/**
 * Session Queries — Supabase-first
 *
 * TimeSession tablosuna yönelik hooks ve async sorgular.
 */

import { invalidateTables } from '@/lib/cloud/queryInvalidation'
import {
    trackerCreateSession,
    trackerDeleteSession,
    trackerGetSessionById,
    trackerGetSessionsByActivity,
    trackerGetSessionsByDate,
    trackerGetSessionsByDateRange,
    trackerUpdateSession,
} from '@/lib/cloud/trackerRepo'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'
import type { TimeSession } from '../types'

// ============================================
// Tarih Yardımcıları
// ============================================

/** Bugünün dateKey'ini döner (YYYY-MM-DD) */
export function todayDateKey(): string {
    return new Date().toISOString().slice(0, 10)
}

// ============================================
// Async Queries
// ============================================

/** Belirli tarih için session'ları getirir */
export async function getSessionsByDate(dateKey: string): Promise<TimeSession[]> {
    return trackerGetSessionsByDate(dateKey)
}

/** Tarih aralığındaki session'ları getirir */
export async function getSessionsByDateRange(
    startISO: string,
    endISO: string
): Promise<TimeSession[]> {
    return trackerGetSessionsByDateRange(startISO, endISO)
}

/** Belirli aktivitenin session'larını getirir */
export async function getSessionsByActivity(
    activityId: string,
    startISO?: string,
    endISO?: string
): Promise<TimeSession[]> {
    return trackerGetSessionsByActivity(activityId, startISO, endISO)
}

/** Belirli tarih aralığında birden fazla aktivitenin session'larını getirir */
export async function getSessionsByActivitiesAndDateRange(
    activityIds: string[],
    startISO: string,
    endISO: string
): Promise<TimeSession[]> {
    const all = await trackerGetSessionsByDateRange(startISO, endISO)
    const idSet = new Set(activityIds)
    return all.filter(s => idSet.has(s.activityId))
}

/** Tek session id ile getirir */
export async function getSessionById(id: string): Promise<TimeSession | undefined> {
    return trackerGetSessionById(id)
}

/** Bugünün session'larını getirir */
export async function getTodaySessions(): Promise<TimeSession[]> {
    return trackerGetSessionsByDate(todayDateKey())
}

// ============================================
// Session CRUD
// ============================================

/** Yeni session oluşturur */
export async function createSession(
    session: Omit<TimeSession, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const id = await trackerCreateSession(session)
    invalidateTables(['sessions'])
    return id
}

/** Session günceller */
export async function updateSession(
    id: string,
    changes: Partial<Omit<TimeSession, 'id' | 'createdAt'>>
): Promise<void> {
    await trackerUpdateSession(id, changes)
    invalidateTables(['sessions'])
}

/** Session siler */
export async function deleteSession(id: string): Promise<void> {
    await trackerDeleteSession(id)
    invalidateTables(['sessions'])
}

// ============================================
// React Hooks
// ============================================

/** Hook: Belirli tarih session'ları (canlı) */
export function useSessionsByDate(dateKey: string): TimeSession[] {
    return useSupabaseQuery(
        () => trackerGetSessionsByDate(dateKey),
        [],
        ['sessions'],
        [dateKey],
    ).data
}

/** Hook: Tarih aralığı session'ları (canlı) */
export function useSessionsByDateRange(startISO: string, endISO: string): TimeSession[] {
    return useSupabaseQuery(
        () => trackerGetSessionsByDateRange(startISO, endISO),
        [],
        ['sessions'],
        [startISO, endISO],
    ).data
}

/** Hook: Bugünün session'ları (canlı) */
export function useTodaySessions(): TimeSession[] {
    const today = todayDateKey()
    return useSupabaseQuery(
        () => trackerGetSessionsByDate(today),
        [],
        ['sessions'],
        [today],
    ).data
}

/** Hook: Belirli aktivite session'ları, tarih aralığında (canlı) */
export function useSessionsByActivity(
    activityId: string | null,
    startISO?: string,
    endISO?: string
): TimeSession[] {
    return useSupabaseQuery(
        () => activityId
            ? trackerGetSessionsByActivity(activityId, startISO, endISO)
            : Promise.resolve([]),
        [],
        ['sessions'],
        [activityId, startISO, endISO],
    ).data
}
