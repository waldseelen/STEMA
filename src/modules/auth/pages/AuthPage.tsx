import { useTranslation } from '@/i18n'

import { AuthStateScreen } from '@/modules/auth/components/AuthStateScreen'
import { AuthStatusNotice } from '@/modules/auth/components/AuthStatusNotice'
import { EmailAuthForm } from '@/modules/auth/components/EmailAuthForm'
import { AuthProviderButtons } from '@/modules/auth/components/AuthProviderButtons'
import type { OAuthProviderId } from '@/modules/auth/lib/oauth'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { LanguageToggle, ThemeToggle } from '@/shared/components'
import { useAccessiblePage } from '@/shared/hooks/useAccessiblePage'
import { motion, useReducedMotion } from 'framer-motion'
import {
    ArrowRight,
    BarChart3,
    BadgeCheck,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Cloud,
    Clock3,
    Flame,
    Layers3,
    ListTodo,
    ShieldCheck,
    Sparkles,
    TimerReset,
} from 'lucide-react'
import { useMemo, useState, type ComponentType } from 'react'


function LoadingSplash() {
    const tAuth = useTranslation('auth')
    return (
        <AuthStateScreen
            title={tAuth('auth.guard.profileLoadingTitle')}
            description={tAuth('auth.guard.profileLoadingDescription')}
        />
    )
}

const EASE_OUT = [0.25, 0.1, 0.25, 1] as [number, number, number, number]

const heroContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
}

const heroItem = {
    hidden: { opacity: 0, y: 18 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: EASE_OUT },
    },
}

const authCardContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
}

const authCardItem = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: EASE_OUT },
    },
}

interface AccentTone {
    glow: string
    surface: string
}

function FeatureCard({
    icon: Icon,
    title,
    description,
    eyebrow,
    index,
    reduced,
    tone,
}: {
    icon: ComponentType<{ className?: string }>
    title: string
    description: string
    eyebrow: string
    index: number
    reduced: boolean | null
    tone: AccentTone
}) {
    return (
        <motion.article
            initial={reduced ? false : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-48px' }}
            transition={
                reduced
                    ? { duration: 0 }
                    : { duration: 0.44, delay: (index % 3) * 0.07, ease: EASE_OUT }
            }
            whileHover={reduced ? undefined : { y: -4, transition: { duration: 0.18 } }}
            className="group card relative isolate h-full cursor-default overflow-hidden p-5 transition-[transform,box-shadow] duration-300 hover:shadow-[var(--card-hover-glow)]"
        >
            <div
                className="pointer-events-none absolute inset-x-6 top-0 h-20 rounded-full blur-3xl"
                style={{ background: tone.glow }}
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                    background:
                        'linear-gradient(180deg, rgb(255 255 255 / 0.045), transparent 46%)',
                }}
                aria-hidden
            />

            <div className="relative">
                <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[var(--border-subtle)] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08)] transition-transform duration-300 group-hover:scale-105"
                    style={{ background: tone.surface }}
                >
                    <Icon className="h-5 w-5 text-text-primary" />
                </div>
                <p className="mb-1.5 font-mono text-[0.61rem] uppercase tracking-[0.2em] text-text-muted">
                    {eyebrow}
                </p>
                <h3 className="mb-2 text-base font-semibold tracking-tight text-text-primary">
                    {title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
            </div>
        </motion.article>
    )
}

function HeroSignalCard({
    kicker,
    title,
    description,
    tone,
    index,
    reduced,
}: {
    kicker: string
    title: string
    description: string
    tone: AccentTone
    index: number
    reduced: boolean | null
}) {
    return (
        <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={
                reduced
                    ? { duration: 0 }
                    : { duration: 0.42, delay: 0.12 + index * 0.06, ease: EASE_OUT }
            }
            whileHover={reduced ? undefined : { y: -3, transition: { duration: 0.18 } }}
            className="group relative isolate overflow-hidden rounded-[1.7rem] border border-[var(--border-subtle)] bg-surface-100/70 p-4 backdrop-blur-xl"
        >
            <div
                className="pointer-events-none absolute inset-x-6 top-0 h-16 rounded-full blur-3xl"
                style={{ background: tone.glow }}
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                    background:
                        'linear-gradient(180deg, rgb(255 255 255 / 0.05), transparent 48%)',
                }}
                aria-hidden
            />

            <div className="relative">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-text-muted">
                    {kicker}
                </p>
                <h3 className="mt-2 text-sm font-semibold leading-snug tracking-tight text-text-primary">
                    {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">{description}</p>
            </div>
        </motion.div>
    )
}

function AuthMetricCard({
    value,
    label,
    tone,
    index,
    reduced,
}: {
    value: string
    label: string
    tone: AccentTone
    index: number
    reduced: boolean | null
}) {
    return (
        <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
                reduced
                    ? { duration: 0 }
                    : { duration: 0.42, delay: 0.28 + index * 0.05, ease: EASE_OUT }
            }
            className="relative isolate overflow-hidden rounded-[1.45rem] border border-[var(--border-subtle)] bg-surface-100/75 p-4 backdrop-blur-xl"
        >
            <div
                className="pointer-events-none absolute inset-x-4 top-0 h-14 rounded-full blur-3xl"
                style={{ background: tone.glow }}
                aria-hidden
            />
            <div className="relative">
                <p className="text-sm font-semibold tracking-tight text-text-primary">{value}</p>
                <p className="mt-1 text-[0.72rem] leading-relaxed text-text-muted">{label}</p>
            </div>
        </motion.div>
    )
}

function StepItem({
    icon: Icon,
    step,
    title,
    description,
    isLast,
    index,
    reduced,
}: {
    icon: ComponentType<{ className?: string }>
    step: string
    title: string
    description: string
    isLast: boolean
    index: number
    reduced: boolean | null
}) {
    return (
        <motion.div
            initial={reduced ? false : { opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={
                reduced
                    ? { duration: 0 }
                    : { duration: 0.44, delay: index * 0.08, ease: EASE_OUT }
            }
            className="relative flex gap-4"
        >
            {!isLast && (
                <div className="absolute bottom-0 left-5 top-14 w-px bg-gradient-to-b from-[var(--border-medium)] to-transparent" />
            )}

            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-medium)] bg-surface-100">
                <Icon className="h-4 w-4 text-text-secondary" />
            </div>

            <div className={isLast ? 'pb-0 flex-1' : 'pb-8 flex-1'}>
                <div className="rounded-[1.6rem] border border-[var(--border-subtle)] bg-surface-100/70 p-5 backdrop-blur-xl">
                    <p className="font-mono text-[0.61rem] uppercase tracking-[0.2em] text-status-violet">
                        {step}
                    </p>
                    <h3 className="mt-2 text-base font-semibold tracking-tight text-text-primary">
                        {title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                        {description}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}

export function AuthPage() {
    const tAuth = useTranslation('auth')
    const tLanding = useTranslation('landing')
    const reduced = useReducedMotion()
    const {
        authInitialized,
        isAuthenticated,
        profile,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
    } = useAuthStore()
    const authEnabled = true
    const [loadingProvider, setLoadingProvider] = useState<OAuthProviderId | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [showEmailForm, setShowEmailForm] = useState(false)

    const handleProvider = async (provider: OAuthProviderId) => {
        if (provider === 'email') {
            setShowEmailForm(true)
        } else {
            setLoadingProvider(provider)
            setErrorMessage(null)
            try {
                await signInWithOAuth(provider)
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'OAuth failed')
                setLoadingProvider(null)
            }
        }
    }

    useAccessiblePage(tLanding('landing.pageTitle'), {
        announceMessage: tLanding('landing.pageAnnouncement'),
        disabled: !authInitialized,
    })

    const heroSignals = useMemo(
        () => [
            {
                kicker: tLanding('landing.heroSignals.unified.kicker'),
                title: tLanding('landing.heroSignals.unified.title'),
                description: tLanding('landing.heroSignals.unified.desc'),
                tone: {
                    glow: 'rgb(var(--accent-color-rgb) / 0.22)',
                    surface: 'rgb(var(--accent-color-rgb) / 0.12)',
                },
            },
            {
                kicker: tLanding('landing.heroSignals.entry.kicker'),
                title: tLanding('landing.heroSignals.entry.title'),
                description: tLanding('landing.heroSignals.entry.desc'),
                tone: {
                    glow: 'rgb(var(--status-blue-rgb) / 0.18)',
                    surface: 'rgb(var(--status-blue-rgb) / 0.1)',
                },
            },
            {
                kicker: tLanding('landing.heroSignals.real.kicker'),
                title: tLanding('landing.heroSignals.real.title'),
                description: tLanding('landing.heroSignals.real.desc'),
                tone: {
                    glow: 'rgb(var(--status-green-rgb) / 0.18)',
                    surface: 'rgb(var(--status-green-rgb) / 0.1)',
                },
            },
        ],
        [tLanding]
    )

    const featureCards = useMemo(
        () => [
            {
                icon: BookOpen,
                title: tLanding('landing.features.planner.title'),
                description: tLanding('landing.features.planner.desc'),
                eyebrow: tLanding('landing.features.planner.badge'),
                tone: {
                    glow: 'rgb(var(--accent-color-rgb) / 0.22)',
                    surface: 'rgb(var(--accent-color-rgb) / 0.12)',
                },
            },
            {
                icon: ListTodo,
                title: tLanding('landing.features.tasks.title'),
                description: tLanding('landing.features.tasks.desc'),
                eyebrow: tLanding('landing.features.tasks.badge'),
                tone: {
                    glow: 'rgb(var(--status-blue-rgb) / 0.18)',
                    surface: 'rgb(var(--status-blue-rgb) / 0.1)',
                },
            },
            {
                icon: CalendarDays,
                title: tLanding('landing.features.calendar.title'),
                description: tLanding('landing.features.calendar.desc'),
                eyebrow: tLanding('landing.features.calendar.badge'),
                tone: {
                    glow: 'rgb(var(--status-amber-rgb) / 0.16)',
                    surface: 'rgb(var(--status-amber-rgb) / 0.1)',
                },
            },
            {
                icon: Flame,
                title: tLanding('landing.features.habits.title'),
                description: tLanding('landing.features.habits.desc'),
                eyebrow: tLanding('landing.features.habits.badge'),
                tone: {
                    glow: 'rgb(var(--status-green-rgb) / 0.18)',
                    surface: 'rgb(var(--status-green-rgb) / 0.1)',
                },
            },
            {
                icon: TimerReset,
                title: tLanding('landing.features.tracker.title'),
                description: tLanding('landing.features.tracker.desc'),
                eyebrow: tLanding('landing.features.tracker.badge'),
                tone: {
                    glow: 'rgb(var(--status-violet-rgb) / 0.18)',
                    surface: 'rgb(var(--status-violet-rgb) / 0.1)',
                },
            },
            {
                icon: BarChart3,
                title: tLanding('landing.features.statistics.title'),
                description: tLanding('landing.features.statistics.desc'),
                eyebrow: tLanding('landing.features.statistics.badge'),
                tone: {
                    glow: 'rgb(var(--text-primary-rgb) / 0.12)',
                    surface: 'rgb(var(--text-primary-rgb) / 0.06)',
                },
            },
        ],
        [tLanding]
    )

    const steps = useMemo(
        () => [
            {
                icon: ShieldCheck,
                title: tLanding('landing.workflow.entry.title'),
                description: tLanding('landing.workflow.entry.desc'),
                step: tLanding('landing.workflow.entry.badge'),
            },
            {
                icon: CheckCircle2,
                title: tLanding('landing.workflow.profile.title'),
                description: tLanding('landing.workflow.profile.desc'),
                step: tLanding('landing.workflow.profile.badge'),
            },
            {
                icon: Layers3,
                title: tLanding('landing.workflow.onboarding.title'),
                description: tLanding('landing.workflow.onboarding.desc'),
                step: tLanding('landing.workflow.onboarding.badge'),
            },
        ],
        [tLanding]
    )

    const authFlow = useMemo(
        () => [
            tLanding('landing.ctaFlow.entry'),
            tLanding('landing.ctaFlow.profile'),
            tLanding('landing.ctaFlow.planner'),
        ],
        [tLanding]
    )

    const authMetrics = useMemo(
        () => [
            {
                value: tLanding('landing.ctaStats.shell.value'),
                label: tLanding('landing.ctaStats.shell.label'),
                tone: {
                    glow: 'rgb(var(--accent-color-rgb) / 0.2)',
                    surface: 'rgb(var(--accent-color-rgb) / 0.1)',
                },
            },
            {
                value: tLanding('landing.ctaStats.providers.value'),
                label: tLanding('landing.ctaStats.providers.label'),
                tone: {
                    glow: 'rgb(var(--status-blue-rgb) / 0.18)',
                    surface: 'rgb(var(--status-blue-rgb) / 0.1)',
                },
            },
            {
                value: tLanding('landing.ctaStats.onboarding.value'),
                label: tLanding('landing.ctaStats.onboarding.label'),
                tone: {
                    glow: 'rgb(var(--status-green-rgb) / 0.18)',
                    surface: 'rgb(var(--status-green-rgb) / 0.1)',
                },
            },
        ],
        [tLanding]
    )

    const futureCards = useMemo(
        () => [
            {
                icon: TimerReset,
                title: tLanding('landing.future.focus.title'),
                description: tLanding('landing.future.focus.desc'),
                tone: {
                    glow: 'rgb(var(--status-amber-rgb) / 0.16)',
                    surface: 'rgb(var(--status-amber-rgb) / 0.1)',
                },
            },
            {
                icon: BarChart3,
                title: tLanding('landing.future.insights.title'),
                description: tLanding('landing.future.insights.desc'),
                tone: {
                    glow: 'rgb(var(--status-blue-rgb) / 0.18)',
                    surface: 'rgb(var(--status-blue-rgb) / 0.1)',
                },
            },
            {
                icon: Cloud,
                title: tLanding('landing.future.cloud.title'),
                description: tLanding('landing.future.cloud.desc'),
                tone: {
                    glow: 'rgb(var(--accent-color-rgb) / 0.2)',
                    surface: 'rgb(var(--accent-color-rgb) / 0.1)',
                },
            },
        ],
        [tLanding]
    )

    const handleEmailSubmit = async (email: string, password: string, isLogin: boolean) => {
        setLoadingProvider('email')
        setErrorMessage(null)
        try {
            if (isLogin) {
                await signInWithEmail(email, password)
            } else {
                await signUpWithEmail(email, password)
            }
        } catch (error: unknown) {
            const sbError = error as { message?: string }
            setErrorMessage(sbError.message || tAuth('auth.email.authError') || 'Authentication failed')
            setLoadingProvider(null)
        }
    }

    const rawTagline = tLanding('landing.tagline')
    const taglineRest = rawTagline.replace(/^PLAN\.EX\s*/i, '')

    if (!authInitialized || (isAuthenticated && !profile)) {
        return <LoadingSplash />
    }

    return (
        <div className="min-h-screen bg-background text-text-primary">
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
                <motion.div
                    className="absolute -top-48 right-[-5%] h-[720px] w-[720px] rounded-full opacity-[0.08] blur-[140px]"
                    style={{ background: 'rgb(var(--accent-color-rgb) / 1)' }}
                    animate={reduced ? {} : { x: [0, 28, -12, 0], y: [0, -20, 16, 0], scale: [1, 1.05, 0.98, 1] }}
                    transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-24 -left-16 h-[420px] w-[420px] rounded-full blur-[120px]"
                    style={{ background: 'rgb(var(--text-primary-rgb) / 0.05)' }}
                    animate={reduced ? {} : { x: [0, -18, 10, 0], y: [0, 22, -12, 0], scale: [1, 0.96, 1.03, 1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
                />
                <motion.div
                    className="absolute left-[16%] top-[44%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05] blur-[100px]"
                    style={{ background: 'var(--status-blue)' }}
                    animate={reduced ? {} : { x: [0, 14, -8, 0], y: [0, -12, 18, 0], scale: [1, 1.04, 0.98, 1] }}
                    transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 11 }}
                />
            </div>

            <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-4 md:px-6 md:pt-6">
                <motion.div
                    initial={reduced ? false : { opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduced ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT }}
                    className="glass sticky top-3 z-20 mb-10 flex items-center justify-between gap-3 rounded-full px-3.5 py-2 md:mb-14"
                >
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="font-mono text-sm font-bold tracking-[0.18em] text-text-primary">
                            PLAN.EX
                        </span>
                        <span className="hidden rounded-full border border-[var(--border-subtle)] px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-text-muted sm:inline-flex">
                            {tLanding('landing.badge')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <LanguageToggle />
                    </div>
                </motion.div>

                <section className="pb-20 md:pb-24">
                    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(340px,0.94fr)] lg:gap-14">
                        <motion.div variants={heroContainer} initial="hidden" animate="visible">
                            <motion.span
                                variants={heroItem}
                                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-surface-100 px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-text-muted"
                            >
                                <Sparkles className="h-3.5 w-3.5 text-status-violet" />
                                {tLanding('landing.heroEyebrow')}
                            </motion.span>

                            <motion.h1
                                variants={heroItem}
                                className="mt-5 max-w-[13ch] text-[2.8rem] font-semibold leading-[1.02] tracking-tight sm:text-[3.5rem] lg:text-[4.35rem]"
                            >
                                <span
                                    style={{
                                        backgroundImage:
                                            'linear-gradient(135deg, rgb(var(--accent-color-rgb)), var(--status-blue))',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    PLAN.EX
                                </span>{' '}
                                <span className="text-text-primary">{taglineRest}</span>
                            </motion.h1>

                            <motion.p
                                variants={heroItem}
                                className="mt-5 max-w-[56ch] text-sm leading-relaxed text-text-secondary sm:text-base"
                            >
                                {tLanding('landing.subtitle')}
                            </motion.p>

                            <div className="mt-7 grid gap-3 sm:grid-cols-3">
                                {heroSignals.map((signal, index) => (
                                    <HeroSignalCard
                                        key={signal.title}
                                        kicker={signal.kicker}
                                        title={signal.title}
                                        description={signal.description}
                                        tone={signal.tone}
                                        index={index}
                                        reduced={reduced}
                                    />
                                ))}
                            </div>

                            <motion.div variants={heroItem} className="mt-6 flex flex-wrap gap-2">
                                {[
                                    tLanding('landing.heroMeta.modules'),
                                    tLanding('landing.heroMeta.profile'),
                                    tLanding('landing.heroMeta.onboarding'),
                                ].map(meta => (
                                    <span
                                        key={meta}
                                        className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-text-secondary"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-status-violet opacity-55" />
                                        {meta}
                                    </span>
                                ))}
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={reduced ? false : { opacity: 0, y: 28, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={
                                reduced
                                    ? { duration: 0 }
                                    : { duration: 0.55, delay: 0.22, ease: EASE_OUT }
                            }
                            className="relative lg:pt-4"
                        >
                            <div
                                className="pointer-events-none absolute -inset-8 rounded-[3rem] opacity-[0.22] blur-[54px]"
                                style={{ background: 'rgb(var(--accent-color-rgb) / 0.9)' }}
                                aria-hidden
                            />

                            <motion.div
                                variants={authCardContainer}
                                initial="hidden"
                                animate="visible"
                                className="relative isolate overflow-hidden rounded-[2.35rem] border border-[var(--border-subtle)] bg-[linear-gradient(160deg,rgb(255_255_255/0.035),rgb(255_255_255/0.012))] p-6 shadow-[var(--shadow-lg)] backdrop-blur-2xl md:p-7"
                            >
                                <div
                                    className="pointer-events-none absolute inset-x-12 top-0 h-24 rounded-full blur-3xl"
                                    style={{ background: 'rgb(var(--accent-color-rgb) / 0.18)' }}
                                    aria-hidden
                                />
                                <div
                                    className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-60"
                                    style={{
                                        background:
                                            'linear-gradient(180deg, transparent, rgb(var(--status-blue-rgb) / 0.08), transparent)',
                                    }}
                                    aria-hidden
                                />

                                <motion.div
                                    variants={authCardItem}
                                    className="relative flex items-center justify-between gap-3"
                                >
                                    <p className="font-mono text-[0.63rem] uppercase tracking-[0.22em] text-text-muted">
                                        {tLanding('landing.ctaEyebrow')}
                                    </p>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-surface-100/75 px-3 py-1 text-[0.68rem] font-medium text-text-secondary">
                                        <BadgeCheck className="h-3.5 w-3.5 text-status-green" />
                                        {tLanding('landing.ctaTrustBadge')}
                                    </span>
                                </motion.div>

                                <motion.h2
                                    variants={authCardItem}
                                    className="relative mt-4 text-[1.72rem] font-semibold leading-[1.14] tracking-tight text-text-primary md:text-[1.95rem]"
                                >
                                    {tLanding('landing.ctaTitle')}
                                </motion.h2>

                                <motion.p
                                    variants={authCardItem}
                                    className="relative mt-3 text-sm leading-relaxed text-text-secondary md:text-[0.97rem]"
                                >
                                    {tLanding('landing.ctaDescription')}
                                </motion.p>

                                <motion.div
                                    variants={authCardItem}
                                    className="relative mt-5 flex flex-wrap items-center gap-2"
                                >
                                    {authFlow.map((item, index) => (
                                        <div
                                            key={item}
                                            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-surface-100/80 px-3 py-1.5 text-[0.72rem] font-medium text-text-secondary"
                                        >
                                            <span>{item}</span>
                                            {index < authFlow.length - 1 && (
                                                <ArrowRight className="h-3.5 w-3.5 text-text-muted" />
                                            )}
                                        </div>
                                    ))}
                                </motion.div>

                                <motion.div variants={authCardItem} className="relative mt-6">
                                    {showEmailForm ? (
                                        <div className="relative mt-6 bg-surface-100/50 rounded-lg p-4 border border-[var(--border-subtle)]">
                                            <button
                                                type="button"
                                                onClick={() => setShowEmailForm(false)}
                                                className="mb-4 text-xs font-medium text-[var(--accent-color)] hover:underline flex items-center gap-1"
                                            >
                                                &larr; {tAuth('auth.email.backToProviders') || 'Geri dön'}
                                            </button>
                                            <EmailAuthForm
                                                isLoading={loadingProvider === 'email'}
                                                onSubmit={handleEmailSubmit}
                                                error={errorMessage}
                                                t={tAuth}
                                            />
                                        </div>
                                    ) : (
                                        <AuthProviderButtons
                                            authEnabled={authEnabled}
                                            loadingProvider={loadingProvider}
                                            onProvider={handleProvider}
                                            t={tLanding}
                                        />
                                    )}
                                </motion.div>

                                {!authEnabled && (
                                    <div className="relative mt-4">
                                        <AuthStatusNotice
                                            tone="warning"
                                            title={tAuth('auth.providers.disabledTitle')}
                                            description={tAuth('auth.providers.disabled')}
                                        />
                                    </div>
                                )}

                                {errorMessage && (
                                    <div className="relative mt-4">
                                        <AuthStatusNotice
                                            tone="error"
                                            title={tAuth('auth.providers.errorTitle')}
                                            description={errorMessage}
                                        />
                                    </div>
                                )}

                                <motion.p
                                    variants={authCardItem}
                                    className="relative mt-5 text-xs leading-relaxed text-text-muted"
                                >
                                    {tLanding('landing.equalTrustNote')}
                                </motion.p>

                                <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
                                    {authMetrics.map((metric, index) => (
                                        <AuthMetricCard
                                            key={metric.value}
                                            value={metric.value}
                                            label={metric.label}
                                            tone={metric.tone}
                                            index={index}
                                            reduced={reduced}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                <section className="pb-20 md:pb-24">
                    <motion.div
                        initial={reduced ? false : { opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={reduced ? { duration: 0 } : { duration: 0.4 }}
                        className="mb-8 md:mb-10"
                    >
                        <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-text-muted">
                            {tLanding('landing.sections.features.kicker')}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">
                            {tLanding('landing.sections.features.title')}
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
                            {tLanding('landing.sections.features.subtitle')}
                        </p>
                    </motion.div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {featureCards.map((card, index) => (
                            <FeatureCard
                                key={card.title}
                                icon={card.icon}
                                title={card.title}
                                description={card.description}
                                eyebrow={card.eyebrow}
                                index={index}
                                reduced={reduced}
                                tone={card.tone}
                            />
                        ))}
                    </div>
                </section>

                <section className="pb-20 md:pb-24">
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-16">
                        <motion.div
                            initial={reduced ? false : { opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={reduced ? { duration: 0 } : { duration: 0.44 }}
                            className="glass-panel rounded-[2rem] p-6 md:p-8 lg:sticky lg:top-24"
                        >
                            <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-text-muted">
                                {tLanding('landing.sections.workflow.kicker')}
                            </p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">
                                {tLanding('landing.sections.workflow.title')}
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-base">
                                {tLanding('landing.sections.workflow.subtitle')}
                            </p>

                            <div className="mt-6 grid gap-3">
                                {steps.map(step => (
                                    <div
                                        key={step.title}
                                        className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--border-subtle)] bg-surface-100/70 px-4 py-3"
                                    >
                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-surface-200">
                                            <step.icon className="h-4 w-4 text-text-secondary" />
                                        </div>
                                        <div>
                                            <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-text-muted">
                                                {step.step}
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-text-primary">
                                                {step.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <div>
                            {steps.map((step, index) => (
                                <StepItem
                                    key={step.title}
                                    icon={step.icon}
                                    step={step.step}
                                    title={step.title}
                                    description={step.description}
                                    isLast={index === steps.length - 1}
                                    index={index}
                                    reduced={reduced}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="pb-16 md:pb-20">
                    <motion.div
                        initial={reduced ? false : { opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={reduced ? { duration: 0 } : { duration: 0.4 }}
                        className="mb-8 md:mb-10"
                    >
                        <div className="flex items-center gap-2 text-text-muted">
                            <Clock3 className="h-4 w-4" />
                            <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em]">
                                {tLanding('landing.sections.future.kicker')}
                            </p>
                        </div>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">
                            {tLanding('landing.sections.future.title')}
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
                            {tLanding('landing.sections.future.subtitle')}
                        </p>
                    </motion.div>

                    <div className="grid gap-3 md:grid-cols-3">
                        {futureCards.map((card, index) => (
                            <motion.article
                                key={card.title}
                                initial={reduced ? false : { opacity: 0, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={
                                    reduced
                                        ? { duration: 0 }
                                        : { duration: 0.42, delay: index * 0.08, ease: EASE_OUT }
                                }
                                whileHover={reduced ? undefined : { y: -3, transition: { duration: 0.18 } }}
                                className="glass relative isolate h-full cursor-default overflow-hidden rounded-[1.8rem] p-5 transition-[transform,box-shadow] duration-300 hover:shadow-[var(--card-hover-glow)]"
                            >
                                <div
                                    className="pointer-events-none absolute inset-x-6 top-0 h-16 rounded-full blur-3xl"
                                    style={{ background: card.tone.glow }}
                                    aria-hidden
                                />
                                <div className="relative">
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div
                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[var(--border-subtle)]"
                                            style={{ background: card.tone.surface }}
                                        >
                                            <card.icon className="h-5 w-5 text-text-primary" />
                                        </div>
                                        <span className="rounded-full border border-status-amber/25 bg-status-amber-soft px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-status-amber">
                                            {tLanding('landing.sections.future.badge')}
                                        </span>
                                    </div>
                                    <h3 className="mb-1.5 text-base font-semibold tracking-tight text-text-primary">
                                        {card.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-text-secondary">
                                        {card.description}
                                    </p>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </section>

                <footer className="border-t border-[var(--border-subtle)] pt-6">
                    <motion.div
                        initial={reduced ? false : { opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-30px' }}
                        transition={reduced ? { duration: 0 } : { duration: 0.36, ease: EASE_OUT }}
                        className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"
                    >
                        <div>
                            <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-text-muted">
                                PLAN.EX <span className="normal-case">v1.0.0</span>
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-text-muted">
                                {tLanding('landing.footer.caption')}
                            </p>
                        </div>

                        <div className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] bg-surface-100/70 px-4 py-2 text-sm text-text-secondary">
                            <Sparkles className="h-4 w-4 text-status-violet" />
                            <span>{tLanding('landing.footer.signature')}</span>
                        </div>
                    </motion.div>
                </footer>
            </div>
        </div>
    )
}
