// Database Types for LifeFlow

// ============================================
// Core Entities
// ============================================

export interface Category {
    id: string
    name: string
    color: string
    icon: string
    archived: boolean
    createdAt: number
    updatedAt: number
}

export interface Tag {
    id: string
    name: string
    color: string
    groupId?: string
    createdAt: number
    updatedAt: number
}

export interface Activity {
    id: string
    name: string
    categoryId: string
    color?: string
    icon?: string
    tagIds: string[]
    archived: boolean
    defaultGoalIds: string[]
    createdAt: number
    updatedAt: number
}

// ============================================
// Time Tracking
// ============================================

export interface TimeSession {
    id: string
    activityId: string
    startAt: number // Unix timestamp
    endAt: number // Unix timestamp
    durationSec: number
    note: string
    dateKey: string // YYYY-MM-DD (effective date)
    mergedFromIds: string[]
    createdAt: number
    updatedAt: number
}

export type TimerMode = 'normal' | 'pomodoro'

export interface RunningTimer {
    id: string
    activityId: string
    startedAt: number // Unix timestamp
    pausedAt?: number // Unix timestamp if paused
    accumulatedSec: number
    mode: TimerMode
    pomodoroConfigId?: string
    createdAt: number
}

export interface PomodoroConfig {
    id: string
    name: string
    workDuration: number // seconds
    shortBreakDuration: number // seconds
    longBreakDuration: number // seconds
    sessionsBeforeLongBreak: number
    isDefault: boolean
}

// ============================================
// Habits
// ============================================

export type HabitType = 'boolean' | 'numeric' | 'time'

export type ScheduleType = 'daily' | 'weekly' | 'custom'

export interface ScheduleSpec {
    type: ScheduleType
    // For weekly: how many times per week
    required?: number
    // For weekly/custom: which days are allowed (1=Mon, 7=Sun)
    allowedDays?: number[]
    // For custom: every N days
    everyNDays?: number
}

export interface Habit {
    id: string
    name: string
    type: HabitType
    scheduleSpec: ScheduleSpec
    minTarget?: number
    maxTarget?: number
    unit?: string
    categoryId?: string
    tagIds: string[]
    allowSkip: boolean
    archived: boolean
    createdAt: number
    updatedAt: number
}

export type HabitLogStatus = 'done' | 'skip' | 'fail'

export interface HabitLog {
    id: string
    habitId: string
    dateKey: string // YYYY-MM-DD
    status: HabitLogStatus
    value?: number // For numeric/time habits
    note?: string
    createdAt: number
    updatedAt: number
}

// ============================================
// Goals & Rules
// ============================================

export type GoalScope = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type GoalMetric = 'time' | 'count' | 'streak'

export interface Goal {
    id: string
    name: string
    scope: GoalScope
    metric: GoalMetric
    minTarget?: number
    maxTarget?: number
    targetValue: number
    activityId?: string
    habitId?: string
    enabled: boolean
    createdAt: number
    updatedAt: number
}

export type RuleTrigger =
    | 'TIMER_STARTED'
    | 'TIMER_STOPPED'
    | 'SESSION_CREATED'
    | 'HABIT_CHECKED'
    | 'POMODORO_COMPLETED'
    | 'GOAL_REACHED'
    | 'DAY_ROLLOVER'

export type RuleAction =
    | 'NOTIFY'
    | 'LOG_MESSAGE'
    | 'START_TIMER'
    | 'TRIGGER_BREAK'

export interface RuleCondition {
    field: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains'
    value: string | number | boolean
}

export interface RuleActionConfig {
    type: RuleAction
    params: Record<string, unknown>
}

export interface Rule {
    id: string
    name: string
    trigger: RuleTrigger
    conditions: RuleCondition[]
    actions: RuleActionConfig[]
    enabled: boolean
    createdAt: number
    updatedAt: number
}

// ============================================
// Notifications & Reminders
// ============================================

export type ReminderKind = 'habit' | 'activity' | 'custom'

export interface ReminderSchedule {
    time: string // HH:MM
    days?: number[] // 1-7 for weekly, undefined for daily
}

export interface Reminder {
    id: string
    kind: ReminderKind
    habitId?: string
    activityId?: string
    title: string
    message: string
    schedule: ReminderSchedule
    enabled: boolean
    createdAt: number
    updatedAt: number
}

// ============================================
// Settings
// ============================================

export interface Setting {
    key: string
    value: string | number | boolean | object
}

// Default settings keys
export type SettingKey =
    | 'rolloverHour'
    | 'weekStart'
    | 'theme'
    | 'language'
    | 'multitaskingEnabled'
    | 'defaultPomodoroConfigId'
    | 'pomodoroWorkDuration'
    | 'pomodoroBreakDuration'
    | 'pomodoroLongBreakDuration'
    | 'pomodoroSessionsBeforeLongBreak'
    | 'pomodoroAutoStartBreak'
    | 'pomodoroAutoStartWork'
    | 'pomodoroSoundEnabled'
    | 'mergeThresholdMinutes'
    | 'commandBarPrefixEnabled'

// ============================================
// Data Vault (Export/Import)
// ============================================

export interface ExportMetadata {
    version: string
    schemaVersion: number
    exportedAt: number
    deviceId?: string
}

export interface BackupData {
    metadata: ExportMetadata
    categories: Category[]
    tags: Tag[]
    activities: Activity[]
    timeSessions: TimeSession[]
    runningTimers: RunningTimer[]
    pomodoroConfigs: PomodoroConfig[]
    habits: Habit[]
    habitLogs: HabitLog[]
    goals: Goal[]
    rules: Rule[]
    reminders: Reminder[]
    settings: Setting[]
}
