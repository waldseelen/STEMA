/**
 * Planner Database Types
 *
 * Dexie (IndexedDB) için entity tipleri.
 * Zustand store'dan bağımsız, DB-first yaklaşım.
 */

// ============================================
// Core Planner Entities
// ============================================

export interface DBCourse {
    id: string
    code?: string
    title: string
    icon?: string
    color?: string
    bgGradient?: string
    order: number
    createdAt: string // ISO timestamp
    updatedAt: string
}

export interface DBUnit {
    id: string
    courseId: string
    title: string
    order: number
    createdAt: string
    updatedAt: string
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked' | 'planning' | 'permits-awaited'

export interface DBTask {
    id: string
    courseId: string
    unitId: string
    text: string
    icon?: string
    status: TaskStatus
    isPriority?: boolean
    startDateISO?: string
    dueDateISO?: string
    dependencies?: string[]
    assignees?: string[]
    completedAt?: string // ISO timestamp when marked done
    tags?: string[]
    note?: string
    order: number
    createdAt: string
    updatedAt: string
}

export type PlannerEventType = 'exam' | 'event'

export interface DBPlannerEvent {
    id: string
    type: PlannerEventType
    courseId?: string
    title: string
    dateISO: string // YYYY-MM-DD
    description?: string
    color?: string
    createdAt: string
    updatedAt: string
}

export interface DBPersonalTask {
    id: string
    text: string
    icon?: string
    status: TaskStatus
    isPriority?: boolean
    startDateISO?: string
    dueDateISO?: string
    dependencies?: string[]
    assignees?: string[]
    completedAt?: string
    note?: string
    order: number
    createdAt: string
    updatedAt: string
}

// Habits - separate from LifeFlow habits
export type PlannerHabitType = 'boolean' | 'numeric'

export type PlannerFrequencyType = 'weeklyTarget' | 'specificDays' | 'everyXDays'

export interface PlannerFrequencyRule {
    type: PlannerFrequencyType
    timesPerWeek?: number // for weeklyTarget
    days?: number[] // for specificDays (0=Sun, 6=Sat)
    interval?: number // for everyXDays
}

export interface DBPlannerHabit {
    id: string
    title: string
    description?: string
    emoji: string
    icon?: string
    type: PlannerHabitType
    target?: number
    unit?: string
    color?: string
    frequency: PlannerFrequencyRule
    isArchived: boolean
    order: number
    createdAt: string
    updatedAt: string
}

export interface DBPlannerHabitLog {
    id: string
    habitId: string
    dateISO: string // YYYY-MM-DD
    done: boolean
    value?: number
    createdAt: string
}

// Completion tracking (for progress/streak)
export interface DBCompletionRecord {
    id: string
    taskId: string
    completedAt: string // ISO timestamp
    dateKey: string // YYYY-MM-DD for indexing
}

// Lecture notes metadata
export interface DBLectureNoteMeta {
    id: string
    courseId: string
    name: string
    fileName: string
    uploadDateISO: string
    unitTitle?: string
    fileSize: number
}

// ============================================
// Index Types for Queries
// ============================================

export interface EventDateRange {
    startISO: string
    endISO: string
}

export interface TaskFilter {
    courseId?: string
    unitId?: string
    status?: TaskStatus
    hasDueDate?: boolean
    isPriority?: boolean
}

// ============================================
// Aggregate Types (for UI)
// ============================================

export interface CourseWithProgress extends DBCourse {
    totalTasks: number
    completedTasks: number
    progressPercent: number
    unitCount: number
}

export interface UnitWithTasks extends DBUnit {
    tasks: DBTask[]
}

export interface CourseWithUnits extends DBCourse {
    units: UnitWithTasks[]
}

export interface EventsByDate {
    [dateISO: string]: DBPlannerEvent[]
}
