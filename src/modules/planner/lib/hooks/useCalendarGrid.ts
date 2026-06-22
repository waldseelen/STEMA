/**
 * useCalendarGrid Hook
 *
 * Calendar grid hesaplaması için pure function hook.
 * 42 günlük grid (6 satır × 7 gün) üretir.
 */

import { useMemo } from 'react'

// ============================================
// Types
// ============================================

export interface CalendarDay {
    /** Date object */
    date: Date
    /** ISO date string (YYYY-MM-DD) */
    dateISO: string
    /** Day number in month */
    dayNumber: number
    /** Is this day in the current month being viewed */
    isCurrentMonth: boolean
    /** Is this day today */
    isToday: boolean
    /** Is this day in the past */
    isPast: boolean
    /** Is this a weekend day */
    isWeekend: boolean
    /** Week index (0-5) */
    weekIndex: number
    /** Day of week (0=Sunday, 6=Saturday) */
    dayOfWeek: number
}

export interface CalendarGridResult {
    /** 42 days grid */
    days: CalendarDay[]
    /** Days grouped by week (6 weeks) */
    weeks: CalendarDay[][]
    /** Month label (e.g., "Ocak 2026") */
    monthLabel: string
    /** Year */
    year: number
    /** Month (0-11) */
    month: number
    /** First day of month */
    firstDayOfMonth: Date
    /** Last day of month */
    lastDayOfMonth: Date
    /** Start of grid (first visible day) */
    gridStartDate: Date
    /** End of grid (last visible day) */
    gridEndDate: Date
    /** Start ISO for queries */
    gridStartISO: string
    /** End ISO for queries */
    gridEndISO: string
}

// ============================================
// Helper Functions
// ============================================

function toDateISO(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    )
}

function startOfDay(date: Date): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

// ============================================
// Grid Generation
// ============================================

/**
 * Generate 42-day calendar grid for a given month
 */
function generateCalendarGrid(
    currentDate: Date,
    locale: string = Intl.DateTimeFormat().resolvedOptions().locale
): CalendarGridResult {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // First and last day of month
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Grid boundaries (start from previous Sunday, end on next Saturday)
    // Sunday = 0, so we go back that many days
    const gridStartDate = addDays(firstDayOfMonth, -firstDayOfMonth.getDay())
    const gridEndDate = addDays(gridStartDate, 41) // 42 days total

    // Today for comparison
    const today = startOfDay(new Date())

    // Generate days
    const days: CalendarDay[] = []
    let currentDay = new Date(gridStartDate)

    for (let i = 0; i < 42; i++) {
        const date = new Date(currentDay)
        const dayOfWeek = date.getDay()

        days.push({
            date,
            dateISO: toDateISO(date),
            dayNumber: date.getDate(),
            isCurrentMonth: date.getMonth() === month,
            isToday: isSameDay(date, today),
            isPast: date < today,
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            weekIndex: Math.floor(i / 7),
            dayOfWeek,
        })

        currentDay = addDays(currentDay, 1)
    }

    // Group by weeks
    const weeks: CalendarDay[][] = []
    for (let i = 0; i < 6; i++) {
        weeks.push(days.slice(i * 7, (i + 1) * 7))
    }

    // Month label
    const monthLabel = firstDayOfMonth.toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
    })

    return {
        days,
        weeks,
        monthLabel,
        year,
        month,
        firstDayOfMonth,
        lastDayOfMonth,
        gridStartDate,
        gridEndDate,
        gridStartISO: toDateISO(gridStartDate),
        gridEndISO: toDateISO(gridEndDate),
    }
}

// ============================================
// Hook
// ============================================

/**
 * Hook for calendar grid calculation
 *
 * @param currentDate - The date representing the month to display
 * @param locale - Locale for month label formatting
 * @returns Calendar grid data
 *
 * @example
 * const { days, weeks, monthLabel, gridStartISO, gridEndISO } = useCalendarGrid(currentMonth)
 *
 * // Use gridStartISO and gridEndISO to fetch events
 * const events = useEventsByDateRange(gridStartISO, gridEndISO)
 */
export function useCalendarGrid(
    currentDate: Date,
    locale: string = Intl.DateTimeFormat().resolvedOptions().locale
): CalendarGridResult {
    return useMemo(
        () => generateCalendarGrid(currentDate, locale),
        [currentDate, locale]
    )
}

/**
 * Get day names for calendar header
 */
export function useCalendarDayNames(
    locale: string = Intl.DateTimeFormat().resolvedOptions().locale,
    format: 'short' | 'narrow' | 'long' = 'short'
): string[] {
    return useMemo(() => {
        const formatter = new Intl.DateTimeFormat(locale, { weekday: format })
        // Start from Sunday (index 0)
        const days: string[] = []
        for (let i = 0; i < 7; i++) {
            // Create a date that is definitely day i of week
            // Adjust to get Sunday=0, Monday=1, etc.
            const sundayBased = new Date(2023, 11, 31 + i) // Dec 31 2023 was Sunday
            days.push(formatter.format(sundayBased))
        }
        return days
    }, [locale, format])
}

/**
 * Static day names for performance (Turkish)
 */
export const DAY_NAMES_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const
export const DAY_NAMES_TR_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] as const

/**
 * Static day names (English)
 */
export const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const DAY_NAMES_EN_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
