/**
 * Goal Queries — Supabase-first
 *
 * Goal tablosuna yönelik hooks, ilerleme hesaplama ve async sorgular.
 */

import { invalidateTables } from '@/lib/cloud/queryInvalidation';
import {
    trackerCreateGoal,
    trackerDeleteGoal,
    trackerGetEnabledGoals,
    trackerGetGoalsForActivity,
    trackerGetSessionsByDateRange,
    trackerUpdateGoal
} from '@/lib/cloud/trackerRepo';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';
import type { Goal, GoalScope } from '../types';

// ============================================
// Tarih Aralığı Yardımcıları
// ============================================

/** Scope'a göre başlangıç/bitiş dateKey döner */
export function getScopeRange(scope: GoalScope, referenceDate?: string): { start: string; end: string } {
    const ref = referenceDate ? new Date(referenceDate) : new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    switch (scope) {
        case 'daily': {
            const key = fmt(ref)
            return { start: key, end: key }
        }
        case 'weekly': {
            const day = ref.getDay() === 0 ? 6 : ref.getDay() - 1 // Mon=0
            const start = new Date(ref)
            start.setDate(ref.getDate() - day)
            const end = new Date(start)
            end.setDate(start.getDate() + 6)
            return { start: fmt(start), end: fmt(end) }
        }
        case 'monthly': {
            const start = new Date(ref.getFullYear(), ref.getMonth(), 1)
            const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0)
            return { start: fmt(start), end: fmt(end) }
        }
        case 'yearly': {
            const y = ref.getFullYear()
            return { start: `${y}-01-01`, end: `${y}-12-31` }
        }
    }
}

// ============================================
// Async Queries
// ============================================

/** Etkin hedefleri getirir */
export async function getEnabledGoals(): Promise<Goal[]> {
    return trackerGetEnabledGoals()
}

/** Aktiviteye bağlı etkin hedefleri getirir */
export async function getGoalsForActivity(activityId: string): Promise<Goal[]> {
    return trackerGetGoalsForActivity(activityId)
}

/** Bir hedefin ilerleme yüzdesini hesaplar (0–100+) */
export async function computeGoalProgress(goal: Goal): Promise<number> {
    if (goal.metric !== 'time') return 0

    const range = getScopeRange(goal.scope)
    const sessions = await trackerGetSessionsByDateRange(range.start, range.end)

    let totalSec = 0
    if (goal.activityId) {
        totalSec = sessions
            .filter(s => s.activityId === goal.activityId)
            .reduce((acc, s) => acc + s.durationSec, 0)
    } else {
        totalSec = sessions.reduce((acc, s) => acc + s.durationSec, 0)
    }

    return goal.targetValue > 0
        ? Math.round((totalSec / goal.targetValue) * 100)
        : 0
}

/** Tüm hedeflerin ilerlemesini toplu hesaplar */
export async function getGoalsWithProgress(): Promise<
    Array<{ goal: Goal; progressPercent: number; achievedSec: number }>
> {
    const goals = await trackerGetEnabledGoals()
    if (goals.length === 0) return []

    // Group goals by scope so each unique scope range is queried only once
    const scopeGoals = new Map<GoalScope, Goal[]>()
    for (const goal of goals) {
        const bucket = scopeGoals.get(goal.scope) ?? []
        bucket.push(goal)
        scopeGoals.set(goal.scope, bucket)
    }

    const scopeActivityTotals = new Map<GoalScope, Map<string, number>>()
    const scopeGrandTotals = new Map<GoalScope, number>()

    for (const scope of scopeGoals.keys()) {
        const range = getScopeRange(scope)
        const sessions = await trackerGetSessionsByDateRange(range.start, range.end)

        const activityTotals = new Map<string, number>()
        let grandTotal = 0
        for (const s of sessions) {
            activityTotals.set(s.activityId, (activityTotals.get(s.activityId) ?? 0) + s.durationSec)
            grandTotal += s.durationSec
        }

        scopeActivityTotals.set(scope, activityTotals)
        scopeGrandTotals.set(scope, grandTotal)
    }

    return goals.map(goal => {
        let achievedSec = 0
        if (goal.metric === 'time') {
            const activityTotals = scopeActivityTotals.get(goal.scope)!
            achievedSec = goal.activityId
                ? (activityTotals.get(goal.activityId) ?? 0)
                : (scopeGrandTotals.get(goal.scope) ?? 0)
        }

        const progressPercent = goal.targetValue > 0
            ? Math.round((achievedSec / goal.targetValue) * 100)
            : 0

        return { goal, progressPercent, achievedSec }
    })
}

// ============================================
// Goal CRUD
// ============================================

export async function createGoal(
    goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const id = await trackerCreateGoal(goal)
    invalidateTables(['goals'])
    return id
}

export async function updateGoal(
    id: string,
    changes: Partial<Omit<Goal, 'id' | 'createdAt'>>
): Promise<void> {
    await trackerUpdateGoal(id, changes)
    invalidateTables(['goals'])
}

export async function deleteGoal(id: string): Promise<void> {
    await trackerDeleteGoal(id)
    invalidateTables(['goals'])
}

// ============================================
// React Hooks
// ============================================

/** Hook: Etkin hedefler (canlı) */
export function useEnabledGoals(): Goal[] {
    return useSupabaseQuery(
        trackerGetEnabledGoals,
        [],
        ['goals'],
        [],
    ).data
}

/** Hook: Aktivite hedefleri (canlı) */
export function useGoalsForActivity(activityId: string | null): Goal[] {
    return useSupabaseQuery(
        () => activityId ? trackerGetGoalsForActivity(activityId) : Promise.resolve([]),
        [],
        ['goals'],
        [activityId],
    ).data
}

/** Hook: Tüm hedefler ilerleme ile (canlı) */
export function useGoalsWithProgress() {
    return useSupabaseQuery(
        getGoalsWithProgress,
        [] as Array<{ goal: Goal; progressPercent: number; achievedSec: number }>,
        ['goals', 'sessions'],
        [],
    ).data
}
