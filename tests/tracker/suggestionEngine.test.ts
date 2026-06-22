import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock trackerRepo
const mockGetAllActivities = vi.fn()
const mockGetSessionsByDateRange = vi.fn()

vi.mock('../../src/lib/cloud/trackerRepo', () => ({
    trackerGetAllActivities: (...args: unknown[]) => mockGetAllActivities(...args),
    trackerGetSessionsByDateRange: (...args: unknown[]) => mockGetSessionsByDateRange(...args),
}))

vi.mock('../../src/i18n', () => ({
    getCurrentLocale: () => 'tr',
    getTranslation: () => 'Bilinmeyen',
}))

import type { Activity, TimeSession } from '../../src/db/types'
import { getCurrentSuggestion, getHourlySuggestions } from '../../src/modules/tracker/lib/suggestionEngine'

function makeSession(overrides: Partial<TimeSession> = {}): TimeSession {
    const now = Date.now()
    return {
        id: 'sess-1',
        activityId: 'act-1',
        startAt: now,
        endAt: now + 3600_000,
        durationSec: 3600,
        note: '',
        dateKey: '2026-03-10',
        mergedFromIds: [],
        createdAt: now,
        updatedAt: now,
        ...overrides,
    }
}

function makeActivity(overrides: Partial<Activity> = {}): Activity {
    return {
        id: 'act-1',
        name: 'Coding',
        categoryId: 'cat-1',
        tagIds: [],
        archived: false,
        defaultGoalIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides,
    }
}

describe('suggestionEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty map when no sessions exist', async () => {
        mockGetSessionsByDateRange.mockResolvedValue([])
        mockGetAllActivities.mockResolvedValue([])

        const suggestions = await getHourlySuggestions()

        expect(suggestions.size).toBe(0)
    })

    it('returns suggestion when activity has >= 2 sessions at same hour', async () => {
        const hour10 = new Date('2026-03-10T10:00:00').getTime()
        const sessions = [
            makeSession({ id: 's1', startAt: hour10 }),
            makeSession({ id: 's2', startAt: hour10 + 60_000 }),
        ]
        mockGetSessionsByDateRange.mockResolvedValue(sessions)
        mockGetAllActivities.mockResolvedValue([makeActivity()])

        const suggestions = await getHourlySuggestions()

        expect(suggestions.has(10)).toBe(true)
        const suggestion = suggestions.get(10)!
        expect(suggestion.activityId).toBe('act-1')
        expect(suggestion.activityName).toBe('Coding')
        expect(suggestion.count).toBe(2)
        expect(suggestion.confidence).toBe(1)
    })

    it('does not suggest when activity count < 2', async () => {
        const hour10 = new Date('2026-03-10T10:00:00').getTime()
        mockGetSessionsByDateRange.mockResolvedValue([
            makeSession({ id: 's1', startAt: hour10 }),
        ])
        mockGetAllActivities.mockResolvedValue([makeActivity()])

        const suggestions = await getHourlySuggestions()

        expect(suggestions.has(10)).toBe(false)
    })

    it('picks the most frequent activity at a given hour', async () => {
        const hour14 = new Date('2026-03-10T14:00:00').getTime()
        const sessions = [
            makeSession({ id: 's1', activityId: 'act-1', startAt: hour14 }),
            makeSession({ id: 's2', activityId: 'act-2', startAt: hour14 + 1000 }),
            makeSession({ id: 's3', activityId: 'act-2', startAt: hour14 + 2000 }),
            makeSession({ id: 's4', activityId: 'act-2', startAt: hour14 + 3000 }),
        ]
        const activities = [
            makeActivity({ id: 'act-1', name: 'Coding' }),
            makeActivity({ id: 'act-2', name: 'Reading' }),
        ]
        mockGetSessionsByDateRange.mockResolvedValue(sessions)
        mockGetAllActivities.mockResolvedValue(activities)

        const suggestions = await getHourlySuggestions()

        expect(suggestions.get(14)?.activityId).toBe('act-2')
        expect(suggestions.get(14)?.activityName).toBe('Reading')
        expect(suggestions.get(14)?.count).toBe(3)
    })

    it('getCurrentSuggestion returns null when no data', async () => {
        mockGetSessionsByDateRange.mockResolvedValue([])
        mockGetAllActivities.mockResolvedValue([])

        const suggestion = await getCurrentSuggestion()

        expect(suggestion).toBeNull()
    })
})
