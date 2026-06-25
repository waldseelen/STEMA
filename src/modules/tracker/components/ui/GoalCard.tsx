import { formatDuration } from '@/db/time-tracking/queries/timerQueries'
import type { Goal } from '@/db/time-tracking/types'
import { useTranslation } from '@/i18n'
import { clsx } from 'clsx'
import { CheckCircle, Target } from 'lucide-react'

interface GoalCardProps {
    goal: Goal
    progressPercent: number
    achievedSec: number
    activityName?: string
    color?: string
    onEdit: (goalId: string) => void
}

export function GoalCard({
    goal,
    progressPercent,
    achievedSec,
    activityName,
    color = 'var(--color-accent)',
    onEdit,
}: GoalCardProps) {
    const t = useTranslation('tracker')
    const isCompleted = progressPercent >= 100
    const isExceeded = goal.maxTarget != null && achievedSec > goal.maxTarget
    const clampedPercent = Math.min(progressPercent, 100)
    const remainingSec = Math.max(0, goal.targetValue - achievedSec)

    const scopeLabel: Record<string, string> = {
        daily: t('goal.scope.daily'),
        weekly: t('goal.scope.weekly'),
        monthly: t('goal.scope.monthly'),
        yearly: t('goal.scope.yearly'),
    }

    return (
        <button
            type="button"
            onClick={() => onEdit(goal.id)}
            className={clsx(
                'card card-hover card-interactive w-full p-5 text-left',
                isCompleted && 'border-status-green/20',
                isExceeded && 'border-status-red/20',
            )}
        >
            <div className="flex items-start gap-4">
                <span
                    className={clsx(
                        'flex h-10 w-10 items-center justify-center rounded-lg border',
                        isCompleted
                            ? 'border-status-green/20 bg-status-green-soft text-status-green'
                            : isExceeded
                                ? 'border-status-red/20 bg-status-red-soft text-status-red'
                                : 'border-[var(--border-subtle)] bg-surface-200 text-text-secondary',
                    )}
                >
                    {isCompleted ? <CheckCircle className="h-4.5 w-4.5" /> : <Target className="h-4.5 w-4.5" />}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-text-primary">{goal.name}</p>
                        <span className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-2xs uppercase tracking-[0.12em] text-text-muted">
                            {scopeLabel[goal.scope] ?? goal.scope}
                        </span>
                    </div>

                    {activityName && (
                        <p className="mt-1 text-xs text-text-secondary">{activityName}</p>
                    )}

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-200">
                        <div
                            className="progress-bar-fill h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${clampedPercent}%`,
                                backgroundColor: isExceeded ? 'var(--status-red)' : isCompleted ? 'var(--status-green)' : color,
                            }}
                        />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs tabular-nums text-text-secondary">
                            {formatDuration(achievedSec)} / {formatDuration(goal.targetValue)}
                        </span>
                        <span
                            className={clsx(
                                'text-xs font-medium',
                                isCompleted
                                    ? 'text-status-green'
                                    : isExceeded
                                        ? 'text-status-red'
                                        : 'text-text-muted',
                            )}
                        >
                            {isCompleted
                                ? t('goal.completed')
                                : isExceeded
                                    ? t('goal.exceeded')
                                    : t('goal.remaining', { time: formatDuration(remainingSec) })}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    )
}
