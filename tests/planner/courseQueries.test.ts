 
/**
 * Course Queries Tests — Supabase-first mutations
 *
 * addCourse, updateCourse, deleteCourse mutation fonksiyonlarını test eder.
 * plannerRepo ve queryInvalidation mock'lanır.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/cloud/plannerRepo', () => ({
    plannerGetCourses: vi.fn(async () => []),
    plannerGetCourseById: vi.fn(async () => undefined),
    plannerAddCourse: vi.fn(async () => 'new-course-id'),
    plannerUpdateCourse: vi.fn(async () => { }),
    plannerDeleteCourse: vi.fn(async () => { }),
    plannerReorderCourses: vi.fn(async () => { }),
    plannerGetUnitsByCourse: vi.fn(async () => []),
    plannerCountTasks: vi.fn(async () => ({ total: 0, completed: 0 })),
}))

vi.mock('../../src/lib/cloud/queryInvalidation', () => ({
    invalidateTables: vi.fn(),
}))

vi.mock('../../src/modules/planner/lib/pdfStorage', () => ({
    deleteCoursePDFs: vi.fn(async () => { }),
}))

import { addCourse, deleteCourse, updateCourse } from '../../src/db/planner/queries/courseQueries'
import {
    plannerAddCourse,
    plannerDeleteCourse,
    plannerGetCourses,
    plannerUpdateCourse,
} from '../../src/lib/cloud/plannerRepo'
import { invalidateTables } from '../../src/lib/cloud/queryInvalidation'
import { deleteCoursePDFs } from '../../src/modules/planner/lib/pdfStorage'

describe('courseQueries — mutations', () => {
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('addCourse', () => {
        it('calls plannerAddCourse with correct data and invalidates courses', async () => {
            const id = await addCourse({ title: 'Math', code: 'MTH101' })
            expect(plannerAddCourse).toHaveBeenCalledWith(
                { title: 'Math', code: 'MTH101' },
                0,
            )
            expect(invalidateTables).toHaveBeenCalledWith(['courses'])
            expect(id).toBe('new-course-id')
        })

        it('uses existing course count as orderIndex', async () => {
            vi.mocked(plannerGetCourses).mockResolvedValueOnce([
                { id: 'c1' } as Record<string, unknown>,
                { id: 'c2' } as Record<string, unknown>,
            ])
            await addCourse({ title: 'Physics' })
            expect(plannerAddCourse).toHaveBeenCalledWith(expect.any(Object), 2)
        })

        it('propagates errors from plannerAddCourse (Supabase disabled)', async () => {
            vi.mocked(plannerAddCourse).mockRejectedValueOnce(
                new Error('Supabase is not configured.'),
            )
            await expect(addCourse({ title: 'Math' })).rejects.toThrow(
                'Supabase is not configured.',
            )
        })
    })

    describe('updateCourse', () => {
        it('calls plannerUpdateCourse and invalidates courses', async () => {
            await updateCourse('course-1', { title: 'Updated Math' })
            expect(plannerUpdateCourse).toHaveBeenCalledWith('course-1', { title: 'Updated Math' })
            expect(invalidateTables).toHaveBeenCalledWith(['courses'])
        })

        it('propagates errors from plannerUpdateCourse', async () => {
            vi.mocked(plannerUpdateCourse).mockRejectedValueOnce(new Error('DB error'))
            await expect(updateCourse('course-1', { title: 'x' })).rejects.toThrow('DB error')
        })
    })

    describe('deleteCourse', () => {
        it('deletes PDFs, calls plannerDeleteCourse, and invalidates multiple tables', async () => {
            await deleteCourse('course-1')
            expect(deleteCoursePDFs).toHaveBeenCalledWith('course-1')
            expect(plannerDeleteCourse).toHaveBeenCalledWith('course-1')
            expect(invalidateTables).toHaveBeenCalledWith(['courses', 'units', 'tasks', 'events'])
        })

        it('propagates errors from plannerDeleteCourse', async () => {
            vi.mocked(plannerDeleteCourse).mockRejectedValueOnce(new Error('Not found'))
            await expect(deleteCourse('course-1')).rejects.toThrow('Not found')
        })
    })
})
