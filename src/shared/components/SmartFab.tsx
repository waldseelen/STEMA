import { useTranslation } from '@/i18n'
import { useLongPress } from '@/shared/hooks/useLongPress'
import {
    CheckCircleIcon,
    ClockIcon,
    PencilIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

interface SmartFabAction {
    icon: ReactNode
    label: string
    onClick: () => void
    variant?: 'default' | 'success' | 'warning' | 'danger'
}

interface SmartFabProps {
    onPrimaryAction: () => void
    secondaryActions?: SmartFabAction[]
    icon?: ReactNode
    position?: 'bottom-right' | 'bottom-center'
    visible?: boolean
    className?: string
}

export function SmartFab({
    onPrimaryAction,
    secondaryActions = [],
    icon = <PlusIcon className="h-7 w-7" />,
    position = 'bottom-right',
    visible = true,
    className,
}: SmartFabProps) {
    const t = useTranslation('common')
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const hasSecondaryActions = secondaryActions.length > 0

    useEffect(() => {
        const openHandler = () => setIsMenuOpen(true)
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false)
            }
        }

        window.addEventListener('smartfab:open-menu', openHandler)
        window.addEventListener('keydown', closeOnEscape)
        return () => {
            window.removeEventListener('smartfab:open-menu', openHandler)
            window.removeEventListener('keydown', closeOnEscape)
        }
    }, [])

    const { handlers, isLongPress } = useLongPress({
        delay: 350,
        onClick: () => {
            if (hasSecondaryActions) {
                setIsMenuOpen(open => !open)
                return
            }

            onPrimaryAction()
        },
        onLongPress: () => {
            if (hasSecondaryActions) {
                setIsMenuOpen(true)
            }
        },
    })

    const handleMenuItemClick = (action: () => void) => {
        action()
        setIsMenuOpen(false)
    }

    if (!visible) {
        return null
    }

    return (
        <>
            <div
                className={clsx(
                    'fixed inset-0 z-40 bg-black/25 transition-opacity',
                    isMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                )}
                onClick={() => setIsMenuOpen(false)}
                aria-hidden={!isMenuOpen}
            />

            <div
                className={clsx(
                    'fixed z-50 transition-all duration-300',
                    position === 'bottom-right' && 'bottom-[5.9rem] right-4 lg:bottom-6 lg:right-6',
                    position === 'bottom-center' && 'bottom-[5.9rem] left-1/2 -translate-x-1/2 lg:bottom-6',
                    !visible && 'scale-0 opacity-0',
                    className
                )}
            >
                {hasSecondaryActions && (
                    <>
                        <div
                            className={clsx(
                                'absolute bottom-[calc(100%+1rem)] right-0 hidden min-w-[17rem] flex-col gap-2 lg:flex',
                                isMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                            )}
                        >
                            {secondaryActions.map((action, index) => (
                                <FabActionButton
                                    key={`${action.label}-${index}`}
                                    action={action}
                                    onClick={() => handleMenuItemClick(action.onClick)}
                                />
                            ))}
                        </div>

                        <div
                            className={clsx(
                                'fixed inset-x-4 bottom-[calc(4.5rem+16px)] rounded-[1.25rem] border border-[var(--border-subtle)] bg-surface-100 p-3 shadow-[var(--shadow-card-elevated)] transition-all lg:hidden',
                                isMenuOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
                            )}
                            role="dialog"
                            aria-modal="true"
                            aria-label={t('fab.quickActions')}
                        >
                            <div className="px-2 pb-2">
                                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-text-muted">
                                    {t('fab.quickActions')}
                                </p>
                            </div>
                            <div className="space-y-2">
                                {secondaryActions.map((action, index) => (
                                    <FabActionButton
                                        key={`${action.label}-${index}-mobile`}
                                        action={action}
                                        onClick={() => handleMenuItemClick(action.onClick)}
                                        mobile
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <button
                    {...handlers}
                    type="button"
                    data-onboarding-target="quick-actions"
                    className={clsx(
                        'flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-black text-white shadow-[var(--shadow-card-elevated)] transition-all duration-300 active:scale-95 dark:border-white/10 dark:bg-white dark:text-black',
                        isMenuOpen && 'rotate-45',
                        isLongPress && 'scale-110'
                    )}
                    aria-expanded={isMenuOpen}
                    aria-label={t('fab.quickActions')}
                >
                    <span className={clsx('transition-transform duration-300', isMenuOpen && 'rotate-45')}>
                        {isMenuOpen ? <XMarkIcon className="h-7 w-7" /> : icon}
                    </span>
                </button>
            </div>
        </>
    )
}

interface FabActionButtonProps {
    action: SmartFabAction
    onClick: () => void
    mobile?: boolean
}

function FabActionButton({ action, onClick, mobile = false }: FabActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                'flex items-center gap-3 rounded-[1.2rem] border border-[var(--border-subtle)] bg-surface-100 px-4 py-3 text-left text-text-primary transition-colors hover:bg-surface-200',
                mobile ? 'w-full' : 'justify-between'
            )}
        >
            <span className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-full',
                action.variant === 'success' && 'bg-status-green-soft text-status-green',
                action.variant === 'warning' && 'bg-status-amber-soft text-status-amber',
                action.variant === 'danger' && 'bg-status-red-soft text-status-red',
                (!action.variant || action.variant === 'default') && 'bg-surface-200 text-text-secondary'
            )}>
                {action.icon}
            </span>
            <span className="flex-1 text-sm font-medium">{action.label}</span>
        </button>
    )
}

export function useDefaultFabActions() {
    const t = useTranslation('common')

    return useMemo(() => [
        {
            icon: <ClockIcon className="h-5 w-5" />,
            label: t('quickAction.tabs.timer'),
            onClick: (): void => undefined,
            variant: 'default' as const,
        },
        {
            icon: <CheckCircleIcon className="h-5 w-5" />,
            label: t('quickAction.tabs.habit'),
            onClick: (): void => undefined,
            variant: 'success' as const,
        },
        {
            icon: <PencilIcon className="h-5 w-5" />,
            label: t('quickAction.tabs.manual'),
            onClick: (): void => undefined,
            variant: 'default' as const,
        },
    ], [t])
}
