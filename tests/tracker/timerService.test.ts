import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock trackerRepo
const mockCreateRunningTimer = vi.fn()
const mockCreateSession = vi.fn()
const mockDeleteRunningTimer = vi.fn()
const mockGetRunningTimerForActivity = vi.fn()
const mockGetRunningTimers = vi.fn()
const mockUpdateRunningTimer = vi.fn()

vi.mock('../../src/lib/cloud/trackerRepo', () => ({
    trackerCreateRunningTimer: (...args: unknown[]) => mockCreateRunningTimer(...args),
    trackerCreateSession: (...args: unknown[]) => mockCreateSession(...args),
    trackerDeleteRunningTimer: (...args: unknown[]) => mockDeleteRunningTimer(...args),
    trackerGetRunningTimerForActivity: (...args: unknown[]) => mockGetRunningTimerForActivity(...args),
    trackerGetRunningTimers: (...args: unknown[]) => mockGetRunningTimers(...args),
    trackerUpdateRunningTimer: (...args: unknown[]) => mockUpdateRunningTimer(...args),
}))

vi.mock('../../src/lib/cloud/queryInvalidation', () => ({
    invalidateTables: vi.fn(),
}))

vi.mock('../../src/modules/settings/store/settingsStore', () => ({
    useSettingsStore: {
        getState: () => ({
            rolloverHour: 4,
            multitaskingEnabled: false,
        }),
    },
}))

import type { RunningTimer } from '../../src/db/types'
import {
    pauseTimer,
    resumeTimer,
    savePomodoroSession,
    startTimer,
    stopTimer,
} from '../../src/modules/tracker/lib/timerService'

function makeRunningTimer(overrides: Partial<RunningTimer> = {}): RunningTimer {
    return {
        id: 'timer-1',
        activityId: 'act-1',
        startedAt: Date.now() - 60_000,
        accumulatedSec: 0,
        mode: 'normal',
        createdAt: Date.now() - 60_000,
        ...overrides,
    }
}

describe('timerService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('startTimer', () => {
        it('creates a running timer when none exists', async () => {
            mockGetRunningTimerForActivity.mockResolvedValue(null)
            mockGetRunningTimers.mockResolvedValue([])
            mockCreateRunningTimer.mockResolvedValue('new-timer-id')

            await startTimer('act-1')

            expect(mockCreateRunningTimer).toHaveBeenCalledOnce()
            expect(mockCreateRunningTimer.mock.calls[0][0]).toMatchObject({
                activityId: 'act-1',
                accumulatedSec: 0,
                mode: 'normal',
            })
        })

        it('skips if timer already exists for activity (idempotent)', async () => {
            mockGetRunningTimerForActivity.mockResolvedValue(makeRunningTimer())

            await startTimer('act-1')

            expect(mockCreateRunningTimer).not.toHaveBeenCalled()
        })

        it('stops other timers when multitasking is disabled', async () => {
            mockGetRunningTimerForActivity.mockResolvedValue(null)
            const otherTimer = makeRunningTimer({ id: 'other-timer', activityId: 'act-2' })
            mockGetRunningTimers.mockResolvedValue([otherTimer])
            mockCreateSession.mockResolvedValue('session-id')
            mockDeleteRunningTimer.mockResolvedValue(undefined)
            mockCreateRunningTimer.mockResolvedValue('new-timer-id')

            await startTimer('act-1')

            // Other timer should be stopped (via stopTimer internally)
            expect(mockDeleteRunningTimer).toHaveBeenCalled()
            expect(mockCreateRunningTimer).toHaveBeenCalledOnce()
        })
    })

    describe('stopTimer', () => {
        it('creates session and deletes running timer', async () => {
            const timer = makeRunningTimer({
                startedAt: Date.now() - 120_000,
                createdAt: Date.now() - 120_000,
            })
            mockGetRunningTimers.mockResolvedValue([timer])
            mockCreateSession.mockResolvedValue('session-id')
            mockDeleteRunningTimer.mockResolvedValue(undefined)

            const result = await stopTimer('timer-1')

            expect(result).toBe('session-id')
            expect(mockCreateSession).toHaveBeenCalledOnce()
            expect(mockDeleteRunningTimer).toHaveBeenCalledWith('timer-1')
        })

        it('returns null when timer not found', async () => {
            mockGetRunningTimers.mockResolvedValue([])

            const result = await stopTimer('nonexistent')

            expect(result).toBeNull()
        })

        it('skips session creation for very short timers (< 1 sec)', async () => {
            const timer = makeRunningTimer({
                startedAt: Date.now(),
                accumulatedSec: 0,
                createdAt: Date.now(),
            })
            mockGetRunningTimers.mockResolvedValue([timer])
            mockDeleteRunningTimer.mockResolvedValue(undefined)

            const result = await stopTimer('timer-1')

            expect(result).toBeNull()
            expect(mockCreateSession).not.toHaveBeenCalled()
            expect(mockDeleteRunningTimer).toHaveBeenCalled()
        })
    })

    describe('pauseTimer', () => {
        it('pauses a running timer', async () => {
            const timer = makeRunningTimer({ startedAt: Date.now() - 30_000 })
            mockGetRunningTimers.mockResolvedValue([timer])
            mockUpdateRunningTimer.mockResolvedValue(undefined)

            await pauseTimer('timer-1')

            expect(mockUpdateRunningTimer).toHaveBeenCalledOnce()
            const updateCall = mockUpdateRunningTimer.mock.calls[0]
            expect(updateCall[0]).toBe('timer-1')
            expect(updateCall[1]).toHaveProperty('pausedAt')
            expect(updateCall[1].accumulatedSec).toBeGreaterThanOrEqual(29)
        })

        it('no-op if already paused', async () => {
            const timer = makeRunningTimer({ pausedAt: Date.now() - 5000 })
            mockGetRunningTimers.mockResolvedValue([timer])

            await pauseTimer('timer-1')

            expect(mockUpdateRunningTimer).not.toHaveBeenCalled()
        })
    })

    describe('resumeTimer', () => {
        it('resumes a paused timer', async () => {
            const timer = makeRunningTimer({ pausedAt: Date.now() - 5000, accumulatedSec: 30 })
            mockGetRunningTimers.mockResolvedValue([timer])
            mockUpdateRunningTimer.mockResolvedValue(undefined)

            await resumeTimer('timer-1')

            expect(mockUpdateRunningTimer).toHaveBeenCalledOnce()
            const updateCall = mockUpdateRunningTimer.mock.calls[0]
            expect(updateCall[0]).toBe('timer-1')
            expect(updateCall[1].pausedAt).toBeUndefined()
        })

        it('no-op if not paused', async () => {
            const timer = makeRunningTimer() // no pausedAt
            mockGetRunningTimers.mockResolvedValue([timer])

            await resumeTimer('timer-1')

            expect(mockUpdateRunningTimer).not.toHaveBeenCalled()
        })
    })

    describe('savePomodoroSession', () => {
        it('creates a time session directly', async () => {
            const startAt = Date.now() - 1500_000
            mockCreateSession.mockResolvedValue('pomo-session-id')

            const result = await savePomodoroSession('act-1', 1500, startAt)

            expect(result).toBe('pomo-session-id')
            expect(mockCreateSession).toHaveBeenCalledOnce()
            expect(mockCreateSession.mock.calls[0][0]).toMatchObject({
                activityId: 'act-1',
                durationSec: 1500,
                note: 'pomodoro',
            })
        })
    })
})
