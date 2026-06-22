import { useTranslation } from '@/i18n'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { clsx } from 'clsx'
import { MoreHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { APP_NAV_ITEMS, MOBILE_PRIMARY_NAV_IDS, isNavItemActive } from './navItems'

const MOBILE_NAV_SPRING = {
    type: 'spring',
    stiffness: 340,
    damping: 28,
    mass: 0.5,
} as const

export function BottomNavigation() {
    const t = useTranslation('common')
    const { pathname } = useLocation()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const shouldReduceMotion = useReducedMotion()

    const primaryItems = useMemo(
        () => MOBILE_PRIMARY_NAV_IDS
            .map(id => APP_NAV_ITEMS.find(item => item.id === id))
            .filter((item): item is (typeof APP_NAV_ITEMS)[number] => Boolean(item)),
        []
    )
    const overflowItems = useMemo(
        () => APP_NAV_ITEMS.filter(item => !MOBILE_PRIMARY_NAV_IDS.includes(item.id)),
        []
    )

    const isOverflowActive = overflowItems.some(item => isNavItemActive(pathname, item.href))

    useEffect(() => {
        setDrawerOpen(false)
    }, [pathname])

    return (
        <div className="fixed inset-x-2.5 bottom-2.5 z-50 md:hidden">
            <LayoutGroup id="mobile-nav">
                <nav
                    className={clsx(
                        'relative rounded-[1.75rem] border border-black/8 px-1.5 py-1.5 shadow-glass backdrop-blur-2xl',
                        'bg-white/92 dark:border-white/8 dark:bg-black/82'
                    )}
                    aria-label={t('app.mobileNavigation')}
                >
                    <ul className="grid grid-cols-5 gap-1">
                        {primaryItems.map(item => (
                            <li key={item.id} className="min-w-0">
                                <MobileNavLink
                                    href={item.href}
                                    label={t(item.labelKey)}
                                    targetId={`nav-${item.id}`}
                                    icon={item.icon}
                                    active={isNavItemActive(pathname, item.href)}
                                    onNavigate={() => setDrawerOpen(false)}
                                />
                            </li>
                        ))}

                        <li className="min-w-0">
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(open => !open)}
                                className={clsx(
                                    'relative flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-[1.15rem] px-2 py-2',
                                    'text-[0.62rem] font-mono uppercase tracking-[0.18em] transition-colors duration-200',
                                    isOverflowActive ? 'text-status-violet' : 'text-surface-500 dark:text-surface-400'
                                )}
                                aria-expanded={drawerOpen}
                                aria-controls="mobile-nav-overflow"
                                aria-label={t('app.more')}
                            >
                                {isOverflowActive && (
                                    <motion.span
                                        layoutId="navActivePill"
                                        className="absolute inset-0 rounded-[1.15rem] bg-black/[0.06] ring-1 ring-black/8 dark:bg-white/[0.08] dark:ring-white/10"
                                        transition={shouldReduceMotion ? { duration: 0 } : MOBILE_NAV_SPRING}
                                    />
                                )}
                                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full">
                                    <MoreHorizontal className="h-4.5 w-4.5" />
                                </span>
                                <span className="relative z-10 truncate">{t('app.more')}</span>
                            </button>
                        </li>
                    </ul>

                    <AnimatePresence>
                        {drawerOpen && (
                            <motion.div
                                id="mobile-nav-overflow"
                                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10, scale: shouldReduceMotion ? 1 : 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 10, scale: shouldReduceMotion ? 1 : 0.98 }}
                                transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                                className={clsx(
                                    'absolute bottom-[calc(100%+0.75rem)] right-0 w-[min(78vw,18rem)] overflow-hidden rounded-[1.5rem]',
                                    'border border-black/8 bg-white/96 p-2 shadow-card backdrop-blur-2xl',
                                    'dark:border-white/8 dark:bg-black/90'
                                )}
                            >
                                <div className="px-2 py-2">
                                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-text-muted">
                                        {t('app.more')}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {overflowItems.map(item => (
                                        <OverflowLink
                                            key={item.id}
                                            href={item.href}
                                            label={t(item.labelKey)}
                                            targetId={`nav-${item.id}`}
                                            icon={item.icon}
                                            active={isNavItemActive(pathname, item.href)}
                                            onNavigate={() => setDrawerOpen(false)}
                                            caption={t('app.navigate')}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>
            </LayoutGroup>
        </div>
    )
}

interface MobileNavLinkProps {
    href: string
    label: string
    targetId: string
    icon: ComponentType<{ className?: string }>
    active: boolean
    onNavigate: () => void
}

function MobileNavLink({ href, label, targetId, icon: Icon, active, onNavigate }: MobileNavLinkProps) {
    const shouldReduceMotion = useReducedMotion()
    return (
        <Link
            to={href}
            onClick={onNavigate}
            data-onboarding-target={targetId}
            aria-current={active ? 'page' : undefined}
            className={clsx(
                'relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[1.15rem] px-2 py-2',
                'text-[0.62rem] font-mono uppercase tracking-[0.18em] transition-colors duration-200',
                active ? 'text-status-violet' : 'text-surface-500 dark:text-surface-400'
            )}
        >
            {active && (
                <motion.span
                    layoutId="navActivePill"
                    className="absolute inset-0 rounded-[1.15rem] bg-black/[0.06] ring-1 ring-black/8 dark:bg-white/[0.08] dark:ring-white/10"
                    transition={shouldReduceMotion ? { duration: 0 } : MOBILE_NAV_SPRING}
                />
            )}
            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full">
                <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="relative z-10 truncate">{label}</span>
        </Link>
    )
}

interface OverflowLinkProps {
    href: string
    label: string
    targetId: string
    caption: string
    icon: ComponentType<{ className?: string }>
    active: boolean
    onNavigate: () => void
}

function OverflowLink({ href, label, targetId, caption, icon: Icon, active, onNavigate }: OverflowLinkProps) {
    return (
        <Link
            to={href}
            onClick={onNavigate}
            data-onboarding-target={targetId}
            aria-current={active ? 'page' : undefined}
            className={clsx(
                'flex items-center gap-3 rounded-[1.1rem] px-3 py-3 text-sm transition-colors duration-200',
                active
                    ? 'bg-black/[0.06] text-text-primary dark:bg-white/[0.08]'
                    : 'text-text-secondary hover:bg-black/[0.04] hover:text-text-primary dark:hover:bg-white/[0.05]'
            )}
        >
            <span
                className={clsx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    active
                        ? 'bg-status-violet/12 text-status-violet'
                        : 'bg-black/[0.04] text-text-secondary dark:bg-white/[0.05]'
                )}
            >
                <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
                <p className="truncate font-medium tracking-tight">{label}</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-text-muted">
                    {caption}
                </p>
            </div>
        </Link>
    )
}
