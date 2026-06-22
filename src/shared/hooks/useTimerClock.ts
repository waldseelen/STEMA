/**
 * useTimerClock — Shared 1Hz tick
 *
 * Module-level singleton interval. All consumers share one setInterval
 * instead of one per mounted component.
 *
 * Interval starts when the first consumer mounts and stops
 * when the last one unmounts.
 */

import { useEffect, useState } from 'react'

let nowMs = Date.now()
const listeners = new Set<() => void>()
let intervalId: ReturnType<typeof setInterval> | null = null

function startClock() {
    if (intervalId !== null) return
    intervalId = setInterval(() => {
        nowMs = Date.now()
        for (const cb of listeners) cb()
    }, 1000)
}

function stopClock() {
    if (intervalId === null) return
    clearInterval(intervalId)
    intervalId = null
}

/**
 * Returns a `nowMs` value that updates every ~1 second.
 * Uses a single shared interval regardless of how many components subscribe.
 */
export function useTimerClock(): number {
    const [now, setNow] = useState(() => nowMs)

    useEffect(() => {
        const update = () => setNow(nowMs)
        listeners.add(update)
        startClock()
        return () => {
            listeners.delete(update)
            if (listeners.size === 0) stopClock()
        }
    }, [])

    return now
}
