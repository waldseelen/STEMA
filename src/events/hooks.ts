import { useEffect, useRef } from 'react'
import { eventBus } from './eventBus'
import type { EventPayload, EventType } from './types'

/**
 * React hook to subscribe to domain events
 * Automatically unsubscribes on unmount
 */
export function useEventSubscription<T extends EventType>(
    eventType: T,
    handler: (payload: EventPayload<T>) => void | Promise<void>,
    deps: React.DependencyList = []
): void {
    const handlerRef = useRef(handler)
    handlerRef.current = handler

    useEffect(() => {
        const subscription = eventBus.subscribe(eventType, (payload) => {
            handlerRef.current(payload)
        })

        return () => {
            subscription.unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventType, ...deps])
}

/**
 * React hook to subscribe to multiple event types
 */
export function useEventSubscriptions<T extends EventType>(
    eventTypes: T[],
    handler: (payload: EventPayload<T>) => void | Promise<void>,
    deps: React.DependencyList = []
): void {
    const handlerRef = useRef(handler)
    handlerRef.current = handler

    useEffect(() => {
        const subscription = eventBus.subscribeMany(eventTypes, (payload) => {
            handlerRef.current(payload)
        })

        return () => {
            subscription.unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventTypes.join(','), ...deps])
}
