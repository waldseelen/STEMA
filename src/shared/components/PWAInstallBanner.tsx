import { useTranslation } from '@/i18n'
import { ArrowDownTrayIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAInstallBannerProps {
    /** Görünüm modu */
    variant?: 'card' | 'banner' | 'minimal'
    /** Ayarlarda göster */
    showInSettings?: boolean
    className?: string
}

/**
 * PWA Kurulum Banner'ı
 * Tarayıcının varsayılan yükle uyarısı yerine özel tasarlanmış bir kart
 */
export function PWAInstallBanner({
    variant = 'card',
    showInSettings = false,
    className,
}: PWAInstallBannerProps) {
    const t = useTranslation('common')
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isInstalled, setIsInstalled] = useState(false)
    const [isIosBrowser, setIsIosBrowser] = useState(false)
    const [isDismissed, setIsDismissed] = useState(() => {
        return localStorage.getItem('lifeflow_pwa_dismissed') === 'true'
    })

    useEffect(() => {
        // Zaten PWA olarak yüklü mü kontrol et
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
            return
        }

        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIos = /iphone|ipad|ipod/.test(userAgent)
        const isStandalone = 'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
        setIsIosBrowser(isIos && !isStandalone)

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
        }

        const handleAppInstalled = () => {
            setIsInstalled(true)
            setDeferredPrompt(null)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setIsInstalled(true)
        }

        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setIsDismissed(true)
        localStorage.setItem('lifeflow_pwa_dismissed', 'true')
    }

    const canShowIosHint = isIosBrowser && !isInstalled

    // Ayarlar sayfasında her zaman göster (farklı bir görünümle)
    if (showInSettings) {
        return (
            <div className={clsx('card p-6', className)}>
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[rgb(var(--color-accent-rgb)/0.08)] text-[var(--color-accent)]">
                        <SparklesIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                            {t('pwa.title')}
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                            {isInstalled
                                ? t('pwa.installedBody')
                                : canShowIosHint
                                    ? t('pwa.iosBody')
                                    : t('pwa.installBody')}
                        </p>
                        {!isInstalled && deferredPrompt && (
                            <button
                                onClick={handleInstall}
                                className="btn-primary mt-4 gap-2"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                {t('pwa.installButton')}
                            </button>
                        )}
                        {!isInstalled && canShowIosHint && !deferredPrompt && (
                            <div className="mt-4 inline-flex rounded-full border border-surface-200 px-3 py-2 text-xs font-medium text-surface-600 dark:border-surface-700 dark:text-surface-300">
                                {t('pwa.iosHint')}
                            </div>
                        )}
                        {isInstalled && (
                            <div className="flex items-center gap-2 mt-3 text-success-500">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">{t('pwa.installed')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Gösterilmemesi gereken durumlar
    if (isInstalled || isDismissed || (!deferredPrompt && !canShowIosHint)) {
        return null
    }

    // Banner variant
    if (variant === 'banner') {
        return (
            <div
                className={clsx(
                    'fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96',
                    'card p-4 shadow-xl z-40 animate-slide-up',
                    className
                )}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[rgb(var(--color-accent-rgb)/0.08)] text-[var(--color-accent)]">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                            {t('pwa.shortTitle')}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                            {canShowIosHint ? t('pwa.iosHint') : t('pwa.bannerBody')}
                        </p>
                    </div>
                    {deferredPrompt ? (
                        <button
                            onClick={handleInstall}
                            className="btn-primary text-sm px-3 py-2"
                        >
                            {t('pwa.installShort')}
                        </button>
                    ) : (
                        <span className="rounded-full border border-surface-200 px-3 py-2 text-xs font-medium text-surface-600 dark:border-surface-700 dark:text-surface-300">
                            {t('pwa.iosHint')}
                        </span>
                    )}
                    <button
                        onClick={handleDismiss}
                        className="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        )
    }

    // Minimal variant
    if (variant === 'minimal') {
        return (
            deferredPrompt ? (
                <button
                    onClick={handleInstall}
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-xl',
                        'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
                        'hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors',
                        className
                    )}
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('pwa.title')}</span>
                </button>
            ) : (
                <div
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-xl',
                        'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
                        className
                    )}
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('pwa.iosHint')}</span>
                </div>
            )
        )
    }

    // Card variant (default)
    return (
        <div
            className={clsx('card relative overflow-hidden p-6', className)}
        >
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="relative flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[rgb(var(--color-accent-rgb)/0.08)] text-[var(--color-accent)]">
                    <SparklesIcon className="w-8 h-8" />
                </div>

                <h3 className="mb-2 text-xl font-bold text-text-primary">
                    {t('pwa.shortTitle')}
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-6 max-w-xs">
                    {canShowIosHint ? t('pwa.iosBody') : t('pwa.cardBody')}
                </p>

                <div className="flex items-center gap-3">
                    {deferredPrompt ? (
                        <button
                            onClick={handleInstall}
                            className="btn-primary gap-2"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            {t('pwa.installButton')}
                        </button>
                    ) : (
                        <span className="inline-flex rounded-full border border-surface-200 px-4 py-2 text-sm font-medium text-surface-700 dark:border-surface-700 dark:text-surface-200">
                            {t('pwa.iosHint')}
                        </span>
                    )}
                    <button
                        onClick={handleDismiss}
                        className="btn-ghost text-surface-500"
                    >
                        {t('pwa.later')}
                    </button>
                </div>

                {/* Feature badges */}
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {[t('pwa.featureOffline'), t('pwa.featureFastAccess'), t('pwa.featureNotifications')].map(feature => (
                        <span
                            key={feature}
                            className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-xs font-medium text-surface-600 dark:text-surface-300"
                        >
                            {feature}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}
