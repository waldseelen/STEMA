/**
 * Event Queries — Supabase-first
 *
 * Calendar events/exams için Supabase CRUD fonksiyonları ve React hooks.
 */

import {
    plannerAddEvent,
    plannerDeleteEvent,
    plannerDeleteEventsByCourse,
    plannerGetAllEvents,
    plannerGetEventById,
    plannerGetEventsByCourse,
    plannerGetEventsByDate,
    plannerGetEventsByDateRange,
    plannerUpdateEvent,
} from '@/lib/cloud/plannerRepo'
import { invalidateTables } from '@/lib/cloud/queryInvalidation'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'
import type { DBPlannerEvent, EventsByDate, PlannerEventType } from '../types'

// ============================================
// Query Functions
// ============================================

export async function getEventById(id: string): Promise<DBPlannerEvent | undefined> {
    return plannerGetEventById(id)
}

export async function getEventsByDate(dateISO: string): Promise<DBPlannerEvent[]> {
    return plannerGetEventsByDate(dateISO)
}

export async function getEventsByDateRange(
    startISO: string,
    endISO: string
): Promise<DBPlannerEvent[]> {
    return plannerGetEventsByDateRange(startISO, endISO)
}

export async function getEventsByDateRangeGrouped(
    startISO: string,
    endISO: string
): Promise<EventsByDate> {
    const events = await getEventsByDateRange(startISO, endISO)

    const grouped: EventsByDate = {}
    for (const event of events) {
        if (!grouped[event.dateISO]) {
            grouped[event.dateISO] = []
        }
        grouped[event.dateISO].push(event)
    }

    for (const dateISO of Object.keys(grouped)) {
        grouped[dateISO].sort((a, b) => a.type.localeCompare(b.type))
    }

    return grouped
}

export async function getEventsByCourse(courseId: string): Promise<DBPlannerEvent[]> {
    return plannerGetEventsByCourse(courseId)
}

export async function getEventsByTypeAndDateRange(
    type: PlannerEventType,
    startISO: string,
    endISO: string
): Promise<DBPlannerEvent[]> {
    const events = await getEventsByDateRange(startISO, endISO)
    return events.filter(e => e.type === type)
}

export async function getUpcomingExams(limit = 10): Promise<DBPlannerEvent[]> {
    const today = new Date().toISOString().slice(0, 10)
    const events = await plannerGetEventsByDateRange(today, '9999-12-31')
    return events.filter(e => e.type === 'exam').slice(0, limit)
}

export async function getTodayEvents(): Promise<DBPlannerEvent[]> {
    const today = new Date().toISOString().slice(0, 10)
    return plannerGetEventsByDate(today)
}

export async function getUpcomingEventsWithinDays(days: number): Promise<DBPlannerEvent[]> {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + days)
    const startISO = today.toISOString().slice(0, 10)
    const endISO = endDate.toISOString().slice(0, 10)
    return getEventsByDateRange(startISO, endISO)
}

export async function countEventsByType(type: PlannerEventType): Promise<number> {
    const events = await plannerGetAllEvents()
    return events.filter(e => e.type === type).length
}

// ============================================
// Mutation Functions
// ============================================

export async function addEvent(data: {
    type: PlannerEventType
    title: string
    dateISO: string
    courseId?: string
    description?: string
    color?: string
}): Promise<string> {
    const id = await plannerAddEvent(data)
    invalidateTables(['events'])
    return id
}

export async function updateEvent(
    id: string,
    updates: Partial<Omit<DBPlannerEvent, 'id' | 'createdAt'>>
): Promise<void> {
    await plannerUpdateEvent(id, updates)
    invalidateTables(['events'])
}

export async function deleteEvent(id: string): Promise<void> {
    await plannerDeleteEvent(id)
    invalidateTables(['events'])
}

export async function deleteEventsByCourse(courseId: string): Promise<void> {
    await plannerDeleteEventsByCourse(courseId)
    invalidateTables(['events'])
}

// ============================================
// React Hooks
// ============================================

export function useEvent(id: string): DBPlannerEvent | undefined {
    return useSupabaseQuery(
        () => getEventById(id),
        undefined,
        ['events'],
        [id],
    ).data
}

export function useEventsByDate(dateISO: string): DBPlannerEvent[] {
    return useSupabaseQuery(
        () => getEventsByDate(dateISO),
        [],
        ['events'],
        [dateISO],
    ).data
}

export function useEventsByDateRange(startISO: string, endISO: string): DBPlannerEvent[] {
    return useSupabaseQuery(
        () => getEventsByDateRange(startISO, endISO),
        [],
        ['events'],
        [startISO, endISO],
    ).data
}

export function useEventsByDateRangeGrouped(startISO: string, endISO: string): EventsByDate {
    return useSupabaseQuery(
        () => getEventsByDateRangeGrouped(startISO, endISO),
        {},
        ['events'],
        [startISO, endISO],
    ).data
}

export function useTodayEvents(): DBPlannerEvent[] {
    return useSupabaseQuery(getTodayEvents, [], ['events'], []).data
}

export function useUpcomingExams(limit = 10): DBPlannerEvent[] {
    return useSupabaseQuery(
        () => getUpcomingExams(limit),
        [],
        ['events'],
        [limit],
    ).data
}

export function useEventsByCourse(courseId: string): DBPlannerEvent[] {
    return useSupabaseQuery(
        () => getEventsByCourse(courseId),
        [],
        ['events'],
        [courseId],
    ).data
}

export function useAllEvents(): DBPlannerEvent[] {
    return useSupabaseQuery(plannerGetAllEvents, [], ['events'], []).data
}
