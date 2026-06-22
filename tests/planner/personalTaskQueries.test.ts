/**
 * Personal Task Queries Tests — Supabase-first mutations
 *
 * addPersonalTask, updatePersonalTask, deletePersonalTask fonksiyonlarını test eder.
 * plannerRepo ve queryInvalidation mock'lanır.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/cloud/plannerRepo', () => ({
    plannerGetPersonalTasks: vi.fn(async () => []),
    plannerGetPersonalTaskById: vi.fn(async () => undefined),
    plannerAddPersonalTask: vi.fn(async () => 'new-personal-task-id'),
    plannerUpdatePersonalTask: vi.fn(async () => { }),
    plannerDeletePersonalTask: vi.fn(async () => { }),
}))

vi.mock('../../src/lib/cloud/queryInvalidation', () => ({
    invalidateTables: vi.fn(),
}))

import {
    addPersonalTask,
    deletePersonalTask,
    updatePersonalTask,
} from '../../src/db/planner/queries/personalTaskQueries'
import {
    plannerAddPersonalTask,
    plannerDeletePersonalTask,
    plannerGetPersonalTaskById,
    plannerGetPersonalTasks,
    plannerUpdatePersonalTask,
} from '../../src/lib/cloud/plannerRepo'
import { invalidateTables } from '../../src/lib/cloud/queryInvalidation'

const baseTask = {
    id: 'ptask-1',
    text: 'Buy groceries',
    status: 'todo' as const,
    isPriority: false,
    order: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
}

describe('personalTaskQueries — mutations', () => {
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('addPersonalTask', () => {
        it('calls plannerAddPersonalTask with correct data and invalidates personal_tasks', async () => {
            const id = await addPersonalTask({ text: 'Buy groceries', isPriority: true })
            expect(plannerAddPersonalTask).toHaveBeenCalledWith(
                expect.objectContaining({ text: 'Buy groceries', isPriority: true }),
                0,
            )
            expect(invalidateTables).toHaveBeenCalledWith(['personal_tasks'])
            expect(id).toBe('new-personal-task-id')
        })

        it('uses existing task count as orderIndex', async () => {
            vi.mocked(plannerGetPersonalTasks).mockResolvedValueOnce([
                { ...baseTask, id: 'pt1' },
                { ...baseTask, id: 'pt2' },
            ])
            await addPersonalTask({ text: 'Third task' })
            expect(plannerAddPersonalTask).toHaveBeenCalledWith(expect.any(Object), 2)
        })

        it('propagates errors from plannerAddPersonalTask (Supabase disabled)', async () => {
            vi.mocked(plannerAddPersonalTask).mockRejectedValueOnce(
                new Error('Supabase is not configured.'),
            )
            await expect(addPersonalTask({ text: 'x' })).rejects.toThrow(
                'Supabase is not configured.',
            )
        })
    })

    describe('updatePersonalTask — completion side-effects', () => {
        it('sets completedAt when status changes to done', async () => {
            vi.mocked(plannerGetPersonalTaskById).mockResolvedValueOnce({
                ...baseTask,
                status: 'todo',
            })
            await updatePersonalTask('ptask-1', { status: 'done' })
            expect(plannerUpdatePersonalTask).toHaveBeenCalledWith(
                'ptask-1',
                expect.objectContaining({ status: 'done', completedAt: expect.any(String) }),
            )
            expect(invalidateTables).toHaveBeenCalledWith(['personal_tasks'])
        })

        it('clears completedAt when status changes from done', async () => {
            vi.mocked(plannerGetPersonalTaskById).mockResolvedValueOnce({
                ...baseTask,
                status: 'done',
            })
            await updatePersonalTask('ptask-1', { status: 'todo' })
            expect(plannerUpdatePersonalTask).toHaveBeenCalledWith(
                'ptask-1',
                expect.objectContaining({ status: 'todo', completedAt: undefined }),
            )
        })

        it('is a no-op when task does not exist', async () => {
            vi.mocked(plannerGetPersonalTaskById).mockResolvedValueOnce(undefined)
            await updatePersonalTask('nonexistent', { status: 'done' })
            expect(plannerUpdatePersonalTask).not.toHaveBeenCalled()
        })
    })

    describe('deletePersonalTask', () => {
        it('calls plannerDeletePersonalTask and invalidates personal_tasks', async () => {
            await deletePersonalTask('ptask-1')
            expect(plannerDeletePersonalTask).toHaveBeenCalledWith('ptask-1')
            expect(invalidateTables).toHaveBeenCalledWith(['personal_tasks'])
        })

        it('propagates errors from plannerDeletePersonalTask', async () => {
            vi.mocked(plannerDeletePersonalTask).mockRejectedValueOnce(new Error('DB error'))
            await expect(deletePersonalTask('ptask-1')).rejects.toThrow('DB error')
        })
    })
})
