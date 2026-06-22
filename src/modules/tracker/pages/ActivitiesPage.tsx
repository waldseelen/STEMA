/**
 * ActivitiesPage — Aktivite Yönetimi (Aşama 5 — Tam İmplementasyon)
 *
 * Aktivite listesi, oluşturma/düzenleme, arşivleme.
 */

import {
    archiveActivity,
    deleteActivity,
    unarchiveActivity,
    useActiveActivities,
    useActiveCategories,
    useArchivedActivities,
} from '@/db/time-tracking/queries/activityQueries'
import type { Activity } from '@/db/types'
import { useTranslations } from '@/i18n'
import { EntityIcon, useToast } from '@/shared/components'
import { clsx } from 'clsx'
import { Archive, ArrowLeft, Inbox, Layers, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ActivityEditModal } from '../components/ActivityEditModal'

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message.trim() ? error.message : fallback
}

export function ActivitiesPage() {
    const t = useTranslations(['common', 'tracker'])
    const { showToast } = useToast()
    const activities = useActiveActivities()
    const archived = useArchivedActivities()
    const categories = useActiveCategories()

    const [showArchived, setShowArchived] = useState(false)
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    const categoryMap = useMemo(
        () => new Map(categories.map(c => [c.id, c])),
        [categories],
    )

    const displayedActivities = showArchived ? archived : activities

    const handleNew = useCallback(() => {
        setEditingActivity(null)
        setModalOpen(true)
    }, [])

    const handleEdit = useCallback((activity: Activity) => {
        setEditingActivity(activity)
        setModalOpen(true)
    }, [])

    const handleClose = useCallback(() => {
        setModalOpen(false)
        setEditingActivity(null)
    }, [])

    const handleArchive = useCallback(async (activityId: string) => {
        try {
            await archiveActivity(activityId)
            showToast(t('common', 'toast.updated'), { variant: 'success' })
        } catch (error) {
            showToast(getErrorMessage(error, t('common', 'toast.error')), { variant: 'error' })
        }
    }, [showToast, t])

    const handleUnarchive = useCallback(async (activityId: string) => {
        try {
            await unarchiveActivity(activityId)
            showToast(t('common', 'toast.updated'), { variant: 'success' })
        } catch (error) {
            showToast(getErrorMessage(error, t('common', 'toast.error')), { variant: 'error' })
        }
    }, [showToast, t])

    const handleDelete = useCallback(async (activityId: string) => {
        try {
            await deleteActivity(activityId)
            showToast(t('common', 'toast.deleted'), { variant: 'success' })
        } catch (error) {
            showToast(getErrorMessage(error, t('common', 'toast.error')), { variant: 'error' })
        }
    }, [showToast, t])

    return (
        <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 max-w-4xl mx-auto">
            {/* Başlık */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/tracker" className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors">
                        <ArrowLeft size={18} className="text-text-secondary" />
                    </Link>
                    <div className="w-9 h-9 rounded-xl bg-status-blue-soft border border-status-blue/20 flex items-center justify-center flex-shrink-0">
                        <Layers size={18} className="text-status-blue" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-text-primary leading-tight">{t('tracker', 'nav.activities')}</h1>
                        <p className="text-xs text-text-muted leading-none mt-0.5">
                            {t('tracker', 'page.activitiesSummary', { active: activities.length, archived: archived.length })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowArchived(s => !s)}
                        className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs transition-all',
                            showArchived
                                ? 'bg-status-amber-soft text-status-amber border border-status-amber/20'
                                : 'bg-surface-100 text-text-secondary hover:bg-surface-200',
                        )}
                    >
                        <Archive size={13} className="inline mr-1" />
                        {t('tracker', 'page.archiveShort')}
                    </button>
                    <button
                        onClick={handleNew}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs text-text-secondary transition-colors"
                    >
                        <Plus size={13} />
                        {t('tracker', 'page.newShort')}
                    </button>
                </div>
            </div>

            {/* Aktivite listesi */}
            {displayedActivities.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {displayedActivities.map(activity => {
                        const category = categoryMap.get(activity.categoryId)
                        const color = activity.color ?? category?.color ?? '#6366f1'
                        return (
                            <div
                                key={activity.id}
                                className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-subtle)] bg-surface-100 hover:bg-surface-200 transition-all"
                            >
                                {activity.icon ? (
                                    <span
                                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)]"
                                        style={{ backgroundColor: `${color}1A`, color }}
                                    >
                                        <EntityIcon name={activity.icon} fallback="Clock3" className="h-4 w-4" size={16} />
                                    </span>
                                ) : (
                                    <span
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleEdit(activity)}
                                    className="flex-1 min-w-0 text-left"
                                >
                                    <p className="text-sm font-medium text-text-primary truncate">{activity.name}</p>
                                    <p className="text-[11px] text-text-muted">{category?.name ?? t('tracker', 'page.noCategory')}</p>
                                </button>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {showArchived ? (
                                        <button
                                            type="button"
                                            onClick={() => void handleUnarchive(activity.id)}
                                            className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors"
                                            title={t('tracker', 'page.unarchive')}
                                        >
                                            <RotateCcw size={14} className="text-text-secondary" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => void handleArchive(activity.id)}
                                            className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors"
                                            title={t('tracker', 'activity.archive')}
                                        >
                                            <Archive size={14} className="text-text-secondary" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => void handleDelete(activity.id)}
                                        className="p-1.5 rounded-lg hover:bg-status-red/10 transition-colors"
                                        title={t('common', 'common.delete')}
                                    >
                                        <Trash2 size={14} className="text-status-red" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <div className="w-14 h-14 rounded-xl bg-surface-100 flex items-center justify-center">
                        <Inbox size={28} className="text-text-muted" />
                    </div>
                    <p className="text-text-secondary text-sm">
                        {showArchived ? t('tracker', 'page.archivedEmptyActivities') : t('tracker', 'activity.noActivities')}
                    </p>
                    {!showArchived && (
                        <button
                            type="button"
                            onClick={handleNew}
                            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white dark:text-black bg-black dark:bg-white hover:opacity-90 transition-colors"
                        >
                            <Plus size={14} />
                            {t('tracker', 'page.createFirstActivity')}
                        </button>
                    )}
                </div>
            )}

            <ActivityEditModal activity={editingActivity} isOpen={modalOpen} onClose={handleClose} />
        </div>
    )
}
