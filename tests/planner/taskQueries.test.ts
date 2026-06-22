/**
 * Task Queries Tests — Supabase-first mutations
 *
 * addTask, updateTask (completion side-effects), deleteTask fonksiyonlarını test eder.
 * plannerRepo ve queryInvalidation mock'lanır.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/cloud/plannerRepo', () => ({
    plannerGetTasksByUnit: vi.fn(async () => []),
    plannerGetTasksByCourse: vi.fn(async () => []),
    plannerGetAllTasks: vi.fn(async () => []),
    plannerGetTaskById: vi.fn(async () => undefined),
    plannerAddTask: vi.fn(async () => 'new-task-id'),
    plannerUpdateTask: vi.fn(async () => { }),
    plannerDeleteTask: vi.fn(async () => { }),
    plannerReorderTasks: vi.fn(async () => { }),
    plannerAddCompletionRecord: vi.fn(async () => 'new-record-id'),
    plannerDeleteCompletionRecordsByTaskId: vi.fn(async () => { }),
    plannerGetOverdueTasks: vi.fn(async () => []),
    plannerGetTasksByDueDateRange: vi.fn(async () => []),
    plannerGetCourses: vi.fn(async () => []),
    plannerGetAllUnits: vi.fn(async () => []),
}))

vi.mock('../../src/lib/cloud/queryInvalidation', () => ({
    invalidateTables: vi.fn(),
}))

import { addTask, deleteTask, updateTask } from '../../src/db/planner/queries/taskQueries'
import {
    plannerAddCompletionRecord,
    plannerAddTask,
    plannerDeleteCompletionRecordsByTaskId,
    plannerDeleteTask,
    plannerGetTaskById,
    plannerGetTasksByUnit,
    plannerUpdateTask,
} from '../../src/lib/cloud/plannerRepo'
import { invalidateTables } from '../../src/lib/cloud/queryInvalidation'

const baseTask = {
    id: 'task-1',
    courseId: 'course-1',
    unitId: 'unit-1',
    text: 'Read chapter 1',
    status: 'todo' as const,
    isPriority: false,
    tags: [],
    order: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
}

describe('taskQueries — mutations', () => {
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('addTask', () => {
        it('calls plannerAddTask with correct data and invalidates tasks', async () => {
            const id = await addTask({
                courseId: 'course-1',
                unitId: 'unit-1',
                text: 'Read chapter 1',
                isPriority: true,
            })
            expect(plannerAddTask).toHaveBeenCalledWith(
                expect.objectContaining({ courseId: 'course-1', unitId: 'unit-1', text: 'Read chapter 1' }),
                0,
            )
            expect(invalidateTables).toHaveBeenCalledWith(['tasks'])
            expect(id).toBe('new-task-id')
        })

        it('uses existing task count as orderIndex', async () => {
            vi.mocked(plannerGetTasksByUnit).mockResolvedValueOnce([
                { ...baseTask, id: 't1' },
                { ...baseTask, id: 't2' },
            ])
            await addTask({ courseId: 'course-1', unitId: 'unit-1', text: 'Task 3' })
            expect(plannerAddTask).toHaveBeenCalledWith(expect.any(Object), 2)
        })

        it('propagates errors from plannerAddTask (Supabase disabled)', async () => {
            vi.mocked(plannerAddTask).mockRejectedValueOnce(
                new Error('Supabase is not configured.'),
            )
            await expect(
                addTask({ courseId: 'c1', unitId: 'u1', text: 'x' }),
            ).rejects.toThrow('Supabase is not configured.')
        })
    })

    describe('updateTask — completion side-effects (completeTask)', () => {
        it('adds a completion record when status changes to done', async () => {
            vi.mocked(plannerGetTaskById).mockResolvedValueOnce({
                ...baseTask,
                status: 'todo',
            })
            await updateTask('task-1', { status: 'done' })
            expect(plannerAddCompletionRecord).toHaveBeenCalledWith('task-1')
            expect(plannerUpdateTask).toHaveBeenCalledWith(
                'task-1',
                expect.objectContaining({ status: 'done', completedAt: expect.any(String) }),
            )
            expect(invalidateTables).toHaveBeenCalledWith(['tasks', 'completion_records'])
        })

        it('removes completion record when status changes from done to todo', async () => {
            vi.mocked(plannerGetTaskById).mockResolvedValueOnce({
                ...baseTask,
                status: 'done',
            })
            await updateTask('task-1', { status: 'todo' })
            expect(plannerDeleteCompletionRecordsByTaskId).toHaveBeenCalledWith('task-1')
            expect(plannerUpdateTask).toHaveBeenCalledWith(
                'task-1',
                expect.objectContaining({ status: 'todo', completedAt: undefined }),
            )
        })

        it('does not add completion record for non-done status updates', async () => {
            vi.mocked(plannerGetTaskById).mockResolvedValueOnce({
                ...baseTask,
                status: 'todo',
            })
            await updateTask('task-1', { status: 'in-progress' })
            expect(plannerAddCompletionRecord).not.toHaveBeenCalled()
        })

        it('is a no-op when task does not exist', async () => {
            vi.mocked(plannerGetTaskById).mockResolvedValueOnce(undefined)
            await updateTask('nonexistent', { status: 'done' })
            expect(plannerUpdateTask).not.toHaveBeenCalled()
        })
    })

    describe('deleteTask', () => {
        it('deletes completion records and task, then invalidates', async () => {
            await deleteTask('task-1')
            expect(plannerDeleteCompletionRecordsByTaskId).toHaveBeenCalledWith('task-1')
            expect(plannerDeleteTask).toHaveBeenCalledWith('task-1')
            expect(invalidateTables).toHaveBeenCalledWith(['tasks', 'completion_records'])
        })

        it('propagates errors from plannerDeleteTask', async () => {
            vi.mocked(plannerDeleteTask).mockRejectedValueOnce(new Error('DB error'))
            await expect(deleteTask('task-1')).rejects.toThrow('DB error')
        })
    })
})
