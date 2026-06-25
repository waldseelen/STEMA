import {
    clearLocalDomainCaches,
    getDomainSyncSummary,
    hydrateLocalCacheFromCloud,
    migrateLocalDataToCloud,
    type DomainSyncSummary,
} from '@/lib/cloud/domainSync'
import { ensureRemoteUserDefaults } from '@/lib/cloud/remoteDefaults'
import { useTranslation } from '@/i18n'
import { Modal, useToast } from '@/shared/components'
import { Database, RefreshCw, ShieldAlert, UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { captureSecureException } from '@/modules/auth/lib/telemetry'
import { eventBus } from '@/events'
import { addEvent } from '@/db/planner/queries/eventQueries'

function SummaryLine({
    label,
    value,
}: {
    label: string
    value: number
}) {
    return (
        <div className="flex items-center justify-between rounded-[1rem] border border-[var(--border-subtle)] bg-surface-100 px-4 py-3">
            <span className="text-sm text-text-secondary">{label}</span>
            <span className="font-mono text-sm font-semibold text-text-primary">
                {value}
            </span>
        </div>
    )
}

export function CloudDataBootstrap() {
    const t = useTranslation('auth')
    const { showToast } = useToast()
    const authInitialized = useAuthStore(state => state.authInitialized)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const userId = useAuthStore(state => state.user?.id ?? null)
    const profileCompleted = useAuthStore(state => state.profile?.profileCompleted ?? false)
    const setDataBootstrapReady = useAuthStore(state => state.setDataBootstrapReady)

    const [isPromptOpen, setIsPromptOpen] = useState(false)
    const [isWorking, setIsWorking] = useState(false)
    const [summary, setSummary] = useState<DomainSyncSummary | null>(null)
    const bootstrappedSessionRef = useRef<string | null>(null)

    // Listen for cross-module learning calendar events (m12n decoupled event broker)
    useEffect(() => {
        const sub = eventBus.subscribe('LEARN_EVENT_CREATED', async (payload) => {
            try {
                await addEvent({
                    type: 'event',
                    title: payload.title,
                    dateISO: payload.dateISO,
                    description: payload.description,
                    color: payload.color,
                })
            } catch (err) {
                console.error('Failed to auto-schedule planner event from learning review:', err)
            }
        })

        return () => {
            sub.unsubscribe()
        }
    }, [])

    useEffect(() => {
        if (!authInitialized) {
            return
        }

        if (!isAuthenticated || !userId) {
            bootstrappedSessionRef.current = null
            setSummary(null)
            setIsPromptOpen(false)
            setDataBootstrapReady(true)
            return
        }

        if (!profileCompleted) {
            setIsPromptOpen(false)
            setDataBootstrapReady(true)
            return
        }

        const sessionKey = `${userId}:profile-complete`
        if (bootstrappedSessionRef.current === sessionKey) {
            return
        }

        bootstrappedSessionRef.current = sessionKey

        let cancelled = false
        setDataBootstrapReady(false)

        void (async () => {
            try {
                const nextSummary = await getDomainSyncSummary()
                if (cancelled) {
                    return
                }

                setSummary(nextSummary)

                if (nextSummary.ownerMismatch) {
                    await clearLocalDomainCaches()

                    if (nextSummary.hasCloudData) {
                        await hydrateLocalCacheFromCloud()
                    }

                    if (!cancelled) {
                        showToast(t('auth.dataMigration.ownerMismatchToast'), { variant: 'warning' })
                    }

                    setDataBootstrapReady(true)
                    return
                }

                if (!nextSummary.hasLocalData && nextSummary.hasCloudData) {
                    await hydrateLocalCacheFromCloud()

                    if (!cancelled) {
                        showToast(t('auth.dataMigration.cloudRestoredToast'), { variant: 'success' })
                    }

                    setDataBootstrapReady(true)
                    return
                }

                if (nextSummary.hasLocalData && nextSummary.hasCloudData) {
                    await hydrateLocalCacheFromCloud()

                    if (!cancelled) {
                        showToast(t('auth.dataMigration.cloudPriorityToast'), { variant: 'warning' })
                    }

                    setDataBootstrapReady(true)
                    return
                }

                if (nextSummary.hasLocalData) {
                    setIsPromptOpen(true)
                    return
                }

                await ensureRemoteUserDefaults()
                await hydrateLocalCacheFromCloud()

                if (!cancelled) {
                    showToast(t('auth.dataMigration.remoteDefaultsToast'), { variant: 'success' })
                }

                setDataBootstrapReady(true)
            } catch (error) {
                captureSecureException(error, {
                    context: 'CloudDataBootstrap.bootstrap',
                    category: 'database',
                    userId: userId ?? undefined,
                })

                if (!cancelled) {
                    showToast(t('auth.dataMigration.checkErrorToast'), { variant: 'error' })
                    setDataBootstrapReady(true)
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [
        authInitialized,
        isAuthenticated,
        profileCompleted,
        setDataBootstrapReady,
        showToast,
        t,
        userId,
    ])

    const handleContinueLocal = () => {
        setIsPromptOpen(false)
        setDataBootstrapReady(true)
        showToast(t('auth.dataMigration.laterToast'))
    }

    const handleImport = async () => {
        setIsWorking(true)

        try {
            await migrateLocalDataToCloud()
            showToast(t('auth.dataMigration.importSuccessToast'), { variant: 'success' })
            setIsPromptOpen(false)
            setDataBootstrapReady(true)
        } catch (error) {
            captureSecureException(error, {
                context: 'CloudDataBootstrap.import',
                category: 'database',
                userId: userId ?? undefined,
            })
            showToast(t('auth.dataMigration.importErrorToast'), { variant: 'error' })
        } finally {
            setIsWorking(false)
        }
    }

    if (!summary) {
        return null
    }

    return (
        <Modal
            isOpen={isPromptOpen}
            onClose={handleContinueLocal}
            title={t('auth.dataMigration.title')}
            size="md"
            hideCloseButton
            disableOutsideClick
        >
            <div className="space-y-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-blue-soft text-status-blue">
                        <Database className="h-5 w-5" />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm leading-relaxed text-text-secondary">
                            {t('auth.dataMigration.description')}
                        </p>

                        <div className="rounded-[1rem] border border-dashed border-[var(--border-subtle)] bg-surface-100 px-3 py-2 text-xs text-text-muted">
                            {t('auth.dataMigration.conflictNote')}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryLine
                        label={t('auth.dataMigration.summaryPlanner')}
                        value={summary.localTotals.planner}
                    />
                    <SummaryLine
                        label={t('auth.dataMigration.summaryTracker')}
                        value={summary.localTotals.tracker}
                    />
                </div>

                <div className="rounded-[1.1rem] border border-[var(--status-amber)]/20 bg-status-amber-soft px-4 py-3">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-4.5 w-4.5 flex-shrink-0 text-status-amber" />
                        <p className="text-sm leading-relaxed text-text-secondary">
                            {t('auth.dataMigration.cloudFirstRule')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={handleContinueLocal}
                        disabled={isWorking}
                        className="btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('auth.dataMigration.continueLocal')}
                    </button>

                    <button
                        type="button"
                        onClick={() => void handleImport()}
                        disabled={isWorking}
                        className="btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isWorking ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                {t('auth.dataMigration.importing')}
                            </span>
                        ) : (
                            <>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                {t('auth.dataMigration.importAction')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
