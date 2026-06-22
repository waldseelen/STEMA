import { useTranslation } from '@/i18n'
import { AuthStateScreen } from '@/modules/auth/components/AuthStateScreen'
import { AuthStatusNotice } from '@/modules/auth/components/AuthStatusNotice'
import { ProfileAvatarPreview } from '@/modules/auth/components/profile/ProfileAvatarPreview'
import { ProfileDetailsForm, type ProfileFormValues, type ProfileSubmitValues } from '@/modules/auth/components/profile/ProfileDetailsForm'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useToast } from '@/shared/components'
import { useAccessiblePage } from '@/shared/hooks/useAccessiblePage'
import { ArrowLeft, ImagePlus, RotateCcw } from 'lucide-react'
import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface NoticeState {
    title?: string
    description: string
    tone: 'success' | 'error'
}

export function ProfileSettingsPage() {
    const t = useTranslation('auth')
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { showToast } = useToast()
    const profile = useAuthStore(state => state.profile)
    const updateProfile = useAuthStore(state => state.updateProfile)
    const uploadAvatar = useAuthStore(state => state.uploadAvatar)
    const restartOnboarding = useAuthStore(state => state.restartOnboarding)

    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isRestarting, setIsRestarting] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [pageNotice, setPageNotice] = useState<NoticeState | null>(null)

    useAccessiblePage(t('auth.profilePage.pageTitle'), {
        announceMessage: t('auth.profilePage.pageAnnouncement'),
        disabled: !profile,
    })

    const initialValues = useMemo<ProfileFormValues>(
        () => ({
            fullName: profile?.fullName ?? '',
            occupation: profile?.occupation ?? '',
            studentStatus: profile?.studentStatus ?? 'other',
            school: profile?.school ?? '',
            department: profile?.department ?? '',
            grade: profile?.grade ?? '',
        }),
        [profile?.department, profile?.fullName, profile?.grade, profile?.occupation, profile?.school, profile?.studentStatus]
    )

    if (!profile) {
        return (
            <AuthStateScreen
                title={t('auth.profilePage.loadingTitle')}
                description={t('auth.profilePage.loadingDescription')}
            />
        )
    }

    const handleSave = async (values: ProfileSubmitValues) => {
        setIsSaving(true)
        setSaveError(null)
        setPageNotice(null)

        try {
            await updateProfile(values)
            showToast(t('auth.profilePage.saved'), { variant: 'success' })
            setPageNotice({
                tone: 'success',
                title: t('auth.profilePage.saved'),
                description: t('auth.profilePage.savedDescription'),
            })
        } catch {
            const message = t('auth.profilePage.saveError')
            showToast(message, { variant: 'error' })
            setSaveError(message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            return
        }

        setIsUploading(true)
        setPageNotice(null)

        try {
            await uploadAvatar(file)
            showToast(t('auth.profilePage.avatarUploaded'), { variant: 'success' })
            setPageNotice({
                tone: 'success',
                title: t('auth.profilePage.avatarUploaded'),
                description: t('auth.profilePage.avatarUploadedDescription'),
            })
        } catch {
            const message = t('auth.profilePage.avatarUploadError')
            showToast(message, { variant: 'error' })
            setPageNotice({
                tone: 'error',
                title: t('auth.profilePage.avatarUploadErrorTitle'),
                description: message,
            })
        } finally {
            setIsUploading(false)
            event.target.value = ''
        }
    }

    const handleRestartOnboarding = async () => {
        setIsRestarting(true)
        setPageNotice(null)

        try {
            await restartOnboarding()
            showToast(t('auth.profilePage.onboardingRestarted'), { variant: 'success' })
            navigate('/planner', { replace: true })
        } catch {
            const message = t('auth.profilePage.onboardingRestartError')
            showToast(message, { variant: 'error' })
            setPageNotice({
                tone: 'error',
                title: t('auth.profilePage.onboardingRestartErrorTitle'),
                description: message,
            })
        } finally {
            setIsRestarting(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <Link
                        to="/settings"
                        className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('auth.profilePage.back')}
                    </Link>
                    <h1 className="text-display-lg text-text-primary">
                        {t('auth.profilePage.title')}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                        {t('auth.profilePage.subtitle')}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleRestartOnboarding}
                    disabled={isRestarting}
                    className="btn-secondary gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isRestarting ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <RotateCcw className="h-4 w-4" />
                    )}
                    {isRestarting ? t('auth.profilePage.restartingOnboarding') : t('auth.profilePage.restartOnboarding')}
                </button>
            </div>

            {pageNotice && (
                <AuthStatusNotice
                    tone={pageNotice.tone}
                    title={pageNotice.title}
                    description={pageNotice.description}
                />
            )}

            <section className="card p-5 md:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <ProfileAvatarPreview
                        avatarUrl={profile.avatarUrl}
                        displayName={profile.fullName || profile.email}
                        email={profile.email}
                        hint={t('auth.profilePage.avatarHint')}
                        size="lg"
                    />

                    <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="btn-primary min-h-[48px] gap-2 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isUploading ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                                <ImagePlus className="h-4 w-4" />
                            )}
                            {isUploading ? t('auth.profilePage.uploading') : t('auth.profilePage.uploadAvatar')}
                        </button>
                    </div>
                </div>
            </section>

            <section className="card p-5 md:p-6">
                <div className="mb-5">
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
                        {t('auth.profilePage.formEyebrow')}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-text-primary">
                        {t('auth.profilePage.formTitle')}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                        {t('auth.profilePage.formDescription')}
                    </p>
                </div>

                <ProfileDetailsForm
                    initialValues={initialValues}
                    isSubmitting={isSaving}
                    submitLabel={t('auth.profilePage.save')}
                    submittingLabel={t('auth.profilePage.saving')}
                    submitAlignment="end"
                    systemError={saveError}
                    onSubmit={handleSave}
                    onInteraction={() => {
                        setSaveError(null)
                        setPageNotice(null)
                    }}
                />
            </section>
        </div>
    )
}
