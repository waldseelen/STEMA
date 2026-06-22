import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock trackerRepo
const mockGetRulesByTrigger = vi.fn()
const mockCreateRule = vi.fn()
const mockUpdateRule = vi.fn()
const mockDeleteRule = vi.fn()
const mockGetEnabledRules = vi.fn()

vi.mock('../../src/lib/cloud/trackerRepo', () => ({
    trackerGetRulesByTrigger: (...args: unknown[]) => mockGetRulesByTrigger(...args),
    trackerCreateRule: (...args: unknown[]) => mockCreateRule(...args),
    trackerUpdateRule: (...args: unknown[]) => mockUpdateRule(...args),
    trackerDeleteRule: (...args: unknown[]) => mockDeleteRule(...args),
    trackerGetEnabledRules: (...args: unknown[]) => mockGetEnabledRules(...args),
}))

vi.mock('../../src/lib/cloud/queryInvalidation', () => ({
    invalidateTables: vi.fn(),
}))

import type { Rule } from '../../src/db/types'
import { createRule, deleteRule, fireRules, getEnabledRules, updateRule } from '../../src/modules/tracker/lib/ruleEngine'

function makeRule(overrides: Partial<Rule> = {}): Rule {
    return {
        id: 'rule-1',
        name: 'Test Rule',
        trigger: 'TIMER_STOPPED',
        conditions: [],
        actions: [{ type: 'LOG_MESSAGE', params: { message: 'hello' } }],
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides,
    }
}

describe('ruleEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('fireRules', () => {
        it('executes matching rules with no conditions', async () => {
            const rule = makeRule()
            mockGetRulesByTrigger.mockResolvedValue([rule])
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

            await fireRules('TIMER_STOPPED')

            expect(mockGetRulesByTrigger).toHaveBeenCalledWith('TIMER_STOPPED')
            expect(consoleSpy).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })

        it('skips rules that fail condition evaluation', async () => {
            const rule = makeRule({
                conditions: [{ field: 'durationSec', operator: 'gt', value: 3600 }],
            })
            mockGetRulesByTrigger.mockResolvedValue([rule])
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

            await fireRules('TIMER_STOPPED', { durationSec: 100 })

            // Action should NOT be executed since condition fails
            expect(consoleSpy).not.toHaveBeenCalled()
            consoleSpy.mockRestore()
        })

        it('evaluates conditions correctly with eq operator', async () => {
            const rule = makeRule({
                conditions: [{ field: 'activityId', operator: 'eq', value: 'act-1' }],
            })
            mockGetRulesByTrigger.mockResolvedValue([rule])
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

            await fireRules('TIMER_STOPPED', { activityId: 'act-1' })

            expect(consoleSpy).toHaveBeenCalled()
            consoleSpy.mockRestore()
        })

        it('handles empty rules gracefully', async () => {
            mockGetRulesByTrigger.mockResolvedValue([])

            await expect(fireRules('TIMER_STARTED')).resolves.not.toThrow()
        })
    })

    describe('CRUD', () => {
        it('createRule delegates to trackerRepo and returns id', async () => {
            mockCreateRule.mockResolvedValue('new-rule-id')

            const id = await createRule({
                name: 'New Rule',
                trigger: 'SESSION_CREATED',
                conditions: [],
                actions: [],
                enabled: true,
            })

            expect(id).toBe('new-rule-id')
            expect(mockCreateRule).toHaveBeenCalledOnce()
        })

        it('updateRule delegates to trackerRepo', async () => {
            mockUpdateRule.mockResolvedValue(undefined)

            await updateRule('rule-1', { name: 'Updated' })

            expect(mockUpdateRule).toHaveBeenCalledWith('rule-1', { name: 'Updated' })
        })

        it('deleteRule delegates to trackerRepo', async () => {
            mockDeleteRule.mockResolvedValue(undefined)

            await deleteRule('rule-1')

            expect(mockDeleteRule).toHaveBeenCalledWith('rule-1')
        })

        it('getEnabledRules returns rules from trackerRepo', async () => {
            const rules = [makeRule()]
            mockGetEnabledRules.mockResolvedValue(rules)

            const result = await getEnabledRules()

            expect(result).toEqual(rules)
        })
    })
})
