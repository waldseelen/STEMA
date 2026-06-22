/**
 * useReminderScheduler — Loads enabled reminders and schedules browser notifications.
 *
 * Mount this once in AppLayout (or a global runtime component).
 * On each render cycle it computes the delay from now to each reminder's
 * scheduled time today, calls scheduleReminder, and clears on unmount.
 */

import { useReminders } from '@/db/time-tracking/queries/reminderQueries'
import { useEffect, useRef } from 'react'
import { requestNotificationPermission, scheduleReminder } from './notificationService'

function msUntilTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    const now = new Date()
    const target = new Date(now)
    target.setHours(hours, minutes, 0, 0)
    // If the target time already passed today, schedule for tomorrow
    if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1)
    }
    return target.getTime() - now.getTime()
}

export function useReminderScheduler(): void {
    const reminders = useReminders()
    const timerIds = useRef<number[]>([])

    useEffect(() => {
        // Clear previous schedules
        for (const id of timerIds.current) {
            window.clearTimeout(id)
        }
        timerIds.current = []

        const enabled = reminders.filter(r => r.enabled)
        if (enabled.length === 0) return

        void requestNotificationPermission().then(granted => {
            if (!granted) return

            for (const reminder of enabled) {
                const delay = msUntilTime(reminder.schedule.time)
                const timerId = scheduleReminder(reminder.title, reminder.message, delay)
                timerIds.current.push(timerId)
            }
        })

        return () => {
            for (const id of timerIds.current) {
                window.clearTimeout(id)
            }
            timerIds.current = []
        }
    }, [reminders])
}
