
/**
 * Category Queries Tests — Supabase-first mutations
 *
 * createCategory, deleteCategory (archiving activities) fonksiyonlarını test eder.
 * trackerRepo ve queryInvalidation mock'lanır.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/cloud/trackerRepo', () => ({
    trackerGetActiveActivities: vi.fn(async () => []),
    trackerGetActivitiesByCategory: vi.fn(async () => []),
    trackerGetArchivedActivities: vi.fn(async () => []),
    trackerGetActivityById: vi.fn(async () => undefined),
    trackerCreateActivity: vi.fn(async () => 'new-activity-id'),
    trackerUpdateActivity: vi.fn(async () => { }),
    trackerDeleteActivity: vi.fn(async () => { }),
    trackerCreateCategory: vi.fn(async () => 'new-category-id'),
    trackerUpdateCategory: vi.fn(async () => { }),
    trackerDeleteCategory: vi.fn(async () => { }),
    trackerGetAllTags: vi.fn(async () => []),
    trackerCreateTag: vi.fn(async () => 'new-tag-id'),
    trackerUpdateTag: vi.fn(async () => { }),
    trackerDeleteTag: vi.fn(async () => { }),
}))

vi.mock('../../src/lib/cloud/queryInvalidation', () => ({
    invalidateTables: vi.fn(),
}))

import { createCategory, deleteCategory } from '../../src/db/time-tracking/queries/activityQueries'
import { invalidateTables } from '../../src/lib/cloud/queryInvalidation'
import {
    trackerCreateCategory,
    trackerDeleteCategory,
    trackerGetActivitiesByCategory,
    trackerUpdateActivity,
} from '../../src/lib/cloud/trackerRepo'

describe('categoryQueries — mutations', () => {
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('createCategory', () => {
        it('calls trackerCreateCategory and invalidates categories', async () => {
            const id = await createCategory({ name: 'Work', color: '#3b82f6', icon: 'briefcase' })
            expect(trackerCreateCategory).toHaveBeenCalledWith({
                name: 'Work',
                color: '#3b82f6',
                icon: 'briefcase',
            })
            expect(invalidateTables).toHaveBeenCalledWith(['categories'])
            expect(id).toBe('new-category-id')
        })

        it('propagates errors from trackerCreateCategory (Supabase disabled)', async () => {
            vi.mocked(trackerCreateCategory).mockRejectedValueOnce(
                new Error('Supabase is not configured.'),
            )
            await expect(
                createCategory({ name: 'x', color: '#000', icon: 'x' }),
            ).rejects.toThrow('Supabase is not configured.')
        })
    })

    describe('deleteCategory', () => {
        it('archives linked activities before deleting and invalidates both tables', async () => {
            vi.mocked(trackerGetActivitiesByCategory).mockResolvedValueOnce([
                { id: 'act-1' } as Record<string, unknown>,
                { id: 'act-2' } as Record<string, unknown>,
            ])
            await deleteCategory('cat-1')
            expect(trackerGetActivitiesByCategory).toHaveBeenCalledWith('cat-1')
            expect(trackerUpdateActivity).toHaveBeenCalledWith('act-1', { archived: true })
            expect(trackerUpdateActivity).toHaveBeenCalledWith('act-2', { archived: true })
            expect(trackerDeleteCategory).toHaveBeenCalledWith('cat-1')
            expect(invalidateTables).toHaveBeenCalledWith(['categories', 'activities'])
        })

        it('deletes with no linked activities', async () => {
            vi.mocked(trackerGetActivitiesByCategory).mockResolvedValueOnce([])
            await deleteCategory('cat-empty')
            expect(trackerUpdateActivity).not.toHaveBeenCalled()
            expect(trackerDeleteCategory).toHaveBeenCalledWith('cat-empty')
            expect(invalidateTables).toHaveBeenCalledWith(['categories', 'activities'])
        })

        it('propagates errors from trackerDeleteCategory', async () => {
            vi.mocked(trackerGetActivitiesByCategory).mockResolvedValueOnce([])
            vi.mocked(trackerDeleteCategory).mockRejectedValueOnce(new Error('DB error'))
            await expect(deleteCategory('cat-1')).rejects.toThrow('DB error')
        })
    })
})
