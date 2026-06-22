/**
 * Reminder Queries Tests — Supabase-first mutations
 *
 * createReminder, updateReminder, deleteReminder fonksiyonlarını test eder.
 * trackerRepo ve queryInvalidation mock'lanır.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/cloud/trackerRepo', () => ({
    trackerGetReminders: vi.fn(async () => []),
    trackerCreateReminder: vi.fn(async () => 'new-reminder-id'),
    trackerUpdateReminder: vi.fn(async () => { }),
    trackerDeleteReminder: vi.fn(async () => { }),
}))

vi.mock('../../src/lib/cloud/queryInvalidation', () => ({
    invalidateTables: vi.fn(),
}))

import {
    createReminder,
    deleteReminder,
    updateReminder,
} from '../../src/db/time-tracking/queries/reminderQueries'
import { invalidateTables } from '../../src/lib/cloud/queryInvalidation'
import {
    trackerCreateReminder,
    trackerDeleteReminder,
    trackerUpdateReminder,
} from '../../src/lib/cloud/trackerRepo'

const baseReminder = {
    activityId: 'act-1',
    label: 'Daily check-in',
    time: '09:00',
    days: [1, 2, 3, 4, 5],
    enabled: true,
}

describe('reminderQueries — mutations', () => {
    afterEach(() => {
        vi.clearAllMocks()
    })

    describe('createReminder', () => {
        it('calls trackerCreateReminder and invalidates reminders', async () => {
            const id = await createReminder(baseReminder)
            expect(trackerCreateReminder).toHaveBeenCalledWith(baseReminder)
            expect(invalidateTables).toHaveBeenCalledWith(['reminders'])
            expect(id).toBe('new-reminder-id')
        })

        it('propagates errors from trackerCreateReminder (Supabase disabled)', async () => {
            vi.mocked(trackerCreateReminder).mockRejectedValueOnce(
                new Error('Supabase is not configured.'),
            )
            await expect(createReminder(baseReminder)).rejects.toThrow(
                'Supabase is not configured.',
            )
        })
    })

    describe('updateReminder', () => {
        it('calls trackerUpdateReminder and invalidates reminders', async () => {
            await updateReminder('rem-1', { enabled: false })
            expect(trackerUpdateReminder).toHaveBeenCalledWith('rem-1', { enabled: false })
            expect(invalidateTables).toHaveBeenCalledWith(['reminders'])
        })

        it('propagates errors from trackerUpdateReminder', async () => {
            vi.mocked(trackerUpdateReminder).mockRejectedValueOnce(new Error('DB error'))
            await expect(updateReminder('rem-1', { enabled: false })).rejects.toThrow('DB error')
        })
    })

    describe('deleteReminder', () => {
        it('calls trackerDeleteReminder and invalidates reminders', async () => {
            await deleteReminder('rem-1')
            expect(trackerDeleteReminder).toHaveBeenCalledWith('rem-1')
            expect(invalidateTables).toHaveBeenCalledWith(['reminders'])
        })

        it('propagates errors from trackerDeleteReminder', async () => {
            vi.mocked(trackerDeleteReminder).mockRejectedValueOnce(new Error('Not found'))
            await expect(deleteReminder('rem-1')).rejects.toThrow('Not found')
        })
    })
})
