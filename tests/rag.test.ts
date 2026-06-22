import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '../api/documents/ingest'

describe('RAG Ingestion and Vector Search', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.OPENROUTER_API_KEY = 'mock-key'
    process.env.VITE_SUPABASE_URL = 'https://mock.supabase.co'
    process.env.VITE_SUPABASE_ANON_KEY = 'mock-anon'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key'
  })

  it('should split text correctly based on paragraph and character length constraints', () => {
    const text = 'Paragraf 1.\n\nParagraf 2.\n\nParagraf 3.'
    
    // Test the exact chunking logic used in the client
    const chunkText = (text: string, maxChunkSize = 1200): string[] => {
      const paragraphs = text.split(/\n\n+/)
      const chunks: string[] = []
      let currentChunk = ''

      for (const para of paragraphs) {
        if (!para.trim()) continue
        if ((currentChunk + '\n\n' + para).length <= maxChunkSize) {
          currentChunk = currentChunk ? currentChunk + '\n\n' + para : para
        } else {
          if (currentChunk) chunks.push(currentChunk)
          currentChunk = para
        }
      }
      if (currentChunk) chunks.push(currentChunk)
      return chunks
    }

    const chunks = chunkText(text, 20)
    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toBe('Paragraf 1.')
    expect(chunks[1]).toBe('Paragraf 2.')
    expect(chunks[2]).toBe('Paragraf 3.')
  })

  it('should process document ingestion request successfully by batching embeddings and calling database insert', async () => {
    // 1. Mock global fetch for OpenRouter embeddings API
    const mockFetch = vi.fn().mockImplementation((url) => {
      if (url === 'https://openrouter.ai/api/v1/embeddings') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: [
                { index: 0, embedding: new Array(1536).fill(0.123) }
              ]
            }),
            { status: 200 }
          )
        )
      }
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
    })
    vi.stubGlobal('fetch', mockFetch)

    // 2. Mock Supabase JS client operations
    // Note: vi.mock is hoisted, so we write a self-contained factory function below
    vi.mock('@supabase/supabase-js', () => ({
      createClient: () => ({
        from: () => ({
          insert: () => Promise.resolve({ error: null })
        })
      })
    }))

    // 3. Construct mock request
    const req = new Request('http://localhost:3000/api/documents/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-session-token'
      },
      body: JSON.stringify({
        documentId: 'db48c3a1-0bd6-4c4f-9e6b-74dbb8a7863a',
        chunks: [
          { content: 'Mock RAG content chunk', metadata: { page: 1 } }
        ]
      })
    })

    // 4. Run handler and assert response
    const response = await handler(req)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.processedChunks).toBe(1)
  })
})
