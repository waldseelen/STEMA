import { toggleHabitToday, useTodayHabitsWithStatus } from '@/db/planner/queries/habitQueries'
import { useUpcomingExams } from '@/db/planner/queries/eventQueries'
import { useCourses } from '@/db/planner/queries/courseQueries'
import { usePlannerStats } from '@/db/planner/queries/statsQueries'
import { useActiveTasksWithContext } from '@/db/planner/queries/taskQueries'
import { useTodaySessions } from '@/db/time-tracking/queries/sessionQueries'
import { computeElapsedSec, useRunningTimers } from '@/db/time-tracking/queries/timerQueries'
import { useI18n, useTranslation, useTranslations } from '@/i18n'
import { EntityIcon, useToast } from '@/shared/components'
import { clsx } from 'clsx'
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Flame, ListTodo, TimerReset } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

function formatHoursAndMinutes(totalSeconds: number): string {
    const totalMinutes = Math.floor(totalSeconds / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours === 0) {
        return `${minutes}dk`
    }

    return `${hours}s ${minutes}dk`
}

export function OverviewPage() {
    const t = useTranslations(['common', 'calendar', 'habits', 'tracker'])
    const { locale } = useI18n()
    const { showToast } = useToast()
    const courses = useCourses()
    const examEvents = useUpcomingExams(8)
    const plannerStats = usePlannerStats()
    const activeTasks = useActiveTasksWithContext(5)
    const todayHabitsRaw = useTodayHabitsWithStatus()
    const todayHabits = useMemo(() => todayHabitsRaw ?? [], [todayHabitsRaw])
    const todaySessions = useTodaySessions()
    const runningTimers = useRunningTimers()

    const greeting = useMemo(() => {
        const hour = new Date().getHours()
        if (hour >= 5 && hour < 12) {
            return t('common', 'greeting.morning')
        }
        if (hour >= 12 && hour < 18) {
            return t('common', 'greeting.afternoon')
        }
        if (hour >= 18 && hour < 23) {
            return t('common', 'greeting.evening')
        }
        return t('common', 'greeting.night')
    }, [t])

    const currentDateLabel = useMemo(() => new Date().toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }), [locale])

    const taskSummary = { completed: plannerStats.completedTasks, total: plannerStats.totalTasks }

    const todaysTrackedSeconds = useMemo(() => {
        const sessionsDuration = todaySessions.reduce((total, session) => total + session.durationSec, 0)
        const activeDuration = runningTimers.reduce((total, timer) => total + computeElapsedSec(timer), 0)
        return sessionsDuration + activeDuration
    }, [runningTimers, todaySessions])

    const streakValue = useMemo(
        () => todayHabits.reduce((best, habit) => Math.max(best, habit.currentStreak), 0),
        [todayHabits]
    )

    const dueTodayHabits = useMemo(
        () => todayHabits.filter(entry => entry.isDueToday).slice(0, 5),
        [todayHabits]
    )

    const courseMap = useMemo(() => new Map(courses.map(c => [c.id, c])), [courses])

    const upcomingExams = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        return examEvents
            .map(event => {
                const course = event.courseId ? courseMap.get(event.courseId) : undefined
                const eventDate = new Date(event.dateISO)
                eventDate.setHours(0, 0, 0, 0)
                const dayDifference = Math.round((eventDate.getTime() - today.getTime()) / 86400000)
                return { event, course, dayDifference }
            })
            .filter(item => item.dayDifference >= 0)
            .sort((left, right) => left.dayDifference - right.dayDifference)
            .slice(0, 4)
    }, [examEvents, courseMap])

    async function handleToggleHabitToday(habitId: string) {
        try {
            await toggleHabitToday(habitId)
        } catch (error) {
            const message = error instanceof Error && error.message.trim()
                ? error.message
                : t('common', 'toast.error')
            showToast(message, { variant: 'error' })
        }
    }

    return (
        <div className="flex flex-col space-y-6 animate-fade-in w-full h-full overflow-y-auto lg:overflow-hidden p-4 md:p-6 min-h-0">
            <section
                data-onboarding-target="dashboard-hero"
                className="card p-6 shrink-0"
            >
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
                    {t('common', 'dashboard.overviewLabel')}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
                    {greeting}
                </h1>
                <p className="mt-2 text-sm text-text-secondary md:text-base">
                    {currentDateLabel}
                </p>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                    <TodayStatCard
                        targetId="dashboard-stat-tasks"
                        icon={<ListTodo className="h-5 w-5" />}
                        label={t('common', 'dashboard.taskStatus')}
                        value={`${taskSummary.completed}/${taskSummary.total}`}
                        detail={taskSummary.total > 0 ? `%${Math.round((taskSummary.completed / taskSummary.total) * 100)}` : '%0'}
                    />
                    <TodayStatCard
                        targetId="dashboard-stat-tracker"
                        icon={<TimerReset className="h-5 w-5" />}
                        label={t('common', 'dashboard.trackerDuration')}
                        value={formatHoursAndMinutes(todaysTrackedSeconds)}
                        detail={t('tracker', 'stats.period.day')}
                    />
                    <TodayStatCard
                        icon={<Flame className="h-5 w-5" />}
                        label={t('common', 'dashboard.streak')}
                        value={`${streakValue}`}
                        detail={t('common', 'common.day')}
                    />
                </div>
            </section>

            <div className="flex-1 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-h-0 overflow-visible lg:overflow-hidden">
                {/* Column 1: Ongoing Tasks */}
                <section
                    data-onboarding-target="dashboard-section-tasks"
                    className="card p-5 flex flex-col min-h-[300px] lg:min-h-0 bg-primary"
                >
                    <SectionHeader
                        title={t('common', 'dashboard.ongoingTasks')}
                        actionHref="/planner/tasks"
                        actionLabel={t('common', 'navigation.tasks')}
                    />

                    <div className="mt-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {activeTasks.length === 0 ? (
                            <InlineEmptyState
                                icon={<CheckCircle2 className="h-5 w-5" />}
                                title={t('common', 'dashboard.noOpenTasksTitle')}
                                description={t('common', 'dashboard.noOpenTasksDescription')}
                                actionHref="/planner/tasks"
                                actionLabel={t('common', 'app.addTask')}
                            />
                        ) : activeTasks.map(entry => (
                            <Link
                                key={entry.task.id}
                                to={`/planner/courses/${entry.course.id}`}
                                className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-surface-100 px-4 py-3 transition-colors hover:bg-surface-200"
                            >
                                <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.course.color }} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-text-primary">{entry.task.text}</p>
                                    <p className="truncate text-xs text-text-muted">
                                        {entry.course.title} • {entry.unit.title}
                                    </p>
                                </div>
                                {entry.task.dueDateISO && (
                                    <span className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[0.65rem] font-mono uppercase tracking-[0.18em] text-text-muted">
                                        {entry.task.dueDateISO}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Column 2: Today's Habits */}
                <section
                    data-onboarding-target="dashboard-section-habits"
                    className="card p-5 flex flex-col min-h-[300px] lg:min-h-0 bg-primary"
                >
                    <SectionHeader
                        title={t('common', 'dashboard.todayHabits')}
                        actionHref="/habits"
                        actionLabel={t('common', 'navigation.habits')}
                    />

                    <div className="mt-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {dueTodayHabits.length === 0 ? (
                            <InlineEmptyState
                                icon={<BookOpen className="h-5 w-5" />}
                                title={t('habits', 'empty.noTodayHabits')}
                                description={t('common', 'dashboard.todayHabitsDescription')}
                                actionHref="/habits"
                                actionLabel={t('common', 'app.addHabit')}
                            />
                        ) : dueTodayHabits.map(entry => (
                            <button
                                key={entry.habit.id}
                                type="button"
                                onClick={() => void handleToggleHabitToday(entry.habit.id)}
                                className="flex w-full items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-surface-100 px-4 py-3 text-left transition-colors hover:bg-surface-200"
                            >
                                <span
                                    className={clsx(
                                        'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                                        entry.isCompletedToday
                                            ? 'border-transparent bg-black text-white dark:bg-white dark:text-black'
                                            : 'bg-transparent text-text-primary'
                                    )}
                                    style={{ borderColor: entry.isCompletedToday ? undefined : entry.habit.color }}
                                >
                                    {entry.isCompletedToday ? '✓' : (
                                        <EntityIcon
                                            name={entry.habit.icon}
                                            fallback={entry.habit.emoji ?? '•'}
                                            className="h-4 w-4"
                                            size={16}
                                        />
                                    )}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-text-primary">{entry.habit.title}</p>
                                    <p className="truncate text-xs text-text-muted">
                                        {t('common', 'dashboard.streakDays', { count: entry.currentStreak })}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Column 3: Tracker + Upcoming Exams */}
                <div className="flex flex-col gap-6 min-h-0 lg:col-span-1 md:col-span-2 lg:overflow-hidden">
                    {/* Tracker Section */}
                    <section className="card p-5 shrink-0 bg-primary">
                        <SectionHeader
                            title={t('common', 'navigation.tracker')}
                            actionHref="/tracker"
                            actionLabel={t('common', 'dashboard.startFocus')}
                        />

                        <div className="mt-4 space-y-3">
                            <div className="rounded-xl border border-[var(--border-subtle)] bg-surface-100 p-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-200 text-text-secondary">
                                        <Clock3 className="h-4.5 w-4.5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-text-primary">
                                            {runningTimers.length > 0
                                                ? t('common', 'dashboard.activeTimer')
                                                : t('tracker', 'timer.startHint')}
                                        </p>
                                        <p className="mt-1 text-xs text-text-secondary">
                                            {runningTimers.length > 0
                                                ? formatHoursAndMinutes(todaysTrackedSeconds)
                                                : t('common', 'dashboard.noPriorityNowHint')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2 grid-cols-2">
                                <Link
                                    to="/tracker?mode=pomodoro"
                                    className="btn-primary justify-center text-xs py-2 px-3"
                                >
                                    {t('common', 'dashboard.startFocus')}
                                </Link>
                                <Link
                                    to="/tracker/activities"
                                    className="btn-secondary justify-center text-xs py-2 px-3"
                                >
                                    {t('tracker', 'nav.activities')}
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Upcoming Exams Section */}
                    <section
                        data-onboarding-target="dashboard-section-exams"
                        className="card p-5 flex-1 flex flex-col min-h-[250px] lg:min-h-0 bg-primary overflow-hidden"
                    >
                        <SectionHeader
                            title={t('common', 'dashboard.upcomingExams')}
                            actionHref="/calendar"
                            actionLabel={t('common', 'navigation.calendar')}
                        />

                        <div className="mt-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {upcomingExams.length === 0 ? (
                                <InlineEmptyState
                                    icon={<BookOpen className="h-5 w-5" />}
                                    title={t('calendar', 'empty.noUpcomingExams')}
                                    description={t('common', 'dashboard.upcomingExamsDescription')}
                                    actionHref="/calendar"
                                    actionLabel={t('common', 'navigation.calendar')}
                                />
                            ) : upcomingExams.map(item => (
                                <div
                                    key={item.event.id}
                                    className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-surface-100 px-4 py-3"
                                >
                                    <span
                                        className="h-10 w-1 rounded-full"
                                        style={{ backgroundColor: item.course?.color ?? 'var(--status-blue)' }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-text-primary">{item.event.title}</p>
                                        <p className="truncate text-xs text-text-muted">{item.course?.title ?? t('common', 'dashboard.calendarFallback')}</p>
                                    </div>
                                    <span className={clsx(
                                        'rounded-full border px-2 py-1 text-[0.65rem] font-mono uppercase tracking-[0.18em]',
                                        item.dayDifference <= 1
                                            ? 'border-status-red/30 text-status-red'
                                            : item.dayDifference <= 3
                                                ? 'border-status-amber/30 text-status-amber'
                                                : 'border-status-green/30 text-status-green'
                                    )}>
                                        {item.dayDifference === 0
                                            ? t('common', 'common.today')
                                            : item.dayDifference === 1
                                                ? t('common', 'common.tomorrow')
                                                : t('calendar', 'daysUntil.days', { count: item.dayDifference })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

interface TodayStatCardProps {
    icon: ReactNode
    label: string
    value: string
    detail: string
    targetId?: string
}

function TodayStatCard({ icon, label, value, detail, targetId }: TodayStatCardProps) {
    return (
        <div
            data-onboarding-target={targetId}
            className="rounded-xl border border-[var(--border-subtle)] bg-surface-100 p-4"
        >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-200 text-text-secondary">
                {icon}
            </span>
            <p className="mt-4 text-sm text-text-secondary">{label}</p>
            <div className="mt-2 flex items-end gap-2">
                <p className="text-2xl font-semibold tracking-tight text-text-primary">{value}</p>
                <span className="pb-1 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                    {detail}
                </span>
            </div>
        </div>
    )
}

interface SectionHeaderProps {
    title: string
    actionHref: string
    actionLabel: string
}

function SectionHeader({ title, actionHref, actionLabel }: SectionHeaderProps) {
    const t = useTranslation('common')

    return (
        <div className="flex items-center justify-between gap-3">
            <div>
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-text-muted">
                    {t('dashboard.todayLabel')}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-text-primary">{title}</h2>
            </div>
            <Link
                to={actionHref}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-200 hover:text-text-primary"
            >
                {actionLabel}
                <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
    )
}

interface InlineEmptyStateProps {
    icon: ReactNode
    title: string
    description: string
    actionHref: string
    actionLabel: string
}

function InlineEmptyState({
    icon,
    title,
    description,
    actionHref,
    actionLabel,
}: InlineEmptyStateProps) {
    return (
        <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-surface-100 px-4 py-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-200 text-text-secondary">
                {icon}
            </span>
            <h3 className="mt-4 text-sm font-semibold text-text-primary">{title}</h3>
            <p className="mt-2 text-sm text-text-secondary">{description}</p>
            <Link
                to={actionHref}
                className="btn-primary mt-4"
            >
                {actionLabel}
            </Link>
        </div>
    )
}
