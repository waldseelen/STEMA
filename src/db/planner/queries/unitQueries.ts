/**
 * Unit Queries — Supabase-first
 *
 * Supabase CRUD fonksiyonları ve React hooks.
 */

import {
    plannerAddUnit,
    plannerDeleteUnit,
    plannerGetTasksByUnit,
    plannerGetUnitById,
    plannerGetUnitsByCourse,
    plannerUpdateCourse,
    plannerUpdateUnit,
} from '@/lib/cloud/plannerRepo'
import { invalidateTables } from '@/lib/cloud/queryInvalidation'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'
import type { DBUnit, UnitWithTasks } from '../types'

// ============================================
// Query Functions
// ============================================

export async function getUnitsByCourse(courseId: string): Promise<DBUnit[]> {
    return plannerGetUnitsByCourse(courseId)
}

export async function getUnitById(id: string): Promise<DBUnit | undefined> {
    return plannerGetUnitById(id)
}

export async function getUnitsWithTasks(courseId: string): Promise<UnitWithTasks[]> {
    const units = await getUnitsByCourse(courseId)

    return Promise.all(
        units.map(async (unit) => {
            const tasks = await plannerGetTasksByUnit(courseId, unit.id)
            return { ...unit, tasks }
        })
    )
}

// ============================================
// Mutation Functions
// ============================================

export async function addUnit(data: {
    courseId: string
    title: string
}): Promise<string> {
    const existingUnits = await getUnitsByCourse(data.courseId)
    const id = await plannerAddUnit(data, existingUnits.length)
    await plannerUpdateCourse(data.courseId, {})
    invalidateTables(['units', 'courses'])
    return id
}

export async function updateUnit(
    id: string,
    updates: Partial<Omit<DBUnit, 'id' | 'courseId' | 'createdAt'>>
): Promise<void> {
    const unit = await getUnitById(id)
    if (!unit) return

    await plannerUpdateUnit(id, updates)
    await plannerUpdateCourse(unit.courseId, {})
    invalidateTables(['units', 'courses'])
}

export async function deleteUnit(id: string): Promise<void> {
    const unit = await getUnitById(id)
    if (!unit) return

    await plannerDeleteUnit(id)
    await plannerUpdateCourse(unit.courseId, {})
    invalidateTables(['units', 'tasks', 'courses'])
}

export async function reorderUnits(courseId: string, orderedIds: string[]): Promise<void> {
    await Promise.all(
        orderedIds.map((unitId, idx) => plannerUpdateUnit(unitId, { order: idx }))
    )
    await plannerUpdateCourse(courseId, {})
    invalidateTables(['units', 'courses'])
}

// ============================================
// React Hooks
// ============================================

export function useUnitsByCourse(courseId: string): DBUnit[] {
    return useSupabaseQuery(
        () => getUnitsByCourse(courseId),
        [],
        ['units'],
        [courseId],
    ).data
}

export function useUnit(id: string): DBUnit | undefined {
    return useSupabaseQuery(
        () => getUnitById(id),
        undefined,
        ['units'],
        [id],
    ).data
}

export function useUnitsWithTasks(courseId: string): UnitWithTasks[] {
    return useSupabaseQuery(
        () => getUnitsWithTasks(courseId),
        [],
        ['units', 'tasks'],
        [courseId],
    ).data
}
