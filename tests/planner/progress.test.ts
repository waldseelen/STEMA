/**
 * Progress Calculation Tests
 *
 * Ders ve task ilerleme hesaplama testleri.
 */

import { describe, expect, it } from 'vitest'
import { calculateCourseProgress } from '../../src/modules/planner/lib/utils'
import type { Course } from '../../src/modules/planner/types'

// Helper to create test course
function createTestCourse(overrides: Partial<Course> = {}): Course {
    return {
        id: 'course-1',
        title: 'Test Course',
        code: 'TST101',
        color: '#FF5722',
        units: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    }
}

describe('calculateCourseProgress', () => {
    describe('basic calculations', () => {
        it('should return 0% for course with no tasks', () => {
            const course = createTestCourse({ units: [] })
            const result = calculateCourseProgress(course, [])

            expect(result.total).toBe(0)
            expect(result.completed).toBe(0)
            expect(result.percentage).toBe(0)
        })

        it('should return 0% when no tasks are completed', () => {
            const course = createTestCourse({
                units: [
                    {
                        id: 'unit-1',
                        title: 'Unit 1',
                        order: 0,
                        tasks: [
                            { id: 'task-1', text: 'Task 1', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                            { id: 'task-2', text: 'Task 2', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                        ],
                    },
                ],
            })

            const result = calculateCourseProgress(course, [])

            expect(result.total).toBe(2)
            expect(result.completed).toBe(0)
            expect(result.percentage).toBe(0)
        })

        it('should return 100% when all tasks are completed', () => {
            const course = createTestCourse({
                units: [
                    {
                        id: 'unit-1',
                        title: 'Unit 1',
                        order: 0,
                        tasks: [
                            { id: 'task-1', text: 'Task 1', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                            { id: 'task-2', text: 'Task 2', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                        ],
                    },
                ],
            })

            const result = calculateCourseProgress(course, ['task-1', 'task-2'])

            expect(result.total).toBe(2)
            expect(result.completed).toBe(2)
            expect(result.percentage).toBe(100)
        })

        it('should return 50% when half tasks are completed', () => {
            const course = createTestCourse({
                units: [
                    {
                        id: 'unit-1',
                        title: 'Unit 1',
                        order: 0,
                        tasks: [
                            { id: 'task-1', text: 'Task 1', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                            { id: 'task-2', text: 'Task 2', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                        ],
                    },
                ],
            })

            const result = calculateCourseProgress(course, ['task-1'])

            expect(result.total).toBe(2)
            expect(result.completed).toBe(1)
            expect(result.percentage).toBe(50)
        })
    })

    describe('multiple units', () => {
        it('should aggregate tasks across all units', () => {
            const course = createTestCourse({
                units: [
                    {
                        id: 'unit-1',
                        title: 'Unit 1',
                        order: 0,
                        tasks: [
                            { id: 'task-1', text: 'Task 1', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                        ],
                    },
                    {
                        id: 'unit-2',
                        title: 'Unit 2',
                        order: 1,
                        tasks: [
                            { id: 'task-2', text: 'Task 2', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                            { id: 'task-3', text: 'Task 3', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                        ],
                    },
                ],
            })

            const result = calculateCourseProgress(course, ['task-1', 'task-3'])

            expect(result.total).toBe(3)
            expect(result.completed).toBe(2)
            expect(result.percentage).toBe(67) // Rounded from 66.67
        })
    })

    describe('edge cases', () => {
        it('should handle completed task IDs that do not exist in course', () => {
            const course = createTestCourse({
                units: [
                    {
                        id: 'unit-1',
                        title: 'Unit 1',
                        order: 0,
                        tasks: [
                            { id: 'task-1', text: 'Task 1', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                        ],
                    },
                ],
            })

            const result = calculateCourseProgress(course, ['task-999', 'task-888'])

            expect(result.total).toBe(1)
            expect(result.completed).toBe(0)
            expect(result.percentage).toBe(0)
        })

        it('should round percentage to nearest integer', () => {
            const course = createTestCourse({
                units: [
                    {
                        id: 'unit-1',
                        title: 'Unit 1',
                        order: 0,
                        tasks: [
                            { id: 'task-1', text: 'Task 1', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                            { id: 'task-2', text: 'Task 2', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                            { id: 'task-3', text: 'Task 3', status: 'todo' as const, isPriority: false, createdAt: '', updatedAt: '' },
                        ],
                    },
                ],
            })

            const result = calculateCourseProgress(course, ['task-1'])

            expect(result.percentage).toBe(33) // 33.33% rounded
        })
    })
})
