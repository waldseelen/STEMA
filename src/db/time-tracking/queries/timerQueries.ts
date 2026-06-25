/**
 * Timer Queries — Supabase-first
 *
 * RunningTimer tablosuna yönelik hooks ve async sorgular.
 */

import {
    trackerGetRunningTimerForActivity,
    trackerGetRunningTimers,
} from '@/lib/cloud/trackerRepo'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'
import type { RunningTimer } from '../types'

// ============================================
// Async Queries
// ============================================

/** Tüm aktif (çalışan/duraklatılmış) timer'ları getirir */
export async function getRunningTimers(): Promise<RunningTimer[]> {
    return trackerGetRunningTimers()
}

/** Belirli bir aktivitenin çalışan timer'ını getirir */
export async function getRunningTimerForActivity(
    activityId: string
): Promise<RunningTimer | undefined> {
    return trackerGetRunningTimerForActivity(activityId)
}

/** Toplam kaç timer çalışıyor */
export async function getRunningTimerCount(): Promise<number> {
    const timers = await trackerGetRunningTimers()
    return timers.length
}

// ============================================
// Timer Hesaplama Yardımcıları
// ============================================

/**
 * Bir timer'ın o anki toplam geçen süresini saniye cinsinden hesaplar.
 * Duraklatılmış timer'lar için accumulatedSec kullanılır.
 */
export function computeElapsedSec(timer: RunningTimer, nowMs?: number): number {
    const now = nowMs ?? Date.now()
    if (timer.pausedAt != null) {
        // Durdurulmuş: birikmiş süre sabit
        return timer.accumulatedSec
    }
    // Çalışıyor: son başlangıçtan bu yana geçen süre + birikmiş
    const runningMs = now - timer.startedAt
    return timer.accumulatedSec + Math.floor(runningMs / 1000)
}

/**
 * Saniyeyi HH:MM:SS formatına çevirir
 */
export function formatDuration(totalSec: number): string {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ============================================
// React Hooks
// ============================================

/** Hook: Tüm çalışan timer'lar (canlı) */
export function useRunningTimers(): RunningTimer[] {
    return useSupabaseQuery(
        trackerGetRunningTimers,
        [],
        ['running_timers'],
        [],
    ).data
}

/** Hook: Belirli aktivitenin timer'ı (canlı) */
export function useRunningTimerForActivity(
    activityId: string | null
): RunningTimer | undefined {
    return useSupabaseQuery(
        () => activityId ? trackerGetRunningTimerForActivity(activityId) : Promise.resolve(undefined),
        undefined,
        ['running_timers'],
        [activityId],
    ).data
}

/** Hook: Çalışan timer sayısı (canlı) */
export function useRunningTimerCount(): number {
    return useSupabaseQuery(
        getRunningTimerCount,
        0,
        ['running_timers'],
        [],
    ).data
}
