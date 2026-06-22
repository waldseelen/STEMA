import { useTranslation } from '@/i18n'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

// ============================================
// Enhanced Empty State
// ============================================

interface EnhancedEmptyStateProps {
    /** İkon veya illüstrasyon */
    icon?: ReactNode
    /** İllüstrasyon türü (varsayılan ikonlar) */
    illustration?: 'habits' | 'activities' | 'sessions' | 'goals' | 'stats' | 'search'
    /** Başlık */
    title: string
    /** Açıklama */
    description?: string
    /** Birincil aksiyon butonu */
    action?: {
        label: string
        onClick: () => void
        variant?: 'primary' | 'secondary'
    }
    /** İkincil aksiyon */
    secondaryAction?: {
        label: string
        onClick: () => void
    }
    /** Boyut */
    size?: 'sm' | 'md' | 'lg'
    /** Stil varyantı */
    variant?: 'card' | 'inline' | 'full'
    className?: string
}

// İllüstrasyon SVG'leri
const illustrations = {
    habits: (
        <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="50" className="fill-success-100 dark:fill-success-900/30" />
            <circle cx="60" cy="60" r="35" className="fill-success-200 dark:fill-success-800/40" />
            <path
                d="M45 60 L55 70 L75 50"
                className="stroke-success-500"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            {/* Decorative dots */}
            <circle cx="30" cy="40" r="3" className="fill-success-300 dark:fill-success-700" />
            <circle cx="90" cy="80" r="4" className="fill-accent-300 dark:fill-accent-700" />
            <circle cx="85" cy="35" r="2" className="fill-primary-300 dark:fill-primary-700" />
        </svg>
    ),
    activities: (
        <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <rect x="20" y="30" width="80" height="60" rx="8" className="fill-primary-100 dark:fill-primary-900/30" />
            <rect x="30" y="45" width="40" height="6" rx="3" className="fill-primary-300 dark:fill-primary-700" />
            <rect x="30" y="57" width="60" height="4" rx="2" className="fill-primary-200 dark:fill-primary-800" />
            <rect x="30" y="67" width="50" height="4" rx="2" className="fill-primary-200 dark:fill-primary-800" />
            <circle cx="90" cy="75" r="15" className="fill-timer-100 dark:fill-timer-900/30" />
            <path
                d="M90 67 L90 75 L96 75"
                className="stroke-timer-500"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    ),
    sessions: (
        <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="45" className="fill-timer-100 dark:fill-timer-900/30" />
            <circle cx="60" cy="60" r="35" className="fill-white dark:fill-surface-800" />
            <circle cx="60" cy="60" r="30" className="stroke-timer-200 dark:stroke-timer-700" strokeWidth="4" fill="none" />
            <path
                d="M60 35 L60 60 L75 70"
                className="stroke-timer-500"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="60" cy="60" r="4" className="fill-timer-500" />
        </svg>
    ),
    goals: (
        <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="45" className="stroke-primary-200 dark:stroke-primary-800" strokeWidth="4" fill="none" />
            <circle cx="60" cy="60" r="30" className="stroke-primary-300 dark:stroke-primary-700" strokeWidth="4" fill="none" />
            <circle cx="60" cy="60" r="15" className="stroke-primary-400 dark:stroke-primary-600" strokeWidth="4" fill="none" />
            <circle cx="60" cy="60" r="6" className="fill-primary-500" />
            <path
                d="M60 20 L60 10 M60 110 L60 100 M20 60 L10 60 M110 60 L100 60"
                className="stroke-primary-300 dark:stroke-primary-700"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    ),
    stats: (
        <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <rect x="15" y="70" width="20" height="35" rx="4" className="fill-primary-300 dark:fill-primary-700" />
            <rect x="40" y="50" width="20" height="55" rx="4" className="fill-primary-400 dark:fill-primary-600" />
            <rect x="65" y="30" width="20" height="75" rx="4" className="fill-primary-500" />
            <rect x="90" y="45" width="20" height="60" rx="4" className="fill-accent-400 dark:fill-accent-600" />
            <path
                d="M25 55 L50 40 L75 20 L100 35"
                className="stroke-timer-500"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <circle cx="25" cy="55" r="4" className="fill-timer-500" />
            <circle cx="50" cy="40" r="4" className="fill-timer-500" />
            <circle cx="75" cy="20" r="4" className="fill-timer-500" />
            <circle cx="100" cy="35" r="4" className="fill-timer-500" />
        </svg>
    ),
    search: (
        <svg className="w-full h-full" viewBox="0 0 120 120" fill="none">
            <circle cx="55" cy="55" r="30" className="stroke-surface-300 dark:stroke-surface-600" strokeWidth="6" fill="none" />
            <circle cx="55" cy="55" r="20" className="fill-surface-100 dark:fill-surface-800" />
            <path
                d="M78 78 L100 100"
                className="stroke-surface-400 dark:stroke-surface-500"
                strokeWidth="8"
                strokeLinecap="round"
            />
            <path
                d="M45 50 L50 55 L65 40"
                className="stroke-surface-300 dark:stroke-surface-600"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
}

/**
 * Gelişmiş boş durum bileşeni
 * Motive edici mesajlar ve illüstrasyonlarla zenginleştirilmiş
 */
export function EnhancedEmptyState({
    icon,
    illustration,
    title,
    description,
    action,
    secondaryAction,
    size = 'md',
    variant = 'card',
    className,
}: EnhancedEmptyStateProps) {
    const sizeClasses = {
        sm: {
            container: 'p-6',
            illustration: 'w-20 h-20',
            title: 'text-base',
            description: 'text-sm',
        },
        md: {
            container: 'p-8',
            illustration: 'w-28 h-28',
            title: 'text-lg',
            description: 'text-sm',
        },
        lg: {
            container: 'p-12',
            illustration: 'w-36 h-36',
            title: 'text-xl',
            description: 'text-base',
        },
    }

    const sizes = sizeClasses[size]

    const content = (
        <>
            {/* Illustration or Icon */}
            <div className={clsx('mx-auto mb-4', sizes.illustration)}>
                {icon || (illustration && illustrations[illustration]) || illustrations.search}
            </div>

            {/* Title */}
            <h3
                className={clsx(
                    'font-semibold text-surface-900 dark:text-white mb-2',
                    sizes.title
                )}
            >
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p
                    className={clsx(
                        'text-surface-500 dark:text-surface-300 mb-6 max-w-sm mx-auto',
                        sizes.description
                    )}
                >
                    {description}
                </p>
            )}

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    {action && (
                        <button
                            onClick={action.onClick}
                            className={clsx(
                                action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'
                            )}
                        >
                            {action.label}
                        </button>
                    )}
                    {secondaryAction && (
                        <button
                            onClick={secondaryAction.onClick}
                            className="btn-ghost text-surface-500"
                        >
                            {secondaryAction.label}
                        </button>
                    )}
                </div>
            )}
        </>
    )

    if (variant === 'inline') {
        return (
            <div className={clsx('text-center py-8', className)}>
                {content}
            </div>
        )
    }

    if (variant === 'full') {
        return (
            <div
                className={clsx(
                    'flex flex-col items-center justify-center min-h-[400px] text-center',
                    sizes.container,
                    className
                )}
            >
                {content}
            </div>
        )
    }

    // Card variant (default)
    return (
        <div
            className={clsx(
                'card text-center',
                sizes.container,
                className
            )}
        >
            {content}
        </div>
    )
}

// ============================================
// Quick Empty State Presets
// ============================================

export function EmptyHabits({ onAdd }: { onAdd: () => void }) {
    const t = useTranslation('common')
    return (
        <EnhancedEmptyState
            illustration="habits"
            title={t('emptyPresets.habitsTitle')}
            description={t('emptyPresets.habitsDescription')}
            action={{
                label: t('emptyPresets.habitsAction'),
                onClick: onAdd,
            }}
        />
    )
}

export function EmptyActivities({ onAdd }: { onAdd: () => void }) {
    const t = useTranslation('common')
    return (
        <EnhancedEmptyState
            illustration="activities"
            title={t('emptyPresets.activitiesTitle')}
            description={t('emptyPresets.activitiesDescription')}
            action={{
                label: t('emptyPresets.activitiesAction'),
                onClick: onAdd,
            }}
        />
    )
}

export function EmptySessions() {
    const t = useTranslation('common')
    return (
        <EnhancedEmptyState
            illustration="sessions"
            title={t('emptyPresets.sessionsTitle')}
            description={t('emptyPresets.sessionsDescription')}
            size="sm"
            variant="inline"
        />
    )
}

export function EmptyStats() {
    const t = useTranslation('common')
    return (
        <EnhancedEmptyState
            illustration="stats"
            title={t('emptyPresets.statsTitle')}
            description={t('emptyPresets.statsDescription')}
            variant="inline"
        />
    )
}

export function EmptySearchResults({ query }: { query: string }) {
    const t = useTranslation('common')
    return (
        <EnhancedEmptyState
            illustration="search"
            title={t('emptyPresets.searchTitle')}
            description={t('emptyPresets.searchDescription', { query })}
            size="sm"
            variant="inline"
        />
    )
}
