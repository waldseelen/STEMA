/**
 * Course Queries — Supabase-first
 *
 * Supabase CRUD fonksiyonları ve React hooks.
 * useSupabaseQuery ile reaktif veri okuma.
 */

import {
    plannerAddCourse,
    plannerCountTasks,
    plannerDeleteCourse,
    plannerGetCourseById,
    plannerGetCourses,
    plannerGetUnitsByCourse,
    plannerReorderCourses,
    plannerUpdateCourse,
} from '@/lib/cloud/plannerRepo'
import { invalidateTables } from '@/lib/cloud/queryInvalidation'
import { deleteCoursePDFs } from '@/modules/planner/lib/pdfStorage'
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery'
import type { CourseWithProgress, DBCourse } from '../types'

// ============================================
// Query Functions
// ============================================

/**
 * Get all courses ordered
 */
export async function getAllCourses(): Promise<DBCourse[]> {
    return plannerGetCourses()
}

/**
 * Get course by ID
 */
export async function getCourseById(id: string): Promise<DBCourse | undefined> {
    return plannerGetCourseById(id)
}

/**
 * Get courses with progress stats
 */
export async function getCoursesWithProgress(): Promise<CourseWithProgress[]> {
    const courses = await getAllCourses()

    return Promise.all(
        courses.map(async (course) => {
            const [{ total: totalTasks, completed: completedTasks }, units] = await Promise.all([
                plannerCountTasks(course.id),
                plannerGetUnitsByCourse(course.id),
            ])

            const progressPercent = totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0

            return {
                ...course,
                totalTasks,
                completedTasks,
                progressPercent,
                unitCount: units.length,
            }
        })
    )
}

// ============================================
// Mutation Functions
// ============================================

/**
 * Add a new course
 */
export async function addCourse(data: {
    title: string
    code?: string
    icon?: string
    color?: string
}): Promise<string> {
    const courses = await plannerGetCourses()
    const id = await plannerAddCourse(data, courses.length)
    invalidateTables(['courses'])
    return id
}

/**
 * Update a course
 */
export async function updateCourse(
    id: string,
    updates: Partial<Omit<DBCourse, 'id' | 'createdAt'>>
): Promise<void> {
    await plannerUpdateCourse(id, updates)
    invalidateTables(['courses'])
}

/**
 * Delete a course and all related data
 */
export async function deleteCourse(id: string): Promise<void> {
    await deleteCoursePDFs(id)
    await plannerDeleteCourse(id)
    invalidateTables(['courses', 'units', 'tasks', 'events'])
}

/**
 * Reorder courses
 */
export async function reorderCourses(orderedIds: string[]): Promise<void> {
    await plannerReorderCourses(orderedIds)
    invalidateTables(['courses'])
}

// ============================================
// React Hooks
// ============================================

/**
 * Hook: Get all courses (live)
 */
export function useCourses(): DBCourse[] {
    return useSupabaseQuery(getAllCourses, [], ['courses']).data
}

/**
 * Hook: Get course by ID (live)
 */
export function useCourse(id: string): DBCourse | undefined {
    return useSupabaseQuery(
        () => getCourseById(id),
        undefined,
        ['courses'],
        [id],
    ).data
}

/**
 * Hook: Get courses with progress (live)
 */
export function useCoursesWithProgress(): CourseWithProgress[] {
    return useSupabaseQuery(getCoursesWithProgress, [], ['courses', 'tasks', 'units']).data
}

/**
 * Hook: Get course count (live)
 */
export function useCourseCount(): number {
    return useSupabaseQuery(
        async () => (await plannerGetCourses()).length,
        0,
        ['courses'],
    ).data
}
