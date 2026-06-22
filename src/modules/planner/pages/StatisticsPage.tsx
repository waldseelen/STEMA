import { useCoursesWithProgress } from '@/db/planner/queries/courseQueries'
import { useHabitLogsInRange, useHabits, useTodayHabitsWithStatus } from '@/db/planner/queries/habitQueries'
import { useCompletionHistory, usePlannerStats } from '@/db/planner/queries/statsQueries'
import { useLocale, useTranslation } from '@/i18n';
import { BarChart3, CheckCircle, Flame, Target, Timer, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, ProgressBar, ProgressRing } from '../components/ui/Card';
import { formatDuration, getLastNDays } from '../lib/utils';

// Get Pomodoro sessions from localStorage
function getPomodoroStats() {
    try {
        const storedSessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '{}') as Record<string, unknown>;
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = typeof storedSessions[today] === 'number' ? storedSessions[today] : 0;

        const totalSessions = Object.values(storedSessions)
            .filter((count): count is number => typeof count === 'number')
            .reduce((sum, count) => sum + count, 0);

        return { todaySessions, totalSessions };
    } catch {
        return { todaySessions: 0, totalSessions: 0 };
    }
}

export function StatisticsPage() {
    const t = useTranslation('planner')
    const locale = useLocale()

    const plannerStats = usePlannerStats()
    const coursesWithProgress = useCoursesWithProgress()
    const habits = useHabits()
    const todayHabitsWithStatusRaw = useTodayHabitsWithStatus()
    const todayHabitsWithStatus = useMemo(() => todayHabitsWithStatusRaw ?? [], [todayHabitsWithStatusRaw])

    const pomodoroStats = useMemo(() => getPomodoroStats(), [])

    const last30Days = useMemo(() => getLastNDays(30), [])
    const last30Start = useMemo(() => last30Days[0], [last30Days])
    const last7Days = useMemo(() => getLastNDays(7), [])
    const last7Start = useMemo(() => last7Days[0], [last7Days])
    const today = useMemo(() => new Date().toISOString().split('T')[0], [])

    // Completion history from Dexie: { [dateISO]: count }
    const completionHistory = useCompletionHistory(last7Start, today)

    // All habit logs in last 30 days for habitLogsMap
    const habitLogsInRange = useHabitLogsInRange(last30Start, today)

    // Build Map<habitId, Map<dateISO, log>> once — used in dailyStats and habit render
    const habitLogsMap = useMemo(() => {
        const result = new Map<string, Map<string, typeof habitLogsInRange[number]>>()
        for (const log of habitLogsInRange) {
            let inner = result.get(log.habitId)
            if (!inner) {
                inner = new Map()
                result.set(log.habitId, inner)
            }
            inner.set(log.dateISO, log)
        }
        return result
    }, [habitLogsInRange])

    // Calculate daily completion stats for last 7 days
    const dailyStats = useMemo(() => {
        return last7Days.map(dateISO => {
            // Count tasks completed on this day from completionHistory
            const completedTasks = completionHistory[dateISO] ?? 0

            // Count habits completed on this day
            let completedHabits = 0;
            habits.forEach(habit => {
                if (habit.isArchived) return
                const dayLog = habitLogsMap.get(habit.id)?.get(dateISO)
                if (dayLog?.done || (habit.type === 'numeric' && dayLog?.value && dayLog.value >= (habit.target || 0))) {
                    completedHabits++;
                }
            });

            const date = new Date(dateISO);
            return {
                dateISO,
                dayName: date.toLocaleDateString(locale, { weekday: 'short' }),
                dayNumber: date.getDate(),
                completedTasks,
                completedHabits,
            };
        });
    }, [completionHistory, habits, habitLogsMap, last7Days, locale]);

    // Overall stats
    const overallStats = useMemo(() => {
        const dueHabits = todayHabitsWithStatus.filter(h => h.isDueToday)
        const habitsCompleted = dueHabits.filter(h => h.isCompletedToday).length

        const avgHabitScore = dueHabits.length > 0
            ? Math.round(dueHabits.reduce((sum, h) => sum + Math.min(100, Math.round((h.currentStreak / 30) * 100)), 0) / dueHabits.length)
            : 0

        return {
            totalTasks: plannerStats.totalTasks,
            completedTasks: plannerStats.completedTasks,
            taskCompletion: plannerStats.completionPercent,
            totalHabits: plannerStats.totalHabits,
            todayHabits: dueHabits.length,
            habitsCompleted,
            avgHabitScore,
            totalCourses: plannerStats.totalCourses,
        };
    }, [plannerStats, todayHabitsWithStatus]);

    // Course progress data from Dexie (already computed)
    const courseProgress = useMemo(() => {
        return coursesWithProgress.map(course => ({
            id: course.id,
            title: course.title,
            color: course.color,
            total: course.totalTasks,
            completed: course.completedTasks,
            percentage: course.progressPercent,
        }));
    }, [coursesWithProgress]);

    // Max value for chart scaling
    const maxChartValue = Math.max(...dailyStats.map(d => d.completedTasks + d.completedHabits), 1);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-primary">{t('statistics.title')}</h1>
                <p className="text-secondary mt-1">{t('statistics.subtitle')}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                    <div className="p-3 rounded-full bg-status-blue-soft w-fit mx-auto mb-3">
                        <CheckCircle className="w-6 h-6 text-status-blue" />
                    </div>
                    <p className="text-2xl font-bold text-primary">{overallStats.completedTasks}</p>
                    <p className="text-sm text-secondary">{t('statistics.completedTasks')}</p>
                </Card>

                <Card className="text-center">
                    <div className="p-3 rounded-full bg-status-green-soft w-fit mx-auto mb-3">
                        <Target className="w-6 h-6 text-status-green" />
                    </div>
                    <p className="text-2xl font-bold text-primary">{overallStats.avgHabitScore}%</p>
                    <p className="text-sm text-secondary">{t('statistics.averageHabitScore')}</p>
                </Card>

                <Card className="text-center">
                    <div className="mx-auto mb-3 w-fit rounded-full bg-status-blue-soft p-3">
                        <TrendingUp className="w-6 h-6 text-status-blue" />
                    </div>
                    <p className="text-2xl font-bold text-primary">{overallStats.taskCompletion}%</p>
                    <p className="text-sm text-secondary">{t('statistics.taskCompletion')}</p>
                </Card>

                <Card className="text-center">
                    <div className="p-3 rounded-full bg-status-amber-soft w-fit mx-auto mb-3">
                        <Timer className="w-6 h-6 text-status-amber" />
                    </div>
                    <p className="text-2xl font-bold text-primary">{pomodoroStats.todaySessions}</p>
                    <p className="text-sm text-secondary">{t('statistics.todayPomodoro')}</p>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Pomodoro Summary */}
                <Card>
                    <CardHeader title={t('statistics.pomodoroSummaryTitle')} subtitle={t('statistics.pomodoroSummarySubtitle')} />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="rounded-xl bg-secondary p-4 text-center">
                            <Timer className="w-8 h-8 text-status-amber mx-auto mb-2" />
                            <p className="text-2xl font-bold text-primary">{pomodoroStats.todaySessions}</p>
                            <p className="text-sm text-secondary">{t('statistics.today')}</p>
                        </div>
                        <div className="rounded-xl bg-secondary p-4 text-center">
                            <BarChart3 className="w-8 h-8 text-status-blue mx-auto mb-2" />
                            <p className="text-2xl font-bold text-primary">{pomodoroStats.totalSessions}</p>
                            <p className="text-sm text-secondary">{t('statistics.total')}</p>
                        </div>
                    </div>
                    <div className="mt-4 rounded-xl bg-secondary p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-secondary">{t('statistics.todayWorkDuration')}</span>
                            <span className="font-bold text-primary">{formatDuration(pomodoroStats.todaySessions * 25 * 60)}</span>
                        </div>
                    </div>
                </Card>

                {/* Weekly Activity Chart */}
                <Card>
                    <CardHeader title={t('statistics.weeklyActivityTitle')} subtitle={t('statistics.weeklyActivitySubtitle')} />

                    <div className="flex items-end justify-between gap-2 h-48 mt-4">
                        {dailyStats.map((day) => {
                            const totalHeight = ((day.completedTasks + day.completedHabits) / maxChartValue) * 100;
                            const taskHeight = totalHeight > 0 ? (day.completedTasks / (day.completedTasks + day.completedHabits)) * 100 : 0;

                            return (
                                <div key={day.dateISO} className="flex-1 flex flex-col items-center">
                                    <div className="relative w-full h-40 flex flex-col justify-end">
                                        <div
                                            className="w-full rounded-t-lg overflow-hidden transition-all duration-500"
                                            style={{ height: `${totalHeight}%` }}
                                        >
                                            {/* Habits portion */}
                                            <div
                                                className="w-full bg-status-green"
                                                style={{ height: `${100 - taskHeight}%` }}
                                            />
                                            {/* Tasks portion */}
                                            <div
                                                className="w-full bg-status-blue"
                                                style={{ height: `${taskHeight}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p className="text-xs text-tertiary">{day.dayName}</p>
                                        <p className="text-sm font-medium text-secondary">{day.dayNumber}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-default">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-status-blue" />
                            <span className="text-sm text-secondary">{t('statistics.tasks')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-status-green" />
                            <span className="text-sm text-secondary">{t('statistics.habits')}</span>
                        </div>
                    </div>
                </Card>

                {/* Overall Progress */}
                <Card>
                    <CardHeader title={t('statistics.overallProgress')} />

                    <div className="flex items-center justify-center py-6">
                        <ProgressRing value={overallStats.taskCompletion} size={150} strokeWidth={12}>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-primary">{overallStats.taskCompletion}%</p>
                                <p className="text-sm text-secondary">{t('statistics.completed')}</p>
                            </div>
                        </ProgressRing>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="rounded-xl bg-secondary p-4 text-center">
                            <p className="text-2xl font-bold text-primary">{overallStats.completedTasks}</p>
                            <p className="text-sm text-secondary">{t('statistics.completed')}</p>
                        </div>
                        <div className="rounded-xl bg-secondary p-4 text-center">
                            <p className="text-2xl font-bold text-primary">
                                {overallStats.totalTasks - overallStats.completedTasks}
                            </p>
                            <p className="text-sm text-secondary">{t('statistics.remaining')}</p>
                        </div>
                    </div>
                </Card>

                {/* Course Progress */}
                <Card className="lg:col-span-2">
                    <CardHeader title={t('statistics.courseProgress')} />

                    {courseProgress.length === 0 ? (
                        <p className="text-secondary text-center py-8">{t('statistics.noCourses')}</p>
                    ) : (
                        <div className="space-y-4">
                            {courseProgress.map(course => (
                                <div key={course.id} className="flex items-center gap-4">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: course.color }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-medium text-primary truncate">{course.title}</p>
                                            <span className="text-sm text-secondary ml-2">
                                                {course.completed}/{course.total} ({course.percentage}%)
                                            </span>
                                        </div>
                                        <ProgressBar value={course.percentage} color={course.color} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Habit Statistics */}
                <Card className="lg:col-span-2">
                    <CardHeader
                        title={t('statistics.habitStatsTitle')}
                        subtitle={t('statistics.habitStatsSubtitle')}
                    />

                    {habits.filter(h => !h.isArchived).length === 0 ? (
                        <div className="text-center py-8">
                            <Target className="w-12 h-12 text-tertiary mx-auto mb-3" />
                            <p className="text-secondary">{t('statistics.noHabits')}</p>
                            <Link to="/habits">
                                <button className="btn-primary mt-3">
                                    {t('statistics.addHabit')}
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {habits.filter(h => !h.isArchived).map(habit => {
                                const dateMap = habitLogsMap.get(habit.id) ?? new Map<string, { done?: boolean; value?: number }>()

                                // Streak from last 30 days
                                let currentStreak = 0;
                                for (let i = last30Days.length - 1; i >= 0; i--) {
                                    const dayLog = dateMap.get(last30Days[i])
                                    if (dayLog?.done || (habit.type === 'numeric' && dayLog?.value && dayLog.value >= (habit.target || 0))) {
                                        currentStreak++;
                                    } else {
                                        break;
                                    }
                                }

                                const completedIn30Days = last30Days.filter(day => {
                                    const dayLog = dateMap.get(day)
                                    return dayLog?.done || (habit.type === 'numeric' && dayLog?.value && dayLog.value >= (habit.target || 0));
                                }).length;

                                const completionRate = Math.round((completedIn30Days / 30) * 100);

                                return (
                                    <Link key={habit.id} to={`/habits/${habit.id}`}>
                                        <div className="p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                                                    style={{ backgroundColor: habit.color + '20', color: habit.color }}
                                                >
                                                    {habit.emoji || '✓'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium text-primary truncate">{habit.title}</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1 text-status-amber">
                                                                <Flame className="w-4 h-4" />
                                                                <span className="text-sm font-medium">{currentStreak}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ProgressBar value={completionRate} color={habit.color} size="sm" />
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-secondary">{t('statistics.last30Days', { count: completedIn30Days })}</span>
                                                        <span className="text-xs font-medium" style={{ color: habit.color }}>{completionRate}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
