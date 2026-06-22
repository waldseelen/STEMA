/**
 * Plan.Ex - Zod Validation Şemaları
 *
 * Runtime'da veri doğrulaması için Zod şemaları.
 * Veritabanından veya dış kaynaklardan gelen verilerin
 * beklenen yapıda olduğunu garanti eder.
 */

import {
    EVENT_TYPES,
    HABIT_STATUS,
    RULE_ACTIONS,
    TIMER_MODES,
    VALIDATION
} from '@/config/constants'
import { z } from 'zod'

// ============================================
// Temel Şemalar
// ============================================

/** UUID formatında ID */
export const IdSchema = z.string().min(1).max(50)

/** Timestamp (milisaniye) */
export const TimestampSchema = z.number().int().positive()

/** Tarih anahtarı (YYYY-MM-DD formatı) */
export const DateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih formatı')

// ============================================
// Event Şemaları
// ============================================

/** Event tipi enum */
export const EventTypeSchema = z.enum([
    EVENT_TYPES.TIMER_STARTED,
    EVENT_TYPES.TIMER_STOPPED,
    EVENT_TYPES.TIMER_PAUSED,
    EVENT_TYPES.TIMER_RESUMED,
    EVENT_TYPES.SESSION_CREATED,
    EVENT_TYPES.SESSION_UPDATED,
    EVENT_TYPES.SESSION_DELETED,
    EVENT_TYPES.SESSION_MERGED,
    EVENT_TYPES.HABIT_CHECKED,
    EVENT_TYPES.HABIT_UNCHECKED,
    EVENT_TYPES.HABIT_SKIPPED,
    EVENT_TYPES.STREAK_UPDATED,
    EVENT_TYPES.POMODORO_STARTED,
    EVENT_TYPES.POMODORO_COMPLETED,
    EVENT_TYPES.POMODORO_STOPPED,
    EVENT_TYPES.POMODORO_BREAK_STARTED,
    EVENT_TYPES.GOAL_PROGRESS,
    EVENT_TYPES.GOAL_REACHED,
    EVENT_TYPES.DAY_ROLLOVER,
    EVENT_TYPES.DATA_SYNCED,
    EVENT_TYPES.APP_INITIALIZED,
])

/** Timer started event payload */
export const TimerStartedPayloadSchema = z.object({
    timerId: IdSchema,
    activityId: IdSchema,
    startedAt: TimestampSchema,
    mode: z.enum([TIMER_MODES.NORMAL, TIMER_MODES.POMODORO]),
})

/** Timer stopped event payload */
export const TimerStoppedPayloadSchema = z.object({
    timerId: IdSchema,
    activityId: IdSchema,
    durationSec: z.number().int().min(0),
    sessionId: IdSchema,
})

/** Session created event payload */
export const SessionCreatedPayloadSchema = z.object({
    session: z.object({
        id: IdSchema,
        activityId: IdSchema,
        startAt: TimestampSchema,
        endAt: TimestampSchema,
        durationSec: z.number().int().min(0),
        dateKey: DateKeySchema,
    }),
})

/** Habit checked event payload */
export const HabitCheckedPayloadSchema = z.object({
    habitId: IdSchema,
    dateKey: DateKeySchema,
    status: z.enum([HABIT_STATUS.DONE, HABIT_STATUS.SKIPPED]),
})

/** Pomodoro completed event payload */
export const PomodoroCompletedPayloadSchema = z.object({
    activityId: IdSchema,
    sessionsCompleted: z.number().int().min(1),
})

// ============================================
// Rule Şemaları
// ============================================

/** Rule action tipi */
export const RuleActionTypeSchema = z.enum([
    RULE_ACTIONS.NOTIFY,
    RULE_ACTIONS.LOG_MESSAGE,
    RULE_ACTIONS.START_TIMER,
    RULE_ACTIONS.STOP_TIMER,
    RULE_ACTIONS.TRIGGER_BREAK,
    RULE_ACTIONS.UPDATE_GOAL,
    RULE_ACTIONS.CHECK_HABIT,
])

/** Rule trigger tipi (event tipi ile aynı) */
export const RuleTriggerSchema = EventTypeSchema

/** Koşul operatörü */
export const ConditionOperatorSchema = z.enum([
    'eq',      // Eşit
    'neq',     // Eşit değil
    'gt',      // Büyük
    'gte',     // Büyük veya eşit
    'lt',      // Küçük
    'lte',     // Küçük veya eşit
    'contains', // İçerir
    'startsWith', // Başlar
    'endsWith',   // Biter
])

/** Rule condition şeması */
export const RuleConditionSchema = z.object({
    field: z.string().min(1),
    operator: ConditionOperatorSchema,
    value: z.union([z.string(), z.number(), z.boolean()]),
})

/** Rule action config şeması */
export const RuleActionConfigSchema = z.object({
    type: RuleActionTypeSchema,
    params: z.record(z.string(), z.unknown()).optional(),
})

/** Tam Rule şeması */
export const RuleSchema = z.object({
    id: IdSchema,
    name: z.string().min(VALIDATION.MIN_NAME_LENGTH).max(VALIDATION.MAX_NAME_LENGTH),
    trigger: RuleTriggerSchema,
    conditions: z.array(RuleConditionSchema),
    actions: z.array(RuleActionConfigSchema),
    enabled: z.union([z.literal(0), z.literal(1)]),
    createdAt: TimestampSchema.optional(),
    updatedAt: TimestampSchema.optional(),
})

// ============================================
// Activity & Session Şemaları
// ============================================

/** Activity şeması */
export const ActivitySchema = z.object({
    id: IdSchema,
    name: z.string().min(VALIDATION.MIN_NAME_LENGTH).max(VALIDATION.MAX_NAME_LENGTH),
    categoryId: IdSchema.nullable().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    archived: z.boolean(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
})

/** Time Session şeması */
export const TimeSessionSchema = z.object({
    id: IdSchema,
    activityId: IdSchema,
    startAt: TimestampSchema,
    endAt: TimestampSchema,
    durationSec: z.number().int().min(VALIDATION.MIN_SESSION_DURATION).max(VALIDATION.MAX_SESSION_DURATION),
    note: z.string().optional(),
    dateKey: DateKeySchema,
    mergedFromIds: z.array(IdSchema).optional(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
})

/** Running Timer şeması */
export const RunningTimerSchema = z.object({
    id: IdSchema,
    activityId: IdSchema,
    startedAt: TimestampSchema,
    pausedAt: TimestampSchema.optional(),
    accumulatedSec: z.number().int().min(0),
    mode: z.enum([TIMER_MODES.NORMAL, TIMER_MODES.POMODORO]),
    createdAt: TimestampSchema,
})

// ============================================
// Habit Şemaları
// ============================================

/** Habit şeması */
export const HabitSchema = z.object({
    id: IdSchema,
    name: z.string().min(VALIDATION.MIN_NAME_LENGTH).max(VALIDATION.MAX_NAME_LENGTH),
    categoryId: IdSchema.nullable().optional(),
    frequency: z.enum(['daily', 'weekly', 'custom']),
    targetDays: z.array(z.number().int().min(0).max(6)).optional(),
    archived: z.boolean(),
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema,
})

/** Habit Log şeması */
export const HabitLogSchema = z.object({
    id: IdSchema,
    habitId: IdSchema,
    dateKey: DateKeySchema,
    status: z.enum([HABIT_STATUS.DONE, HABIT_STATUS.SKIPPED, HABIT_STATUS.MISSED]),
    note: z.string().optional(),
    createdAt: TimestampSchema,
})

// ============================================
// Export/Import Şemaları
// ============================================

/** Export data şeması */
export const ExportDataSchema = z.object({
    version: z.number().int().positive(),
    exportedAt: TimestampSchema,
    data: z.object({
        activities: z.array(ActivitySchema).optional(),
        timeSessions: z.array(TimeSessionSchema).optional(),
        habits: z.array(HabitSchema).optional(),
        habitLogs: z.array(HabitLogSchema).optional(),
        rules: z.array(RuleSchema).optional(),
        settings: z.record(z.string(), z.unknown()).optional(),
    }),
})

// ============================================
// Validation Yardımcı Fonksiyonları
// ============================================

/**
 * Güvenli parse - hata fırlatmaz, sonuç döner
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
    const result = schema.safeParse(data)
    if (result.success) {
        return { success: true, data: result.data }
    }
    return { success: false, error: result.error }
}

/**
 * Validasyon hatalarını okunabilir mesaja çevir
 */
export function formatValidationError(error: z.ZodError): string {
    return error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
}

/**
 * Kural payload'ını doğrula
 */
export function validateRulePayload(trigger: string, payload: unknown): { valid: boolean; error?: string } {
    try {
        switch (trigger) {
            case EVENT_TYPES.TIMER_STARTED:
                TimerStartedPayloadSchema.parse(payload)
                break
            case EVENT_TYPES.TIMER_STOPPED:
                TimerStoppedPayloadSchema.parse(payload)
                break
            case EVENT_TYPES.SESSION_CREATED:
                SessionCreatedPayloadSchema.parse(payload)
                break
            case EVENT_TYPES.HABIT_CHECKED:
                HabitCheckedPayloadSchema.parse(payload)
                break
            case EVENT_TYPES.POMODORO_COMPLETED:
                PomodoroCompletedPayloadSchema.parse(payload)
                break
            default:
                // Diğer event'ler için genel obje validasyonu
                z.record(z.string(), z.unknown()).parse(payload)
        }
        return { valid: true }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, error: formatValidationError(error) }
        }
        return { valid: false, error: String(error) }
    }
}

// Type exports
export type Rule = z.infer<typeof RuleSchema>
export type Activity = z.infer<typeof ActivitySchema>
export type TimeSession = z.infer<typeof TimeSessionSchema>
export type RunningTimer = z.infer<typeof RunningTimerSchema>
export type Habit = z.infer<typeof HabitSchema>
export type HabitLog = z.infer<typeof HabitLogSchema>
export type ExportData = z.infer<typeof ExportDataSchema>
