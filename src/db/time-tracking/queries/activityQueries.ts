/**
 * Activity Queries — Supabase-first
 *
 * Activity, Category ve Tag tablolarına yönelik hooks ve async sorgular.
 */

import { invalidateTables } from '@/lib/cloud/queryInvalidation'
import {
    trackerCreateActivity,
    trackerCreateCategory,
    trackerCreateGoal,
    trackerCreateTag,
    trackerDeleteActivity,
    trackerDeleteCategory,
    trackerDeleteGoal,
    trackerDeleteRunningTimerForActivity,
    trackerDeleteTag,
    trackerGetActiveActivities,
    trackerGetActiveCategories,
    trackerGetActivitiesByCategory,
    trackerGetActivityById,
    trackerGetAllTags,
    trackerGetArchivedActivities,
    trackerGetGoalsForActivity,
    trackerUpdateActivity,
    trackerUpdateCategory,
    trackerUpdateTag,
} from '@/lib/cloud/trackerRepo'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'
import type { Activity, Category, Goal, GoalScope } from '../types'

type ActivityDefaultGoalInput = {
    scope: Extract<GoalScope, 'daily' | 'weekly'>
    targetHours: number
}

// ============================================
// Async Queries
// ============================================

/** Tüm aktif (arşivlenmemiş) aktiviteleri getirir */
export async function getActiveActivities(): Promise<Activity[]> {
    return trackerGetActiveActivities()
}

/** Belirli bir kategoriye ait aktif aktiviteleri getirir */
export async function getActivitiesByCategory(categoryId: string): Promise<Activity[]> {
    return trackerGetActivitiesByCategory(categoryId)
}

/** Tüm aktif aktiviteleri kategori bazlı gruplar */
export async function getActivitiesGroupedByCategory(): Promise<
    Array<{ category: Category; activities: Activity[] }>
> {
    const [categories, activities] = await Promise.all([
        trackerGetActiveCategories(),
        trackerGetActiveActivities(),
    ])

    return categories.map(category => ({
        category,
        activities: activities.filter(a => a.categoryId === category.id),
    }))
}

/** Bir aktiviteyi id ile getirir */
export async function getActivityById(id: string): Promise<Activity | undefined> {
    return trackerGetActivityById(id)
}

/** Tüm aktif kategorileri getirir */
export async function getActiveCategories(): Promise<Category[]> {
    return trackerGetActiveCategories()
}

// ============================================
// Activity CRUD
// ============================================

export async function createActivity(
    data: {
        name: string
        categoryId: string
        color?: string
        icon?: string
        tagIds?: string[]
        defaultGoal?: ActivityDefaultGoalInput
    }
): Promise<string> {
    const defaultGoal = (
        data.defaultGoal && data.defaultGoal.targetHours > 0
            ? data.defaultGoal
            : undefined
    )
    const defaultGoalIds: string[] = []

    if (defaultGoal) {
        const goalPayload: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
            name: data.name,
            scope: defaultGoal.scope,
            metric: 'time',
            targetValue: Math.round(defaultGoal.targetHours * 3600),
            activityId: undefined, // will be set by FK after activity created
            enabled: true,
        }
        const goalId = await trackerCreateGoal(goalPayload)
        defaultGoalIds.push(goalId)
    }

    const id = await trackerCreateActivity({
        name: data.name,
        categoryId: data.categoryId,
        color: data.color,
        icon: data.icon,
        tagIds: data.tagIds ?? [],
        defaultGoalIds,
    })

    invalidateTables(defaultGoalIds.length > 0 ? ['activities', 'goals'] : ['activities'])
    return id
}

export async function updateActivity(
    id: string,
    changes: Partial<Omit<Activity, 'id' | 'createdAt'>>
): Promise<void> {
    await trackerUpdateActivity(id, changes)
    invalidateTables(['activities'])
}

export async function deleteActivity(id: string): Promise<void> {
    // Delete associated goals and timers then the activity
    const goals = await trackerGetGoalsForActivity(id)
    await Promise.all(goals.map(g => trackerDeleteGoal(g.id)))
    await trackerDeleteRunningTimerForActivity(id)
    await trackerDeleteActivity(id)
    invalidateTables(['activities', 'goals', 'running_timers'])
}

export async function archiveActivity(id: string): Promise<void> {
    await trackerUpdateActivity(id, { archived: true })
    invalidateTables(['activities'])
}

export async function unarchiveActivity(id: string): Promise<void> {
    await trackerUpdateActivity(id, { archived: false })
    invalidateTables(['activities'])
}

/** Arşivlenmiş aktiviteleri getirir */
export async function getArchivedActivities(): Promise<Activity[]> {
    return trackerGetArchivedActivities()
}

// ============================================
// Category CRUD
// ============================================

export async function createCategory(
    data: { name: string; color: string; icon: string }
): Promise<string> {
    const id = await trackerCreateCategory(data)
    invalidateTables(['categories'])
    return id
}

export async function updateCategory(
    id: string,
    changes: Partial<Omit<Category, 'id' | 'createdAt'>>
): Promise<void> {
    await trackerUpdateCategory(id, changes)
    invalidateTables(['categories'])
}

export async function deleteCategory(id: string): Promise<void> {
    // Archive activities belonging to this category before deleting
    const activities = await trackerGetActivitiesByCategory(id)
    await Promise.all(activities.map(a => trackerUpdateActivity(a.id, { archived: true })))
    await trackerDeleteCategory(id)
    invalidateTables(['categories', 'activities'])
}

// ============================================
// Tag CRUD
// ============================================

export async function createTag(
    data: { name: string; color: string; groupId?: string }
): Promise<string> {
    const id = await trackerCreateTag(data)
    invalidateTables(['tags'])
    return id
}

export async function updateTag(
    id: string,
    changes: Partial<Omit<import('../types').Tag, 'id' | 'createdAt'>>
): Promise<void> {
    await trackerUpdateTag(id, changes)
    invalidateTables(['tags'])
}

export async function deleteTag(id: string): Promise<void> {
    await trackerDeleteTag(id)
    invalidateTables(['tags'])
}

export async function getAllTags(): Promise<import('../types').Tag[]> {
    return trackerGetAllTags()
}

/** Hook: Tüm tag'ler (canlı) */
export function useAllTags() {
    return useSupabaseQuery(
        trackerGetAllTags,
        [],
        ['tags'],
        [],
    ).data
}

/** Hook: Arşivlenmiş aktiviteler (canlı) */
export function useArchivedActivities(): Activity[] {
    return useSupabaseQuery(
        trackerGetArchivedActivities,
        [],
        ['activities'],
        [],
    ).data
}

// ============================================
// React Hooks
// ============================================

/** Hook: Tüm aktif aktiviteler (canlı) */
export function useActiveActivities(): Activity[] {
    return useSupabaseQuery(
        trackerGetActiveActivities,
        [],
        ['activities'],
        [],
    ).data
}

/** Hook: Aktiviteler kategori bazlı gruplu (canlı) */
export function useActivitiesGroupedByCategory() {
    return useSupabaseQuery(
        getActivitiesGroupedByCategory,
        [] as Array<{ category: Category; activities: Activity[] }>,
        ['activities', 'categories'],
        [],
    ).data
}

/** Hook: Belirli kategori aktiviteleri (canlı) */
export function useActivitiesByCategory(categoryId: string | null): Activity[] {
    return useSupabaseQuery(
        () => (categoryId ? trackerGetActivitiesByCategory(categoryId) : trackerGetActiveActivities()),
        [],
        ['activities'],
        [categoryId],
    ).data
}

/** Hook: Tüm aktif kategoriler (canlı) */
export function useActiveCategories(): Category[] {
    return useSupabaseQuery(
        trackerGetActiveCategories,
        [],
        ['categories'],
        [],
    ).data
}

/** Hook: Tek aktivite (canlı) */
export function useActivity(id: string | null): Activity | undefined {
    return useSupabaseQuery(
        () => (id ? trackerGetActivityById(id) : Promise.resolve(undefined)),
        undefined,
        ['activities'],
        [id],
    ).data
}
