import { useTranslation } from '@/i18n'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { CheckCircleIcon, CloudIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { useEffect, useState } from 'react'

type SyncStatus = 'synced' | 'saving' | 'offline' | 'error'

interface OfflineIndicatorProps {
    /** Kaydetme durumu */
    status?: SyncStatus
    /** Son kaydetme zamanı */
    lastSaved?: Date | null
    /** Görünüm modu */
    variant?: 'bar' | 'badge' | 'minimal'
    className?: string
}

/**
 * Offline durum göstergesi
 * PWA'nın offline-first doğasını kullanıcıya gösterir
 */
export function OfflineIndicator({
    status = 'synced',
    lastSaved,
    variant = 'minimal',
    className,
}: OfflineIndicatorProps) {
    const t = useTranslation('common')
    const isOnline = useOnlineStatus()
    const [showOfflineMessage, setShowOfflineMessage] = useState(false)

    // Çevrimdışı olduğunda mesajı göster
    useEffect(() => {
        if (!isOnline) {
            setShowOfflineMessage(true)
        } else {
            // Tekrar çevrimiçi olduğunda 3 saniye sonra gizle
            const timer = setTimeout(() => setShowOfflineMessage(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [isOnline])

    const effectiveStatus: SyncStatus = !isOnline ? 'offline' : status

    const getStatusConfig = () => {
        switch (effectiveStatus) {
            case 'synced':
                return {
                    icon: <CheckCircleIcon className="w-4 h-4" />,
                    text: t('app.savedLocally'),
                    shortText: t('toast.saved'),
                    color: 'text-success-500',
                    bg: 'bg-success-50 dark:bg-success-900/20',
                    border: 'border-success-200 dark:border-success-800',
                }
            case 'saving':
                return {
                    icon: (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ),
                    text: t('common.loading'),
                    shortText: t('app.saving'),
                    color: 'text-primary-500',
                    bg: 'bg-primary-50 dark:bg-primary-900/20',
                    border: 'border-primary-200 dark:border-primary-800',
                }
            case 'offline':
                return {
                    icon: <CloudIcon className="w-4 h-4" />,
                    text: t('app.offlineSaving'),
                    shortText: t('app.offline'),
                    color: 'text-amber-500',
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    border: 'border-amber-200 dark:border-amber-800',
                }
            case 'error':
                return {
                    icon: <ExclamationTriangleIcon className="w-4 h-4" />,
                    text: t('app.saveError'),
                    shortText: t('common.error'),
                    color: 'text-red-500',
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-200 dark:border-red-800',
                }
        }
    }

    const config = getStatusConfig()

    // Minimal variant - sadece ikon
    if (variant === 'minimal') {
        return (
            <div
                className={clsx(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-300',
                    config.color,
                    showOfflineMessage && config.bg,
                    className
                )}
                title={config.text}
            >
                {config.icon}
                {showOfflineMessage && (
                    <span className="text-xs font-medium animate-fade-in">
                        {config.shortText}
                    </span>
                )}
            </div>
        )
    }

    // Badge variant - kompakt görünüm
    if (variant === 'badge') {
        return (
            <div
                className={clsx(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
                    config.bg,
                    config.color,
                    'border',
                    config.border,
                    className
                )}
            >
                {config.icon}
                <span>{config.shortText}</span>
            </div>
        )
    }

    // Bar variant - tam genişlik üst bar
    if (!showOfflineMessage && effectiveStatus === 'synced') {
        return null
    }

    return (
        <div
            className={clsx(
                'fixed top-0 left-0 right-0 z-50 py-2 px-4',
                'flex items-center justify-center gap-2',
                'text-sm font-medium transition-all duration-300',
                config.bg,
                config.color,
                'border-b',
                config.border,
                'animate-slide-down',
                className
            )}
        >
            {config.icon}
            <span>{config.text}</span>
            {lastSaved && effectiveStatus === 'synced' && (
                <span className="text-xs opacity-70">
                    ({formatTimeAgo(lastSaved)})
                </span>
            )}
        </div>
    )
}

/**
 * Zaman farkını okunabilir formata çevirir
 */
function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 10) return 'just now'
    if (seconds < 60) return `${seconds}s ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    return `${days}d ago`
}
