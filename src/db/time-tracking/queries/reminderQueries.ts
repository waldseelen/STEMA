/**
 * Reminder Queries — Supabase-first
 *
 * Reminder CRUD fonksiyonları ve React hooks.
 */

import { invalidateTables } from '@/lib/cloud/queryInvalidation'
import {
    trackerCreateReminder,
    trackerDeleteReminder,
    trackerGetAllReminders,
    trackerUpdateReminder,
} from '@/lib/cloud/trackerRepo'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'
import type { Reminder } from '../../types'

// ============================================
// Mutation Functions
// ============================================

export async function createReminder(
    data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
    const id = await trackerCreateReminder(data)
    invalidateTables(['reminders'])
    return id
}

export async function updateReminder(
    id: string,
    changes: Partial<Omit<Reminder, 'id' | 'createdAt'>>,
): Promise<void> {
    await trackerUpdateReminder(id, changes)
    invalidateTables(['reminders'])
}

export async function deleteReminder(id: string): Promise<void> {
    await trackerDeleteReminder(id)
    invalidateTables(['reminders'])
}

// ============================================
// React Hooks
// ============================================

export function useReminders(): Reminder[] {
    return useSupabaseQuery(trackerGetAllReminders, [], ['reminders'], []).data
}
