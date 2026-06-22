/**
 * Stats Queries — Supabase-first
 *
 * Aktivite istatistikleri, günlük/haftalık/dönemsel aggregate sorgular.
 * echarts bileşenlerine veri sağlar.
 */

import {
    trackerGetActiveActivities,
    trackerGetActiveCategories,
    trackerGetSessionsByDateRange,
} from '@/lib/cloud/trackerRepo'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'
import type { Activity } from '../../types'

// ============================================
// Tipler
// ============================================

export interface ActivityDuration {
    activityId: string
    activityName: string
    color: string
    totalSec: number
}

export interface DailyDuration {
    dateKey: string    // YYYY-MM-DD
    totalSec: number
}

export interface TagDuration {
    tagId: string
    totalSec: number
}

export interface StatsResult {
    byActivity: ActivityDuration[]
    byDay: DailyDuration[]
    byTag: TagDuration[]
    totalSec: number
    activeDays: number
    topActivity: ActivityDuration | null
}

const EMPTY_STATS: StatsResult = {
    byActivity: [],
    byDay: [],
    byTag: [],
    totalSec: 0,
    activeDays: 0,
    topActivity: null,
}

// ============================================
// Async Queries
// ============================================

/**
 * Verilen tarih aralığında aktivite başına toplam süreyi döner.
 * (Kept for backwards-compat with any external callers.)
 */
export async function getStatsByActivityAndRange(
    startISO: string,
    endISO: string
): Promise<ActivityDuration[]> {
    return (await getStatsForRange(startISO, endISO)).byActivity
}

/**
 * Günlük toplam süre — bar chart verisi
 * (Kept for backwards-compat with any external callers.)
 */
export async function getDailyDurations(
    startISO: string,
    endISO: string
): Promise<DailyDuration[]> {
    return (await getStatsForRange(startISO, endISO)).byDay
}

/**
 * Tarih aralığı için tam istatistik özeti.
 *
 * Single-pass: sessions are fetched once and used to compute
 * byActivity, byDay, byTag, totalSec, and activeDays in one loop.
 */
export async function getStatsForRange(startISO: string, endISO: string): Promise<StatsResult> {
    const [sessions, activities, categories] = await Promise.all([
        trackerGetSessionsByDateRange(startISO, endISO),
        trackerGetActiveActivities(),
        trackerGetActiveCategories(),
    ])

    if (sessions.length === 0) return { ...EMPTY_STATS }

    const activityMap = new Map<string, Activity>(activities.map(a => [a.id, a]))
    const colorMap = new Map<string, string>(categories.map(c => [c.id, c.color]))

    // Single pass over sessions
    const activityDurationMap = new Map<string, number>()
    const dayMap = new Map<string, number>()
    const tagMap = new Map<string, number>()

    for (const s of sessions) {
        // byActivity
        activityDurationMap.set(s.activityId, (activityDurationMap.get(s.activityId) ?? 0) + s.durationSec)
        // byDay
        dayMap.set(s.dateKey, (dayMap.get(s.dateKey) ?? 0) + s.durationSec)
        // byTag
        const tagIds = activityMap.get(s.activityId)?.tagIds ?? []
        for (const tagId of tagIds) {
            tagMap.set(tagId, (tagMap.get(tagId) ?? 0) + s.durationSec)
        }
    }

    // Build byActivity
    const byActivity: ActivityDuration[] = []
    for (const [activityId, totalSec] of activityDurationMap.entries()) {
        const activity = activityMap.get(activityId)
        byActivity.push({
            activityId,
            activityName: activity?.name ?? 'Bilinmeyen',
            color: activity?.color ?? (activity ? (colorMap.get(activity.categoryId) ?? '#6366f1') : '#6366f1'),
            totalSec,
        })
    }
    byActivity.sort((a, b) => b.totalSec - a.totalSec)

    // Build byDay
    const byDay: DailyDuration[] = Array.from(dayMap.entries())
        .map(([dateKey, totalSec]) => ({ dateKey, totalSec }))
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))

    // Build byTag
    const byTag: TagDuration[] = Array.from(tagMap.entries())
        .map(([tagId, totalSec]) => ({ tagId, totalSec }))

    const totalSec = byActivity.reduce((acc, a) => acc + a.totalSec, 0)
    const activeDays = byDay.filter(d => d.totalSec > 0).length
    const topActivity = byActivity.length > 0 ? byActivity[0] : null

    return { byActivity, byDay, byTag, totalSec, activeDays, topActivity }
}

// ============================================
// React Hooks
// ============================================

/** Hook: Aktivite bazlı süre (canlı) */
export function useStatsByActivity(startISO: string, endISO: string): ActivityDuration[] {
    return useSupabaseQuery(
        () => getStatsByActivityAndRange(startISO, endISO),
        [],
        ['sessions', 'activities', 'categories'],
        [startISO, endISO],
    ).data
}

/** Hook: Günlük süre (canlı) */
export function useDailyDurations(startISO: string, endISO: string): DailyDuration[] {
    return useSupabaseQuery(
        () => getDailyDurations(startISO, endISO),
        [],
        ['sessions'],
        [startISO, endISO],
    ).data
}

/** Hook: Tarih aralığı özet istatistik (canlı) */
export function useStatsForRange(startISO: string, endISO: string): StatsResult {
    return useSupabaseQuery(
        () => getStatsForRange(startISO, endISO),
        { ...EMPTY_STATS },
        ['sessions', 'activities', 'categories'],
        [startISO, endISO],
    ).data
}
