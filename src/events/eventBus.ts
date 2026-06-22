import type { DomainEvent, EventPayload, EventType } from './types'

type EventHandler<T extends EventType> = (payload: EventPayload<T>) => void | Promise<void>

interface Subscription {
    unsubscribe: () => void
}

class EventBus {
    private handlers: Map<EventType, Set<EventHandler<EventType>>> = new Map()
    private eventHistory: DomainEvent[] = []
    private maxHistorySize = 100

    /**
     * Subscribe to a specific event type
     */
    subscribe<T extends EventType>(
        eventType: T,
        handler: EventHandler<T>
    ): Subscription {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set())
        }

        const handlers = this.handlers.get(eventType)!
        handlers.add(handler as unknown as EventHandler<EventType>)

        return {
            unsubscribe: () => {
                handlers.delete(handler as unknown as EventHandler<EventType>)
            },
        }
    }

    /**
     * Subscribe to multiple event types with the same handler
     */
    subscribeMany<T extends EventType>(
        eventTypes: T[],
        handler: EventHandler<T>
    ): Subscription {
        const subscriptions = eventTypes.map((type) =>
            this.subscribe(type, handler)
        )

        return {
            unsubscribe: () => {
                subscriptions.forEach((sub) => sub.unsubscribe())
            },
        }
    }

    /**
     * Publish an event to all subscribers
     */
    async publish<T extends EventType>(
        eventType: T,
        payload: EventPayload<T>
    ): Promise<void> {
        const event = { type: eventType, payload } as DomainEvent

        // Add to history
        this.eventHistory.push(event)
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift()
        }

        // Get handlers for this event type
        const handlers = this.handlers.get(eventType)
        if (!handlers || handlers.size === 0) {
            return
        }

        // Execute all handlers (parallel)
        const promises = Array.from(handlers).map(async (handler) => {
            try {
                await handler(payload)
            } catch (error) {
                console.error(`Error in event handler for ${eventType}:`, error)
            }
        })

        await Promise.all(promises)
    }

    /**
     * Get recent events (for debugging/replay)
     */
    getHistory(): readonly DomainEvent[] {
        return this.eventHistory
    }

    /**
     * Clear all handlers (for testing)
     */
    clear(): void {
        this.handlers.clear()
        this.eventHistory = []
    }

    /**
     * Get handler count for a specific event type
     */
    getHandlerCount(eventType: EventType): number {
        return this.handlers.get(eventType)?.size ?? 0
    }
}

// Singleton instance
export const eventBus = new EventBus()
