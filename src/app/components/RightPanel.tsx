import { useCourses } from '@/db/planner/queries/courseQueries'
import { useAllEvents } from '@/db/planner/queries/eventQueries'
import { logHabit, useTodayHabitsWithStatus } from '@/db/planner/queries/habitQueries'
import { usePersonalTasks } from '@/db/planner/queries/personalTaskQueries'
import { useActiveTasksWithContext } from '@/db/planner/queries/taskQueries'
import type { TaskStatus } from '@/db/planner/types'
import { useActiveActivities } from '@/db/time-tracking/queries/activityQueries'
import { useTodaySessions } from '@/db/time-tracking/queries/sessionQueries'
import { computeElapsedSec, formatDuration, useRunningTimers } from '@/db/time-tracking/queries/timerQueries'
import { useTranslations } from '@/i18n'
import { useSettingsStore } from '@/modules/settings/store/settingsStore'
import { stopTimer } from '@/modules/tracker/lib/timerService'
import { usePomodoroStore } from '@/modules/tracker/store/pomodoroStore'
import { EntityIcon } from '@/shared/components'
import { useTimerClock } from '@/shared/hooks/useTimerClock'
import { clsx } from 'clsx'
import { AlarmClock, CalendarDays, Check, ChevronRight, CircleAlert, Flame, Pause, Play, ShieldCheck, Square } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface RightPanelProps {
    collapsed?: boolean
    onToggle?: () => void
}

interface TaskCandidate {
    id: string
    kind: 'courseTask' | 'personalTask'
    title: string
    subtitle: string
    path: string
    dayDifference: number | null
    isPriority: boolean
    status: TaskStatus
    color?: string
}

interface DeadlineItem {
    id: string
    title: string
    subtitle: string
    path: string
    dayDifference: number
    color: string
    isPriority: boolean
}

interface HabitRiskItem {
    habit: {
        id: string
        title: string
        emoji: string
        icon?: string
        type: 'boolean' | 'numeric'
        target?: number
    }
    currentStreak: number
    isDueToday: boolean
    isCompletedToday: boolean
}

type NextAction =
    | { kind: 'timer'; title: string; subtitle: string }
    | { kind: 'pomodoro'; title: string; subtitle: string; phase: 'work' | 'break'; secondsLeft: number; totalSeconds: number }
    | { kind: 'task'; task: TaskCandidate }
    | { kind: 'habit'; habit: HabitRiskItem }
    | { kind: 'idle' }

function formatHoursAndMinutes(totalSec: number): string {
    const totalMinutes = Math.floor(totalSec / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours === 0) {
        return `${minutes}dk`
    }

    return `${hours}s ${minutes}dk`
}

export function RightPanel({ collapsed, onToggle }: RightPanelProps) {
    const t = useTranslations(['common', 'tracker'])
    const navigate = useNavigate()
    const courses = useCourses()
    const events = useAllEvents()
    const personalTasks = usePersonalTasks()
    const activeTasksWithContext = useActiveTasksWithContext()
    const todayHabitsData = useTodayHabitsWithStatus()

    const courseById = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses])

    const todayHabits = useMemo<HabitRiskItem[]>(
        () => collapsed ? [] : todayHabitsData,
        [collapsed, todayHabitsData],
    )
    const todaySessions = useTodaySessions()
    const runningTimers = useRunningTimers()
    const activities = useActiveActivities()
    const nowMs = useTimerClock()
    const pomodoro = usePomodoroStore()
    const { pomodoroWorkDuration, pomodoroBreakDuration } = useSettingsStore()
    const pomodoroWorkSeconds = pomodoroWorkDuration * 60
    const pomodoroBreakSeconds = pomodoroBreakDuration * 60
    const currentPomodoroTotalSeconds = pomodoro.phase === 'work' ? pomodoroWorkSeconds : pomodoroBreakSeconds
    const pomodoroHasProgress = pomodoro.secondsLeft < currentPomodoroTotalSeconds
    const pomodoroPrimaryActionLabel = pomodoro.running
        ? t('tracker', 'timer.pause')
        : pomodoroHasProgress
            ? t('tracker', 'timer.resume')
            : t('tracker', 'timer.start')

    const taskCandidates = useMemo<TaskCandidate[]>(() => {
        if (collapsed) return []
        const courseTasks = activeTasksWithContext.map(({ task, course }) => ({
            id: task.id,
            kind: 'courseTask' as const,
            title: task.text,
            subtitle: course.title,
            path: `/planner/courses/${course.id}`,
            dayDifference: getDayDifference(task.dueDateISO),
            isPriority: !!task.isPriority,
            status: task.status,
            color: course.color,
        }))

        const looseTasks = personalTasks
            .filter(task => task.status !== 'done')
            .map(task => ({
                id: task.id,
                kind: 'personalTask' as const,
                title: task.text,
                subtitle: t('common', 'dashboard.personalTask'),
                path: '/planner/tasks',
                dayDifference: getDayDifference(task.dueDateISO),
                isPriority: !!task.isPriority,
                status: task.status,
                color: 'var(--status-blue)',
            }))

        return [...courseTasks, ...looseTasks].sort(sortTaskCandidates)
    }, [collapsed, activeTasksWithContext, personalTasks, t])

    const todaysTrackedSeconds = useMemo(() => {
        if (collapsed) return 0
        const sessionsDuration = todaySessions.reduce((total, session) => total + session.durationSec, 0)
        const activeDuration = runningTimers.reduce((total, timer) => total + computeElapsedSec(timer, nowMs), 0)
        return sessionsDuration + activeDuration
    }, [collapsed, runningTimers, todaySessions, nowMs])

    const atRiskHabits = useMemo(
        () => {
            if (collapsed) return []
            return todayHabits
                .filter(habit => habit.isDueToday && !habit.isCompletedToday)
                .sort((left, right) => {
                    if (right.currentStreak !== left.currentStreak) {
                        return right.currentStreak - left.currentStreak
                    }

                    return left.habit.title.localeCompare(right.habit.title)
                })
        },
        [collapsed, todayHabits]
    )

    const deadlineItems = useMemo<DeadlineItem[]>(() => {
        if (collapsed) return []

        const taskDeadlines = taskCandidates
            .filter(task => task.dayDifference != null)
            .map(task => ({
                id: task.id,
                title: task.title,
                subtitle: task.subtitle,
                path: task.path,
                dayDifference: task.dayDifference ?? 0,
                color: task.color ?? 'var(--status-blue)',
                isPriority: task.isPriority,
            }))

        const eventDeadlines = events.map(event => {
            const course = event.courseId ? courseById.get(event.courseId) : undefined

            return {
                id: event.id,
                title: event.title,
                subtitle: course?.title ?? t('common', 'dashboard.calendarFallback'),
                path: '/calendar',
                dayDifference: getDayDifference(event.dateISO) ?? 0,
                color: course?.color ?? 'var(--color-accent)',
                isPriority: event.type === 'exam',
            }
        })

        return [...taskDeadlines, ...eventDeadlines].sort((left, right) => {
            if (left.dayDifference !== right.dayDifference) {
                return left.dayDifference - right.dayDifference
            }

            if (left.isPriority !== right.isPriority) {
                return left.isPriority ? -1 : 1
            }

            return left.title.localeCompare(right.title)
        })
    }, [collapsed, courseById, events, taskCandidates, t])

    const deadlineGroups = useMemo(() => ({
        overdue: deadlineItems.filter(item => item.dayDifference < 0).slice(0, 2),
        today: deadlineItems.filter(item => item.dayDifference === 0).slice(0, 2),
        nextThreeDays: deadlineItems.filter(item => item.dayDifference > 0 && item.dayDifference <= 3).slice(0, 2),
    }), [deadlineItems])

    const activeTimer = runningTimers[0]
    const activeActivity = activeTimer ? activities.find(activity => activity.id === activeTimer.activityId) : undefined
    const activeElapsed = activeTimer ? computeElapsedSec(activeTimer, nowMs) : 0

    const nextAction = useMemo<NextAction>(() => {
        if (collapsed) return { kind: 'idle' }

        if (pomodoro.running || pomodoroHasProgress) {
            const totalSeconds = pomodoro.phase === 'work' ? pomodoroWorkSeconds : pomodoroBreakSeconds
            const selectedActivity = activities.find(activity => activity.id === pomodoro.selectedActivityId)
            const subtitle = pomodoro.running
                ? `${t('tracker', `pomodoro.${pomodoro.phase}`)} • ${t('common', 'dashboard.timerRunning')}`
                : `${t('tracker', `pomodoro.${pomodoro.phase}`)} • ${t('tracker', 'timer.paused')}`

            return {
                kind: 'pomodoro',
                title: selectedActivity?.name ?? t('tracker', 'pomodoro.noActivity'),
                subtitle,
                phase: pomodoro.phase,
                secondsLeft: pomodoro.secondsLeft,
                totalSeconds,
            }
        }

        if (activeTimer && activeActivity) {
            return {
                kind: 'timer',
                title: activeActivity.name,
                subtitle: t('common', 'dashboard.timerRunning'),
            }
        }

        const nextTask = taskCandidates[0]
        if (nextTask) {
            return {
                kind: 'task',
                task: nextTask,
            }
        }

        const nextHabit = atRiskHabits[0]
        if (nextHabit) {
            return {
                kind: 'habit',
                habit: nextHabit,
            }
        }

        return { kind: 'idle' }
    }, [activities, activeActivity, activeTimer, atRiskHabits, collapsed, pomodoro.phase, pomodoro.running, pomodoro.secondsLeft, pomodoro.selectedActivityId, pomodoroBreakSeconds, pomodoroWorkSeconds, pomodoroHasProgress, t, taskCandidates])

    if (collapsed) {
        return (
            <aside className="hidden h-full w-16 flex-col items-center justify-between border-l border-[var(--border-subtle)] bg-primary px-2 py-4 lg:flex">
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-surface-100 text-text-secondary transition-colors hover:bg-surface-200 hover:text-text-primary"
                    aria-label={t('common', 'rightPanel.expand')}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
                <div className="space-y-2 text-center">
                    <div className="h-2 w-2 rounded-full bg-status-green" />
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-text-muted [writing-mode:vertical-rl]">
                        {t('common', 'dashboard.todayLabel')}
                    </p>
                </div>
            </aside>
        )
    }

    return (
        <aside className="custom-scrollbar hidden h-full w-[340px] overflow-y-auto border-l border-[var(--border-subtle)] bg-primary px-4 py-3.5 lg:flex lg:flex-col">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-text-muted">
                        {t('common', 'dashboard.rightPanelLabel')}
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-text-primary">
                        {t('common', 'rightPanel.insights')}
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    className="rounded-full border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-200 hover:text-text-primary"
                >
                    {t('common', 'rightPanel.collapse')}
                </button>
            </div>

            <div className="space-y-2.5">
                <PanelCard aria-live={nextAction.kind === 'timer' || nextAction.kind === 'pomodoro' ? 'polite' : 'off'}>
                    <PanelHeader
                        eyebrow={t('common', 'dashboard.todayLabel')}
                        title={t('common', 'dashboard.nowNext')}
                        badge={formatHoursAndMinutes(todaysTrackedSeconds)}
                    />

                    {nextAction.kind === 'pomodoro' ? (
                        <div className={clsx(
                            'mt-4 rounded-xl border p-3',
                            nextAction.phase === 'work'
                                ? 'border-status-amber/20 bg-status-amber-soft'
                                : 'border-status-blue/20 bg-status-blue-soft',
                        )}>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={clsx(
                                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                                            nextAction.phase === 'work'
                                                ? 'bg-white/70 text-status-amber dark:bg-black/30'
                                                : 'bg-white/70 text-status-blue dark:bg-black/30',
                                        )}>
                                            <AlarmClock className="h-3.5 w-3.5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-medium text-text-primary">
                                                {nextAction.title}
                                            </p>
                                            <p className="text-[0.65rem] text-text-secondary">
                                                {nextAction.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-semibold tabular-nums tracking-tight text-text-primary whitespace-nowrap">
                                        {formatDuration(nextAction.secondsLeft)}
                                    </p>
                                </div>

                                <div className="h-1.5 rounded-full bg-white/60 dark:bg-black/35">
                                    <div
                                        className={clsx(
                                            'h-full rounded-full transition-all',
                                            nextAction.phase === 'work' ? 'bg-status-amber' : 'bg-status-blue',
                                        )}
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                ((nextAction.totalSeconds - nextAction.secondsLeft) / Math.max(nextAction.totalSeconds, 1)) * 100,
                                            )}%`,
                                        }}
                                    />
                                </div>

                                <div className="flex gap-1.5 flex-wrap items-center">
                                    <select
                                        value={pomodoro.selectedActivityId}
                                        onChange={(e) => pomodoro.setSelectedActivityId(e.target.value)}
                                        title={t('tracker', 'nav.activities')}
                                        className="rounded-lg border border-[var(--border-subtle)] bg-white/50 dark:bg-black/30 px-2 py-1 text-xs text-text-primary transition-colors hover:bg-white/70 dark:hover:bg-black/50"
                                    >
                                        <option value="">{t('common', 'navigation.tracker')}</option>
                                        {activities.map(act => (
                                            <option key={act.id} value={act.id}>{act.name}</option>
                                        ))}
                                    </select>

                                    <div className="flex gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => pomodoro.toggleRunning(currentPomodoroTotalSeconds)}
                                            title={pomodoroPrimaryActionLabel}
                                            className="rounded-lg border border-[var(--border-subtle)] bg-surface-200 text-text-primary hover:bg-surface-300 p-1.5 transition-colors"
                                        >
                                            {pomodoro.running ? (
                                                <Pause className="h-4 w-4" />
                                            ) : (
                                                <Play className="h-4 w-4" />
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => pomodoro.reset(pomodoroWorkSeconds)}
                                            title={t('tracker', 'timer.stop')}
                                            className="rounded-lg border border-[var(--border-subtle)] bg-surface-200 text-text-primary hover:bg-surface-300 p-1.5 transition-colors"
                                        >
                                            <Square className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : nextAction.kind === 'timer' ? (
                        <div className="mt-4 rounded-[1.15rem] border border-status-blue/20 bg-status-blue-soft p-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-status-blue dark:bg-black/30">
                                    <AlarmClock className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-text-primary">
                                        {nextAction.title}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {nextAction.subtitle}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <p className="text-3xl font-semibold tracking-tight text-text-primary">
                                    {formatDuration(activeElapsed)}
                                </p>
                                <div className="mt-3 h-2 rounded-full bg-white/60 dark:bg-black/35">
                                    <div
                                        className="h-full rounded-full bg-status-blue"
                                        style={{ width: `${Math.min(100, ((activeElapsed % 3600) / 3600) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <ActionButton
                                    className="flex-1 bg-text-primary text-white hover:opacity-90 dark:bg-white dark:text-black"
                                    onClick={() => navigate('/tracker')}
                                >
                                    {t('tracker', 'resume')}
                                </ActionButton>
                                {activeTimer && (
                                    <ActionButton
                                        className="border border-[var(--border-subtle)] bg-white/70 text-text-primary hover:bg-white/85 dark:bg-black/30 dark:hover:bg-black/45"
                                        onClick={() => void stopTimer(activeTimer.id)}
                                    >
                                        {t('common', 'dashboard.stopTimer')}
                                    </ActionButton>
                                )}
                            </div>
                        </div>
                    ) : nextAction.kind === 'task' ? (
                        <div className="mt-4 rounded-[1.15rem] border border-[var(--border-subtle)] bg-surface-100 p-4">
                            <div className="flex items-start gap-3">
                                <span
                                    className="mt-0.5 h-11 w-1 rounded-full"
                                    style={{ backgroundColor: nextAction.task.color ?? 'var(--status-blue)' }}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[0.65rem] font-mono uppercase tracking-[0.18em] text-text-muted">
                                            {t('common', `dashboard.${nextAction.task.kind}`)}
                                        </span>
                                        {nextAction.task.isPriority && (
                                            <span className="rounded-full border border-status-amber/30 px-2 py-1 text-[0.65rem] font-mono uppercase tracking-[0.18em] text-status-amber">
                                                {t('common', 'app.priority')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-3 line-clamp-2 text-sm font-medium text-text-primary">
                                        {nextAction.task.title}
                                    </p>
                                    <p className="mt-1 text-xs text-text-secondary">
                                        {nextAction.task.subtitle}
                                    </p>
                                    {nextAction.task.dayDifference != null && (
                                        <p className="mt-3 text-xs font-medium text-text-muted">
                                            {formatRelativeDay(nextAction.task.dayDifference, t)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <ActionButton
                                    className="flex-1 bg-text-primary text-white hover:opacity-90 dark:bg-white dark:text-black"
                                    onClick={() => navigate(nextAction.task.path)}
                                >
                                    {t('common', 'app.open')}
                                </ActionButton>
                                <ActionButton
                                    className="border border-[var(--border-subtle)] bg-surface-200 text-text-primary hover:bg-surface-300"
                                    onClick={() => pomodoro.toggleRunning(pomodoroWorkSeconds)}
                                >
                                    {t('common', 'dashboard.startFocus')}
                                </ActionButton>
                            </div>
                        </div>
                    ) : nextAction.kind === 'habit' ? (
                        <div className="mt-4 rounded-[1.15rem] border border-[var(--border-subtle)] bg-surface-100 p-4">
                            <div className="flex items-start gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-200 text-lg">
                                    <EntityIcon
                                        name={nextAction.habit.habit.icon}
                                        fallback={nextAction.habit.habit.emoji}
                                        className="h-5 w-5"
                                        size={18}
                                    />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <span className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[0.65rem] font-mono uppercase tracking-[0.18em] text-text-muted">
                                        {t('common', 'navigation.habits')}
                                    </span>
                                    <p className="mt-3 truncate text-sm font-medium text-text-primary">
                                        {nextAction.habit.habit.title}
                                    </p>
                                    <p className="mt-1 text-xs text-text-secondary">
                                        {t('common', 'dashboard.streakDays', { count: nextAction.habit.currentStreak })}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <ActionButton
                                    className="flex-1 bg-text-primary text-white hover:opacity-90 dark:bg-white dark:text-black"
                                    onClick={() => void logHabit(
                                        nextAction.habit.habit.id,
                                        getTodayISO(),
                                        true,
                                        nextAction.habit.habit.type === 'numeric' ? nextAction.habit.habit.target : undefined,
                                    )}
                                >
                                    {t('common', 'dashboard.markDone')}
                                </ActionButton>
                                <ActionButton
                                    className="border border-[var(--border-subtle)] bg-surface-200 text-text-primary hover:bg-surface-300"
                                    onClick={() => navigate(`/habits/${nextAction.habit.habit.id}`)}
                                >
                                    {t('common', 'app.open')}
                                </ActionButton>
                            </div>
                        </div>
                    ) : (
                        <WidgetEmptyState
                            icon={<Play className="h-5 w-5" />}
                            title={t('common', 'dashboard.noPriorityNowTitle')}
                            description={t('common', 'dashboard.noPriorityNowHint')}
                            actionLabel={t('common', 'dashboard.startFocus')}
                            onAction={() => pomodoro.toggleRunning(pomodoroWorkSeconds)}
                        />
                    )}
                </PanelCard>

                <PanelCard>
                    <PanelHeader
                        eyebrow={t('common', 'dashboard.streak')}
                        title={t('common', 'dashboard.streakRisk')}
                    />

                    {atRiskHabits.length > 0 ? (
                        <div className="mt-4 space-y-3">
                            {atRiskHabits.slice(0, 3).map(item => (
                                <div
                                    key={item.habit.id}
                                    className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--border-subtle)] bg-surface-100 px-3 py-3"
                                >
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/habits/${item.habit.id}`)}
                                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                    >
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-200 text-base">
                                            <EntityIcon
                                                name={item.habit.icon}
                                                fallback={item.habit.emoji}
                                                className="h-4 w-4"
                                                size={16}
                                            />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-text-primary">
                                                {item.habit.title}
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                {t('common', 'dashboard.streakDays', { count: item.currentStreak })}
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => void logHabit(
                                            item.habit.id,
                                            getTodayISO(),
                                            true,
                                            item.habit.type === 'numeric' ? item.habit.target : undefined,
                                        )}
                                        className="flex h-10 items-center gap-1 rounded-full border border-status-green/25 bg-status-green-soft px-3 text-xs font-medium text-status-green transition-colors hover:bg-status-green/15"
                                    >
                                        <Check className="h-4 w-4" />
                                        {t('common', 'dashboard.markDone')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : todayHabits.some(habit => habit.isDueToday) ? (
                        <WidgetEmptyState
                            icon={<ShieldCheck className="h-5 w-5" />}
                            title={t('common', 'dashboard.allHabitsSafe')}
                            description={t('common', 'dashboard.allHabitsSafeHint')}
                            actionLabel={t('common', 'app.open')}
                            onAction={() => navigate('/habits')}
                        />
                    ) : (
                        <WidgetEmptyState
                            icon={<Flame className="h-5 w-5" />}
                            title={t('common', 'dashboard.noHabitsDue')}
                            description={t('common', 'dashboard.noHabitsDueHint')}
                            actionLabel={t('common', 'app.open')}
                            onAction={() => navigate('/habits')}
                        />
                    )}
                </PanelCard>

                <PanelCard>
                    <PanelHeader
                        eyebrow={t('common', 'dashboard.deadlines')}
                        title={t('common', 'dashboard.deadlineRadar')}
                    />

                    {deadlineGroups.overdue.length === 0 && deadlineGroups.today.length === 0 && deadlineGroups.nextThreeDays.length === 0 ? (
                        <WidgetEmptyState
                            icon={<CalendarDays className="h-5 w-5" />}
                            title={t('common', 'app.noUpcomingDeadlines')}
                            description={t('common', 'dashboard.noPriorityNowHint')}
                            actionLabel={t('common', 'dashboard.openCalendar')}
                            onAction={() => navigate('/calendar')}
                        />
                    ) : (
                        <div className="mt-4 space-y-4">
                            <DeadlineSection
                                title={t('common', 'dashboard.overdue')}
                                items={deadlineGroups.overdue}
                                t={t}
                                onOpen={path => navigate(path)}
                            />
                            <DeadlineSection
                                title={t('common', 'common.today')}
                                items={deadlineGroups.today}
                                t={t}
                                onOpen={path => navigate(path)}
                            />
                            <DeadlineSection
                                title={t('common', 'dashboard.nextThreeDays')}
                                items={deadlineGroups.nextThreeDays}
                                t={t}
                                onOpen={path => navigate(path)}
                            />

                            <ActionButton
                                className="w-full border border-[var(--border-subtle)] bg-surface-200 text-text-primary hover:bg-surface-300"
                                onClick={() => navigate('/calendar')}
                            >
                                {t('common', 'dashboard.openCalendar')}
                            </ActionButton>
                        </div>
                    )}
                </PanelCard>
            </div>
        </aside>
    )
}

interface PanelCardProps {
    children: ReactNode
    ariaLive?: 'polite' | 'off'
}

function PanelCard({ children, ariaLive = 'off' }: PanelCardProps) {
    return (
        <section
            className="card py-3 px-3.5"
            aria-live={ariaLive}
        >
            {children}
        </section>
    )
}

interface PanelHeaderProps {
    eyebrow: string
    title: string
    badge?: string
}

function PanelHeader({ eyebrow, title, badge }: PanelHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-text-muted">
                    {eyebrow}
                </p>
                <h3 className="mt-1 text-base font-semibold text-text-primary">
                    {title}
                </h3>
            </div>
            {badge && (
                <span className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[0.65rem] font-mono uppercase tracking-[0.18em] text-text-muted">
                    {badge}
                </span>
            )}
        </div>
    )
}

interface ActionButtonProps {
    children: ReactNode
    className: string
    onClick: () => void
}

function ActionButton({ children, className, onClick }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                'flex min-h-[44px] items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors',
                className,
            )}
        >
            {children}
        </button>
    )
}

interface WidgetEmptyStateProps {
    icon: ReactNode
    title: string
    description: string
    actionLabel: string
    onAction: () => void
}

function WidgetEmptyState({ icon, title, description, actionLabel, onAction }: WidgetEmptyStateProps) {
    return (
        <div className="mt-3 rounded-[1.15rem] border border-dashed border-[var(--border-subtle)] bg-surface-100 p-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-200 text-text-secondary">
                {icon}
            </span>
            <p className="mt-2.5 text-sm font-medium text-text-primary">
                {title}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
                {description}
            </p>
            <ActionButton
                className="mt-3.5 w-full border border-[var(--border-subtle)] bg-surface-200 text-text-primary hover:bg-surface-300"
                onClick={onAction}
            >
                {actionLabel}
            </ActionButton>
        </div>
    )
}

interface DeadlineSectionProps {
    title: string
    items: DeadlineItem[]
    t: (namespace: 'common' | 'tracker', key: string, params?: Record<string, string | number>) => string
    onOpen: (path: string) => void
}

function DeadlineSection({ title, items, t, onOpen }: DeadlineSectionProps) {
    if (items.length === 0) {
        return null
    }

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <p className="text-[0.68rem] font-mono uppercase tracking-[0.18em] text-text-muted">
                    {title}
                </p>
                <span className="rounded-full bg-surface-200 px-2 py-1 text-[0.65rem] text-text-secondary">
                    {items.length}
                </span>
            </div>

            <div className="space-y-2">
                {items.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpen(item.path)}
                        className="flex w-full items-start gap-3 rounded-[1.05rem] border border-[var(--border-subtle)] bg-surface-100 px-3 py-3 text-left transition-colors hover:bg-surface-200"
                    >
                        <span
                            className="mt-0.5 h-10 w-1 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className={clsx(
                                    'flex h-7 w-7 items-center justify-center rounded-full',
                                    item.dayDifference < 0 || item.dayDifference === 0
                                        ? 'bg-status-red-soft text-status-red'
                                        : 'bg-status-amber-soft text-status-amber',
                                )}>
                                    {item.dayDifference < 0 ? <CircleAlert className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                                </span>
                                <p className="truncate text-sm font-medium text-text-primary">
                                    {item.title}
                                </p>
                            </div>
                            <p className="mt-1 truncate text-xs text-text-muted">
                                {item.subtitle}
                            </p>
                        </div>
                        <span className={clsx(
                            'rounded-full border px-2 py-1 text-[0.65rem] font-mono uppercase tracking-[0.18em]',
                            item.dayDifference < 0 || item.dayDifference === 0
                                ? 'border-status-red/30 text-status-red'
                                : 'border-status-amber/30 text-status-amber',
                        )}>
                            {formatRelativeDay(item.dayDifference, t)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}

function getTaskStatusRank(status: TaskStatus) {
    switch (status) {
        case 'in-progress':
            return 0
        case 'review':
            return 1
        case 'todo':
            return 2
        case 'done':
            return 3
        default:
            return 4
    }
}

function getDayDifference(dateISO?: string): number | null {
    if (!dateISO) {
        return null
    }

    const target = new Date(dateISO)
    target.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function sortTaskCandidates(left: TaskCandidate, right: TaskCandidate) {
    const leftDay = left.dayDifference ?? Number.MAX_SAFE_INTEGER
    const rightDay = right.dayDifference ?? Number.MAX_SAFE_INTEGER

    if (leftDay !== rightDay) {
        return leftDay - rightDay
    }

    if (left.isPriority !== right.isPriority) {
        return left.isPriority ? -1 : 1
    }

    const statusDiff = getTaskStatusRank(left.status) - getTaskStatusRank(right.status)
    if (statusDiff !== 0) {
        return statusDiff
    }

    return left.title.localeCompare(right.title)
}

function getTodayISO() {
    return new Date().toISOString().split('T')[0]
}

function formatRelativeDay(
    dayDifference: number,
    t: (namespace: 'common' | 'tracker', key: string, params?: Record<string, string | number>) => string
) {
    if (dayDifference < 0) {
        return t('common', 'dashboard.overdueDays', { count: Math.abs(dayDifference) })
    }

    if (dayDifference === 0) {
        return t('common', 'common.today')
    }

    if (dayDifference === 1) {
        return t('common', 'common.tomorrow')
    }

    return t('common', 'app.daysLeft', { count: dayDifference })
}
