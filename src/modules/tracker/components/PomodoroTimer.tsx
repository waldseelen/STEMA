import { useActiveActivities } from '@/db/time-tracking/queries/activityQueries'
import { useTranslations } from '@/i18n'
import { useSettingsStore } from '@/modules/settings/store/settingsStore'
import { EntityIcon } from '@/shared/components'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePomodoroStore } from '../store/pomodoroStore'

function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${minutes}:${secs}`
}

function resolvePhaseColors(phase: 'work' | 'break') {
    if (phase === 'work') {
        return {
            badge: 'badge-accent',
            color: 'var(--color-accent-2)',
            soft: 'rgb(var(--color-accent-2-rgb) / 0.14)',
        }
    }

    return {
        badge: 'badge-primary',
        color: 'var(--color-accent)',
        soft: 'rgb(var(--color-accent-rgb) / 0.12)',
    }
}

export function PomodoroTimer() {
    const t = useTranslations(['tracker'])
    const {
        pomodoroWorkDuration,
        pomodoroBreakDuration,
    } = useSettingsStore()

    const activities = useActiveActivities() ?? []
    const {
        phase,
        secondsLeft,
        running,
        completedSessions,
        selectedActivityId,
        lastSavedId,
        clearLastSavedId,
        reset,
        setSelectedActivityId,
        toggleRunning,
    } = usePomodoroStore()
    const [showActivityPicker, setShowActivityPicker] = useState(false)
    const pickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function onClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowActivityPicker(false)
            }
        }

        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [])

    useEffect(() => {
        if (!lastSavedId) {
            return
        }

        const timeoutId = window.setTimeout(() => {
            clearLastSavedId()
        }, 2400)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [clearLastSavedId, lastSavedId])

    const handleStart = () => {
        toggleRunning((phase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration) * 60)
    }

    const handleReset = () => {
        reset(pomodoroWorkDuration * 60)
    }

    const totalSeconds = (phase === 'work' ? pomodoroWorkDuration : pomodoroBreakDuration) * 60
    const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
    const circumference = 2 * Math.PI * 54
    const selectedActivity = activities.find(activity => activity.id === selectedActivityId)
    const phaseColors = resolvePhaseColors(phase)

    return (
        <section className="card flex flex-col items-center gap-6 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-center gap-3">
                <span className={phaseColors.badge}>
                    {phase === 'work' ? t('tracker', 'pomodoro.work') : t('tracker', 'pomodoro.break')}
                </span>
                {completedSessions > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Check className="h-3.5 w-3.5 text-status-green" />
                        {t('tracker', 'pomodoro.sessions', { count: completedSessions })}
                    </span>
                )}
            </div>

            <div className="flex h-40 w-40 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-surface-100">
                <div className="relative h-36 w-36">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                        <circle
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            strokeWidth="6"
                            className="stroke-[var(--border-subtle)]"
                        />
                        <circle
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - progress)}
                            style={{
                                stroke: phaseColors.color,
                                transition: 'stroke-dashoffset 180ms cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-2xl border border-[var(--border-subtle)] bg-primary px-4 py-3">
                            <span className="font-mono text-3xl font-semibold tabular-nums text-text-primary">
                                {formatTime(secondsLeft)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={handleReset}
                    title={t('tracker', 'pomodoro.reset')}
                    className="btn-icon"
                >
                    <RotateCcw className="h-4 w-4" />
                </button>

                <button
                    type="button"
                    onClick={handleStart}
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-white transition-all duration-180 active:scale-[0.985]"
                    style={{
                        backgroundColor: phaseColors.color,
                        boxShadow: `0 0 0 1px ${phaseColors.soft}`,
                    }}
                >
                    {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-[1px]" />}
                </button>

                <div className="h-10 w-10" aria-hidden />
            </div>

            <div className="w-full max-w-xs" ref={pickerRef}>
                <button
                    type="button"
                    onClick={() => setShowActivityPicker(previous => !previous)}
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-surface-100 px-4 py-3 text-sm text-text-primary transition-colors hover:border-[var(--border-medium)] hover:bg-surface-200"
                >
                    <span className="truncate">
                        {selectedActivity ? selectedActivity.name : t('tracker', 'pomodoro.selectActivity')}
                    </span>
                    <ChevronDown className={clsx('h-4 w-4 text-text-muted transition-transform', showActivityPicker && 'rotate-180')} />
                </button>

                <AnimatePresence>
                    {showActivityPicker && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                            className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-surface-100 shadow-[var(--shadow-card)]"
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedActivityId('')
                                    setShowActivityPicker(false)
                                }}
                                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-text-secondary transition-colors hover:bg-surface-200"
                            >
                                <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                                {t('tracker', 'pomodoro.noActivity')}
                            </button>

                            {activities.map(activity => (
                                <button
                                    key={activity.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedActivityId(activity.id)
                                        setShowActivityPicker(false)
                                    }}
                                    className={clsx(
                                        'flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition-colors',
                                        activity.id === selectedActivityId
                                            ? 'bg-surface-200 text-text-primary'
                                            : 'text-text-secondary hover:bg-surface-200',
                                    )}
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-primary text-text-primary">
                                        <EntityIcon name={activity.icon} fallback="•" className="h-4 w-4" />
                                    </span>
                                    {activity.name}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {lastSavedId && (
                    <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-xs text-status-green"
                    >
                        <Check className="h-3.5 w-3.5" />
                        {t('tracker', 'pomodoro.sessionSaved')}
                    </motion.p>
                )}
            </AnimatePresence>
        </section>
    )
}
