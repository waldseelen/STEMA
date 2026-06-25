/**
 * ruleEngine — Otomasyon Kural Motoru (Supabase-first)
 *
 * Rule trigger → condition check → action executor.
 * Timer başlatma/durdurma olaylarında çalışır.
 */

import type { Rule, RuleActionConfig, RuleCondition, RuleTrigger } from '@/db/time-tracking/types'
import { invalidateTables } from '@/lib/cloud/queryInvalidation'
import {
    trackerCreateRule,
    trackerDeleteRule,
    trackerGetEnabledRules,
    trackerGetRulesByTrigger,
    trackerUpdateRule,
} from '@/lib/cloud/trackerRepo'

// ============================================
// Condition Evaluator
// ============================================

function evaluateCondition(condition: RuleCondition, context: Record<string, unknown>): boolean {
    const fieldValue = context[condition.field]
    const { operator, value } = condition

    switch (operator) {
        case 'eq': return fieldValue === value
        case 'neq': return fieldValue !== value
        case 'gt': return typeof fieldValue === 'number' && fieldValue > (value as number)
        case 'gte': return typeof fieldValue === 'number' && fieldValue >= (value as number)
        case 'lt': return typeof fieldValue === 'number' && fieldValue < (value as number)
        case 'lte': return typeof fieldValue === 'number' && fieldValue <= (value as number)
        case 'contains':
            return typeof fieldValue === 'string' && fieldValue.includes(String(value))
        default: return false
    }
}

function evaluateConditions(conditions: RuleCondition[], context: Record<string, unknown>): boolean {
    if (conditions.length === 0) return true
    return conditions.every(c => evaluateCondition(c, context))
}

// ============================================
// Action Executor
// ============================================

async function executeAction(action: RuleActionConfig, context: Record<string, unknown>): Promise<void> {
    switch (action.type) {
        case 'NOTIFY': {
            const title = String(action.params['title'] ?? 'Bildirim')
            const body = String(action.params['body'] ?? '')
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { body })
            }
            break
        }
        case 'LOG_MESSAGE': {
            console.log('[RuleEngine]', action.params['message'] ?? '', context)
            break
        }
        case 'START_TIMER': {
            const activityId = String(action.params['activityId'] ?? '')
            if (activityId) {
                const { startTimer } = await import('./timerService')
                await startTimer(activityId)
            }
            break
        }
        case 'TRIGGER_BREAK': {
            // Gelecekte pomodoro entegrasyonu ile kullanılacak
            console.log('[RuleEngine] TRIGGER_BREAK', action.params)
            break
        }
    }
}

// ============================================
// Rule Engine — Ana Fonksiyon
// ============================================

/**
 * Belirli bir trigger için tüm aktif kuralları çalıştırır.
 * Context: olayla ilgili veri (ör. activityId, durationSec).
 */
export async function fireRules(
    trigger: RuleTrigger,
    context: Record<string, unknown> = {}
): Promise<void> {
    const rules = await trackerGetRulesByTrigger(trigger)

    for (const rule of rules) {
        if (evaluateConditions(rule.conditions, context)) {
            for (const action of rule.actions) {
                try {
                    await executeAction(action, context)
                } catch (err) {
                    console.error(`[RuleEngine] Action failed: ${action.type}`, err)
                }
            }
        }
    }
}

// ============================================
// Rule CRUD
// ============================================

export async function createRule(
    data: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const id = await trackerCreateRule(data)
    invalidateTables(['rules'])
    return id
}

export async function updateRule(
    id: string,
    changes: Partial<Omit<Rule, 'id' | 'createdAt'>>
): Promise<void> {
    await trackerUpdateRule(id, changes)
    invalidateTables(['rules'])
}

export async function deleteRule(id: string): Promise<void> {
    await trackerDeleteRule(id)
    invalidateTables(['rules'])
}

export async function getEnabledRules(): Promise<Rule[]> {
    return trackerGetEnabledRules()
}
