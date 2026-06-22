import { useTranslation } from '@/i18n'
import { ThemeToggle, LanguageToggle } from '@/shared/components'
import { useAccessiblePage } from '@/shared/hooks/useAccessiblePage'
import { AuthStateScreen } from '@/modules/auth/components/AuthStateScreen'
import { ProfileDetailsForm, type ProfileFormValues, type ProfileSubmitValues } from '@/modules/auth/components/profile/ProfileDetailsForm'
import { ProfileAvatarPreview } from '@/modules/auth/components/profile/ProfileAvatarPreview'
import {
    AUTHENTICATED_HOME_ROUTE,
    PUBLIC_LANDING_ROUTE,
} from '@/modules/auth/lib/routes'
import { sanitizeRemoteImageUrl } from '@/modules/auth/lib/security'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function ProfileSetupPage() {
    const t = useTranslation('auth')
    const navigate = useNavigate()
    const { authInitialized, completeProfile, isAuthenticated, profile, user } = useAuthStore()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    useAccessiblePage(t('auth.profileSetup.pageTitle'), {
        announceMessage: t('auth.profileSetup.pageAnnouncement'),
        disabled: !authInitialized,
    })

    useEffect(() => {
        if (!authInitialized) {
            return
        }

        if (!isAuthenticated) {
            navigate(PUBLIC_LANDING_ROUTE, { replace: true })
            return
        }

        if (profile?.profileCompleted) {
            navigate(AUTHENTICATED_HOME_ROUTE, { replace: true })
        }
    }, [authInitialized, isAuthenticated, navigate, profile?.profileCompleted])

    const initialValues = useMemo<ProfileFormValues>(
        () => ({
            fullName: profile?.fullName ?? user?.displayName ?? '',
            occupation: profile?.occupation ?? '',
            studentStatus: profile?.studentStatus ?? '',
            school: profile?.school ?? '',
            department: profile?.department ?? '',
            grade: profile?.grade ?? '',
        }),
        [
            profile?.department,
            profile?.fullName,
            profile?.grade,
            profile?.occupation,
            profile?.school,
            profile?.studentStatus,
            user?.displayName,
        ]
    )

    const avatarUrl = sanitizeRemoteImageUrl(
        profile?.avatarUrl ?? user?.photoURL
    )

    const setupChecklist = [
        t('auth.profileSetup.checklist.avatar'),
        t('auth.profileSetup.checklist.student'),
        t('auth.profileSetup.checklist.settings'),
    ]

    const handleSubmit = async (values: ProfileSubmitValues) => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await completeProfile(values)
            navigate(AUTHENTICATED_HOME_ROUTE, { replace: true })
        } catch {
            setSubmitError(t('auth.profileSetup.submitError'))
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!authInitialized || (isAuthenticated && !profile)) {
        return (
            <AuthStateScreen
                title={t('auth.profileSetup.loadingTitle')}
                description={t('auth.profileSetup.loadingDescription')}
            />
        )
    }

    return (
        <div className="min-h-screen bg-background text-text-primary">
            <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
                <div
                    className="absolute top-0 right-0 h-[420px] w-[420px] rounded-full opacity-[0.06] blur-[110px]"
                    style={{ background: 'rgb(var(--accent-color-rgb) / 1)' }}
                />
            </div>

            <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-4 md:px-6 md:pb-20 md:pt-6">
                <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
                    <span className="font-mono text-sm font-semibold tracking-[0.16em] text-text-muted">
                        PLAN.EX
                    </span>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <LanguageToggle />
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                    <section className="glass-panel rounded-[2rem] p-5 md:p-6">
                        <span className="inline-flex rounded-full border border-[var(--border-subtle)] bg-surface-100 px-3 py-1 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                            {t('auth.profileSetup.eyebrow')}
                        </span>

                        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-text-primary md:text-[2.25rem]">
                            {t('auth.profileSetup.title')}
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">
                            {t('auth.profileSetup.subtitle')}
                        </p>

                        <div className="glass mt-6 rounded-[1.6rem] p-4">
                            <ProfileAvatarPreview
                                avatarUrl={avatarUrl}
                                displayName={initialValues.fullName}
                                email={user?.email ?? undefined}
                                hint={t('auth.profileSetup.avatarHint')}
                                size="lg"
                            />
                        </div>

                        <div className="mt-5 space-y-3">
                            {setupChecklist.map(item => (
                                <div
                                    key={item}
                                    className="flex items-start gap-3 rounded-[1.25rem] border border-[var(--border-subtle)] bg-surface-100 px-4 py-3"
                                >
                                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-status-green-soft text-status-green">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </span>
                                    <p className="text-sm leading-relaxed text-text-secondary">
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="card p-5 md:p-6">
                        <ProfileDetailsForm
                            initialValues={initialValues}
                            isSubmitting={isSubmitting}
                            submitLabel={t('auth.profileSetup.submit')}
                            submittingLabel={t('auth.profileSetup.submitting')}
                            systemError={submitError}
                            onSubmit={handleSubmit}
                            onInteraction={() => setSubmitError(null)}
                        />
                    </section>
                </div>
            </div>
        </div>
    )
}
