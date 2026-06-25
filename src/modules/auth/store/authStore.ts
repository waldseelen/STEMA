/**
 * Auth Store — Firebase Auth & Firestore
 *
 * Spec 2.2: Email/password yok — sadece Google ve GitHub OAuth (Email desteği fallback/geliştirme amaçlı Firebase ile uyumlu bırakıldı).
 * Spec 2.4: full_name, occupation (text), student_status zorunlu.
 * Spec 2.6: preferred_locale ve preferred_theme profile'a yazılır.
 * Spec 2.7: v1'de ek rol modeli yok.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { auth, db, storage, isFirebaseConfigured } from '@/config/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
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

      // ── Firebase Auth ──────────────────────────────────────────────────────
      signInWithEmail: async (email, password) => {
        set({ isLoading: true })
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password)
          if (userCredential.user) {
            await applySession(userCredential.user)
          }
        } catch (error) {
          captureSecureException(error, { context: 'AuthStore.signInWithEmail', category: 'network' })
          set({ isLoading: false })
          throw error
        }
      },

      signUpWithEmail: async (email, password) => {
        set({ isLoading: true })
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password)
          if (userCredential.user) {
            await applySession(userCredential.user)
          }
        } catch (error) {
          captureSecureException(error, { context: 'AuthStore.signUpWithEmail', category: 'network' })
          set({ isLoading: false })
          throw error
        }
      },

      signInWithOAuth: async (providerName) => {
        set({ isLoading: true })
        try {
          const provider = providerName === 'google' 
            ? new GoogleAuthProvider() 
            : new GithubAuthProvider()
          
          const result = await signInWithPopup(auth, provider)
          if (result.user) {
            await applySession(result.user)
          }
        } catch (error) {
          captureSecureException(error, { context: 'AuthStore.signInWithOAuth', category: 'network' })
          set({ isLoading: false })
          throw error
        }
      },

      signOut: async () => {
        set({ isLoading: true })
        try {
          await fbSignOut(auth)
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

      // ── Fetch profile from Firestore ──────────────────────────────────────
      fetchProfile: async (userOverride) => {
        const user = userOverride ?? get().user
        if (!user) return null

        if (!isFirebaseConfigured) {
          try {
            const raw = localStorage.getItem(`planex-mock-profile-${user.id}`)
            if (!raw) {
              set({ profile: null })
              return null
            }
            const profile = mapProfileRow(JSON.parse(raw))
            set({ profile })
            return profile
          } catch {
            set({ profile: null })
            return null
          }
        }

        try {
          const docRef = doc(db, 'profiles', user.id)
          const docSnap = await getDoc(docRef)

          if (!docSnap.exists()) {
            set({ profile: null })
            return null
          }

          const profile = mapProfileRow(docSnap.data() as Record<string, unknown>)
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
            plan: 'free',
            profile_completed: false,
            onboarding_completed: false,
            preferred_locale: 'tr',
            preferred_theme: 'system',
            created_at: now,
            updated_at: now,
          }

          if (!isFirebaseConfigured) {
            localStorage.setItem(`planex-mock-profile-${user.id}`, JSON.stringify(newProfileRow))
            const newProfile = mapProfileRow(newProfileRow as Record<string, unknown>)
            set({ profile: newProfile })
            return newProfile
          }

          const docRef = doc(db, 'profiles', user.id)
          await setDoc(docRef, newProfileRow, { merge: true })

          const newProfile = mapProfileRow(newProfileRow as Record<string, unknown>)
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

        if (!isFirebaseConfigured) {
          try {
            const raw = localStorage.getItem(`planex-mock-profile-${user.id}`)
            const currentObj = raw ? JSON.parse(raw) : {}
            const merged = { ...currentObj, ...dbUpdates }
            localStorage.setItem(`planex-mock-profile-${user.id}`, JSON.stringify(merged))
            set({ profile: { ...profile, ...normalizedUpdates } })
          } catch (err) {
            console.error('Failed to update mock profile:', err)
          }
          return
        }

        try {
          const docRef = doc(db, 'profiles', user.id)
          await updateDoc(docRef, dbUpdates as any)

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

        if (!isFirebaseConfigured) {
          try {
            const raw = localStorage.getItem(`planex-mock-profile-${user.id}`)
            const currentObj = raw ? JSON.parse(raw) : {}
            const merged = { ...currentObj, ...updates, profile_completed: true }
            localStorage.setItem(`planex-mock-profile-${user.id}`, JSON.stringify(merged))

            if (ensuredProfile) {
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
          } catch (err) {
            console.error('Failed to complete mock profile:', err)
          }
          return
        }

        try {
          const docRef = doc(db, 'profiles', user.id)
          await updateDoc(docRef, updates as any)

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

        if (!isFirebaseConfigured) {
          try {
            const raw = localStorage.getItem(`planex-mock-profile-${user.id}`)
            const currentObj = raw ? JSON.parse(raw) : {}
            const merged = { ...currentObj, onboarding_completed: true, updated_at: new Date().toISOString() }
            localStorage.setItem(`planex-mock-profile-${user.id}`, JSON.stringify(merged))
            set({ profile: { ...(profile as UserProfile), onboardingCompleted: true } })
          } catch (err) {
            console.error('Failed to complete mock onboarding:', err)
          }
          return
        }

        try {
          const docRef = doc(db, 'profiles', user.id)
          await updateDoc(docRef, { onboarding_completed: true, updated_at: new Date().toISOString() })
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

        if (!isFirebaseConfigured) {
          try {
            const raw = localStorage.getItem(`planex-mock-profile-${user.id}`)
            const currentObj = raw ? JSON.parse(raw) : {}
            const merged = { ...currentObj, onboarding_completed: false, updated_at: new Date().toISOString() }
            localStorage.setItem(`planex-mock-profile-${user.id}`, JSON.stringify(merged))
            set({ profile: { ...profile, onboardingCompleted: false } })
          } catch (err) {
            console.error('Failed to restart mock onboarding:', err)
          }
          return
        }

        try {
          const docRef = doc(db, 'profiles', user.id)
          await updateDoc(docRef, { onboarding_completed: false, updated_at: new Date().toISOString() })
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
        const path = `avatars/${user.id}/avatar.${extension}`

        if (!isFirebaseConfigured) {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = async () => {
              const dataUrl = reader.result as string
              await get().updateProfile({ avatarUrl: dataUrl })
              resolve(dataUrl)
            }
            reader.readAsDataURL(file)
          })
        }

        try {
          const avatarRef = ref(storage, path)
          await uploadBytes(avatarRef, file)
          const publicUrl = await getDownloadURL(avatarRef)

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

        if (!isFirebaseConfigured) {
          try {
            const raw = localStorage.getItem(`planex-mock-profile-${user.id}`)
            const currentObj = raw ? JSON.parse(raw) : {}
            const merged = { ...currentObj, preferred_locale: locale, preferred_theme: theme, updated_at: new Date().toISOString() }
            localStorage.setItem(`planex-mock-profile-${user.id}`, JSON.stringify(merged))
            set({ profile: { ...profile, preferredLocale: locale, preferredTheme: theme } })
          } catch (err) {
            console.error('Failed to sync mock profile preferences:', err)
          }
          return
        }

        try {
          const docRef = doc(db, 'profiles', user.id)
          await updateDoc(docRef, { preferred_locale: locale, preferred_theme: theme, updated_at: new Date().toISOString() })
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
 * Auth state listener — Firebase session değişikliklerini dinler.
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

async function applySession(fbUser: FirebaseUser | null) {
  const store = useAuthStore.getState()

  if (!fbUser) {
    setUnauthenticatedState()
    return
  }

  const mappedUser: User = {
    id: fbUser.uid,
    email: fbUser.email || undefined,
    displayName: fbUser.displayName || undefined,
    photoURL: fbUser.photoURL || undefined,
  }

  const token = await fbUser.getIdToken().catch(() => 'mock-session-token')

  const dummySession: Session = {
    accessToken: token,
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

  authBootstrapPromise = new Promise<void>((resolve) => {
    const store = useAuthStore.getState()
    store.setLoading(true)

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe() // Run once for bootstrap
      try {
        await applySession(user)
      } catch (error) {
        captureSecureException(error, {
          context: 'AuthStore.bootstrap',
          category: 'network',
        })
        setUnauthenticatedState()
      } finally {
        useAuthStore.setState({ authInitialized: true, isLoading: false })
        resolve()
      }
    })
  })

  return authBootstrapPromise
}

export const ensureAuthBootstrapped = ensureInitialAuthBootstrap

export function initAuthListener() {
  if (unsubscribeAuthListener) {
    return unsubscribeAuthListener
  }

  void ensureInitialAuthBootstrap()

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    const store = useAuthStore.getState()
    store.setLoading(true)

    try {
      await applySession(user)
    } catch (error) {
      captureSecureException(error, {
        context: 'AuthStore.stateSync',
        category: 'network',
      })
    } finally {
      useAuthStore.setState({ authInitialized: true, isLoading: false })
    }
  })

  unsubscribeAuthListener = () => {
    unsubscribe()
    unsubscribeAuthListener = null
  }

  return unsubscribeAuthListener
}
