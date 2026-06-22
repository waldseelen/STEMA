/**
 * Personal Task Queries — Supabase-first
 *
 * Supabase CRUD fonksiyonları ve React hooks.
 */

import {
    plannerAddPersonalTask,
    plannerDeletePersonalTask,
    plannerGetPersonalTaskById,
    plannerGetPersonalTasks,
    plannerUpdatePersonalTask,
} from '@/lib/cloud/plannerRepo'
import { invalidateTables } from '@/lib/cloud/queryInvalidation'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'
import type { DBPersonalTask, TaskStatus } from '../types'

// ============================================
// Query Functions
// ============================================

export async function getAllPersonalTasks(): Promise<DBPersonalTask[]> {
    return plannerGetPersonalTasks()
}

export async function getPersonalTaskById(id: string): Promise<DBPersonalTask | undefined> {
    return plannerGetPersonalTaskById(id)
}

export async function getPersonalTasksByStatus(status: TaskStatus): Promise<DBPersonalTask[]> {
    const tasks = await getAllPersonalTasks()
    return tasks.filter(t => t.status === status)
}

export async function getPersonalTasksDueToday(): Promise<DBPersonalTask[]> {
    const today = new Date().toISOString().slice(0, 10)
    const tasks = await getAllPersonalTasks()
    return tasks.filter(t => t.dueDateISO === today)
}

export async function getOverduePersonalTasks(): Promise<DBPersonalTask[]> {
    const today = new Date().toISOString().slice(0, 10)
    const tasks = await getAllPersonalTasks()
    return tasks.filter(t => t.dueDateISO && t.dueDateISO < today && t.status !== 'done')
}

export async function getIncompletePersonalTasks(): Promise<DBPersonalTask[]> {
    const tasks = await getAllPersonalTasks()
    return tasks.filter(t => t.status !== 'done')
}

export async function getCompletedPersonalTasksCount(): Promise<number> {
    const tasks = await getAllPersonalTasks()
    return tasks.filter(t => t.status === 'done').length
}

// ============================================
// Mutation Functions
// ============================================

export async function addPersonalTask(data: {
    text: string
    icon?: string
    status?: TaskStatus
    isPriority?: boolean
    dueDateISO?: string
    note?: string
}): Promise<string> {
    const existing = await getAllPersonalTasks()
    const id = await plannerAddPersonalTask(data, existing.length)
    invalidateTables(['personal_tasks'])
    return id
}

export async function updatePersonalTask(
    id: string,
    updates: Partial<Omit<DBPersonalTask, 'id' | 'createdAt'>>
): Promise<void> {
    const task = await getPersonalTaskById(id)
    if (!task) return

    if (updates.status === 'done' && task.status !== 'done') {
        updates = { ...updates, completedAt: new Date().toISOString() }
    } else if (updates.status && updates.status !== 'done' && task.status === 'done') {
        updates = { ...updates, completedAt: undefined }
    }

    await plannerUpdatePersonalTask(id, updates)
    invalidateTables(['personal_tasks'])
}

export async function togglePersonalTaskCompletion(id: string): Promise<boolean> {
    const task = await getPersonalTaskById(id)
    if (!task) return false

    const isDone = task.status === 'done'
    await updatePersonalTask(id, { status: isDone ? 'todo' : 'done' })
    return !isDone
}

export async function deletePersonalTask(id: string): Promise<void> {
    await plannerDeletePersonalTask(id)
    invalidateTables(['personal_tasks'])
}

export async function reorderPersonalTasks(orderedIds: string[]): Promise<void> {
    await Promise.all(
        orderedIds.map((id, idx) => plannerUpdatePersonalTask(id, { order: idx }))
    )
    invalidateTables(['personal_tasks'])
}

// ============================================
// React Hooks
// ============================================

export function usePersonalTasks(): DBPersonalTask[] {
    return useSupabaseQuery(getAllPersonalTasks, [], ['personal_tasks'], []).data
}

export function usePersonalTask(id: string): DBPersonalTask | undefined {
    return useSupabaseQuery(
        () => getPersonalTaskById(id),
        undefined,
        ['personal_tasks'],
        [id],
    ).data
}

export function usePersonalTasksByStatus(status: TaskStatus): DBPersonalTask[] {
    return useSupabaseQuery(
        () => getPersonalTasksByStatus(status),
        [],
        ['personal_tasks'],
        [status],
    ).data
}

export function useIncompletePersonalTasks(): DBPersonalTask[] {
    return useSupabaseQuery(getIncompletePersonalTasks, [], ['personal_tasks'], []).data
}

export function usePersonalTasksDueToday(): DBPersonalTask[] {
    return useSupabaseQuery(getPersonalTasksDueToday, [], ['personal_tasks'], []).data
}
