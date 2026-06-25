import { useActiveActivities, useActiveCategories } from '@/db/time-tracking/queries/activityQueries'
import { computeElapsedSec, formatDuration, useRunningTimers } from '@/db/time-tracking/queries/timerQueries'
import type { Category, RunningTimer } from '@/db/time-tracking/types'
import { useTranslations } from '@/i18n'
import { useTimerClock } from '@/shared/hooks/useTimerClock'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { TimerControls } from '../ui/TimerControls'

interface TimerRowProps {
    timer: RunningTimer
    activityName: string
    category: Category | undefined
    nowMs: number
}

function TimerRow({ timer, activityName, category, nowMs }: TimerRowProps) {
    const t = useTranslations(['common', 'tracker'])
    const isPaused = timer.pausedAt != null
    const elapsed = computeElapsedSec(timer, nowMs)
    const color = category?.color ?? 'var(--color-accent)'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-3 border-t border-[var(--border-subtle)] px-4 py-3 first:border-t-0"
        >
            <span
                className="h-9 w-1 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
            />

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{activityName}</p>
                <p className="truncate text-xs text-text-muted">
                    {category?.name ?? t('tracker', 'page.noCategory')}
                </p>
            </div>

            <div className="flex items-center gap-2">
                {!isPaused && (
                    <span
                        className="h-1.5 w-1.5 rounded-full animate-pulse bg-[var(--color-accent-2)]"
                        aria-hidden
                    />
                )}
                <span
                    className={clsx(
                        'font-mono text-sm font-semibold tabular-nums',
                        isPaused ? 'text-text-secondary' : 'text-text-primary',
                    )}
                >
                    {formatDuration(elapsed)}
                </span>
            </div>

            <TimerControls timer={timer} />
        </motion.div>
    )
}

export function RunningTimerBar() {
    const t = useTranslations(['common', 'tracker'])
    const timers = useRunningTimers()
    const activities = useActiveActivities()
    const categories = useActiveCategories()
    const nowMs = useTimerClock()

    if (timers.length === 0) {
        return null
    }

    const activityMap = new Map(activities.map(activity => [activity.id, activity]))
    const categoryMap = new Map(categories.map(category => [category.id, category]))

    return (
        <section className="card overflow-hidden p-0">
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" aria-hidden />
                    <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                        {t('tracker', 'runningTimerBar.title')}
                    </h2>
                </div>
                <span className="text-xs text-text-muted">{timers.length}</span>
            </div>

            <AnimatePresence initial={false}>
                {timers.map(timer => {
                    const activity = activityMap.get(timer.activityId)
                    const category = activity ? categoryMap.get(activity.categoryId) : undefined

                    return (
                        <TimerRow
                            key={timer.id}
                            timer={timer}
                            activityName={activity?.name ?? t('tracker', 'suggestion.unknownActivity')}
                            category={category}
                            nowMs={nowMs}
                        />
                    )
                })}
            </AnimatePresence>
        </section>
    )
}
