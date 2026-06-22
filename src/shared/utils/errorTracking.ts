/**
 * Plan.Ex - Error Tracking & Reporting
 *
 * Merkezi hata yakalama ve raporlama servisi.
 * Gelecekte Sentry/Posthog entegrasyonu için hazır.
 */

import { translateCurrentLocale } from '@/i18n/config'

// ============================================
// Types
// ============================================

export interface ErrorContext {
    /** Hatanın oluştuğu bileşen/modül */
    context: string
    /** Ek meta veriler */
    metadata?: Record<string, unknown>
    /** Kullanıcı ID'si (anonim) */
    userId?: string
    /** Hata seviyesi */
    level?: 'error' | 'warning' | 'info'
    /** Hata kategorisi */
    category?: 'auth' | 'database' | 'network' | 'security' | 'ui' | 'validation' | 'unknown'
}

interface ErrorReport {
    id: string
    timestamp: number
    message: string
    stack?: string
    context: ErrorContext
    userAgent: string
    url: string
    appVersion: string
}

// ============================================
// Error Storage (Local)
// ============================================

const ERROR_STORAGE_KEY = 'lifeflow_error_log'
const MAX_STORED_ERRORS = 50
const REDACTED_VALUE = '[REDACTED]'
const SENSITIVE_KEY_PATTERN = /token|secret|password|authorization|cookie|api[-_]?key|service[-_]?role|code/i
const SENSITIVE_URL_KEYS = new Set([
    'access_token',
    'refresh_token',
    'provider_token',
    'provider_refresh_token',
    'id_token',
    'token',
    'code',
    'apikey',
    'api_key',
])

function sanitizeHashFragment(hashFragment: string): string {
    if (!hashFragment) {
        return ''
    }

    const hashContent = hashFragment.startsWith('#') ? hashFragment.slice(1) : hashFragment
    const hashParams = new URLSearchParams(hashContent)
    let didSanitize = false

    for (const key of hashParams.keys()) {
        if (SENSITIVE_URL_KEYS.has(key.toLowerCase())) {
            hashParams.set(key, REDACTED_VALUE)
            didSanitize = true
        }
    }

    if (!didSanitize) {
        return hashFragment
    }

    const serializedHash = hashParams.toString()
    return serializedHash ? `#${serializedHash}` : ''
}

export function sanitizeTelemetryUrl(rawUrl: string): string {
    try {
        const url = new URL(rawUrl)

        for (const key of url.searchParams.keys()) {
            if (SENSITIVE_URL_KEYS.has(key.toLowerCase())) {
                url.searchParams.set(key, REDACTED_VALUE)
            }
        }

        url.hash = sanitizeHashFragment(url.hash)
        return url.toString()
    } catch {
        return rawUrl
    }
}

function sanitizeMetadataValue(value: unknown, key?: string): unknown {
    if (typeof value === 'string') {
        if ((key && SENSITIVE_KEY_PATTERN.test(key)) || /^bearer\s+/i.test(value)) {
            return REDACTED_VALUE
        }

        return value
    }

    if (Array.isArray(value)) {
        return value.map(item => sanitizeMetadataValue(item))
    }

    if (value && typeof value === 'object') {
        const output: Record<string, unknown> = {}

        for (const [nestedKey, nestedValue] of Object.entries(value)) {
            output[nestedKey] = sanitizeMetadataValue(nestedValue, nestedKey)
        }

        return output
    }

    return value
}

export function sanitizeErrorMetadata(
    metadata?: Record<string, unknown>
): Record<string, unknown> | undefined {
    if (!metadata) {
        return undefined
    }

    return sanitizeMetadataValue(metadata) as Record<string, unknown>
}

/**
 * Hataları local storage'da sakla
 */
function storeError(report: ErrorReport): void {
    try {
        const stored = localStorage.getItem(ERROR_STORAGE_KEY)
        const errors: ErrorReport[] = stored ? JSON.parse(stored) : []

        // En yeni hatayı ekle
        errors.unshift(report)

        // Maksimum sayıyı aşarsa eskileri sil
        if (errors.length > MAX_STORED_ERRORS) {
            errors.splice(MAX_STORED_ERRORS)
        }

        localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors))
    } catch {
        // Storage hatası - sessizce devam et
        console.warn('[ErrorTracking] Failed to store error locally')
    }
}

/**
 * Saklanan hataları al
 */
export function getStoredErrors(): ErrorReport[] {
    try {
        const stored = localStorage.getItem(ERROR_STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

/**
 * Saklanan hataları temizle
 */
export function clearStoredErrors(): void {
    localStorage.removeItem(ERROR_STORAGE_KEY)
}

// ============================================
// Error Capture
// ============================================

/**
 * Hatayı yakala ve raporla
 *
 * @example
 * try {
 *   await db.activities.add(activity)
 * } catch (error) {
 *   captureException(error, {
 *     context: 'ActivityStore.createActivity',
 *     category: 'database'
 *   })
 *   throw error
 * }
 */
export function captureException(
    error: unknown,
    errorContext: ErrorContext
): void {
    const err = error instanceof Error ? error : new Error(String(error))
    const safeMetadata = sanitizeErrorMetadata(errorContext.metadata)

    const report: ErrorReport = {
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        message: err.message,
        context: {
            level: 'error',
            category: 'unknown',
            ...errorContext
        },
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? sanitizeTelemetryUrl(window.location.href) : '',
        appVersion: import.meta.env.VITE_APP_VERSION || '0.1.0',
    }

    if (safeMetadata) {
        report.context.metadata = safeMetadata
    }

    // stack varsa ekle
    if (err.stack) {
        report.stack = err.stack
    }

    // Console'a log (development)
    if (import.meta.env.DEV) {
        console.error(`[${errorContext.context}]`, err)
        if (safeMetadata) {
            console.error('Metadata:', safeMetadata)
        }
    }

    // Local storage'a kaydet
    storeError(report)

    // Gelecekte: Sentry/Posthog'a gönder
    // if (import.meta.env.PROD) {
    //     Sentry.captureException(err, { extra: errorContext })
    // }
}

/**
 * Mesaj olarak log (hata olmayan uyarılar için)
 */
export function captureMessage(
    message: string,
    context: Omit<ErrorContext, 'context'> & { context?: string }
): void {
    const safeMetadata = sanitizeErrorMetadata(context.metadata)
    const reportContext: ErrorContext = {
        context: context.context || 'Unknown',
        level: context.level || 'info',
        category: context.category || 'unknown',
    }
    if (safeMetadata) {
        reportContext.metadata = safeMetadata
    }

    const report: ErrorReport = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        message,
        context: reportContext,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? sanitizeTelemetryUrl(window.location.href) : '',
        appVersion: import.meta.env.VITE_APP_VERSION || '0.1.0',
    }

    if (import.meta.env.DEV) {
        console.log(`[${report.context.context}] ${message}`)
    }

    storeError(report)
}

// ============================================
// Error Boundary Helper
// ============================================

/**
 * Error Boundary için hata handler
 */
export function handleBoundaryError(
    error: Error,
    errorInfo: { componentStack?: string | null }
): void {
    captureException(error, {
        context: 'ErrorBoundary',
        category: 'ui',
        metadata: {
            componentStack: errorInfo.componentStack,
        },
    })
}

// ============================================
// Async Error Wrapper
// ============================================

/**
 * Async fonksiyonları sarmalayarak hataları otomatik yakala
 *
 * @example
 * const loadData = withErrorCapture(
 *   async () => await db.activities.toArray(),
 *   { context: 'Dashboard.loadActivities', category: 'database' }
 * )
 */
export function withErrorCapture<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    errorContext: ErrorContext
): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args)
        } catch (error) {
            captureException(error, errorContext)
            throw error
        }
    }) as T
}

// ============================================
// User-Friendly Error Messages
// ============================================

const ERROR_MESSAGES: Record<string, string> = {
    // Database errors
    'QuotaExceededError': 'errors.storageFull',
    'DatabaseClosedError': 'errors.databaseClosed',
    'TransactionInactiveError': 'errors.transactionInactive',

    // Network errors
    'NetworkError': 'errors.network',
    'TimeoutError': 'errors.timeout',

    // Generic
    'default': 'errors.default',
}

/**
 * Teknik hatayı kullanıcı dostu mesaja çevir
 */
export function getUserFriendlyMessage(error: unknown): string {
    if (error instanceof Error) {
        // Bilinen hata türlerini kontrol et
        for (const [key, messageKey] of Object.entries(ERROR_MESSAGES)) {
            if (error.name === key || error.message.includes(key)) {
                return translateCurrentLocale('common', messageKey)
            }
        }
    }

    return translateCurrentLocale('common', ERROR_MESSAGES['default'] ?? 'errors.default')
}

// ============================================
// Performance Tracking
// ============================================

const perfMarks = new Map<string, number>()

/**
 * Performans ölçümü başlat
 */
export function perfStart(label: string): void {
    perfMarks.set(label, performance.now())
}

/**
 * Performans ölçümü bitir ve logla
 */
export function perfEnd(label: string, warnThreshold = 100): number {
    const start = perfMarks.get(label)
    if (!start) return 0

    const duration = performance.now() - start
    perfMarks.delete(label)

    if (import.meta.env.DEV && duration > warnThreshold) {
        console.warn(`[Perf] ${label}: ${duration.toFixed(2)}ms (threshold: ${warnThreshold}ms)`)
    }

    return duration
}
