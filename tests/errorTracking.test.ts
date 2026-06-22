import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock localStorage before importing module
const localStorageMock = (() => {
    let store: Record<string, string> = { 'planex-locale': 'tr' }
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value }),
        removeItem: vi.fn((key: string) => { delete store[key] }),
        clear: vi.fn(() => { store = { 'planex-locale': 'tr' } }),
    }
})()

vi.stubGlobal('localStorage', localStorageMock)

import {
    captureException,
    captureMessage,
    clearStoredErrors,
    getStoredErrors,
    getUserFriendlyMessage,
    handleBoundaryError,
    perfEnd,
    perfStart,
} from '../src/shared/utils/errorTracking'

describe('Error Tracking', () => {
    beforeEach(() => {
        // Clear stored errors before each test
        localStorageMock.clear()
        vi.spyOn(console, 'error').mockImplementation(() => { })
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('captureException', () => {
        it('should store error in localStorage', () => {
            const error = new Error('Test error')
            captureException(error, { context: 'TestContext' })

            const stored = getStoredErrors()
            expect(stored.length).toBeGreaterThan(0)
            expect(stored[0].message).toBe('Test error')
            expect(stored[0].context.context).toBe('TestContext')
        })

        it('should handle non-Error objects', () => {
            captureException('String error', { context: 'TestContext' })

            const stored = getStoredErrors()
            expect(stored[0].message).toBe('String error')
        })

        it('should include metadata', () => {
            captureException(new Error('Test'), {
                context: 'TestContext',
                category: 'database',
                metadata: { userId: '123' },
            })

            const stored = getStoredErrors()
            expect(stored[0].context.category).toBe('database')
            expect(stored[0].context.metadata).toEqual({ userId: '123' })
        })

        it('should limit stored errors', () => {
            // Store more than max
            for (let i = 0; i < 60; i++) {
                captureException(new Error(`Error ${i}`), { context: 'Test' })
            }

            const stored = getStoredErrors()
            expect(stored.length).toBeLessThanOrEqual(50)
        })
    })

    describe('captureMessage', () => {
        it('should store message as report', () => {
            captureMessage('Info message', { context: 'TestContext', level: 'info' })

            const stored = getStoredErrors()
            expect(stored[0].message).toBe('Info message')
            expect(stored[0].context.level).toBe('info')
        })
    })

    describe('getStoredErrors', () => {
        it('should return empty array when no errors', () => {
            expect(getStoredErrors()).toEqual([])
        })

        it('should return stored errors', () => {
            captureException(new Error('Test 1'), { context: 'A' })
            captureException(new Error('Test 2'), { context: 'B' })

            const stored = getStoredErrors()
            expect(stored.length).toBe(2)
        })
    })

    describe('clearStoredErrors', () => {
        it('should clear all stored errors', () => {
            captureException(new Error('Test'), { context: 'Test' })
            expect(getStoredErrors().length).toBe(1)

            clearStoredErrors()
            expect(getStoredErrors().length).toBe(0)
        })
    })

    describe('getUserFriendlyMessage', () => {
        it('should return friendly message for known errors', () => {
            const quotaError = new Error('QuotaExceededError')
            quotaError.name = 'QuotaExceededError'
            expect(getUserFriendlyMessage(quotaError)).toContain('Depolama')
        })

        it('should return default message for unknown errors', () => {
            const unknownError = new Error('Some weird error')
            expect(getUserFriendlyMessage(unknownError)).toContain('hata')
        })

        it('should handle non-Error objects', () => {
            expect(getUserFriendlyMessage('string error')).toContain('hata')
            expect(getUserFriendlyMessage(null)).toContain('hata')
        })
    })

    describe('handleBoundaryError', () => {
        it('should capture error with component stack', () => {
            const error = new Error('Render error')
            handleBoundaryError(error, { componentStack: 'at Component' })

            const stored = getStoredErrors()
            expect(stored[0].context.context).toBe('ErrorBoundary')
            expect(stored[0].context.category).toBe('ui')
        })
    })

    describe('Performance tracking', () => {
        it('should measure duration between start and end', () => {
            perfStart('test-operation')

            // Simulate some work
            const start = Date.now()
            while (Date.now() - start < 10) {
                // Wait ~10ms
            }

            const duration = perfEnd('test-operation')
            expect(duration).toBeGreaterThan(0)
        })

        it('should return 0 if start was not called', () => {
            const duration = perfEnd('nonexistent')
            expect(duration).toBe(0)
        })
    })
})
