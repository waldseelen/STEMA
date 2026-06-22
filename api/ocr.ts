import { callLLMWithMultimodal } from './lib/llmClient'

export const config = {
  runtime: 'edge',
}

const OCR_SYSTEM_PROMPT = `Sen bir STEM matematik/formül OCR asistanısın. Görevin, kullanıcının gönderdiği görseldeki el yazısı veya basılı matematiksel ifadeleri, denklemleri ve metinleri analiz ederek doğru LaTeX formatına dönüştürmektir.

Kurallar:
1. Görselde ne görüyorsan onu LaTeX'e çevir. Yanına fazladan açıklama EKLEME.
2. Tüm matematiksel ifadeleri mutlaka satır içi $...$ veya blok $$...$$ ile sar.
3. Eğer görselde sadece metin varsa, metni olduğu gibi döndür.
4. Eğer görsel bir grafik veya şekil içeriyorsa, grafiğin kısa bir tanımını yap (en fazla 1 cümle).
5. Kesinlikle sadece şu JSON formatında yanıt ver:
{
  "latex": "algılanan latex veya metin",
  "description": "varsa grafik/şekil tanımı (yoksa boş string)",
  "confidence": 0.0-1.0 arası güven skoru
}
6. Hiçbir şey algılanamazsa: {"latex": "", "description": "Görselde matematiksel ifade veya metin tespit edilemedi.", "confidence": 0.0}
7. Ters \\ işaretlerini doğru kullan. Yanlış: \int, Doğru: \\int`

export default async function handler(req: Request): Promise<Response> {
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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers })
  }

  try {
    const { image } = await req.json() as { image: string }
    if (!image || typeof image !== 'string') {
      return new Response(JSON.stringify({ error: 'Image base64 string is required' }), { status: 400, headers })
    }

    let result: { latex: string; description: string; confidence: number }

    try {
      const llmResult = await callLLMWithMultimodal(
        'ocr',
        OCR_SYSTEM_PROMPT,
        'Bu görseldeki matematiksel ifadeleri ve metinleri LaTeX formatına dönüştür:',
        image,
      )

      try {
        result = JSON.parse(llmResult.content)
      } catch {
        result = { latex: llmResult.content, description: '', confidence: 0.5 }
      }
    } catch (err: any) {
      console.error('OCR LLM call failed:', err)
      return new Response(JSON.stringify({ error: `OCR failed: ${err.message}` }), { status: 502, headers })
    }

    return new Response(JSON.stringify(result), { status: 200, headers })
  } catch (err: any) {
    console.error('OCR handler error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { status: 500, headers })
  }
}
