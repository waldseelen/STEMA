/**
 * i18n Configuration
 *
 * Çok dilli destek için konfigürasyon.
 * Default: Türkçe (tr)
 */

// ============================================
// Types
// ============================================

export type Locale = 'tr' | 'en'
export type Namespace =
    | 'common'
    | 'planner'
    | 'calendar'
    | 'habits'
    | 'settings'
    | 'tracker'
    | 'auth'
    | 'landing'
    | 'onboarding'

// ============================================
// Constants
// ============================================

export const DEFAULT_LOCALE: Locale = 'tr'
export const SUPPORTED_LOCALES: Locale[] = ['tr', 'en']
export const NAMESPACES: Namespace[] = [
    'common',
    'planner',
    'calendar',
    'habits',
    'settings',
    'tracker',
    'auth',
    'landing',
    'onboarding',
]

export const LOCALE_NAMES: Record<Locale, string> = {
    tr: 'Türkçe',
    en: 'English',
}

// ============================================
// Translation Resources
// ============================================

// Static locale resources
import authEn from './locales/en/auth.json'
import calendarEn from './locales/en/calendar.json'
import commonEn from './locales/en/common.json'
import habitsEn from './locales/en/habits.json'
import landingEn from './locales/en/landing.json'
import onboardingEn from './locales/en/onboarding.json'
import plannerEn from './locales/en/planner.json'
import settingsEn from './locales/en/settings.json'
import trackerEn from './locales/en/tracker.json'
import authTr from './locales/tr/auth.json'
import calendarTr from './locales/tr/calendar.json'
import commonTr from './locales/tr/common.json'
import habitsTr from './locales/tr/habits.json'
import landingTr from './locales/tr/landing.json'
import onboardingTr from './locales/tr/onboarding.json'
import plannerTr from './locales/tr/planner.json'
import settingsTr from './locales/tr/settings.json'
import trackerTr from './locales/tr/tracker.json'

export const translations: Record<Locale, Record<Namespace, Record<string, unknown>>> = {
    tr: {
        auth: authTr,
        landing: landingTr,
        onboarding: onboardingTr,
        common: commonTr,
        planner: plannerTr,
        calendar: calendarTr,
        habits: habitsTr,
        settings: settingsTr,
        tracker: trackerTr,
    },
    en: {
        auth: authEn,
        landing: landingEn,
        onboarding: onboardingEn,
        common: commonEn,
        planner: plannerEn,
        calendar: calendarEn,
        habits: habitsEn,
        settings: settingsEn,
        tracker: trackerEn,
    },
}

/**
 * Get translation value by key path
 */
export function getTranslation(
    locale: Locale,
    namespace: Namespace,
    key: string,
    params?: Record<string, string | number>
): string {
    const namespaceData = translations[locale]?.[namespace] || translations[DEFAULT_LOCALE]?.[namespace]
    if (!namespaceData) {
        console.warn(`[i18n] Namespace not found: ${namespace}`)
        return key
    }

    // Navigate nested keys
    const keys = key.split('.')
    let value: unknown = namespaceData

    for (const k of keys) {
        if (typeof value !== 'object' || value === null) {
            console.warn(`[i18n] Key not found: ${namespace}.${key}`)
            return key
        }
        value = (value as Record<string, unknown>)[k]
    }

    if (typeof value !== 'string') {
        console.warn(`[i18n] Key is not a string: ${namespace}.${key}`)
        return key
    }

    // Replace parameters
    if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
            return String(params[paramKey] ?? `{{${paramKey}}}`)
        })
    }

    return value
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create a translation function for a specific namespace
 */
export function createT(locale: Locale, namespace: Namespace) {
    return (key: string, params?: Record<string, string | number>) =>
        getTranslation(locale, namespace, key, params)
}

/**
 * Translate using the currently active locale outside React.
 */
export function translateCurrentLocale(
    namespace: Namespace,
    key: string,
    params?: Record<string, string | number>
): string {
    return getTranslation(getCurrentLocale(), namespace, key, params)
}

/**
 * Get browser locale
 */
export function getBrowserLocale(): Locale {
    if (typeof navigator === 'undefined' || typeof navigator.language !== 'string') {
        return DEFAULT_LOCALE
    }

    const browserLang = navigator.language.split('-')[0]
    return SUPPORTED_LOCALES.includes(browserLang as Locale)
        ? (browserLang as Locale)
        : DEFAULT_LOCALE
}

/**
 * Get stored locale preference
 */
export function getStoredLocale(): Locale | null {
    const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return null
    }

    const cookieLocale = getCookie('planex-locale')
    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as Locale)) {
        return cookieLocale as Locale
    }

    if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
        return null
    }

    const stored = localStorage.getItem('planex-locale')
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
        return stored as Locale
    }
    return null
}

/**
 * Store locale preference
 */
export function setStoredLocale(locale: Locale): void {
    if (typeof document !== 'undefined') {
        document.cookie = `planex-locale=${locale}; path=/; max-age=31536000; SameSite=Lax`
    }
    if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') {
        return
    }

    localStorage.setItem('planex-locale', locale)
}

/**
 * Get current locale (preference > browser > default)
 */
export function getCurrentLocale(): Locale {
    return getStoredLocale() || getBrowserLocale()
}
