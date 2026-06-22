/**
 * Habit Queries — Supabase-first
 *
 * Planner habits için Supabase CRUD fonksiyonları.
 * Streak hesaplama ve günlük/haftalık progress.
 */

import {
    plannerAddHabit,
    plannerDeleteHabit,
    plannerGetAllHabitLogs,
    plannerGetAllHabits,
    plannerGetHabitById,
    plannerGetHabitLogForDate,
    plannerGetHabitLogs,
    plannerGetHabitLogsByDate,
    plannerGetHabitLogsByHabitAndDateRange,
    plannerUpdateHabit,
    plannerUpsertHabitLog,
} from '@/lib/cloud/plannerRepo'
import { invalidateTables } from '@/lib/cloud/queryInvalidation'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'
import type {
    DBPlannerHabit,
    DBPlannerHabitLog,
    PlannerFrequencyRule,
    PlannerHabitType,
} from '../types'

// ============================================
// Helper Functions (pure — no DB access)
// ============================================

function isHabitDueOnDate(habit: DBPlannerHabit, dateISO: string): boolean {
    const date = new Date(dateISO)
    const dayOfWeek = date.getDay()

    switch (habit.frequency.type) {
        case 'weeklyTarget':
            return true
        case 'specificDays':
            return habit.frequency.days?.includes(dayOfWeek) ?? false
        case 'everyXDays': {
            const startDate = new Date(habit.createdAt)
            const diffTime = date.getTime() - startDate.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            const interval = habit.frequency.interval ?? 1
            return diffDays >= 0 && diffDays % interval === 0
        }
        default:
            return true
    }
}

export function computeStreakFromLogs(
    today: string,
    sortedAscLogs: DBPlannerHabitLog[]
): { currentStreak: number; longestStreak: number } {
    if (sortedAscLogs.length === 0) {
        return { currentStreak: 0, longestStreak: 0 }
    }

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 1
    let expectedDate = today

    for (let i = sortedAscLogs.length - 1; i >= 0; i--) {
        const log = sortedAscLogs[i]
        if (log.dateISO === expectedDate) {
            currentStreak++
            const d = new Date(expectedDate)
            d.setDate(d.getDate() - 1)
            expectedDate = d.toISOString().slice(0, 10)
        } else if (log.dateISO < expectedDate) {
            break
        }
    }

    for (let i = 0; i < sortedAscLogs.length; i++) {
        if (i === 0) { tempStreak = 1; continue }
        const diffDays = Math.floor(
            (new Date(sortedAscLogs[i].dateISO).getTime() - new Date(sortedAscLogs[i - 1].dateISO).getTime())
            / 86400000
        )
        if (diffDays === 1) {
            tempStreak++
        } else {
            longestStreak = Math.max(longestStreak, tempStreak)
            tempStreak = 1
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    return { currentStreak, longestStreak }
}

// ============================================
// Query Functions
// ============================================

export async function getAllHabits(): Promise<DBPlannerHabit[]> {
    return plannerGetAllHabits()
}

export async function getActiveHabits(): Promise<DBPlannerHabit[]> {
    const habits = await plannerGetAllHabits()
    return habits.filter(h => !h.isArchived)
}

export async function getArchivedHabits(): Promise<DBPlannerHabit[]> {
    const habits = await plannerGetAllHabits()
    return habits.filter(h => h.isArchived)
}

export async function getHabitById(id: string): Promise<DBPlannerHabit | undefined> {
    return plannerGetHabitById(id)
}

export async function getHabitLogs(habitId: string): Promise<DBPlannerHabitLog[]> {
    return plannerGetHabitLogs(habitId)
}

export async function getHabitLogForDate(
    habitId: string,
    dateISO: string
): Promise<DBPlannerHabitLog | undefined> {
    return plannerGetHabitLogForDate(habitId, dateISO)
}

export async function getHabitLogsByDate(dateISO: string): Promise<DBPlannerHabitLog[]> {
    return plannerGetHabitLogsByDate(dateISO)
}

export async function getTodayHabitsWithStatus(): Promise<Array<{
    habit: DBPlannerHabit
    isDueToday: boolean
    isCompletedToday: boolean
    todayLog: DBPlannerHabitLog | undefined
    currentStreak: number
    longestStreak: number
}>> {
    const today = new Date().toISOString().slice(0, 10)
    const habits = await getActiveHabits()
    if (habits.length === 0) return []

    const [allLogs, todayLogs] = await Promise.all([
        plannerGetAllHabitLogs(),
        plannerGetHabitLogsByDate(today),
    ])

    const doneLogsByHabit = new Map<string, DBPlannerHabitLog[]>()
    for (const log of allLogs.filter(l => l.done)) {
        const bucket = doneLogsByHabit.get(log.habitId)
        if (bucket) {
            bucket.push(log)
        } else {
            doneLogsByHabit.set(log.habitId, [log])
        }
    }

    const todayLogsMap = new Map(todayLogs.map(l => [l.habitId, l]))

    return habits.map(habit => {
        const doneLogs = doneLogsByHabit.get(habit.id) ?? []
        const todayLog = todayLogsMap.get(habit.id)
        const isDueToday = isHabitDueOnDate(habit, today)
        const isCompletedToday = todayLog?.done ?? false
        const { currentStreak, longestStreak } = computeStreakFromLogs(today, doneLogs)
        return { habit, isDueToday, isCompletedToday, todayLog, currentStreak, longestStreak }
    })
}

export async function getHabitWeeklyProgress(habitId: string): Promise<{
    done: number
    target: number
}> {
    const habit = await getHabitById(habitId)
    if (!habit) return { done: 0, target: 7 }

    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const startISO = monday.toISOString().slice(0, 10)
    const endISO = sunday.toISOString().slice(0, 10)

    const logs = await plannerGetHabitLogsByHabitAndDateRange(habitId, startISO, endISO)
    const doneLogs = logs.filter(l => l.done)

    let target = 7
    if (habit.frequency.type === 'weeklyTarget') {
        target = habit.frequency.timesPerWeek ?? 7
    } else if (habit.frequency.type === 'specificDays') {
        target = habit.frequency.days?.length ?? 7
    }

    return { done: doneLogs.length, target }
}

// ============================================
// Mutation Functions
// ============================================

const HABIT_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e',
]

export async function addHabit(data: {
    title: string
    type: PlannerHabitType
    frequency: PlannerFrequencyRule
    description?: string
    emoji?: string
    icon?: string
    target?: number
    unit?: string
    color?: string
}): Promise<string> {
    const existing = await getAllHabits()
    const id = await plannerAddHabit({
        title: data.title,
        description: data.description,
        emoji: data.emoji ?? '✨',
        icon: data.icon,
        type: data.type,
        target: data.target,
        unit: data.unit,
        color: data.color ?? HABIT_COLORS[existing.length % HABIT_COLORS.length],
        frequency: data.frequency,
        isArchived: false,
    }, existing.length)
    invalidateTables(['habits'])
    return id
}

export async function updateHabit(
    id: string,
    updates: Partial<Omit<DBPlannerHabit, 'id' | 'createdAt'>>
): Promise<void> {
    await plannerUpdateHabit(id, updates)
    invalidateTables(['habits'])
}

export async function deleteHabit(id: string): Promise<void> {
    await plannerDeleteHabit(id)
    invalidateTables(['habits', 'habit_logs'])
}

export async function archiveHabit(id: string): Promise<void> {
    await updateHabit(id, { isArchived: true })
}

export async function unarchiveHabit(id: string): Promise<void> {
    await updateHabit(id, { isArchived: false })
}

export async function logHabit(
    habitId: string,
    dateISO: string,
    done = true,
    value?: number
): Promise<void> {
    await plannerUpsertHabitLog({ habitId, dateISO, done, value })
    invalidateTables(['habit_logs'])
}

export async function toggleHabitToday(habitId: string): Promise<boolean> {
    const today = new Date().toISOString().slice(0, 10)
    const existingLog = await getHabitLogForDate(habitId, today)
    const newDone = !(existingLog?.done ?? false)
    await logHabit(habitId, today, newDone)
    return newDone
}

export async function reorderHabits(orderedIds: string[]): Promise<void> {
    await Promise.all(
        orderedIds.map((id, idx) => plannerUpdateHabit(id, { order: idx }))
    )
    invalidateTables(['habits'])
}

// ============================================
// React Hooks
// ============================================

export function useHabits(): DBPlannerHabit[] {
    return useSupabaseQuery(getAllHabits, [], ['habits'], []).data
}

export function useActiveHabits(): DBPlannerHabit[] {
    return useSupabaseQuery(getActiveHabits, [], ['habits'], []).data
}

export function useHabit(id: string): DBPlannerHabit | undefined {
    return useSupabaseQuery(
        () => getHabitById(id),
        undefined,
        ['habits'],
        [id],
    ).data
}

export function useTodayHabitsWithStatus() {
    return useSupabaseQuery(
        getTodayHabitsWithStatus,
        [],
        ['habits', 'habit_logs'],
        [],
    ).data
}

export function useHabitLogs(habitId: string): DBPlannerHabitLog[] {
    return useSupabaseQuery(
        () => getHabitLogs(habitId),
        [],
        ['habit_logs'],
        [habitId],
    ).data
}

export function useHabitWeeklyProgress(habitId: string) {
    return useSupabaseQuery(
        () => getHabitWeeklyProgress(habitId),
        { done: 0, target: 7 },
        ['habit_logs'],
        [habitId],
    ).data
}

async function getHabitWithStats(habitId: string) {
    const [habit, logs] = await Promise.all([
        plannerGetHabitById(habitId),
        plannerGetHabitLogs(habitId),
    ])
    if (!habit) return null

    const today = new Date().toISOString().slice(0, 10)
    const doneLogs = logs.filter(l =>
        l.done || (habit.type === 'numeric' && l.value !== undefined && l.value >= (habit.target ?? 0))
    )
    const { currentStreak, longestStreak } = computeStreakFromLogs(today, doneLogs)
    const totalCompletions = doneLogs.length
    const score = Math.min(100, Math.round((currentStreak / 30) * 100))
    const todayLog = logs.find(l => l.dateISO === today)

    return { habit, currentStreak, longestStreak, totalCompletions, score, todayLog }
}

export function useHabitWithStats(habitId: string) {
    return useSupabaseQuery(
        () => getHabitWithStats(habitId),
        null,
        ['habits', 'habit_logs'],
        [habitId],
    ).data
}

export function useHabitLogsInRange(startISO: string, endISO: string): DBPlannerHabitLog[] {
    return useSupabaseQuery(
        async () => {
            const allLogs = await plannerGetAllHabitLogs()
            return allLogs.filter(l => l.dateISO >= startISO && l.dateISO <= endISO)
        },
        [],
        ['habit_logs'],
        [startISO, endISO],
    ).data
}
