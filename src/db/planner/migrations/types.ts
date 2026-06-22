/**
 * Migration Types
 *
 * localStorage -> Dexie migration için tip tanımları.
 */

import { z } from 'zod'

// ============================================
// Legacy Zustand Store Types
// ============================================

/**
 * Legacy Task (nested in Unit)
 */
export const LegacyTaskSchema = z.object({
    id: z.string(),
    text: z.string(),
    status: z.enum(['todo', 'in-progress', 'review', 'done']).optional().default('todo'),
    isPriority: z.boolean().optional(),
    dueDateISO: z.string().optional(),
    tags: z.array(z.string()).optional(),
    note: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
})
export type LegacyTask = z.infer<typeof LegacyTaskSchema>

/**
 * Legacy Unit (nested in Course)
 */
export const LegacyUnitSchema = z.object({
    id: z.string(),
    title: z.string(),
    order: z.number().optional().default(0),
    tasks: z.array(LegacyTaskSchema).optional().default([]),
})
export type LegacyUnit = z.infer<typeof LegacyUnitSchema>

/**
 * Legacy Course
 */
export const LegacyCourseSchema = z.object({
    id: z.string(),
    code: z.string().optional(),
    title: z.string(),
    color: z.string().optional(),
    bgGradient: z.string().optional(),
    units: z.array(LegacyUnitSchema).optional().default([]),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
})
export type LegacyCourse = z.infer<typeof LegacyCourseSchema>

/**
 * Legacy Event
 */
export const LegacyEventSchema = z.object({
    id: z.string(),
    type: z.enum(['exam', 'event']).optional().default('event'),
    courseId: z.string().optional(),
    title: z.string(),
    dateISO: z.string(),
    description: z.string().optional(),
    color: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
})
export type LegacyEvent = z.infer<typeof LegacyEventSchema>

/**
 * Legacy Personal Task
 */
export const LegacyPersonalTaskSchema = z.object({
    id: z.string(),
    text: z.string(),
    status: z.enum(['todo', 'in-progress', 'review', 'done']).optional().default('todo'),
    isPriority: z.boolean().optional(),
    dueDateISO: z.string().optional(),
    note: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
})
export type LegacyPersonalTask = z.infer<typeof LegacyPersonalTaskSchema>

/**
 * Legacy Completion State
 */
export const LegacyCompletionStateSchema = z.object({
    completedTaskIds: z.array(z.string()).optional().default([]),
    completionHistory: z.record(z.string(), z.string()).optional().default({}),
})
export type LegacyCompletionState = z.infer<typeof LegacyCompletionStateSchema>

/**
 * Legacy Lecture Note Meta
 */
export const LegacyLectureNoteMetaSchema = z.object({
    id: z.string(),
    courseId: z.string(),
    name: z.string(),
    fileName: z.string(),
    uploadDateISO: z.string(),
    unitTitle: z.string().optional(),
    fileSize: z.number(),
})
export type LegacyLectureNoteMeta = z.infer<typeof LegacyLectureNoteMetaSchema>

/**
 * Legacy Planner Store State
 */
export const LegacyPlannerStateSchema = z.object({
    courses: z.array(LegacyCourseSchema).optional().default([]),
    events: z.array(LegacyEventSchema).optional().default([]),
    completionState: LegacyCompletionStateSchema.optional().default({
        completedTaskIds: [],
        completionHistory: {}
    }),
    personalTasks: z.array(LegacyPersonalTaskSchema).optional().default([]),
    lectureNotesMeta: z.array(LegacyLectureNoteMetaSchema).optional().default([]),
})
export type LegacyPlannerState = z.infer<typeof LegacyPlannerStateSchema>

// ============================================
// Legacy Habits Store Types
// ============================================

export const LegacyFrequencyRuleSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('weeklyTarget'),
        timesPerWeek: z.number(),
    }),
    z.object({
        type: z.literal('specificDays'),
        days: z.array(z.number()),
    }),
    z.object({
        type: z.literal('everyXDays'),
        interval: z.number(),
    }),
])
export type LegacyFrequencyRule = z.infer<typeof LegacyFrequencyRuleSchema>

export const LegacyHabitSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    emoji: z.string().optional().default('✨'),
    type: z.enum(['boolean', 'numeric']).optional().default('boolean'),
    target: z.number().optional(),
    unit: z.string().optional(),
    color: z.string().optional(),
    frequency: LegacyFrequencyRuleSchema,
    sortMode: z.string().optional(),
    manualOrder: z.number().optional(),
    isArchived: z.boolean().optional().default(false),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
})
export type LegacyHabit = z.infer<typeof LegacyHabitSchema>

export const LegacyHabitLogSchema = z.object({
    habitId: z.string(),
    dateISO: z.string(),
    done: z.boolean().optional(),
    value: z.number().optional(),
    timestamp: z.string().optional(),
})
export type LegacyHabitLog = z.infer<typeof LegacyHabitLogSchema>

export const LegacyHabitsStateSchema = z.object({
    habits: z.array(LegacyHabitSchema).optional().default([]),
    habitLogs: z.record(z.string(), z.array(LegacyHabitLogSchema)).optional().default({}),
})
export type LegacyHabitsState = z.infer<typeof LegacyHabitsStateSchema>

// ============================================
// Migration Result Types
// ============================================

export interface MigrationResult {
    success: boolean
    coursesCount: number
    unitsCount: number
    tasksCount: number
    eventsCount: number
    personalTasksCount: number
    habitsCount: number
    habitLogsCount: number
    errors: string[]
    warnings: string[]
}

export interface MigrationFlags {
    plannerMigrated: boolean
    habitsMigrated: boolean
    migrationDate: string
    rollbackAvailable: boolean
    legacyDataPurged: boolean
}
