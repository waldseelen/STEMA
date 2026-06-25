import { db, collection, addDoc, getUserIdFromToken } from '../lib/firebaseEdge'

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

    // 1. Get User ID from JWT Token
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    const userId = getUserIdFromToken(authHeader)

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

      // Write chunks to Firestore document_chunks collection
      const colRef = collection(db, 'document_chunks')
      await Promise.all(
        currentBatch.map(async (chunk, idx) => {
          await addDoc(colRef, {
            document_id: documentId,
            user_id: userId,
            content: chunk.content,
            embedding: sortedEmbeddings[idx],
            metadata: chunk.metadata || {},
            created_at: new Date().toISOString()
          })
        })
      )

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
