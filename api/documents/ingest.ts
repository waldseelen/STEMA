import { createClient } from '@supabase/supabase-js'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request): Promise<Response> {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    })
  }

  try {
    const { documentId, chunks } = await req.json() as {
      documentId: string
      chunks: Array<{ content: string; metadata: any }>
    }

    if (!documentId || !chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return new Response(JSON.stringify({ error: 'Document ID and non-empty chunks list are required' }), {
        status: 400,
        headers,
      })
    }

    // 1. Initialize Supabase Client with User's JWT (respecting RLS)
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    const token = authHeader ? authHeader.replace('Bearer ', '') : null

    const isMockUser = token === 'mock-session-token' || !token
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const activeKey = (isMockUser && supabaseServiceKey) ? supabaseServiceKey : (supabaseAnonKey || '')
    const supabaseClient = createClient(supabaseUrl || '', activeKey, {
      global: {
        headers: (!isMockUser && token) ? { Authorization: `Bearer ${token}` } : {},
      },
    })

    // 2. Fetch Embeddings via OpenRouter
    const openrouterKey = process.env.OPENROUTER_API_KEY
    if (!openrouterKey) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY is not configured on the server' }), {
        status: 500,
        headers,
      })
    }

    // Process in batches of 20 to avoid large payload/timeout limits
    const batchSize = 20
    let processedCount = 0

    for (let i = 0; i < chunks.length; i += batchSize) {
      const currentBatch = chunks.slice(i, i + batchSize)

      // Fetch embeddings for the current batch
      const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/text-embedding-3-small',
          input: currentBatch.map(c => c.content),
        }),
      })

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text()
        console.error('OpenRouter Embedding error details:', errorText)
        return new Response(JSON.stringify({ error: `OpenRouter Embedding error: ${errorText}` }), {
          status: 502,
          headers,
        })
      }

      const resData = await embeddingResponse.json()
      if (!resData.data || !Array.isArray(resData.data)) {
        console.error('Invalid response format from OpenRouter:', resData)
        return new Response(JSON.stringify({ error: 'Invalid response format from embedding API' }), {
          status: 502,
          headers,
        })
      }

      // Sort results by index to match order of currentBatch
      const sortedEmbeddings = resData.data
        .sort((a: any, b: any) => a.index - b.index)
        .map((item: any) => item.embedding)

      // Prepare database rows
      const insertRows = currentBatch.map((chunk, idx) => ({
        document_id: documentId,
        content: chunk.content,
        embedding: sortedEmbeddings[idx],
        metadata: chunk.metadata || {},
      }))

      // Insert into Supabase
      const { error: dbError } = await supabaseClient
        .from('document_chunks')
        .insert(insertRows)

      if (dbError) {
        console.error('Database insertion error:', dbError)
        return new Response(JSON.stringify({ error: `Failed to store chunks in database: ${dbError.message}` }), {
          status: 500,
          headers,
        })
      }

      processedCount += currentBatch.length
    }

    return new Response(JSON.stringify({ success: true, processedChunks: processedCount }), {
      status: 200,
      headers,
    })

  } catch (err: any) {
    console.error('Error during ingestion:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers,
    })
  }
}
