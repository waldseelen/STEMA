import type { Goal, HabitLog, TimeSession } from '@/db/types'

// ============================================
// Event Type Definitions
// ============================================

export interface TimerStartedEvent {
    type: 'TIMER_STARTED'
    payload: {
        timerId: string
        activityId: string
        startedAt: number
        mode: 'normal' | 'pomodoro'
    }
}

export interface TimerStoppedEvent {
    type: 'TIMER_STOPPED'
    payload: {
        timerId: string
        activityId: string
        durationSec: number
        sessionId: string
    }
}

export interface TimerPausedEvent {
    type: 'TIMER_PAUSED'
    payload: {
        timerId: string
        activityId: string
        accumulatedSec: number
    }
}

export interface TimerResumedEvent {
    type: 'TIMER_RESUMED'
    payload: {
        timerId: string
        activityId: string
    }
}

export interface SessionCreatedEvent {
    type: 'SESSION_CREATED'
    payload: {
        session: TimeSession
    }
}

export interface SessionUpdatedEvent {
    type: 'SESSION_UPDATED'
    payload: {
        session: TimeSession
        previousSession: TimeSession
    }
}

export interface SessionDeletedEvent {
    type: 'SESSION_DELETED'
    payload: {
        sessionId: string
        activityId: string
        dateKey: string
    }
}

export interface SessionMergedEvent {
    type: 'SESSION_MERGED'
    payload: {
        resultSession: TimeSession
        mergedSessionIds: string[]
    }
}

export interface SessionSplitEvent {
    type: 'SESSION_SPLIT'
    payload: {
        originalSessionId: string
        newSessions: [TimeSession, TimeSession]
    }
}

export interface HabitCheckedEvent {
    type: 'HABIT_CHECKED'
    payload: {
        log: HabitLog
        habitId: string
        currentStreak: number
    }
}

export interface HabitSkippedEvent {
    type: 'HABIT_SKIPPED'
    payload: {
        log: HabitLog
        habitId: string
    }
}

export interface HabitFailedEvent {
    type: 'HABIT_FAILED'
    payload: {
        log: HabitLog
        habitId: string
        streakBroken: number // Previous streak value
    }
}

export interface PomodoroCompletedEvent {
    type: 'POMODORO_COMPLETED'
    payload: {
        activityId: string
        sessionNumber: number
        isLongBreakNext: boolean
        sessionsCompleted?: number
    }
}

export interface PomodoroStartedEvent {
    type: 'POMODORO_STARTED'
    payload: {
        activityId: string
        phase: 'work' | 'shortBreak' | 'longBreak'
        duration: number
    }
}

export interface PomodoroStoppedEvent {
    type: 'POMODORO_STOPPED'
    payload: {
        activityId: string
    }
}

export interface BreakStartedEvent {
    type: 'BREAK_STARTED'
    payload: {
        duration: number
        isLongBreak: boolean
    }
}

export interface BreakEndedEvent {
    type: 'BREAK_ENDED'
    payload: {
        wasLongBreak: boolean
    }
}

export interface GoalReachedEvent {
    type: 'GOAL_REACHED'
    payload: {
        goal: Goal
        currentValue: number
    }
}

export interface GoalProgressEvent {
    type: 'GOAL_PROGRESS'
    payload: {
        goalId: string
        currentValue: number
        targetValue: number
        percentage: number
    }
}

export interface DayRolloverEvent {
    type: 'DAY_ROLLOVER'
    payload: {
        previousDateKey: string
        newDateKey: string
    }
}

export interface SettingChangedEvent {
    type: 'SETTING_CHANGED'
    payload: {
        key: string
        oldValue: unknown
        newValue: unknown
    }
}

export interface DataImportedEvent {
    type: 'DATA_IMPORTED'
    payload: {
        counts: {
            categories: number
            activities: number
            sessions: number
            habits: number
            habitLogs: number
        }
    }
}

export interface DataExportedEvent {
    type: 'DATA_EXPORTED'
    payload: {
        format: 'json' | 'csv' | 'ics'
        filename: string
    }
}

// Union type of all events
export type DomainEvent =
    | TimerStartedEvent
    | TimerStoppedEvent
    | TimerPausedEvent
    | TimerResumedEvent
    | SessionCreatedEvent
    | SessionUpdatedEvent
    | SessionDeletedEvent
    | SessionMergedEvent
    | SessionSplitEvent
    | HabitCheckedEvent
    | HabitSkippedEvent
    | HabitFailedEvent
    | PomodoroCompletedEvent
    | PomodoroStartedEvent
    | PomodoroStoppedEvent
    | BreakStartedEvent
    | BreakEndedEvent
    | GoalReachedEvent
    | GoalProgressEvent
    | DayRolloverEvent
    | SettingChangedEvent
    | DataImportedEvent
    | DataExportedEvent

// Event type string literal union
export type EventType = DomainEvent['type']

// Helper type to get payload type from event type
export type EventPayload<T extends EventType> = Extract<
    DomainEvent,
    { type: T }
>['payload']
