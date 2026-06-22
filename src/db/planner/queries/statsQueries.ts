/**
 * Stats & Progress Queries — Supabase-first
 *
 * Overview, statistics ve progress için aggregate queries.
 */

import {
    plannerCountActiveHabits,
    plannerCountCourses,
    plannerCountPersonalTasks,
    plannerCountTasks,
    plannerCountTodayCompletedHabits,
    plannerCountUpcomingExams,
    plannerGetAllHabitLogs,
    plannerGetCompletionRecordsByDateRange,
} from '@/lib/cloud/plannerRepo'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'

// ============================================
// Aggregate Stats
// ============================================

export interface PlannerStats {
    totalCourses: number
    totalTasks: number
    completedTasks: number
    completionPercent: number
    totalHabits: number
    todayHabitsCompleted: number
    upcomingExamsCount: number
    personalTasksCount: number
}

export async function getPlannerStats(): Promise<PlannerStats> {
    const [
        totalCourses,
        taskCounts,
        totalHabits,
        todayHabitsCompleted,
        upcomingExamsCount,
        personalTasksCount,
    ] = await Promise.all([
        plannerCountCourses(),
        plannerCountTasks(),
        plannerCountActiveHabits(),
        plannerCountTodayCompletedHabits(),
        plannerCountUpcomingExams(),
        plannerCountPersonalTasks(),
    ])

    return {
        totalCourses,
        totalTasks: taskCounts.total,
        completedTasks: taskCounts.completed,
        completionPercent: taskCounts.total > 0
            ? Math.round((taskCounts.completed / taskCounts.total) * 100)
            : 0,
        totalHabits,
        todayHabitsCompleted,
        upcomingExamsCount,
        personalTasksCount,
    }
}

export async function getCompletionHistory(
    startISO: string,
    endISO: string
): Promise<Map<string, number>> {
    const records = await plannerGetCompletionRecordsByDateRange(startISO, endISO)

    const countByDate = new Map<string, number>()
    for (const record of records) {
        const current = countByDate.get(record.dateKey) ?? 0
        countByDate.set(record.dateKey, current + 1)
    }

    return countByDate
}

export async function getDailyActivity(
    startISO: string,
    endISO: string
): Promise<Array<{ date: string; count: number }>> {
    const [taskCompletions, allHabitLogs] = await Promise.all([
        plannerGetCompletionRecordsByDateRange(startISO, endISO),
        plannerGetAllHabitLogs(),
    ])

    const habitLogs = allHabitLogs.filter(
        l => l.done && l.dateISO >= startISO && l.dateISO <= endISO
    )

    const countByDate = new Map<string, number>()

    for (const record of taskCompletions) {
        const current = countByDate.get(record.dateKey) ?? 0
        countByDate.set(record.dateKey, current + 1)
    }

    for (const log of habitLogs) {
        const current = countByDate.get(log.dateISO) ?? 0
        countByDate.set(log.dateISO, current + 1)
    }

    return Array.from(countByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getProductivityScore(dateISO: string): Promise<number> {
    const [taskCompletions, allHabitLogs] = await Promise.all([
        plannerGetCompletionRecordsByDateRange(dateISO, dateISO),
        plannerGetAllHabitLogs(),
    ])

    const habitLogs = allHabitLogs.filter(l => l.done && l.dateISO === dateISO)

    return (taskCompletions.length * 10) + (habitLogs.length * 5)
}

// ============================================
// React Hooks
// ============================================

const PLANNER_STATS_DEFAULT: PlannerStats = {
    totalCourses: 0,
    totalTasks: 0,
    completedTasks: 0,
    completionPercent: 0,
    totalHabits: 0,
    todayHabitsCompleted: 0,
    upcomingExamsCount: 0,
    personalTasksCount: 0,
}

export function usePlannerStats(): PlannerStats {
    return useSupabaseQuery(
        getPlannerStats,
        PLANNER_STATS_DEFAULT,
        ['courses', 'tasks', 'habits', 'habit_logs', 'events', 'personal_tasks', 'completion_records'],
        [],
    ).data
}

export function useDailyActivity(startISO: string, endISO: string) {
    return useSupabaseQuery(
        () => getDailyActivity(startISO, endISO),
        [],
        ['completion_records', 'habit_logs'],
        [startISO, endISO],
    ).data
}

export function useCompletionHistory(startISO: string, endISO: string): Record<string, number> {
    return useSupabaseQuery(
        async () => {
            const map = await getCompletionHistory(startISO, endISO)
            return Object.fromEntries(map)
        },
        {} as Record<string, number>,
        ['completion_records'],
        [startISO, endISO],
    ).data
}

export function useRecentCompletions(limit = 5): Array<{ taskId: string; completedAt: string }> {
    return useSupabaseQuery(
        async () => {
            const records = await plannerGetCompletionRecordsByDateRange('0000-01-01', '9999-12-31')
            return records
                .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
                .slice(0, limit)
                .map(r => ({ taskId: r.taskId, completedAt: r.completedAt }))
        },
        [],
        ['completion_records'],
        [limit],
    ).data
}
