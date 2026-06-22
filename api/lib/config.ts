export type ModelId = 'openrouter/deepseek-v4-flash' | 'openrouter/deepseek-v4' | 'openrouter/gemini-2.5-flash' | 'openrouter/claude-3.5-sonnet'

export type TaskType = 'socratic' | 'feynman' | 'mindmap' | 'mindmap-expand' | 'ocr' | 'flashcard' | 'embedding'

export interface ModelPricing {
  input: number  // $ per million tokens
  output: number
}

export interface TaskConfig {
  model: ModelId
  temperature: number
  responseFormat?: 'json_object' | 'text'
  maxTokens?: number
  reasoning?: boolean
}

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'deepseek/deepseek-v4-flash': { input: 0.14, output: 0.28 },
  'deepseek/deepseek-v4': { input: 0.35, output: 0.70 },
  'google/gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'openai/text-embedding-3-small': { input: 0.02, output: 0.02 },
}

export const TASK_CONFIG: Record<TaskType, TaskConfig> = {
  socratic: {
    model: 'openrouter/deepseek-v4-flash',
    temperature: 0.3,
    maxTokens: 4096,
  },
  feynman: {
    model: 'openrouter/deepseek-v4-flash',
    temperature: 0.3,
    responseFormat: 'json_object',
    reasoning: true,
  },
  mindmap: {
    model: 'openrouter/deepseek-v4-flash',
    temperature: 0.3,
    responseFormat: 'json_object',
  },
  'mindmap-expand': {
    model: 'openrouter/deepseek-v4-flash',
    temperature: 0.3,
    responseFormat: 'json_object',
  },
  ocr: {
    model: 'openrouter/deepseek-v4-flash',
    temperature: 0.1,
    responseFormat: 'json_object',
  },
  flashcard: {
    model: 'openrouter/deepseek-v4-flash',
    temperature: 0.3,
    responseFormat: 'json_object',
  },
  embedding: {
    model: 'openrouter/deepseek-v4-flash',
    temperature: 0.0,
  },
}

export function getModelRoute(taskType: TaskType): { model: string; config: TaskConfig } {
  const cfg = TASK_CONFIG[taskType]
  const openRouterModel = cfg.model.replace('openrouter/', '')
  return { model: openRouterModel, config: cfg }
}

export function getPricing(modelSlug: string): ModelPricing {
  for (const [key, price] of Object.entries(MODEL_PRICING)) {
    if (modelSlug.includes(key) || key.includes(modelSlug)) {
      return price
    }
  }
  return { input: 0.14, output: 0.28 }
}

export function calculateCost(promptTokens: number, completionTokens: number, modelSlug: string): number {
  const p = getPricing(modelSlug)
  return ((promptTokens * p.input) + (completionTokens * p.output)) / 1_000_000
}
