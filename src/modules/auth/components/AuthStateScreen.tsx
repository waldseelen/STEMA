import { duration, easing } from '@/config/motion'
import { useAccessiblePage } from '@/shared/hooks/useAccessiblePage'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface AuthStateScreenProps {
    title: string
    description?: string
    tone?: 'loading' | 'error'
    actionLabel?: string
    onAction?: () => void
    secondaryActionLabel?: string
    onSecondaryAction?: () => void
}

export function AuthStateScreen({
    title,
    description,
    tone = 'loading',
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
}: AuthStateScreenProps) {
    const shouldReduceMotion = useReducedMotion()
    useAccessiblePage(title, { announceMessage: title })

    if (tone === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-primary px-4">
                <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : duration.base / 1000, ease: easing.standard }}
                    className="space-y-3 text-center"
                    role="status"
                    aria-live="polite"
                >
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-surface-100">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-text-muted border-t-text-primary" aria-hidden />
                    </span>
                    <div>
                        <h1 className="text-base text-text-primary">{title}</h1>
                        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-primary px-4" role="alert" aria-live="assertive">
            <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : duration.base / 1000, ease: easing.standard }}
                className="card w-full max-w-md p-6 text-center"
            >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-status-red-soft text-status-red">
                    <AlertTriangle className="h-5 w-5" aria-hidden />
                </div>

                <h1 className="mt-4 text-display-lg text-text-primary">{title}</h1>

                {description && <p className="mt-3 text-sm leading-relaxed text-text-secondary">{description}</p>}

                {(actionLabel || secondaryActionLabel) && (
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                        {secondaryActionLabel && onSecondaryAction && (
                            <button type="button" onClick={onSecondaryAction} className="btn-secondary">
                                {secondaryActionLabel}
                            </button>
                        )}

                        {actionLabel && onAction && (
                            <button type="button" onClick={onAction} className="btn-primary">
                                {actionLabel}
                            </button>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    )
}
