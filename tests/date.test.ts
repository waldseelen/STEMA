import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import {
    formatDuration,
    formatTimerDisplay,
    getDateKey,
    getEffectiveDate,
    getWeekBoundaries,
} from '../src/shared/utils/date'

describe('Date Utilities', () => {
    describe('getEffectiveDate', () => {
        it('should return same date if after rollover hour', () => {
            const date = DateTime.fromObject({ hour: 10, day: 15, month: 1, year: 2024 })
            const result = getEffectiveDate(date, 4)
            expect(result.day).toBe(15)
        })

        it('should return previous day if before rollover hour', () => {
            const date = DateTime.fromObject({ hour: 2, day: 15, month: 1, year: 2024 })
            const result = getEffectiveDate(date, 4)
            expect(result.day).toBe(14)
        })

        it('should handle midnight correctly', () => {
            const date = DateTime.fromObject({ hour: 0, day: 15, month: 1, year: 2024 })
            const result = getEffectiveDate(date, 4)
            expect(result.day).toBe(14)
        })

        it('should handle exactly at rollover hour', () => {
            const date = DateTime.fromObject({ hour: 4, day: 15, month: 1, year: 2024 })
            const result = getEffectiveDate(date, 4)
            expect(result.day).toBe(15)
        })
    })

    describe('getDateKey', () => {
        it('should return YYYY-MM-DD format', () => {
            const date = DateTime.fromObject({ hour: 10, day: 5, month: 3, year: 2024 })
            const result = getDateKey(date, 4)
            expect(result).toBe('2024-03-05')
        })

        it('should use effective date for dateKey', () => {
            const date = DateTime.fromObject({ hour: 2, day: 5, month: 3, year: 2024 })
            const result = getDateKey(date, 4)
            expect(result).toBe('2024-03-04')
        })
    })

    describe('formatDuration', () => {
        it('should format seconds only', () => {
            expect(formatDuration(45)).toBe('45sn')
        })

        it('should format minutes and seconds', () => {
            expect(formatDuration(125)).toBe('2dk 5sn')
        })

        it('should format hours and minutes', () => {
            expect(formatDuration(3725)).toBe('1s 2dk')
        })
    })

    describe('formatTimerDisplay', () => {
        it('should format as MM:SS for less than an hour', () => {
            expect(formatTimerDisplay(65)).toBe('01:05')
            expect(formatTimerDisplay(599)).toBe('09:59')
        })

        it('should format as HH:MM:SS for an hour or more', () => {
            expect(formatTimerDisplay(3661)).toBe('01:01:01')
            expect(formatTimerDisplay(7325)).toBe('02:02:05')
        })
    })

    describe('getWeekBoundaries', () => {
        it('should get correct boundaries with Monday start', () => {
            const date = DateTime.fromObject({ day: 10, month: 1, year: 2024 }) // Wednesday
            const { start, end: _end } = getWeekBoundaries(date, 1)
            expect(start.weekday).toBe(1) // Monday
            expect(_end.weekday).toBe(7) // Sunday
        })

        it('should get correct boundaries with Sunday start', () => {
            const date = DateTime.fromObject({ day: 10, month: 1, year: 2024 }) // Wednesday
            const { start } = getWeekBoundaries(date, 7)
            expect(start.weekday).toBe(7) // Sunday
        })
    })
})
