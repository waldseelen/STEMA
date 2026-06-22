import { getModelRoute, TaskType, calculateCost } from './config'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | LLMContentPart[]
}

export type LLMContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export interface LLMRequestOptions {
  taskType: TaskType
  systemPrompt: string
  messages: LLMMessage[]
  stream?: boolean
  maxTokens?: number
}

export interface LLMResponse {
  content: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cost: number
  model: string
  latencyMs: number
}

export interface LLMStreamEvents {
  onToken: (token: string) => Promise<void>
  onComplete: (result: LLMResponse) => Promise<void>
  onError: (error: Error) => Promise<void>
}

function getOpenRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('OPENROUTER_API_KEY is not configured')
  return key
}

function buildRequestBody(
  model: string,
  systemPrompt: string,
  messages: LLMMessage[],
  config: { temperature: number; responseFormat?: 'json_object' | 'text'; maxTokens?: number },
  stream: boolean,
) {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => {
        if (typeof m.content === 'string') {
          return { role: m.role, content: m.content }
        }
        return { role: m.role, content: m.content }
      }),
    ],
    temperature: config.temperature,
    stream,
  }

  if (config.maxTokens) body.max_tokens = config.maxTokens
  if (config.responseFormat === 'json_object') {
    body.response_format = { type: 'json_object' }
  }

  return body
}

function extractTokenUsage(parsed: Record<string, any>): { prompt: number; completion: number } {
  const usage = parsed.usage || parsed.usageMetadata
  if (usage) {
    return {
      prompt: usage.prompt_tokens || usage.promptTokens || usage.input_tokens || usage.promptTokenCount || 0,
      completion: usage.completion_tokens || usage.completionTokens || usage.output_tokens || usage.candidatesTokenCount || 0,
    }
  }
  return { prompt: 0, completion: 0 }
}

export async function callLLM(options: LLMRequestOptions): Promise<LLMResponse> {
  const startTime = Date.now()
  const apiKey = getOpenRouterKey()
  const { model, config } = getModelRoute(options.taskType)

  const body = buildRequestBody(model, options.systemPrompt, options.messages, {
    ...config,
    maxTokens: options.maxTokens || config.maxTokens,
  }, false)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'STEMA',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  const { prompt, completion } = extractTokenUsage(data)
  const latencyMs = Date.now() - startTime
  const cost = calculateCost(prompt, completion, model)

  return {
    content,
    promptTokens: prompt,
    completionTokens: completion,
    totalTokens: prompt + completion,
    cost,
    model,
    latencyMs,
  }
}

export async function streamLLM(options: LLMRequestOptions, events: LLMStreamEvents): Promise<void> {
  const startTime = Date.now()
  let completeResponse = ''
  let promptTokens = 0
  let completionTokens = 0

  try {
    const apiKey = getOpenRouterKey()
    const { model, config } = getModelRoute(options.taskType)

    const body = buildRequestBody(model, options.systemPrompt, options.messages, {
      ...config,
      maxTokens: options.maxTokens || config.maxTokens,
    }, true)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'STEMA',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`OpenRouter streaming API error (${response.status}): ${errText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body from OpenRouter')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const cleanLine = line.trim()
        if (!cleanLine.startsWith('data:')) continue

        const jsonStr = cleanLine.substring(5).trim()
        if (jsonStr === '[DONE]') continue

        try {
          const parsed = JSON.parse(jsonStr)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            await events.onToken(content)
            completeResponse += content
          }
          if (parsed.usage) {
            promptTokens = parsed.usage.prompt_tokens || promptTokens
            completionTokens = parsed.usage.completion_tokens || completionTokens
          }
          if (parsed.usageMetadata) {
            promptTokens = parsed.usageMetadata.promptTokenCount || promptTokens
            completionTokens = parsed.usageMetadata.candidatesTokenCount || completionTokens
          }
        } catch {
          // skip malformed JSON chunks
        }
      }
    }

    if (promptTokens === 0) promptTokens = Math.round(completeResponse.length / 4)
    if (completionTokens === 0) completionTokens = Math.round(completeResponse.length / 4)

    const latencyMs = Date.now() - startTime
    const cost = calculateCost(promptTokens, completionTokens, model)

    await events.onComplete({
      content: completeResponse,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost,
      model,
      latencyMs,
    })
  } catch (err: any) {
    await events.onError(err instanceof Error ? err : new Error(String(err)))
  }
}

export async function callLLMWithMultimodal(
  taskType: TaskType,
  systemPrompt: string,
  text: string,
  imageUrl: string,
): Promise<LLMResponse> {
  const messages: LLMMessage[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ]
  return callLLM({ taskType, systemPrompt, messages })
}
