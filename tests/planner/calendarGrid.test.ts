/**
 * Calendar Grid Tests
 *
 * useCalendarGrid hook için unit testler.
 */

import {
    DAY_NAMES_TR,
    useCalendarGrid
} from '../../src/modules/planner/lib/hooks/useCalendarGrid'
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('useCalendarGrid', () => {
    describe('grid generation', () => {
        it('should generate exactly 42 days', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2026, 0, 1)) // January 2026
            )

            expect(result.current.days).toHaveLength(42)
        })

        it('should generate 6 weeks', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2026, 0, 1))
            )

            expect(result.current.weeks).toHaveLength(6)
            result.current.weeks.forEach((week: typeof result.current.weeks[0]) => {
                expect(week).toHaveLength(7)
            })
        })

        it('should start grid from Sunday', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2026, 0, 1)) // January 2026, first day is Thursday
            )

            // Grid should start from previous Sunday (Dec 28, 2025)
            expect(result.current.days[0].dayOfWeek).toBe(0) // Sunday
        })

        it('should mark current month days correctly', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2026, 0, 1)) // January 2026
            )

            // January 2026 has 31 days
            const januaryDays = result.current.days.filter(d => d.isCurrentMonth)
            expect(januaryDays).toHaveLength(31)

            // Verify all January days are marked correctly
            januaryDays.forEach((day: typeof januaryDays[0]) => {
                expect(day.date.getMonth()).toBe(0) // January
                expect(day.date.getFullYear()).toBe(2026)
            })
        })

        it('should include previous month days at start', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2026, 0, 1)) // January 2026
            )

            // January 1, 2026 is Thursday, so we need Dec 28-31
            const prevMonthDays = result.current.days.filter(
                d => !d.isCurrentMonth && d.date.getMonth() === 11
            )
            expect(prevMonthDays.length).toBeGreaterThan(0)
        })

        it('should include next month days at end', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2026, 0, 1)) // January 2026
            )

            const nextMonthDays = result.current.days.filter(
                d => !d.isCurrentMonth && d.date.getMonth() === 1
            )
            expect(nextMonthDays.length).toBeGreaterThan(0)
        })
    })

    describe('date properties', () => {
        it('should correctly identify today', () => {
            const today = new Date()
            const { result } = renderHook(() =>
                useCalendarGrid(today)
            )

            const todayDays = result.current.days.filter(d => d.isToday)
            expect(todayDays).toHaveLength(1)
            expect(todayDays[0].dayNumber).toBe(today.getDate())
        })

        it('should correctly identify weekends', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2026, 0, 1))
            )

            result.current.days.forEach((day: typeof result.current.days[0]) => {
                const isWeekendExpected = day.dayOfWeek === 0 || day.dayOfWeek === 6
                expect(day.isWeekend).toBe(isWeekendExpected)
            })
        })

        it('should correctly identify past days', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2020, 0, 1)) // Past month
            )

            // All days in January 2020 should be past
            const pastDays = result.current.days.filter(d => d.isPast)
            expect(pastDays.length).toBeGreaterThan(0)
        })

        it('should generate valid ISO date strings', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2026, 0, 1))
            )

            result.current.days.forEach((day: typeof result.current.days[0]) => {
                expect(day.dateISO).toMatch(/^\d{4}-\d{2}-\d{2}$/)
                // Verify ISO matches actual date
                const [year, month, dayNum] = day.dateISO.split('-').map((x: string) => Number(x))
                expect(year).toBe(day.date.getFullYear())
                expect(month).toBe(day.date.getMonth() + 1)
                expect(dayNum).toBe(day.date.getDate())
            })
        })
    })

    describe('month metadata', () => {
        it('should provide correct month label in Turkish', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2026, 0, 1), 'tr-TR')
            )

            expect(result.current.monthLabel.toLowerCase()).toContain('ocak')
            expect(result.current.monthLabel).toContain('2026')
        })

        it('should provide correct grid boundaries', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2026, 0, 1))
            )

            expect(result.current.year).toBe(2026)
            expect(result.current.month).toBe(0)
            expect(result.current.firstDayOfMonth.getDate()).toBe(1)
            expect(result.current.lastDayOfMonth.getDate()).toBe(31)
        })

        it('should provide correct grid start/end ISO for queries', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2026, 0, 1))
            )

            expect(result.current.gridStartISO).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            expect(result.current.gridEndISO).toMatch(/^\d{4}-\d{2}-\d{2}$/)

            // End should be after start
            expect(result.current.gridEndISO > result.current.gridStartISO).toBe(true)
        })
    })

    describe('edge cases', () => {
        it('should handle February in leap year', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2024, 1, 1)) // February 2024 (leap year)
            )

            const februaryDays = result.current.days.filter(
                d => d.isCurrentMonth
            )
            expect(februaryDays).toHaveLength(29)
        })

        it('should handle February in non-leap year', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2025, 1, 1)) // February 2025 (non-leap)
            )

            const februaryDays = result.current.days.filter(
                d => d.isCurrentMonth
            )
            expect(februaryDays).toHaveLength(28)
        })

        it('should handle year transitions', () => {
            const { result } = renderHook(() =>
                useCalendarGrid(new Date(2025, 11, 1)) // December 2025
            )

            // Should include January 2026 days
            const nextYearDays = result.current.days.filter(
                (d: typeof result.current.days[0]) => d.date.getFullYear() === 2026
            )
            expect(nextYearDays.length).toBeGreaterThan(0)
        })
    })
})

describe('DAY_NAMES_TR', () => {
    it('should have 7 day names', () => {
        expect(DAY_NAMES_TR).toHaveLength(7)
    })

    it('should start with Sunday', () => {
        expect(DAY_NAMES_TR[0]).toBe('Paz')
    })

    it('should end with Saturday', () => {
        expect(DAY_NAMES_TR[6]).toBe('Cmt')
    })
})
