/**
 * i18n React Hooks & Provider
 *
 * React context ile çeviri yönetimi.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
    type Locale,
    type Namespace,
    DEFAULT_LOCALE,
    getCurrentLocale,
    getTranslation,
    setStoredLocale,
    SUPPORTED_LOCALES
} from './config'

// ============================================
// Types
// ============================================

interface I18nContextValue {
    /** Current locale */
    locale: Locale
    /** Change locale */
    setLocale: (locale: Locale) => void
    /** Translation function */
    t: (namespace: Namespace, key: string, params?: Record<string, string | number>) => string
    /** Check if a translation exists */
    hasTranslation: (namespace: Namespace, key: string) => boolean
    /** Available locales */
    locales: readonly Locale[]
}

// ============================================
// Context
// ============================================

const I18nContext = createContext<I18nContextValue | null>(null)

// ============================================
// Provider
// ============================================

interface I18nProviderProps {
    children: React.ReactNode
    /** Initial locale (overrides stored/detected) */
    initialLocale?: Locale
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        return initialLocale || getCurrentLocale()
    })

    // Sync with storage
    useEffect(() => {
        setStoredLocale(locale)
        // Update document lang attribute
        document.documentElement.lang = locale
    }, [locale])

    const setLocale = useCallback((newLocale: Locale) => {
        if (SUPPORTED_LOCALES.includes(newLocale)) {
            setLocaleState(newLocale)
        }
    }, [])

    const t = useCallback((
        namespace: Namespace,
        key: string,
        params?: Record<string, string | number>
    ): string => {
        return getTranslation(locale, namespace, key, params)
    }, [locale])

    const hasTranslation = useCallback((namespace: Namespace, key: string): boolean => {
        const result = getTranslation(locale, namespace, key)
        return result !== key
    }, [locale])

    const value = useMemo<I18nContextValue>(() => ({
        locale,
        setLocale,
        t,
        hasTranslation,
        locales: SUPPORTED_LOCALES,
    }), [locale, setLocale, t, hasTranslation])

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    )
}

// ============================================
// Hooks
// ============================================

/**
 * Access the i18n context
 */
export function useI18n(): I18nContextValue {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider')
    }
    return context
}

/**
 * Get current locale
 */
export function useLocale(): Locale {
    const context = useContext(I18nContext)
    return context?.locale ?? DEFAULT_LOCALE
}

/**
 * Create a namespaced translation hook
 *
 * @example
 * const t = useTranslation('calendar')
 * t('title') // "Takvim"
 * t('event.create') // "Yeni Etkinlik"
 */
export function useTranslation(namespace: Namespace) {
    const { t } = useI18n()

    return useCallback(
        (key: string, params?: Record<string, string | number>) => t(namespace, key, params),
        [t, namespace]
    )
}

/**
 * Multi-namespace translation hook
 *
 * @example
 * const t = useTranslations(['common', 'calendar'])
 * t('common', 'save') // "Kaydet"
 * t('calendar', 'title') // "Takvim"
 */
export function useTranslations<N extends Namespace>(_namespaces: N[]) {
    const { t } = useI18n()

    return useCallback(
        (namespace: N, key: string, params?: Record<string, string | number>) =>
            t(namespace, key, params),
        [t]
    )
}

// ============================================
// Utility Hooks
// ============================================

/**
 * Format date according to locale
 */
export function useDateFormatter() {
    const locale = useLocale()

    return useMemo(() => ({
        formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
            const d = typeof date === 'string' ? new Date(date) : date
            return d.toLocaleDateString(locale, options)
        },
        formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
            const d = typeof date === 'string' ? new Date(date) : date
            return d.toLocaleTimeString(locale, options)
        },
        formatDateTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
            const d = typeof date === 'string' ? new Date(date) : date
            return d.toLocaleString(locale, options)
        },
        formatRelative: (date: Date | string) => {
            const d = typeof date === 'string' ? new Date(date) : date
            const now = new Date()
            const diff = d.getTime() - now.getTime()
            const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24))

            if (diffDays === 0) return locale === 'tr' ? 'Bugün' : 'Today'
            if (diffDays === 1) return locale === 'tr' ? 'Yarın' : 'Tomorrow'
            if (diffDays === -1) return locale === 'tr' ? 'Dün' : 'Yesterday'

            return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
        },
    }), [locale])
}

/**
 * Format number according to locale
 */
export function useNumberFormatter() {
    const locale = useLocale()

    return useMemo(() => ({
        formatNumber: (num: number, options?: Intl.NumberFormatOptions) => {
            return num.toLocaleString(locale, options)
        },
        formatPercent: (num: number) => {
            return num.toLocaleString(locale, { style: 'percent', maximumFractionDigits: 0 })
        },
    }), [locale])
}
