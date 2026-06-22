import { useI18n, type Locale } from '@/i18n'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useSettingsStore } from '@/modules/settings/store/settingsStore'
import { useEffect, useRef } from 'react'

function isLocale(value: string): value is Locale {
    return value === 'tr' || value === 'en'
}

export function SettingsI18nSync() {
    const initialize = useSettingsStore(state => state.initialize)
    const language = useSettingsStore(state => state.language)
    const isInitialized = useSettingsStore(state => state.isInitialized)
    const authInitialized = useAuthStore(state => state.authInitialized)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const profileId = useAuthStore(state => state.profile?.id)
    const profileLocale = useAuthStore(state => state.profile?.preferredLocale)
    const { locale, setLocale } = useI18n()
    const lastAppliedProfileLocale = useRef<string | null>(null)

    useEffect(() => {
        void initialize()
    }, [initialize])

    useEffect(() => {
        if (!isInitialized) {
            return
        }

        const resolvedProfileLocale: Locale | null =
            profileLocale && isLocale(profileLocale)
                ? profileLocale
                : null

        if (authInitialized && isAuthenticated && resolvedProfileLocale) {
            const profileLocaleToken = `${profileId}:${resolvedProfileLocale}`

            if (profileLocaleToken === lastAppliedProfileLocale.current) {
                return
            }

            lastAppliedProfileLocale.current = profileLocaleToken

            if (resolvedProfileLocale !== locale) {
                setLocale(resolvedProfileLocale)
            }
            return
        }

        lastAppliedProfileLocale.current = null

        if (!isAuthenticated && isLocale(language) && language !== locale) {
            setLocale(language)
        }
    }, [authInitialized, isAuthenticated, isInitialized, language, locale, profileId, profileLocale, setLocale])

    return null
}
