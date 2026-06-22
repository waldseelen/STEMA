const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1'])

export const OAUTH_CALLBACK_PATH = '/auth/callback'

function isProviderEnabled(rawValue: string | undefined): boolean {
    return rawValue !== 'false'
}

export const OAUTH_PROVIDERS = [
    {
        id: 'google',
        labelKey: 'landing.providers.google',
        enabled: isProviderEnabled(import.meta.env.VITE_ENABLE_GOOGLE_AUTH),
    },
    {
        id: 'github',
        labelKey: 'landing.providers.github',
        enabled: isProviderEnabled(import.meta.env.VITE_ENABLE_GITHUB_AUTH),
    },
    {
        id: 'email',
        labelKey: 'landing.providers.email',
        enabled: isProviderEnabled(import.meta.env.VITE_ENABLE_EMAIL_AUTH),
    },
] as const

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number]['id']
export type SupportedLocale = 'tr' | 'en'
export type SupportedTheme = 'light' | 'dark' | 'system'

export const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024

const AVATAR_MIME_TO_EXTENSION: Record<string, string> = {
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}

function normalizeOrigin(value: string): string | null {
    try {
        const url = new URL(value)
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return null
        }

        return url.origin
    } catch {
        return null
    }
}

function parseAllowedOrigins(rawValue: string | undefined): string[] {
    if (!rawValue) {
        return []
    }

    return rawValue
        .split(',')
        .map(value => value.trim())
        .map(value => normalizeOrigin(value))
        .filter((value): value is string => Boolean(value))
}

const allowedCallbackOrigins = parseAllowedOrigins(import.meta.env.VITE_ALLOWED_AUTH_ORIGINS)

export function getCurrentWindowOrigin(): string | null {
    if (typeof window === 'undefined' || !window.location.origin) {
        return null
    }

    return normalizeOrigin(window.location.origin)
}

export function isAllowedAuthOrigin(origin: string): boolean {
    const normalizedOrigin = normalizeOrigin(origin)
    if (!normalizedOrigin) {
        return false
    }

    try {
        const url = new URL(normalizedOrigin)
        if (LOCALHOST_HOSTNAMES.has(url.hostname)) {
            return true
        }
    } catch {
        return false
    }

    if (allowedCallbackOrigins.length > 0) {
        return allowedCallbackOrigins.includes(normalizedOrigin)
    }

    const currentOrigin = getCurrentWindowOrigin()
    if (currentOrigin) {
        return currentOrigin === normalizedOrigin
    }

    return false
}

export function getOAuthRedirectUrl(origin = getCurrentWindowOrigin()): string | null {
    if (!origin || !isAllowedAuthOrigin(origin)) {
        return null
    }

    return `${origin}${OAUTH_CALLBACK_PATH}`
}

export function isOAuthProviderAvailable(providerId: OAuthProviderId): boolean {
    return OAUTH_PROVIDERS.some(provider => provider.id === providerId && provider.enabled)
}

export function getUnavailableOAuthProviders() {
    return OAUTH_PROVIDERS.filter(provider => !provider.enabled)
}

export function sanitizeRemoteImageUrl(value: string | null | undefined): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmedValue = value.trim()
    if (!trimmedValue) {
        return null
    }

    try {
        const url = new URL(trimmedValue)

        if (url.protocol === 'https:') {
            return url.toString()
        }

        if (url.protocol === 'http:' && LOCALHOST_HOSTNAMES.has(url.hostname)) {
            return url.toString()
        }

        return null
    } catch {
        return null
    }
}

export function validateAvatarFile(file: File):
    | { valid: true; extension: string }
    | { valid: false; reason: 'file_too_large' | 'invalid_type' } {
    const extension = AVATAR_MIME_TO_EXTENSION[file.type]
    if (!extension) {
        return { valid: false, reason: 'invalid_type' }
    }

    if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
        return { valid: false, reason: 'file_too_large' }
    }

    return { valid: true, extension }
}

export function isSupportedLocale(value: string): value is SupportedLocale {
    return value === 'tr' || value === 'en'
}

export function isSupportedTheme(value: string): value is SupportedTheme {
    return value === 'light' || value === 'dark' || value === 'system'
}

// ── Client-side rate limiting ─────────────────────────────────────────────────

interface RateLimitEntry {
    count: number
    resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Returns true if the action is allowed, false if the rate limit has been hit.
 * @param key    Unique key for the action (e.g. 'oauth:google', 'avatar:upload')
 * @param limit  Max number of calls allowed within windowMs
 * @param windowMs  Rolling window in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetAt) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
        return true
    }

    if (entry.count >= limit) {
        return false
    }

    entry.count++
    return true
}
