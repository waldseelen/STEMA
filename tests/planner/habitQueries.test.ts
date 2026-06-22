 
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearPlannerData } from '../../src/db/planner/database'

// Mock the plannerRepo to avoid requiring Supabase auth
vi.mock('../../src/lib/cloud/plannerRepo', () => {
    let habits: Record<string, unknown>[] = []
    return {
        plannerGetAllHabits: vi.fn(async () => habits),
        plannerGetHabitById: vi.fn(async (id: string) => habits.find(h => h.id === id)),
        plannerAddHabit: vi.fn(async () => 'new-habit-id'),
        plannerUpdateHabit: vi.fn(async () => { }),
        plannerDeleteHabit: vi.fn(async () => { }),
        plannerUpsertHabitLog: vi.fn(async () => 'new-log-id'),
        plannerGetHabitLogForDate: vi.fn(async () => undefined),
        _setHabits: (h: Record<string, unknown>[]) => { habits = h },
    }
})

vi.mock('../../src/lib/cloud/queryInvalidation', () => ({
    invalidateTables: vi.fn(),
}))

import {
    addHabit,
    deleteHabit,
    getActiveHabits,
    getArchivedHabits,
    logHabit,
} from '../../src/db/planner/queries/habitQueries'
import {
    _setHabits,
    plannerAddHabit,
    plannerDeleteHabit,
    plannerUpsertHabitLog,
} from '../../src/lib/cloud/plannerRepo'
import { invalidateTables } from '../../src/lib/cloud/queryInvalidation'

describe('planner habit queries', () => {
    beforeEach(async () => {
        await clearPlannerData()
    })

    afterEach(async () => {
        await clearPlannerData()
        vi.clearAllMocks()
            ; ((_setHabits as unknown) as (h: Record<string, unknown>[]) => void)([])
    })

    it('returns active and archived habits without querying boolean key ranges', async () => {
        const mockHabits = [
            {
                id: 'habit-active',
                title: 'Read',
                emoji: '📚',
                type: 'boolean',
                frequency: { type: 'weeklyTarget', timesPerWeek: 3 },
                isArchived: false,
                order: 0,
                createdAt: '2026-03-11T00:00:00.000Z',
                updatedAt: '2026-03-11T00:00:00.000Z',
            },
            {
                id: 'habit-archived',
                title: 'Run',
                emoji: '🏃',
                type: 'boolean',
                frequency: { type: 'specificDays', days: [1, 3, 5] },
                isArchived: true,
                order: 1,
                createdAt: '2026-03-11T00:00:00.000Z',
                updatedAt: '2026-03-11T00:00:00.000Z',
            },
        ]
            ; ((_setHabits as unknown) as (h: Record<string, unknown>[]) => void)(mockHabits)

        await expect(getActiveHabits()).resolves.toMatchObject([
            { id: 'habit-active', isArchived: false },
        ])

        await expect(getArchivedHabits()).resolves.toMatchObject([
            { id: 'habit-archived', isArchived: true },
        ])
    })
})

describe('habitQueries — mutations', () => {
    afterEach(() => {
        vi.clearAllMocks()
            ; ((_setHabits as unknown) as (h: Record<string, unknown>[]) => void)([])
    })

    describe('addHabit', () => {
        it('calls plannerAddHabit and invalidates habits', async () => {
            const id = await addHabit({
                title: 'Read daily',
                type: 'boolean',
                frequency: { type: 'daily' },
            })
            expect(plannerAddHabit).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Read daily', type: 'boolean' }),
                0,
            )
            expect(invalidateTables).toHaveBeenCalledWith(['habits'])
            expect(id).toBe('new-habit-id')
        })

        it('propagates errors from plannerAddHabit (Supabase disabled)', async () => {
            vi.mocked(plannerAddHabit).mockRejectedValueOnce(
                new Error('Supabase is not configured.'),
            )
            await expect(
                addHabit({ title: 'x', type: 'boolean', frequency: { type: 'daily' } }),
            ).rejects.toThrow('Supabase is not configured.')
        })
    })

    describe('logHabit', () => {
        it('calls plannerUpsertHabitLog and invalidates habit_logs', async () => {
            await logHabit('habit-1', '2026-03-14', true)
            expect(plannerUpsertHabitLog).toHaveBeenCalledWith({
                habitId: 'habit-1',
                dateISO: '2026-03-14',
                done: true,
                value: undefined,
            })
            expect(invalidateTables).toHaveBeenCalledWith(['habit_logs'])
        })

        it('propagates errors from plannerUpsertHabitLog', async () => {
            vi.mocked(plannerUpsertHabitLog).mockRejectedValueOnce(new Error('DB error'))
            await expect(logHabit('habit-1', '2026-03-14')).rejects.toThrow('DB error')
        })
    })

    describe('deleteHabit', () => {
        it('calls plannerDeleteHabit and invalidates habits + habit_logs', async () => {
            await deleteHabit('habit-1')
            expect(plannerDeleteHabit).toHaveBeenCalledWith('habit-1')
            expect(invalidateTables).toHaveBeenCalledWith(['habits', 'habit_logs'])
        })

        it('propagates errors from plannerDeleteHabit', async () => {
            vi.mocked(plannerDeleteHabit).mockRejectedValueOnce(new Error('Not found'))
            await expect(deleteHabit('habit-1')).rejects.toThrow('Not found')
        })
    })
})
