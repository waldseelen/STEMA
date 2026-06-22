/**
 * Plan.Ex - Form Validation Schemas
 *
 * Form girdileri için Zod validation şemaları.
 * User-friendly error mesajları ile.
 */

import { VALIDATION } from '@/config/constants'
import { translateCurrentLocale } from '@/i18n'
import { z } from 'zod'

// ============================================
// Error Messages (Turkish)
// ============================================

const errorMessages = {
    required: 'Bu alan zorunludur',
    minLength: (min: number) => `En az ${min} karakter olmalıdır`,
    maxLength: (max: number) => `En fazla ${max} karakter olmalıdır`,
    positive: 'Pozitif bir sayı olmalıdır',
    min: (min: number) => `En az ${min} olmalıdır`,
    max: (max: number) => `En fazla ${max} olmalıdır`,
    invalidFormat: 'Geçersiz format',
    invalidColor: 'Geçersiz renk kodu',
    invalidDate: 'Geçersiz tarih',
    invalidTime: 'Geçersiz saat',
}

// ============================================
// Base Field Schemas
// ============================================

/** İsim alanı (aktivite, habit, kategori vb.) */
export const nameSchema = z
    .string()
    .min(VALIDATION.MIN_NAME_LENGTH, errorMessages.required)
    .max(VALIDATION.MAX_NAME_LENGTH, errorMessages.maxLength(VALIDATION.MAX_NAME_LENGTH))
    .transform(val => val.trim())

/** Açıklama/not alanı */
export const noteSchema = z
    .string()
    .max(2000, errorMessages.maxLength(2000))
    .transform(val => val.trim())
    .optional()
    .or(z.literal(''))

/** Renk kodu (#RRGGBB formatı) */
export const colorSchema = z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, errorMessages.invalidColor)
    .optional()

/** Emoji veya Lucide ikon adı */
export const iconSchema = z
    .string()
    .max(64)
    .optional()

/** Pozitif sayı */
export const positiveNumberSchema = z
    .number()
    .positive(errorMessages.positive)

/** Tarih key (YYYY-MM-DD) */
export const dateKeySchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, errorMessages.invalidDate)

/** Saat (HH:MM) */
export const timeSchema = z
    .string()
    .regex(/^\d{2}:\d{2}$/, errorMessages.invalidTime)

// ============================================
// Activity Form Schema
// ============================================

export const activityFormSchema = z.object({
    name: nameSchema,
    categoryId: z.string().nullable().optional(),
    color: colorSchema,
    icon: iconSchema,
    description: noteSchema,
})

export type ActivityFormData = z.infer<typeof activityFormSchema>

// ============================================
// Category Form Schema
// ============================================

export const categoryFormSchema = z.object({
    name: nameSchema,
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, errorMessages.invalidColor),
    icon: iconSchema,
})

export type CategoryFormData = z.infer<typeof categoryFormSchema>

// ============================================
// Habit Form Schema
// ============================================

export const habitFormSchema = z.object({
    name: nameSchema,

    type: z.enum(['boolean', 'numeric']),

    frequency: z.enum(['daily', 'weekly', 'custom']),

    // Numeric habit için
    minTarget: z
        .number()
        .min(0, errorMessages.min(0))
        .max(99999, errorMessages.max(99999))
        .optional(),

    unit: z
        .string()
        .max(20, errorMessages.maxLength(20))
        .optional(),

    // Weekly/Custom için hedef günler
    targetDays: z
        .array(z.number().min(0).max(6))
        .optional(),

    categoryId: z.string().nullable().optional(),

    // Reminder
    reminderEnabled: z.boolean().optional(),
    reminderTime: timeSchema.optional(),

    note: noteSchema,
})

export type HabitFormData = z.infer<typeof habitFormSchema>

// ============================================
// Time Session Form Schema
// ============================================

export const timeSessionFormSchema = z.object({
    activityId: z.string().min(1, errorMessages.required),

    startAt: z
        .number()
        .positive(errorMessages.positive),

    endAt: z
        .number()
        .positive(errorMessages.positive),

    note: noteSchema,
}).refine(data => data.endAt > data.startAt, {
    message: translateCurrentLocale('tracker', 'validation.endAfterStart'),
    path: ['endAt'],
})

export type TimeSessionFormData = z.infer<typeof timeSessionFormSchema>

// ============================================
// Rule Form Schema
// ============================================

export const ruleConditionSchema = z.object({
    field: z.string().min(1, errorMessages.required),
    operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith']),
    value: z.union([z.string(), z.number(), z.boolean()]),
})

export const ruleActionSchema = z.object({
    type: z.enum(['NOTIFY', 'LOG_MESSAGE', 'START_TIMER', 'STOP_TIMER', 'TRIGGER_BREAK', 'UPDATE_GOAL', 'CHECK_HABIT']),
    params: z.record(z.string(), z.unknown()).optional(),
})

export const ruleFormSchema = z.object({
    name: nameSchema,
    trigger: z.string().min(1, errorMessages.required),
    conditions: z.array(ruleConditionSchema),
    actions: z.array(ruleActionSchema).min(1, 'En az bir aksiyon gereklidir'),
    enabled: z.boolean(),
})

export type RuleFormData = z.infer<typeof ruleFormSchema>

// ============================================
// Goal Form Schema
// ============================================

export const goalFormSchema = z.object({
    name: nameSchema,

    targetType: z.enum(['daily', 'weekly', 'monthly', 'total']),

    targetValue: z
        .number()
        .positive(errorMessages.positive)
        .max(86400, 'Günde maksimum 24 saat'),

    activityId: z.string().optional(),
    habitId: z.string().optional(),
    categoryId: z.string().optional(),

    startDate: dateKeySchema.optional(),
    endDate: dateKeySchema.optional(),
}).refine(data => {
    // En az bir target olmalı
    return data.activityId || data.habitId || data.categoryId
}, {
    message: 'Aktivite, alışkanlık veya kategori seçmelisiniz',
    path: ['activityId'],
})

export type GoalFormData = z.infer<typeof goalFormSchema>

// ============================================
// Settings Form Schemas
// ============================================

export const generalSettingsSchema = z.object({
    rolloverHour: z
        .number()
        .min(0, errorMessages.min(0))
        .max(23, errorMessages.max(23)),

    weekStart: z.union([z.literal(0), z.literal(1)]),

    language: z.enum(['tr', 'en']),

    theme: z.enum(['light', 'dark', 'system']),
})

export type GeneralSettingsData = z.infer<typeof generalSettingsSchema>

export const pomodoroSettingsSchema = z.object({
    workDuration: z
        .number()
        .min(1, errorMessages.min(1))
        .max(120, errorMessages.max(120)),

    shortBreakDuration: z
        .number()
        .min(1, errorMessages.min(1))
        .max(60, errorMessages.max(60)),

    longBreakDuration: z
        .number()
        .min(1, errorMessages.min(1))
        .max(120, errorMessages.max(120)),

    sessionsBeforeLongBreak: z
        .number()
        .min(1, errorMessages.min(1))
        .max(10, errorMessages.max(10)),

    autoStartBreaks: z.boolean(),
    autoStartWork: z.boolean(),
})

export type PomodoroSettingsData = z.infer<typeof pomodoroSettingsSchema>

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Form verisini doğrula
 *
 * @example
 * const result = validateForm(habitFormSchema, formData)
 * if (!result.success) {
 *   setErrors(result.errors)
 *   return
 * }
 * // result.data is typed and validated
 */
export function validateForm<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
    const result = schema.safeParse(data)

    if (result.success) {
        return { success: true, data: result.data }
    }

    // Hataları field bazlı objeye çevir
    const errors: Record<string, string> = {}

    for (const issue of result.error.issues) {
        const path = issue.path.join('.')
        if (!errors[path]) {
            errors[path] = issue.message
        }
    }

    return { success: false, errors }
}

/**
 * Tek bir alanı doğrula
 *
 * @example
 * const error = validateField(nameSchema, inputValue)
 * if (error) {
 *   setFieldError('name', error)
 * }
 */
export function validateField<T>(
    schema: z.ZodSchema<T>,
    value: unknown
): string | null {
    const result = schema.safeParse(value)

    if (result.success) {
        return null
    }

    return result.error.issues[0]?.message || translateCurrentLocale('common', 'validation.invalidValue')
}

/**
 * Tüm hataları formatla
 */
export function formatErrors(errors: Record<string, string>): string {
    return Object.entries(errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ')
}

// ============================================
// React Hook Form Integration
// ============================================

/**
 * Zod şemasından default değerler oluştur
 */
export function getDefaultValues<T extends z.ZodTypeAny>(
    schema: T,
    overrides: Partial<z.infer<T>> = {}
): z.infer<T> {
    const defaults: Record<string, unknown> = {}

    if (schema instanceof z.ZodObject) {
        const shape = schema.shape as Record<string, z.ZodTypeAny>

        for (const [key, fieldSchema] of Object.entries(shape)) {
            if (fieldSchema instanceof z.ZodDefault) {
                const defaultFn = fieldSchema._def.defaultValue as () => unknown
                defaults[key] = defaultFn()
            } else if (fieldSchema instanceof z.ZodOptional) {
                defaults[key] = undefined
            } else if (fieldSchema instanceof z.ZodString) {
                defaults[key] = ''
            } else if (fieldSchema instanceof z.ZodNumber) {
                defaults[key] = 0
            } else if (fieldSchema instanceof z.ZodBoolean) {
                defaults[key] = false
            } else if (fieldSchema instanceof z.ZodArray) {
                defaults[key] = []
            }
        }
    }

    return { ...defaults, ...overrides } as z.infer<T>
}

// ============================================
// Coercion Helpers
// ============================================

/**
 * String'i sayıya çevir (form input'ları için)
 */
export const coerceNumber = z.preprocess(
    (val) => {
        if (typeof val === 'string') {
            const parsed = parseFloat(val)
            return isNaN(parsed) ? undefined : parsed
        }
        return val
    },
    z.number()
)

/**
 * Checkbox değerini boolean'a çevir
 */
export const coerceBoolean = z.preprocess(
    (val) => {
        if (val === 'true' || val === '1' || val === 'on') return true
        if (val === 'false' || val === '0' || val === 'off' || val === '') return false
        return val
    },
    z.boolean()
)

// ============================================
// Profile Form Schema
// ============================================

export const studentStatusSchema = z.enum(['student', 'working', 'both', 'other'])

export const profileFormSchema = z.object({
    fullName: z
        .string()
        .min(1, errorMessages.required)
        .max(100, errorMessages.maxLength(100))
        .transform(val => val.trim()),

    occupation: z
        .string()
        .min(1, errorMessages.required)
        .max(100, errorMessages.maxLength(100))
        .transform(val => val.trim()),

    studentStatus: studentStatusSchema,

    school: z
        .string()
        .max(150, errorMessages.maxLength(150))
        .transform(val => val.trim())
        .optional()
        .or(z.literal('')),

    department: z
        .string()
        .max(150, errorMessages.maxLength(150))
        .transform(val => val.trim())
        .optional()
        .or(z.literal('')),

    grade: z
        .string()
        .max(20, errorMessages.maxLength(20))
        .transform(val => val.trim())
        .optional()
        .or(z.literal('')),
})

export type ProfileFormData = z.infer<typeof profileFormSchema>
