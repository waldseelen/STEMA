/**
 * Task Queries — Supabase-first
 *
 * Supabase CRUD fonksiyonları ve React hooks.
 */

import {
    plannerAddCompletionRecord,
    plannerAddTask,
    plannerDeleteCompletionRecordsByTaskId,
    plannerDeleteTask,
    plannerGetAllTasks,
    plannerGetAllUnits,
    plannerGetCourses,
    plannerGetOverdueTasks,
    plannerGetTaskById,
    plannerGetTasksByCourse,
    plannerGetTasksByDueDateRange,
    plannerGetTasksByUnit,
    plannerReorderTasks,
    plannerUpdateTask,
} from '@/lib/cloud/plannerRepo'
import { invalidateTables } from '@/lib/cloud/queryInvalidation'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'
import type { DBCourse, DBTask, DBUnit, TaskFilter, TaskStatus } from '../types'

// ============================================
// Query Functions
// ============================================

export async function getTaskById(id: string): Promise<DBTask | undefined> {
    return plannerGetTaskById(id)
}

export async function getTasksByUnit(courseId: string, unitId: string): Promise<DBTask[]> {
    return plannerGetTasksByUnit(courseId, unitId)
}

export async function getTasksByCourse(courseId: string): Promise<DBTask[]> {
    return plannerGetTasksByCourse(courseId)
}

export async function getTasksByCourseAndStatus(
    courseId: string,
    status: TaskStatus
): Promise<DBTask[]> {
    const tasks = await plannerGetTasksByCourse(courseId)
    return tasks.filter(t => t.status === status)
}

export async function getTasksByDueDateRange(
    startISO: string,
    endISO: string
): Promise<DBTask[]> {
    return plannerGetTasksByDueDateRange(startISO, endISO)
}

export async function getTasksDueToday(): Promise<DBTask[]> {
    const today = new Date().toISOString().slice(0, 10)
    return plannerGetTasksByDueDateRange(today, today)
}

export async function getOverdueTasks(): Promise<DBTask[]> {
    return plannerGetOverdueTasks()
}

export async function getCompletedTasksCount(courseId: string): Promise<number> {
    const tasks = await plannerGetTasksByCourse(courseId)
    return tasks.filter(t => t.status === 'done').length
}

export async function getTotalTasksCount(courseId: string): Promise<number> {
    const tasks = await plannerGetTasksByCourse(courseId)
    return tasks.length
}

export async function getTaskWithContext(taskId: string): Promise<{
    task: DBTask
    courseName: string
    unitName: string
} | undefined> {
    const task = await getTaskById(taskId)
    if (!task) return undefined

    const courses = await plannerGetCourses()
    const units = await plannerGetAllUnits()
    const courseMap = new Map(courses.map(c => [c.id, c]))
    const unitMap = new Map(units.map(u => [u.id, u]))

    return {
        task,
        courseName: courseMap.get(task.courseId)?.title ?? '',
        unitName: unitMap.get(task.unitId)?.title ?? '',
    }
}

export async function filterTasks(filter: TaskFilter): Promise<DBTask[]> {
    let tasks: DBTask[]

    if (filter.courseId) {
        tasks = await plannerGetTasksByCourse(filter.courseId)
    } else {
        tasks = await plannerGetAllTasks()
    }

    if (filter.unitId) {
        tasks = tasks.filter(t => t.unitId === filter.unitId)
    }

    if (filter.status) {
        tasks = tasks.filter(t => t.status === filter.status)
    }

    if (filter.hasDueDate !== undefined) {
        tasks = tasks.filter(t =>
            filter.hasDueDate ? !!t.dueDateISO : !t.dueDateISO
        )
    }

    if (filter.isPriority !== undefined) {
        tasks = tasks.filter(t => t.isPriority === filter.isPriority)
    }

    return tasks
}

// ============================================
// Mutation Functions
// ============================================

export async function addTask(data: {
    courseId: string
    unitId: string
    text: string
    icon?: string
    status?: TaskStatus
    isPriority?: boolean
    dueDateISO?: string
    tags?: string[]
    note?: string
}): Promise<string> {
    const existingTasks = await getTasksByUnit(data.courseId, data.unitId)
    const id = await plannerAddTask(data, existingTasks.length)
    invalidateTables(['tasks'])
    return id
}

export async function updateTask(
    id: string,
    updates: Partial<Omit<DBTask, 'id' | 'courseId' | 'unitId' | 'createdAt'>>
): Promise<void> {
    const task = await getTaskById(id)
    if (!task) return

    if (updates.status === 'done' && task.status !== 'done') {
        await plannerAddCompletionRecord(id)
        updates = { ...updates, completedAt: new Date().toISOString() }
    } else if (updates.status && updates.status !== 'done' && task.status === 'done') {
        await plannerDeleteCompletionRecordsByTaskId(id)
        updates = { ...updates, completedAt: undefined }
    }

    await plannerUpdateTask(id, updates)
    invalidateTables(['tasks', 'completion_records'])
}

export async function toggleTaskCompletion(id: string): Promise<boolean> {
    const task = await getTaskById(id)
    if (!task) return false

    const isDone = task.status === 'done'
    await updateTask(id, { status: isDone ? 'todo' : 'done' })
    return !isDone
}

export async function deleteTask(id: string): Promise<void> {
    await plannerDeleteCompletionRecordsByTaskId(id)
    await plannerDeleteTask(id)
    invalidateTables(['tasks', 'completion_records'])
}

export async function reorderTasks(
    _courseId: string,
    _unitId: string,
    orderedIds: string[]
): Promise<void> {
    await plannerReorderTasks(orderedIds)
    invalidateTables(['tasks'])
}

// ============================================
// React Hooks
// ============================================

export function useTask(id: string): DBTask | undefined {
    return useSupabaseQuery(
        () => getTaskById(id),
        undefined,
        ['tasks'],
        [id],
    ).data
}

export function useTasksByUnit(courseId: string, unitId: string): DBTask[] {
    return useSupabaseQuery(
        () => getTasksByUnit(courseId, unitId),
        [],
        ['tasks'],
        [courseId, unitId],
    ).data
}

export function useTasksByCourse(courseId: string): DBTask[] {
    return useSupabaseQuery(
        () => getTasksByCourse(courseId),
        [],
        ['tasks'],
        [courseId],
    ).data
}

export function useTasksDueToday(): DBTask[] {
    return useSupabaseQuery(
        getTasksDueToday,
        [],
        ['tasks'],
        [],
    ).data
}

export function useOverdueTasks(): DBTask[] {
    return useSupabaseQuery(
        getOverdueTasks,
        [],
        ['tasks'],
        [],
    ).data
}

export function useCourseProgress(courseId: string): { total: number; completed: number; percent: number } {
    return useSupabaseQuery(
        async () => {
            const [total, completed] = await Promise.all([
                getTotalTasksCount(courseId),
                getCompletedTasksCount(courseId),
            ])
            return {
                total,
                completed,
                percent: total > 0 ? Math.round((completed / total) * 100) : 0,
            }
        },
        { total: 0, completed: 0, percent: 0 },
        ['tasks'],
        [courseId],
    ).data
}

export function useAllTasksForSearch(): Array<{
    task: { id: string; text: string }
    course: DBCourse
    unit: DBUnit
}> {
    return useSupabaseQuery(
        async () => {
            const [courses, units, tasks] = await Promise.all([
                plannerGetCourses(),
                plannerGetAllUnits(),
                plannerGetAllTasks(),
            ])
            const courseMap = new Map(courses.map(c => [c.id, c]))
            const unitMap = new Map(units.map(u => [u.id, u]))
            return tasks
                .map(task => ({
                    task: { id: task.id, text: task.text },
                    course: courseMap.get(task.courseId),
                    unit: unitMap.get(task.unitId),
                }))
                .filter((e): e is { task: { id: string; text: string }; course: DBCourse; unit: DBUnit } =>
                    e.course !== undefined && e.unit !== undefined
                )
        },
        [],
        ['tasks', 'courses', 'units'],
        [],
    ).data
}

export function useActiveTasksWithContext(limit?: number): Array<{
    task: DBTask
    course: DBCourse
    unit: DBUnit
}> {
    return useSupabaseQuery(
        async () => {
            const [courses, units, allTasks] = await Promise.all([
                plannerGetCourses(),
                plannerGetAllUnits(),
                plannerGetAllTasks(),
            ])

            const tasks = allTasks
                .filter(t => t.status !== 'done')
                .sort((a, b) => {
                    if (a.dueDateISO && b.dueDateISO) return a.dueDateISO.localeCompare(b.dueDateISO)
                    if (a.dueDateISO) return -1
                    if (b.dueDateISO) return 1
                    return a.createdAt.localeCompare(b.createdAt)
                })

            const visibleTasks = typeof limit === 'number' ? tasks.slice(0, limit) : tasks

            const courseMap = new Map(courses.map(c => [c.id, c]))
            const unitMap = new Map(units.map(u => [u.id, u]))

            return visibleTasks
                .map(task => ({
                    task,
                    course: courseMap.get(task.courseId),
                    unit: unitMap.get(task.unitId),
                }))
                .filter((e): e is { task: DBTask; course: DBCourse; unit: DBUnit } =>
                    e.course !== undefined && e.unit !== undefined
                )
        },
        [],
        ['tasks', 'courses', 'units'],
        [limit],
    ).data
}
