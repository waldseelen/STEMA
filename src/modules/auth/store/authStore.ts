/**
 * Auth Store — Supabase Auth & PostgreSQL
 *
 * Spec 2.2: Email/password yok — sadece Google ve GitHub OAuth (Email desteği fallback/geliştirme amaçlı Supabase ile uyumlu bırakıldı).
 * Spec 2.4: full_name, occupation (text), student_status zorunlu.
 * Spec 2.6: preferred_locale ve preferred_theme profile'a yazılır.
 * Spec 2.7: v1'de ek rol modeli yok.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/config/supabase'
import { clearLocalCacheOwner } from '@/lib/cloud/localCacheOwner'
import {
  buildProfileCompletionUpdate,
  buildProfilePatch,
  isProfileComplete as resolveProfileComplete,
  mapProfileRow,
  shouldStartOnboarding as resolveShouldStartOnboarding,
  type ProfileCompletionInput,
  type StudentStatus,
  type UserProfile,
} from '@/modules/auth/lib/profile'
import {
  clearLastOAuthProvider,
} from '@/modules/auth/lib/oauth'
import {
  isSupportedLocale,
  isSupportedTheme,
  validateAvatarFile,
  checkRateLimit,
} from '@/modules/auth/lib/security'
import { captureSecureException } from '@/modules/auth/lib/telemetry'

export type { StudentStatus, UserProfile } from '@/modules/auth/lib/profile'

export type User = {
  id: string
  email?: string
  displayName?: string
  photoURL?: string
}

export type Session = {
  accessToken?: string
  user: User
}

interface AuthState {
  // ── State ──────────────────────────────────────────────────────────────────
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  authInitialized: boolean
  dataBootstrapReady: boolean

  // ── Setters ────────────────────────────────────────────────────────────────
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setDataBootstrapReady: (ready: boolean) => void

  // ── Auth methods ───────────────────────────────────────────────────────────
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>
  signOut: () => Promise<void>

  // ── Profile methods ────────────────────────────────────────────────────────
  fetchProfile: (userOverride?: User | null) => Promise<UserProfile | null>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  completeProfile: (data: ProfileCompletionInput) => Promise<void>
  completeOnboarding: () => Promise<void>
  restartOnboarding: () => Promise<void>
  uploadAvatar: (file: File) => Promise<string | null>
  syncProfilePreferences: (locale: string, theme: string) => Promise<void>

  // ── Derived helpers ────────────────────────────────────────────────────────
  isProfileComplete: () => boolean
  shouldStartOnboarding: () => boolean
  ensureProfile: (userOverride?: User | null) => Promise<UserProfile | null>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────────
      user: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'mockuser@example.com',
        displayName: 'Gezgin Öğrenci',
      },
      profile: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'mockuser@example.com',
        fullName: 'Gezgin Öğrenci',
        avatarUrl: undefined,
        occupation: 'Öğrenci',
        studentStatus: 'student',
        plan: 'free',
        profileCompleted: true,
        onboardingCompleted: true,
        preferredLocale: 'tr',
        preferredTheme: 'dark',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: {
        accessToken: 'mock-session-token',
        user: {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'mockuser@example.com',
          displayName: 'Gezgin Öğrenci',
        }
      },
      isLoading: false,
      isAuthenticated: true,
      authInitialized: true,
      dataBootstrapReady: true,

      // ── Setters ────────────────────────────────────────────────────────────
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      setDataBootstrapReady: (dataBootstrapReady) => set({ dataBootstrapReady }),

      // ── Supabase Auth ──────────────────────────────────────────────────────
      signInWithEmail: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) throw error
          if (data.session) await applySession(data.session)
        } catch (error) {
          captureSecureException(error, { context: 'AuthStore.signInWithEmail', category: 'network' })
          set({ isLoading: false })
          throw error
        }
      },

      signUpWithEmail: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          })
          if (error) throw error
          if (data.session) await applySession(data.session)
        } catch (error) {
          captureSecureException(error, { context: 'AuthStore.signUpWithEmail', category: 'network' })
          set({ isLoading: false })
          throw error
        }
      },

      signInWithOAuth: async (provider) => {
        set({ isLoading: true })
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          })
          if (error) throw error
        } catch (error) {
          captureSecureException(error, { context: 'AuthStore.signInWithOAuth', category: 'network' })
          set({ isLoading: false })
          throw error
        }
      },

      signOut: async () => {
        set({ isLoading: true })
        try {
          await supabase.auth.signOut()
          clearLastOAuthProvider()
          clearLocalCacheOwner()
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            dataBootstrapReady: true,
          })
        } catch (error) {
          captureSecureException(error, {
            context: 'AuthStore.signOut',
            category: 'network',
            userId: get().user?.id,
          })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // ── Fetch profile from PostgreSQL ──────────────────────────────────────
      fetchProfile: async (userOverride) => {
        const user = userOverride ?? get().user
        if (!user) return null

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (error || !data) {
            set({ profile: null })
            return null
          }

          const profile = mapProfileRow(data as Record<string, unknown>)
          set({ profile })
          return profile
        } catch (error) {
          captureSecureException(error, {
            context: 'AuthStore.fetchProfile',
            category: 'database',
            userId: user.id,
          })
          throw error
        }
      },

      // ── Ensure profile row exists (race-condition-safe) ────────────────────
      ensureProfile: async (userOverride) => {
        const user = userOverride ?? get().user
        const { fetchProfile, profile } = get()
        if (!user) return null
        if (profile?.id === user.id) return profile
        if (profile && profile.id !== user.id) {
          set({ profile: null })
        }

        try {
          const existing = await fetchProfile(user)
          if (existing) {
            return existing
          }

          const now = new Date().toISOString()
          const newProfileRow = {
            id: user.id,
            email: user.email ?? '',
            full_name: user.displayName ?? '',
            avatar_url: user.photoURL ?? null,
            plan: 'free' as const,
            profile_completed: false,
            onboarding_completed: false,
            preferred_locale: 'tr',
            preferred_theme: 'system',
            created_at: now,
            updated_at: now,
          }
          const { data, error } = await supabase
            .from('profiles')
            .upsert(newProfileRow, { onConflict: 'id' })
            .select()
            .single()

          if (error) throw error

          const newProfile = mapProfileRow(data as Record<string, unknown>)
          set({ profile: newProfile })
          return newProfile
        } catch (error) {
          captureSecureException(error, {
            context: 'AuthStore.ensureProfile',
            category: 'database',
            userId: user.id,
          })
          throw error
        }
      },

      // ── Update arbitrary profile fields ───────────────────────────────────
      updateProfile: async (updates) => {
        const { user, profile } = get()
        if (!user || !profile) return

        const normalizedUpdates: Partial<UserProfile> = { ...updates }
        if (updates.preferredLocale !== undefined && !isSupportedLocale(updates.preferredLocale)) {
          delete normalizedUpdates.preferredLocale
        }
        if (updates.preferredTheme !== undefined && !isSupportedTheme(updates.preferredTheme)) {
          delete normalizedUpdates.preferredTheme
        }

        const dbUpdates = buildProfilePatch(normalizedUpdates)
        dbUpdates.updated_at = new Date().toISOString()
        try {
          const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', user.id)

          if (error) throw error

          const refreshedProfile = await get().fetchProfile(user)
          if (!refreshedProfile) {
            set({ profile: { ...profile, ...updates } })
          }
        } catch (error) {
          captureSecureException(error, {
            context: 'AuthStore.updateProfile',
            category: 'database',
            userId: user.id,
          })
          throw error
        }
      },

      // ── Complete profile setup (first-login flow) ──────────────────────────
      completeProfile: async (input) => {
        const { user } = get()
        if (!user) return
        const ensuredProfile = (await get().ensureProfile(user)) ?? get().profile

        const updates = buildProfileCompletionUpdate(input)
        updates.updated_at = new Date().toISOString()
        try {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)

          if (error) throw error

          const refreshedProfile = await get().fetchProfile(user)
          if (!refreshedProfile && ensuredProfile) {
            set({
              profile: {
                ...(ensuredProfile as UserProfile),
                fullName: updates.full_name ?? ensuredProfile.fullName,
                occupation: updates.occupation ?? ensuredProfile.occupation,
                studentStatus: updates.student_status as StudentStatus,
                profileCompleted: true,
                school: (updates.school as string | null) ?? undefined,
                department: (updates.department as string | null) ?? undefined,
                grade: (updates.grade as string | null) ?? undefined,
              },
            })
          }
        } catch (error) {
          captureSecureException(error, {
            context: 'AuthStore.completeProfile',
            category: 'database',
            userId: user.id,
          })
          throw error
        }
      },

      // ── Mark onboarding done ───────────────────────────────────────────────
      completeOnboarding: async () => {
        const { user, profile } = get()
        if (!user) return

        try {
          const { error } = await supabase
            .from('profiles')
            .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
            .eq('id', user.id)

          if (error) throw error
          set({ profile: { ...(profile as UserProfile), onboardingCompleted: true } })
        } catch (error) {
          captureSecureException(error, {
            context: 'AuthStore.completeOnboarding',
            category: 'database',
            userId: user.id,
          })
          throw error
        }
      },

      restartOnboarding: async () => {
        const { user, profile } = get()
        if (!user || !profile) return

        try {
          const { error } = await supabase
            .from('profiles')
            .update({ onboarding_completed: false, updated_at: new Date().toISOString() })
            .eq('id', user.id)

          if (error) throw error
          set({ profile: { ...profile, onboardingCompleted: false } })
        } catch (error) {
          captureSecureException(error, {
            context: 'AuthStore.restartOnboarding',
            category: 'database',
            userId: user.id,
          })
          throw error
        }
      },

      uploadAvatar: async (file) => {
        const { user } = get()
        if (!user) return null

        const fileValidation = validateAvatarFile(file)
        if (!fileValidation.valid) {
          throw new Error(fileValidation.reason)
        }

        if (!checkRateLimit(`avatar:${user.id}`, 3, 60 * 1000)) {
          throw new Error('Too many upload attempts. Please try again in a minute.')
        }

        const extension = fileValidation.extension
        const path = `${user.id}/avatar.${extension}`
        try {
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, file, {
              upsert: true,
              cacheControl: '3600',
            })

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(path)

          await get().updateProfile({ avatarUrl: publicUrl })
          return publicUrl
        } catch (uploadError) {
          captureSecureException(uploadError, {
            context: 'AuthStore.uploadAvatar',
            category: 'network',
            userId: user.id,
          })
          throw uploadError
        }
      },

      // ── Sync theme + locale to profile (spec 2.6) ─────────────────────────
      syncProfilePreferences: async (locale, theme) => {
        const { user, profile } = get()
        if (!user || !profile) return
        if (!isSupportedLocale(locale) || !isSupportedTheme(theme)) return

        try {
          const { error } = await supabase
            .from('profiles')
            .update({ preferred_locale: locale, preferred_theme: theme, updated_at: new Date().toISOString() })
            .eq('id', user.id)

          if (error) throw error
          set({ profile: { ...profile, preferredLocale: locale, preferredTheme: theme } })
        } catch (error) {
          captureSecureException(error, {
            context: 'AuthStore.syncProfilePreferences',
            category: 'database',
            userId: user.id,
          })
        }
      },

      // ── Derived helpers ────────────────────────────────────────────────────
      isProfileComplete: () => {
        return resolveProfileComplete(get().profile)
      },

      shouldStartOnboarding: () => {
        return resolveShouldStartOnboarding(get().profile)
      },
    }),
    {
      name: 'planex-auth',
      partialize: () => ({}),
      version: 2,
      migrate: () => ({}),
    }
  )
)

/**
 * Auth state listener — Supabase session değişikliklerini dinler.
 * İlk bootstrap render öncesi çözülür, component katmanı sadece listener bağlar.
 */
let unsubscribeAuthListener: (() => void) | null = null
let authBootstrapPromise: Promise<void> | null = null

function setUnauthenticatedState() {
  clearLocalCacheOwner()
  clearLastOAuthProvider()
  useAuthStore.setState({
    user: {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'mockuser@example.com',
      displayName: 'Gezgin Öğrenci',
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'mockuser@example.com',
      fullName: 'Gezgin Öğrenci',
      avatarUrl: undefined,
      occupation: 'Öğrenci',
      studentStatus: 'student',
      plan: 'free',
      profileCompleted: true,
      onboardingCompleted: true,
      preferredLocale: 'tr',
      preferredTheme: 'dark',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    session: {
      accessToken: 'mock-session-token',
      user: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'mockuser@example.com',
        displayName: 'Gezgin Öğrenci',
      }
    },
    isAuthenticated: true,
    dataBootstrapReady: true,
  })
}

async function applySession(sbSession: any) {
  const store = useAuthStore.getState()

  if (!sbSession || !sbSession.user) {
    setUnauthenticatedState()
    return
  }

  const sbUser = sbSession.user
  const mappedUser: User = {
    id: sbUser.id,
    email: sbUser.email,
    displayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || undefined,
    photoURL: sbUser.user_metadata?.avatar_url || undefined,
  }

  const dummySession: Session = {
    accessToken: sbSession.access_token,
    user: mappedUser,
  }

  clearLastOAuthProvider()
  useAuthStore.setState({ dataBootstrapReady: false, profile: null })
  store.setSession(dummySession)
  store.setUser(mappedUser)
  await store.ensureProfile(mappedUser)
}

export async function ensureInitialAuthBootstrap() {
  if (authBootstrapPromise) {
    return authBootstrapPromise
  }

  authBootstrapPromise = (async () => {
    const store = useAuthStore.getState()
    store.setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      await applySession(session)
    } catch (error) {
      captureSecureException(error, {
        context: 'AuthStore.bootstrap',
        category: 'network',
      })
      setUnauthenticatedState()
    } finally {
      useAuthStore.setState({ authInitialized: true, isLoading: false })
    }
  })()

  return authBootstrapPromise
}

export const ensureAuthBootstrapped = ensureInitialAuthBootstrap

export function initAuthListener() {
  if (unsubscribeAuthListener) {
    return unsubscribeAuthListener
  }

  void ensureInitialAuthBootstrap()

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    const store = useAuthStore.getState()
    store.setLoading(true)

    void (async () => {
      try {
        await applySession(session)
      } catch (error) {
        captureSecureException(error, {
          context: 'AuthStore.stateSync',
          category: 'network',
        })
      } finally {
        useAuthStore.setState({ authInitialized: true, isLoading: false })
      }
    })()
  })

  unsubscribeAuthListener = () => {
    subscription.unsubscribe()
    unsubscribeAuthListener = null
  }

  return unsubscribeAuthListener
}
