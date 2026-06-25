import { useActiveActivities } from '@/db/time-tracking/queries/activityQueries'
import { useGoalsWithProgress } from '@/db/time-tracking/queries/goalQueries'
import type { Goal } from '@/db/time-tracking/types'
import { useTranslations } from '@/i18n'
import { ArrowLeft, Inbox, Plus, Target } from 'lucide-react'
import { useCallback, useMemo, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { GoalCard } from '../components/ui/GoalCard'

const GoalEditModal = lazy(() => import('../components/features/GoalEditModal').then(m => ({ default: m.GoalEditModal })))

export function GoalsPage() {
    const t = useTranslations(['common', 'tracker'])
    const goalsWithProgress = useGoalsWithProgress()
    const activities = useActiveActivities()
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [hasModalLoaded, setHasModalLoaded] = useState(false)

    const activityMap = useMemo(() => new Map(activities.map(activity => [activity.id, activity])), [activities])

    const handleNew = useCallback(() => {
        setEditingGoal(null)
        setHasModalLoaded(true)
        setModalOpen(true)
    }, [])

    const handleEdit = useCallback((goalId: string) => {
        const matched = goalsWithProgress.find(item => item.goal.id === goalId)
        if (matched) {
            setEditingGoal(matched.goal)
            setHasModalLoaded(true)
            setModalOpen(true)
        }
    }, [goalsWithProgress])

    const handleClose = useCallback(() => {
        setModalOpen(false)
        setEditingGoal(null)
    }, [])

    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                    <Link to="/tracker" className="btn-icon" aria-label={t('common', 'common.back')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-surface-200 text-text-secondary">
                        <Target className="h-4.5 w-4.5" />
                    </span>
                    <div>
                        <h1 className="text-xl font-semibold text-text-primary">{t('tracker', 'goal.title')}</h1>
                        <p className="mt-1 text-sm text-text-secondary">
                            {t('tracker', 'page.goalsSummary', { count: goalsWithProgress.length })}
                        </p>
                    </div>
                </div>

                <button type="button" onClick={handleNew} className="btn-primary gap-2">
                    <Plus className="h-4 w-4" />
                    {t('tracker', 'page.newGoal')}
                </button>
            </div>

            {goalsWithProgress.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {goalsWithProgress.map(({ goal, progressPercent, achievedSec }) => {
                        const activity = goal.activityId ? activityMap.get(goal.activityId) : undefined
                        return (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                progressPercent={progressPercent}
                                achievedSec={achievedSec}
                                activityName={activity?.name}
                                onEdit={handleEdit}
                            />
                        )
                    })}
                </div>
            ) : (
                <div className="card flex flex-col items-center gap-3 py-16 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-surface-100 text-text-muted">
                        <Inbox className="h-6 w-6" />
                    </span>
                    <p className="text-sm text-text-primary">{t('tracker', 'goal.noGoals')}</p>
                    <p className="text-xs text-text-secondary">{t('tracker', 'page.goalsEmptyDescription')}</p>
                    <button type="button" onClick={handleNew} className="btn-primary gap-2">
                        <Plus className="h-4 w-4" />
                        {t('tracker', 'page.newGoal')}
                    </button>
                </div>
            )}

            {hasModalLoaded && (
                <Suspense fallback={null}>
                    <GoalEditModal goal={editingGoal} isOpen={modalOpen} onClose={handleClose} />
                </Suspense>
            )}
        </div>
    )
}
