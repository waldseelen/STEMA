import { clsx } from 'clsx'
import { AlertTriangle, CheckCircle2, Info, LoaderCircle } from 'lucide-react'

interface AuthStatusNoticeProps {
    title?: string
    description: string
    tone?: 'info' | 'warning' | 'error' | 'success' | 'loading'
    className?: string
}

const TONE_STYLES = {
    info: {
        icon: Info,
        box: 'border-[var(--border-subtle)] bg-surface-100 text-text-secondary',
        iconClassName: 'text-status-blue',
    },
    warning: {
        icon: AlertTriangle,
        box: 'border-status-amber/20 bg-status-amber-soft text-text-secondary',
        iconClassName: 'text-status-amber',
    },
    error: {
        icon: AlertTriangle,
        box: 'border-status-red/20 bg-status-red-soft text-text-secondary',
        iconClassName: 'text-status-red',
    },
    success: {
        icon: CheckCircle2,
        box: 'border-status-green/20 bg-status-green-soft text-text-secondary',
        iconClassName: 'text-status-green',
    },
    loading: {
        icon: LoaderCircle,
        box: 'border-[var(--border-subtle)] bg-surface-100 text-text-secondary',
        iconClassName: 'text-text-primary',
    },
} as const

export function AuthStatusNotice({
    title,
    description,
    tone = 'info',
    className,
}: AuthStatusNoticeProps) {
    const styles = TONE_STYLES[tone]
    const Icon = styles.icon

    return (
        <div
            className={clsx(
                'flex items-start gap-3 rounded-xl border px-4 py-3',
                styles.box,
                className
            )}
            role={tone === 'error' ? 'alert' : 'status'}
            aria-live={tone === 'error' ? 'assertive' : 'polite'}
        >
            <span
                className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-primary"
            >
                <Icon
                    className={clsx(
                        'h-4.5 w-4.5',
                        styles.iconClassName,
                        tone === 'loading' && 'animate-spin'
                    )}
                    aria-hidden
                />
            </span>

            <div className="min-w-0">
                {title && (
                    <p className="text-sm font-semibold text-text-primary">
                        {title}
                    </p>
                )}
                <p className={clsx('text-sm leading-relaxed', title && 'mt-1')}>
                    {description}
                </p>
            </div>
        </div>
    )
}
