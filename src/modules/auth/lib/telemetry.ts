import { captureException, captureMessage } from '@/shared/utils/errorTracking'

interface SecureLogContext {
    category?: 'database' | 'network' | 'ui' | 'validation' | 'unknown'
    context: string
    metadata?: Record<string, unknown>
    userId?: string
}

const SENSITIVE_KEY_PATTERN = /token|secret|authorization|cookie|password|api[_-]?key|access[_-]?key/i

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sanitizeValue(value: unknown, depth = 0): unknown {
    if (depth > 4) {
        return '[Truncated]'
    }

    if (Array.isArray(value)) {
        return value.map(item => sanitizeValue(item, depth + 1))
    }

    if (isRecord(value)) {
        const sanitized: Record<string, unknown> = {}

        for (const [key, nestedValue] of Object.entries(value)) {
            sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
                ? '[Redacted]'
                : sanitizeValue(nestedValue, depth + 1)
        }

        return sanitized
    }

    if (typeof value === 'string' && value.length > 512) {
        return `${value.slice(0, 509)}...`
    }

    return value
}

function getErrorCode(error: unknown): string | null {
    if (!isRecord(error)) {
        return null
    }

    return typeof error.code === 'string' ? error.code : null
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message
    }

    if (isRecord(error) && typeof error.message === 'string') {
        return error.message
    }

    return String(error)
}

export function isRlsDeniedError(error: unknown): boolean {
    const code = getErrorCode(error)
    const message = getErrorMessage(error).toLowerCase()

    return (
        code === '42501' ||
        message.includes('row-level security') ||
        message.includes('permission denied')
    )
}

export function captureSecureException(error: unknown, context: SecureLogContext): void {
    const metadata = sanitizeValue({
        ...context.metadata,
        errorCode: getErrorCode(error),
        securityCode: isRlsDeniedError(error) ? 'RLS_DENIED' : undefined,
    }) as Record<string, unknown> | undefined

    captureException(error, {
        context: context.context,
        category: context.category ?? (isRlsDeniedError(error) ? 'database' : 'unknown'),
        metadata,
        userId: context.userId,
    })

    if (isRlsDeniedError(error)) {
        captureMessage('RLS denial captured', {
            context: `${context.context}.RLS`,
            category: 'database',
            level: 'warning',
            userId: context.userId,
            metadata: sanitizeValue({
                errorCode: getErrorCode(error),
                securityCode: 'RLS_DENIED',
            }) as Record<string, unknown>,
        })
    }
}

export function captureSecureMessage(message: string, context: SecureLogContext & { level?: 'error' | 'warning' | 'info' }): void {
    captureMessage(message, {
        context: context.context,
        category: context.category ?? 'unknown',
        level: context.level ?? 'info',
        userId: context.userId,
        metadata: sanitizeValue(context.metadata) as Record<string, unknown>,
    })
}
