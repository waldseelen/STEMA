/**
 * timerService — Timer İş Mantığı (Supabase-first)
 *
 * trackerRepo üzerindeki tüm timer CRUD operasyonlarını kapsüller.
 * Bileşenler doğrudan DB'ye yazmaz; timerService'i çağırır.
 *
 * Davranış:
 *   startTimer  → RunningTimer oluştur; multitaskingEnabled=false ise diğerleri durdur
 *   stopTimer   → TimeSession oluştur, RunningTimer sil
 *   pauseTimer  → pausedAt + accumulatedSec
 *   resumeTimer → pausedAt sil, startedAt = now
 */

import type { RunningTimer } from '@/db/types'
import { invalidateTables } from '@/lib/cloud/queryInvalidation'
import {
    trackerCreateRunningTimer,
    trackerCreateSession,
    trackerDeleteRunningTimer,
    trackerGetRunningTimerForActivity,
    trackerGetRunningTimers,
    trackerUpdateRunningTimer,
} from '@/lib/cloud/trackerRepo'
import { useSettingsStore } from '@/modules/settings/store/settingsStore'

// ============================================
// Yardımcılar
// ============================================

/** Local YYYY-MM-DD */
function localDateKey(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

/**
 * Aktif bir timer'ın milisaniye cinsinden birikmiş süresini hesaplar.
 * Duraklatılmışsa accumulatedSec sabit tutulur.
 */
function computeAccumulatedSec(timer: RunningTimer, nowMs: number): number {
    if (timer.pausedAt != null) {
        return timer.accumulatedSec
    }
    return timer.accumulatedSec + Math.floor((nowMs - timer.startedAt) / 1000)
}

/** rolloverHour ayarını settingsStore'dan okur (varsayılan 4) */
function getRolloverHour(): number {
    return useSettingsStore.getState().rolloverHour
}

/** multitaskingEnabled ayarını settingsStore'dan okur (varsayılan false) */
function getMultitaskingEnabled(): boolean {
    return useSettingsStore.getState().multitaskingEnabled
}

/**
 * Verilen Unix timestamp'i rolloverHour'a göre dateKey'e çevirir.
 * Saat rolloverHour'dan küçükse önceki güne sayılır.
 */
function timestampToDateKey(timestampMs: number, rolloverHour: number): string {
    const d = new Date(timestampMs)
    if (d.getHours() < rolloverHour) {
        d.setDate(d.getDate() - 1)
    }
    return localDateKey(d)
}

// ============================================
// Timer Operasyonları
// ============================================

/**
 * Bir aktivite için timer başlatır.
 * - `multitaskingEnabled` false ise tüm çalışan timer'lar önce durdurulur.
 * - Aynı aktivite için zaten timer çalışıyorsa no-op (idempotent).
 */
export async function startTimer(activityId: string): Promise<void> {
    const now = Date.now()
    const multitaskingEnabled = getMultitaskingEnabled()

    // Aynı aktivitede zaten timer var mı?
    const existing = await trackerGetRunningTimerForActivity(activityId)
    if (existing) return

    // Multitasking kapalıysa çalışan diğer timer'ları durdur
    if (!multitaskingEnabled) {
        const others = await trackerGetRunningTimers()
        for (const other of others) {
            await stopTimer(other.id)
        }
    }

    await trackerCreateRunningTimer({
        activityId,
        startedAt: now,
        accumulatedSec: 0,
        mode: 'normal',
        createdAt: now,
    })

    invalidateTables(['running_timers', 'time_sessions'])
}

/**
 * Timer'ı durdurur ve bir TimeSession kaydı oluşturur.
 * @returns Oluşturulan TimeSession'ın id'si; timer bulunamazsa `null`.
 */
export async function stopTimer(timerId: string): Promise<string | null> {
    const timers = await trackerGetRunningTimers()
    const timer = timers.find(t => t.id === timerId)
    if (!timer) return null

    const now = Date.now()
    const rolloverHour = getRolloverHour()
    const durationSec = computeAccumulatedSec(timer, now)

    // 1 saniyeden kısa session'ları kaydetme
    if (durationSec < 1) {
        await trackerDeleteRunningTimer(timerId)
        invalidateTables(['running_timers'])
        return null
    }

    const startAt = timer.createdAt          // Timer oluşturulma zamanı = session başlangıcı
    const endAt = now
    const dateKey = timestampToDateKey(startAt, rolloverHour)

    const sessionId = await trackerCreateSession({
        activityId: timer.activityId,
        startAt,
        endAt,
        durationSec,
        note: '',
        dateKey,
        mergedFromIds: [],
    })

    await trackerDeleteRunningTimer(timerId)
    invalidateTables(['time_sessions', 'running_timers'])
    return sessionId
}

/**
 * Timer'ı duraklatır.
 * accumulatedSec güncellenir, pausedAt set edilir.
 */
export async function pauseTimer(timerId: string): Promise<void> {
    const timers = await trackerGetRunningTimers()
    const timer = timers.find(t => t.id === timerId)
    if (!timer || timer.pausedAt != null) return  // Zaten duraklatılmış

    const now = Date.now()
    const accumulated = timer.accumulatedSec + Math.floor((now - timer.startedAt) / 1000)

    await trackerUpdateRunningTimer(timerId, {
        pausedAt: now,
        accumulatedSec: accumulated,
    })

    invalidateTables(['running_timers'])
}

/**
 * Duraklatılmış timer'ı devam ettirir.
 * startedAt = now, pausedAt = undefined, accumulatedSec değişmez.
 */
export async function resumeTimer(timerId: string): Promise<void> {
    const timers = await trackerGetRunningTimers()
    const timer = timers.find(t => t.id === timerId)
    if (!timer || timer.pausedAt == null) return  // Zaten çalışıyor

    const now = Date.now()

    await trackerUpdateRunningTimer(timerId, {
        startedAt: now,
        pausedAt: undefined,
    })

    invalidateTables(['running_timers'])
}

/**
 * Pomodoro oturumu tamamlandığında doğrudan bir TimeSession kaydeder.
 * RunningTimer gerektirmez — Pomodoro kendi zamanlayıcısını yönetir.
 */
export async function savePomodoroSession(
    activityId: string,
    durationSec: number,
    startAt: number,
): Promise<string> {
    const now = Date.now()
    const rolloverHour = getRolloverHour()
    const dateKey = timestampToDateKey(startAt, rolloverHour)

    const sessionId = await trackerCreateSession({
        activityId,
        startAt,
        endAt: now,
        durationSec,
        note: 'pomodoro',
        dateKey,
        mergedFromIds: [],
    })

    invalidateTables(['time_sessions'])
    return sessionId
}
