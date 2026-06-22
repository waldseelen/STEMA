/**
 * Streak Calculation Tests
 *
 * Habit streak ve skor hesaplama testleri.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    calculateHabitScore,
    calculateHabitStreak,
    formatDate,
    getWeeklyProgress,
    isHabitCompleted,
    isHabitDueOnDate,
} from '../../src/modules/planner/lib/utils'
import type { Habit, HabitLog } from '../../src/modules/planner/types'

// Helper to create test habit
function createTestHabit(overrides: Partial<Habit> = {}): Habit {
    return {
        id: 'habit-1',
        title: 'Test Habit',
        color: '#FF5722',
        emoji: '💪',
        type: 'boolean',
        frequency: { type: 'specificDays', days: [1, 2, 3, 4, 5] }, // Weekdays
        isArchived: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        ...overrides,
    }
}

// Helper to create test log
function createTestLog(dateISO: string, overrides: Partial<HabitLog> = {}): HabitLog {
    return {
        habitId: 'habit-1',
        dateISO,
        timestamp: dateISO,
        done: true,
        ...overrides,
    }
}

describe('isHabitDueOnDate', () => {
    describe('specificDays frequency', () => {
        it('should return true for matching day', () => {
            const habit = createTestHabit({
                frequency: { type: 'specificDays', days: [1] }, // Monday
            })
            // Find a Monday
            const monday = new Date('2024-01-08') // This is a Monday
            expect(isHabitDueOnDate(habit, formatDate(monday))).toBe(true)
        })

        it('should return false for non-matching day', () => {
            const habit = createTestHabit({
                frequency: { type: 'specificDays', days: [1] }, // Monday
            })
            // Find a Tuesday
            const tuesday = new Date('2024-01-09') // This is a Tuesday
            expect(isHabitDueOnDate(habit, formatDate(tuesday))).toBe(false)
        })
    })

    describe('weeklyTarget frequency', () => {
        it('should return true for any day', () => {
            const habit = createTestHabit({
                frequency: { type: 'weeklyTarget', timesPerWeek: 3 },
            })
            // Any day should be due
            expect(isHabitDueOnDate(habit, '2024-01-08')).toBe(true)
            expect(isHabitDueOnDate(habit, '2024-01-09')).toBe(true)
            expect(isHabitDueOnDate(habit, '2024-01-14')).toBe(true) // Sunday
        })
    })

    describe('everyXDays frequency', () => {
        it('should return true on creation day', () => {
            const habit = createTestHabit({
                frequency: { type: 'everyXDays', interval: 3 },
                createdAt: '2024-01-01',
            })
            expect(isHabitDueOnDate(habit, '2024-01-01')).toBe(true)
        })

        it('should return true on interval days', () => {
            const habit = createTestHabit({
                frequency: { type: 'everyXDays', interval: 3 },
                createdAt: '2024-01-01',
            })
            expect(isHabitDueOnDate(habit, '2024-01-04')).toBe(true) // Day 3
            expect(isHabitDueOnDate(habit, '2024-01-07')).toBe(true) // Day 6
        })

        it('should return false on non-interval days', () => {
            const habit = createTestHabit({
                frequency: { type: 'everyXDays', interval: 3 },
                createdAt: '2024-01-01',
            })
            expect(isHabitDueOnDate(habit, '2024-01-02')).toBe(false) // Day 1
            expect(isHabitDueOnDate(habit, '2024-01-03')).toBe(false) // Day 2
        })
    })
})

describe('isHabitCompleted', () => {
    describe('boolean habits', () => {
        it('should return true when log.done is true', () => {
            const habit = createTestHabit({ type: 'boolean' })
            const log = createTestLog('2024-01-01', { done: true })

            expect(isHabitCompleted(habit, log)).toBe(true)
        })

        it('should return false when log.done is false', () => {
            const habit = createTestHabit({ type: 'boolean' })
            const log = createTestLog('2024-01-01', { done: false })

            expect(isHabitCompleted(habit, log)).toBe(false)
        })

        it('should return false when log is null', () => {
            const habit = createTestHabit({ type: 'boolean' })

            expect(isHabitCompleted(habit, null)).toBe(false)
        })
    })

    describe('numeric habits', () => {
        it('should return true when value meets target', () => {
            const habit = createTestHabit({ type: 'numeric', target: 8 })
            const log = createTestLog('2024-01-01', { value: 8 })

            expect(isHabitCompleted(habit, log)).toBe(true)
        })

        it('should return true when value exceeds target', () => {
            const habit = createTestHabit({ type: 'numeric', target: 8 })
            const log = createTestLog('2024-01-01', { value: 10 })

            expect(isHabitCompleted(habit, log)).toBe(true)
        })

        it('should return false when value below target', () => {
            const habit = createTestHabit({ type: 'numeric', target: 8 })
            const log = createTestLog('2024-01-01', { value: 5 })

            expect(isHabitCompleted(habit, log)).toBe(false)
        })

        it('should use default target of 1 when not specified', () => {
            const habit = createTestHabit({ type: 'numeric' })
            const log = createTestLog('2024-01-01', { value: 1 })

            expect(isHabitCompleted(habit, log)).toBe(true)
        })
    })
})

describe('calculateHabitStreak', () => {
    // Mock today's date for consistent tests
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-01-15')) // Monday
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should return 0 streak for no logs', () => {
        const habit = createTestHabit({
            frequency: { type: 'specificDays', days: [1, 2, 3, 4, 5] },
        })

        const result = calculateHabitStreak(habit, [])

        expect(result.current).toBe(0)
    })

    it('should calculate consecutive streak', () => {
        const habit = createTestHabit({
            frequency: { type: 'specificDays', days: [1, 2, 3, 4, 5] }, // Weekdays
            createdAt: '2024-01-01',
        })

        // Logs for Jan 8-12 (Mon-Fri) and Jan 15 (Today, Monday)
        const logs: HabitLog[] = [
            createTestLog('2024-01-15'), // Today
            createTestLog('2024-01-12'), // Last Friday
            createTestLog('2024-01-11'), // Thursday
            createTestLog('2024-01-10'), // Wednesday
            createTestLog('2024-01-09'), // Tuesday
            createTestLog('2024-01-08'), // Monday
        ]

        const result = calculateHabitStreak(habit, logs)

        expect(result.current).toBeGreaterThan(0)
    })

    it('should track best streak separately', () => {
        const habit = createTestHabit({
            frequency: { type: 'specificDays', days: [0, 1, 2, 3, 4, 5, 6] }, // Every day
            createdAt: '2024-01-01',
        })

        // 3 day streak early on, then gap, then current streak
        const logs: HabitLog[] = [
            createTestLog('2024-01-03'), // Wed
            createTestLog('2024-01-04'), // Thu
            createTestLog('2024-01-05'), // Fri - 3 day streak
            // Gap Jan 6-10
            createTestLog('2024-01-15'), // Today
            createTestLog('2024-01-14'), // Yesterday
        ]

        const result = calculateHabitStreak(habit, logs)

        expect(result.best).toBeGreaterThanOrEqual(result.current)
    })
})

describe('calculateHabitScore', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2024-01-31'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should return 100 when no due days in period', () => {
        const habit = createTestHabit({
            frequency: { type: 'specificDays', days: [] }, // Never due
        })

        const result = calculateHabitScore(habit, [], 30)

        expect(result).toBe(100)
    })

    it('should return 0 when all due days missed', () => {
        const habit = createTestHabit({
            frequency: { type: 'specificDays', days: [0, 1, 2, 3, 4, 5, 6] }, // Every day
        })

        const result = calculateHabitScore(habit, [], 30)

        expect(result).toBe(0)
    })

    it('should weight recent days more heavily', () => {
        const habit = createTestHabit({
            frequency: { type: 'specificDays', days: [0, 1, 2, 3, 4, 5, 6] },
        })

        // Only recent logs (last 5 days)
        const recentLogs: HabitLog[] = [
            createTestLog('2024-01-31'),
            createTestLog('2024-01-30'),
            createTestLog('2024-01-29'),
            createTestLog('2024-01-28'),
            createTestLog('2024-01-27'),
        ]

        // Only old logs (first 5 days of 30)
        const oldLogs: HabitLog[] = [
            createTestLog('2024-01-02'),
            createTestLog('2024-01-03'),
            createTestLog('2024-01-04'),
            createTestLog('2024-01-05'),
            createTestLog('2024-01-06'),
        ]

        const recentScore = calculateHabitScore(habit, recentLogs, 30)
        const oldScore = calculateHabitScore(habit, oldLogs, 30)

        // Recent completions should score higher due to exponential weighting
        expect(recentScore).toBeGreaterThan(oldScore)
    })
})

describe('getWeeklyProgress', () => {
    it('should calculate progress for weekday habit', () => {
        const habit = createTestHabit({
            frequency: { type: 'specificDays', days: [1, 2, 3, 4, 5] }, // Weekdays
        })

        // Week starting Monday Jan 8, 2024
        const weekStart = new Date('2024-01-08')

        // Completed Mon, Tue, Wed
        const logs: HabitLog[] = [
            createTestLog('2024-01-08'),
            createTestLog('2024-01-09'),
            createTestLog('2024-01-10'),
        ]

        const result = getWeeklyProgress(habit, logs, weekStart)

        expect(result.completed).toBe(3)
        expect(result.target).toBe(5) // 5 weekdays
    })

    it('should use timesPerWeek for weeklyTarget frequency', () => {
        const habit = createTestHabit({
            frequency: { type: 'weeklyTarget', timesPerWeek: 3 },
        })

        const weekStart = new Date('2024-01-08')

        const logs: HabitLog[] = [
            createTestLog('2024-01-08'),
            createTestLog('2024-01-10'),
        ]

        const result = getWeeklyProgress(habit, logs, weekStart)

        expect(result.completed).toBe(2)
        expect(result.target).toBe(3) // Weekly target
    })
})
