import { useTheme } from '@/app/providers/ThemeProvider'
import { useI18n } from '@/i18n'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useEffect, useRef } from 'react'

function isTheme(value: string | undefined): value is 'light' | 'dark' | 'system' {
    return value === 'light' || value === 'dark' || value === 'system'
}

export function ProfilePreferencesSync() {
    const { locale } = useI18n()
    const { theme, setTheme } = useTheme()
    const authInitialized = useAuthStore(state => state.authInitialized)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const profile = useAuthStore(state => state.profile)
    // Get profile-related values, not the function itself, to avoid triggering effects unnecessarily
    const profileId = useAuthStore(state => state.profile?.id)
    const profilePreferredTheme = useAuthStore(state => state.profile?.preferredTheme)
    const lastAppliedProfileTheme = useRef<string | null>(null)
    const lastSyncTimeRef = useRef<number>(0)

    // Sync user's current locale and theme to their profile (local → remote)
    useEffect(() => {
        if (!authInitialized || !isAuthenticated || !profile) {
            return
        }

        if (profile.preferredLocale === locale && profile.preferredTheme === theme) {
            return
        }

        // Throttle syncs to prevent excessive database calls
        const now = Date.now()
        if (now - lastSyncTimeRef.current < 500) {
            return
        }
        lastSyncTimeRef.current = now

        void useAuthStore.getState().syncProfilePreferences(locale, theme)
    }, [authInitialized, isAuthenticated, locale, theme, profileId, profile])

    // Apply profile's theme preference to local state (remote → local)
    // Only sync when user is authenticated and profile exists
    useEffect(() => {
        if (!authInitialized || !isAuthenticated || !profile || !isTheme(profilePreferredTheme)) {
            lastAppliedProfileTheme.current = null
            return
        }

        const profileThemeToken = `${profile.id}:${profilePreferredTheme}`
        if (profileThemeToken === lastAppliedProfileTheme.current) {
            return
        }

        lastAppliedProfileTheme.current = profileThemeToken

        if (profilePreferredTheme !== theme) {
            setTheme(profilePreferredTheme)
        }
    }, [authInitialized, isAuthenticated, profileId, profilePreferredTheme, theme, profile, setTheme])

    return null
}
