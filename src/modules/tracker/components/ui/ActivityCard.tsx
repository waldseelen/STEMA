import { computeElapsedSec, formatDuration, useRunningTimerForActivity } from '@/db/time-tracking/queries/timerQueries'
import type { Activity } from '@/db/time-tracking/types'
import { useTranslations } from '@/i18n'
import { useTimerClock } from '@/shared/hooks/useTimerClock'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { Clock3, Pause, StopCircle } from 'lucide-react'
import { useState } from 'react'
import { startTimer, stopTimer } from '../../lib/timerService'
import { GoalProgressBadge } from './GoalProgressBadge'

interface ActivityCardProps {
    activity: Activity
    categoryColor: string
    goalProgress?: number
}

export function ActivityCard({ activity, categoryColor, goalProgress }: ActivityCardProps) {
    const t = useTranslations(['common', 'tracker'])
    const runningTimer = useRunningTimerForActivity(activity.id)
    const isRunning = runningTimer != null
    const isPaused = isRunning && runningTimer.pausedAt != null
    const nowMs = useTimerClock()
    const elapsed = runningTimer ? computeElapsedSec(runningTimer, nowMs) : 0
    const [loading, setLoading] = useState(false)

    async function handleClick() {
        if (loading) {
            return
        }

        setLoading(true)
        try {
            if (isRunning) {
                await stopTimer(runningTimer.id)
            } else {
                await startTimer(activity.id)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.button
            type="button"
            onClick={handleClick}
            disabled={loading}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.08 }}
            className={clsx(
                'card card-hover card-interactive relative flex aspect-square w-full flex-col items-start justify-between p-4 text-left',
                'disabled:cursor-not-allowed disabled:opacity-60',
                isRunning && 'border-[rgb(var(--color-accent-rgb)/0.32)] shadow-[var(--shadow-card-elevated)]',
            )}
            aria-label={`${activity.name} ${isRunning ? t('tracker', 'timer.stop') : t('tracker', 'timer.start')}`}
            aria-pressed={isRunning}
        >
            <div className="flex w-full items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-surface-200 text-text-secondary">
                    {isRunning ? (
                        <StopCircle className="h-4.5 w-4.5" />
                    ) : (
                        <Clock3 className="h-4.5 w-4.5" />
                    )}
                </span>

                <div className="mt-1 flex items-center gap-2 text-2xs uppercase tracking-[0.12em] text-text-muted">
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: categoryColor }}
                    />
                    <span>{isRunning ? t('tracker', 'timer.running') : t('tracker', 'timer.start')}</span>
                </div>
            </div>

            <div className="w-full">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary">
                    {activity.name}
                </p>

                <div className="mt-3 flex min-h-5 items-center gap-2">
                    {isRunning ? (
                        <>
                            {!isPaused && (
                                <span
                                    className="h-1.5 w-1.5 rounded-full animate-pulse bg-[var(--color-accent-2)]"
                                    aria-hidden
                                />
                            )}
                            <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                                {formatDuration(elapsed)}
                            </span>
                            {isPaused && <Pause className="h-3.5 w-3.5 text-text-muted" />}
                        </>
                    ) : (
                        <span className="text-xs text-text-secondary">
                            {t('tracker', 'timer.startHint')}
                        </span>
                    )}
                </div>
            </div>

            {goalProgress != null && <GoalProgressBadge progress={goalProgress} />}
        </motion.button>
    )
}
