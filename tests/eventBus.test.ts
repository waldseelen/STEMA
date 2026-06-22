import { beforeEach, describe, expect, it } from 'vitest'
import { eventBus } from '../src/events/eventBus'

describe('EventBus', () => {
    beforeEach(() => {
        eventBus.clear()
    })

    it('should subscribe and receive events', async () => {
        let received = false
        let receivedPayload: unknown = null

        eventBus.subscribe('TIMER_STARTED', (payload) => {
            received = true
            receivedPayload = payload
        })

        await eventBus.publish('TIMER_STARTED', {
            timerId: 'test-1',
            activityId: 'activity-1',
            startedAt: Date.now(),
            mode: 'normal',
        })

        expect(received).toBe(true)
        expect(receivedPayload).toHaveProperty('timerId', 'test-1')
    })

    it('should unsubscribe correctly', async () => {
        let callCount = 0

        const subscription = eventBus.subscribe('TIMER_STOPPED', () => {
            callCount++
        })

        await eventBus.publish('TIMER_STOPPED', {
            timerId: 'test-1',
            activityId: 'activity-1',
            durationSec: 100,
            sessionId: 'session-1',
        })

        expect(callCount).toBe(1)

        subscription.unsubscribe()

        await eventBus.publish('TIMER_STOPPED', {
            timerId: 'test-2',
            activityId: 'activity-1',
            durationSec: 200,
            sessionId: 'session-2',
        })

        expect(callCount).toBe(1)
    })

    it('should handle multiple subscribers', async () => {
        let count1 = 0
        let count2 = 0

        eventBus.subscribe('HABIT_CHECKED', () => { count1++ })
        eventBus.subscribe('HABIT_CHECKED', () => { count2++ })

        await eventBus.publish('HABIT_CHECKED', {
            log: {} as unknown,
            habitId: 'habit-1',
            currentStreak: 5,
        })

        expect(count1).toBe(1)
        expect(count2).toBe(1)
    })

    it('should keep event history', async () => {
        await eventBus.publish('TIMER_STARTED', {
            timerId: 'test-1',
            activityId: 'activity-1',
            startedAt: Date.now(),
            mode: 'normal',
        })

        const history = eventBus.getHistory()
        expect(history).toHaveLength(1)
        expect(history[0]?.type).toBe('TIMER_STARTED')
    })
})
