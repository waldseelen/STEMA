import { createClient } from '@supabase/supabase-js'
import { streamLLM, callLLM } from './lib/llmClient'
import { calculateCost } from './lib/config'

export const config = {
  runtime: 'edge',
}

const SOCRATIC_SYSTEM_PROMPT = `Sen STEMA (Sokratik STEM Öğrenme Platformu) bünyesinde çalışan yapay zeka tabanlı bir Sokratik Eğitmensin.
Görevin, öğrenciye doğrudan cevap veya tam çözüm sunmak YERİNE, onu ipuçları ve yönlendirici sorularla doğru cevaba ulaştırmaktır.

Uyman gereken katı kurallar:
1. KESİNLİKLE doğrudan çözüm, sonuç veya kod satırı verme.
2. Öğrencinin seviyesini anlamak için sorular sor (örn. "Bu formülü daha önce gördün mü?", "İlk adım olarak ne yapmayı düşündün?").
3. Matematiksel ifadeleri mutlaka satır içi $...$ veya blok $$...$$ LaTeX formatında yaz.
4. Kodlama sorularında tüm kodu yazma; mantığı açıklatacak sorular sor veya küçük kod blokları vererek eksiği onun tamamlamasını iste.
5. Yanıtlarını kısa, net ve yönlendirici tut. Tek seferde çok fazla bilgi verme.
6. 3 kademeli ipucu mekanizmasını izle:
   - 1. Kademe (Genel İpucu): Konseptin temel mantığını veya kuralı hatırlat.
   - 2. Kademe (Yönlendirici İpucu): Formüle, denkleme veya yönteme odaklandır.
   - 3. Kademe (Nihai İpucu): Neredeyse çözüme götüren spesifik bir yönlendirme sorusu sor.
7. Yanıtlarının en başına mutlaka o anki ipucu seviyesini belirten \`[HINT_LEVEL:X]\` etiketini ekle. X değeri 0, 1, 2 veya 3 olmalıdır:
   - \`[HINT_LEVEL:0]\`: İpucu verilmeyen durumlar (ilk karşılama, tebrik etme, doğrudan doğrulama vb.)
   - \`[HINT_LEVEL:1]\`: 1. Kademe (Genel İpucu)
   - \`[HINT_LEVEL:2]\`: 2. Kademe (Yönlendirici İpucu)
   - \`[HINT_LEVEL:3]\`: 3. Kademe (Nihai İpucu)
8. Çözümün kritik aşamalarında öğrenciye 'Peki neden burada eksi işareti kullandık?' veya 'Bu satırda hangi değişkeni tanımlamamız gerekir? Neden?' gibi kendi mantığını açıklamasını isteyeceğin öz-açıklama (self-explanation) soruları yönelt.
9. Öğrencinin yanlış cevap verdiğini veya hata yaptığını tespit edip ipucu durumuna (HINT_LEVEL 1, 2 veya 3) girdiğinde, yanıtının en başına o anki hata kategorisini belirten \`[ERROR_TYPE:type]\` etiketini ekle. \`type\` değeri şunlardan biri olmalıdır:
   - \`conceptual\`: Kavramsal bilgi eksikliği (örn. konunun temel prensibini veya formülün ne anlama geldiğini bilmeme).
   - \`procedural\`: İşlem sırası veya yöntem uygulama hatası (örn. integral alma sırasını karıştırma).
   - \`calculation\`: Basit işlem hatası veya dikkat eksikliği (örn. işaret hatası, dört işlem hatası).
   - \`strategic\`: Yanlış yöntem seçimi veya strateji hatası.
   Örnek format: \`[HINT_LEVEL:1][ERROR_TYPE:calculation] ...\`
10. GÖRSELLEŞTİRME DESTEĞİ: Matematiksel grafikleri, fizik problemlerindeki cisimleri veya kuvvet vektörlerini öğrenciye açıklamak için yanıtının sonuna bir veya birden fazla \`[WHITEBOARD_DRAW: json]\` komutu ekleyebilirsin. JSON yapısı şu tipleri destekler:
    - Çizgi: \`[WHITEBOARD_DRAW: {"type": "line", "x1": 50, "y1": 50, "x2": 250, "y2": 50, "color": "#2563eb", "label": "F"}]\`
    - Dikdörtgen: \`[WHITEBOARD_DRAW: {"type": "rect", "x": 100, "y": 150, "w": 80, "h": 50, "color": "#2563eb", "label": "m"}]\`
    - Daire: \`[WHITEBOARD_DRAW: {"type": "circle", "x": 200, "y": 200, "r": 30, "color": "#16a34a", "label": "R"}]\`
    - Metin: \`[WHITEBOARD_DRAW: {"type": "text", "x": 50, "y": 100, "text": "Hız = 5 m/s", "color": "#111111"}]\`
    - Matematik Grafiği/Eğrisi: \`[WHITEBOARD_DRAW: {"type": "plot", "formula": "sin(x)", "color": "#dc2626"}]\` (Desteklenen formüller: "sin(x)", "cos(x)", "x^2", "exp(x)", "log(x)").
    Örnek: "...bu fonksiyonun grafiği şu şekildedir: [WHITEBOARD_DRAW: {"type": "plot", "formula": "x^2", "color": "#dc2626"}]"
`

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const startTime = Date.now()

  try {
    const { messages, userMessage, sessionId, conceptId } = await req.json() as {
      messages: ChatMessage[]
      userMessage: string
      sessionId?: string
      conceptId?: string
    }

    if (!userMessage) {
      return new Response(JSON.stringify({ error: 'User message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 1. Initialize Supabase Client with User's JWT (to respect RLS) or Service Role Key
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    const token = authHeader ? authHeader.replace('Bearer ', '') : null

    // Use service role if local bypass or mock token is detected, otherwise use client token
    const isMockUser = token === 'mock-session-token' || !token
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Fallback logic for keys
    const activeKey = (isMockUser && supabaseServiceKey) ? supabaseServiceKey : (supabaseAnonKey || '')
    const supabaseClient = createClient(supabaseUrl || '', activeKey, {
      global: {
        headers: (!isMockUser && token) ? { Authorization: `Bearer ${token}` } : {},
      },
    })

    // 2. Select Model based on Routing Logic (Spec 4.5)
    const lowerMessage = userMessage.toLowerCase()
    const isCoding = /kod|programlama|react|html|css|javascript|typescript|python|function|class|dizi|array|db|database|sql|api|json|bug|hata/.test(lowerMessage)
    const isMathOrPhysics = /limit|türev|integral|fizik|kimya|biyoloji|formül|denklem|ispat|kanıt|hesapla|çöz|teorem|matematik|algebra|geometri/.test(lowerMessage)

    let targetModel: 'claude' | 'gemini' | 'deepseek' = 'deepseek'
    if (isCoding) {
      targetModel = 'claude'
    } else if (isMathOrPhysics) {
      targetModel = 'gemini'
    }

    // 3. Check for OpenRouter API key (single provider)
    const openrouterKey = process.env.OPENROUTER_API_KEY
    const isMockMode = !openrouterKey
    console.log(`[AI Router] Target: ${targetModel}, Mock Mode: ${isMockMode}`)

    // Create stream
    const encoder = new TextEncoder()
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // 4. Run database setup asynchronously (e.g. creating session if needed)
    let activeSessionId = sessionId
    let userId = '00000000-0000-0000-0000-000000000000'

    // Try to resolve user id
    if (token && token !== 'mock-session-token') {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser()
        if (user) userId = user.id
      } catch (err) {
        console.error('Error fetching user from auth token:', err)
      }
    }

    // Start background processing
    const runAI = async () => {
      let completeResponse = ''
      let promptTokensCount = 0
      let completionTokensCount = 0

      try {
        // 5.3: Fetch Concept Mastery Score
        let masteryScore: number | null = null
        if (conceptId && userId && userId !== '00000000-0000-0000-0000-000000000000') {
          try {
            const { data: masteryData } = await supabaseClient
              .from('concept_mastery')
              .select('score')
              .eq('user_id', userId)
              .eq('concept_id', conceptId)
              .maybeSingle()
            if (masteryData) {
              masteryScore = Number(masteryData.score)
            }
          } catch (masteryErr) {
            console.error('Error fetching concept mastery:', masteryErr)
          }
        }

        // Build dynamic system prompt based on mastery score
        let dynamicSystemPrompt = SOCRATIC_SYSTEM_PROMPT
        if (masteryScore !== null) {
          if (masteryScore >= 90) {
            dynamicSystemPrompt += `\n[SİSTEM BİLGİSİ: Öğrencinin bu konudaki hakimiyet skoru %${masteryScore}'dir. Bu seviye çok yüksek (%90 ve üzeri) olduğu için, Sokratik yönlendirme adımlarını atlayabilir, doğrudan öğrencinin cevabını doğrulayabilir ve eğer doğruysa tebrik edip tam çözümü sunabilirsin. Yanıtının başına mutlaka [HINT_LEVEL:0] ekle.]\n`
          } else {
            dynamicSystemPrompt += `\n[SİSTEM BİLGİSİ: Öğrencinin bu konudaki hakimiyet skoru: %${masteryScore}.]\n`
          }
        }

        // RAG: Fetch relevant document chunks using pgvector and match_document_chunks RPC
        let searchContext = ''
        const openrouterKey = process.env.OPENROUTER_API_KEY
        if (openrouterKey && userId && userId !== '00000000-0000-0000-0000-000000000000') {
          try {
            // Check count of user documents first to avoid unnecessary embedding calls
            const { count, error: countErr } = await supabaseClient
              .from('documents')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', userId)

            if (!countErr && count && count > 0) {
              const embedResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${openrouterKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'openai/text-embedding-3-small',
                  input: userMessage
                })
              })

              if (embedResponse.ok) {
                const embedData = await embedResponse.json()
                const queryEmbedding = embedData.data?.[0]?.embedding
                
                if (queryEmbedding) {
                  const { data: matchedChunks, error: rpcError } = await supabaseClient
                    .rpc('match_document_chunks', {
                      query_embedding: queryEmbedding,
                      match_threshold: 0.35,
                      match_count: 3,
                      p_user_id: userId
                    })

                  if (!rpcError && matchedChunks && matchedChunks.length > 0) {
                    searchContext = matchedChunks
                      .map((chunk: any) => `[Kaynak: ${chunk.metadata?.page ? `Sayfa ${chunk.metadata.page}` : 'Ders Notu'}]\n${chunk.content}`)
                      .join('\n\n')
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error during RAG vector search:', err)
          }
        }

        if (searchContext) {
          dynamicSystemPrompt += `\n\n[KULLANICI DERS NOTLARINDAN ALINAN BAĞLAM]\nÖğrencinin yüklediği ders notlarından en ilgili kısımlar aşağıdadır. Soruyu öncelikle bu bağlama dayanarak yanıtla:\n${searchContext}\n\n[HALÜSİNASYON ÖNLEME POLİTİKASI]\nEğer öğrencinin sorusu veya istenen bilgi yukarıdaki bağlamda bulunmuyorsa, KESİNLİKLE dışarıdan bilgi uydurma. Bunun yerine "Bu bilgi kaynaklarınızda bulunamadı." şeklinde net ve kibar bir yanıt dön.`
        }

        // Calculate user response time (stuck duration) for Socratic State Machine (5.5)
        let responseTimeMs = 0
        if (activeSessionId && supabaseUrl) {
          try {
            const { data: lastAssistantMsg } = await supabaseClient
              .from('messages')
              .select('created_at')
              .eq('session_id', activeSessionId)
              .eq('role', 'assistant')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            
            if (lastAssistantMsg) {
              const lastTime = new Date(lastAssistantMsg.created_at).getTime()
              responseTimeMs = Date.now() - lastTime
            }
          } catch (err) {
            console.error('Error calculating user response time:', err)
          }
        }

        // Log user response event with response time
        if (activeSessionId && supabaseUrl) {
          void supabaseClient
            .from('tutor_events')
            .insert({
              user_id: userId,
              event_type: 'user_response',
              payload: {
                session_id: activeSessionId,
                concept_id: conceptId || null,
                response_time_ms: responseTimeMs,
                content_length: userMessage.length,
                timestamp: new Date().toISOString()
              }
            })
            .then(({ error }) => {
              if (error) console.error('Error logging user_response tutor event:', error)
            })
        }

        // Resolve session ID
        if (!activeSessionId && supabaseUrl) {
          try {
            const { data: sessionData, error: sessionErr } = await supabaseClient
              .from('sessions')
              .insert({
                user_id: userId,
                title: userMessage.slice(0, 40) + (userMessage.length > 40 ? '...' : ''),
                status: 'active',
              })
              .select('id')
              .single()

            if (sessionErr) throw sessionErr
            if (sessionData) {
              activeSessionId = sessionData.id
              // Send control event to tell frontend about session ID
              await writer.write(encoder.encode(`[SESSION_ID:${activeSessionId}]\n`))

              // Log session start tutor event
              void supabaseClient
                .from('tutor_events')
                .insert({
                  user_id: userId,
                  event_type: 'session_start',
                  payload: {
                    session_id: activeSessionId,
                    concept_id: conceptId || null,
                    start_time: new Date().toISOString()
                  }
                })
                .then(({ error }) => {
                  if (error) console.error('Error logging session_start tutor event:', error)
                })
            }
          } catch (dbErr) {
            console.error('Could not create session in Supabase:', dbErr)
          }
        }

        // If session created, store user message in background
        if (activeSessionId && supabaseUrl) {
          void supabaseClient
            .from('messages')
            .insert({
              user_id: userId,
              session_id: activeSessionId,
              role: 'user',
              content: userMessage,
            })
            .then(({ error }) => {
              if (error) console.error('Error logging user message:', error)
            })
        }

        if (isMockMode) {
          await writer.write(encoder.encode(`[MOCK_SOCRATIC_MODE] `))
          const simulatedResponse = getMockSocraticResponse(userMessage, targetModel)
          const words = simulatedResponse.split(' ')
          for (const word of words) {
            await new Promise(r => setTimeout(r, 60))
            await writer.write(encoder.encode(word + ' '))
            completeResponse += word + ' '
          }
          promptTokensCount = Math.round(userMessage.length / 4)
          completionTokensCount = Math.round(completeResponse.length / 4)
        } else {
          const formattedHistory = messages.map(m => ({
            role: m.role,
            content: m.content,
          }))
          formattedHistory.push({ role: 'user', content: userMessage })

          await streamLLM(
            {
              taskType: 'socratic',
              systemPrompt: dynamicSystemPrompt,
              messages: formattedHistory,
              stream: true,
            },
            {
              onToken: async (token) => {
                await writer.write(encoder.encode(token))
                completeResponse += token
              },
              onComplete: async (result) => {
                promptTokensCount = result.promptTokens
                completionTokensCount = result.completionTokens
              },
              onError: async (err) => {
                throw err
              },
            },
          )
        }

        // 10.7: Hallüsinasyon Önleme — hard-code validation layer
        if (searchContext && completeResponse.length > 20) {
          const isTurkish = /[ğüşıöçĞÜŞİÖÇ]/.test(userMessage) || userMessage.includes('nedir') || userMessage.includes('nasıl')
          const noSourceFound = completeResponse.includes('bulunamadı') || 
            completeResponse.includes('kaynaklarınızda') ||
            completeResponse.includes('not found') ||
            completeResponse.includes('no information')
          const claimsSource = completeResponse.includes('[Kaynak:') || 
            completeResponse.includes('sayfa') ||
            completeResponse.includes('page') ||
            completeResponse.includes('ders notu')
          if (!claimsSource && !noSourceFound) {
            const warningNote = isTurkish
              ? '\n\n> 📖 **Not:** Bu yanıt, yüklediğiniz ders notlarındaki bilgilerle doğrulanamamıştır. Lütfen kendi kaynaklarınızı kontrol ediniz.'
              : '\n\n> 📖 **Note:** This response could not be verified against your uploaded study materials. Please verify against your own sources.'
            await writer.write(encoder.encode(warningNote))
            completeResponse += warningNote
          }
        }

        // Apply estimation fallback if api returns no tokens
        if (promptTokensCount === 0) {
          promptTokensCount = Math.round(userMessage.length / 4)
        }
        if (completionTokensCount === 0) {
          completionTokensCount = Math.round(completeResponse.length / 4)
        }

        // Calculate Cost & Latency
        const latencyMs = Date.now() - startTime
        const cost = calculateCost(promptTokensCount, completionTokensCount, 'deepseek/deepseek-v4-flash')

        console.log(`[AI Log] Latency: ${latencyMs}ms, Prompt Tokens: ${promptTokensCount}, Completion Tokens: ${completionTokensCount}, Cost: $${cost.toFixed(6)}`)

        // Parse hint level from the complete response
        let parsedHintLevel = 0
        const hintMatch = completeResponse.match(/\[HINT_LEVEL:(\d)\]/)
        if (hintMatch) {
          parsedHintLevel = parseInt(hintMatch[1], 10)
        }

        // 4.7: Log to Database
        if (activeSessionId && supabaseUrl) {
          void supabaseClient
            .from('messages')
            .insert({
              user_id: userId,
              session_id: activeSessionId,
              role: 'assistant',
              content: completeResponse,
              raw_response: {
                model: 'deepseek/deepseek-v4-flash',
                routed_from: targetModel,
                is_mock: isMockMode,
                prompt_tokens: promptTokensCount,
                completion_tokens: completionTokensCount,
                latency_ms: latencyMs,
                pricing_cost: cost,
                hint_level: parsedHintLevel,
              },
              token_cost: cost,
              prompt_tokens: promptTokensCount,
              completion_tokens: completionTokensCount,
              latency_ms: latencyMs,
            })
            .then(({ error }) => {
              if (error) console.error('Error logging assistant message:', error)
            })

          // Log tutor event for hint shown
          if (parsedHintLevel > 0) {
            void supabaseClient
              .from('tutor_events')
              .insert({
                user_id: userId,
                event_type: 'hint_shown',
                payload: {
                  session_id: activeSessionId,
                  concept_id: conceptId || null,
                  hint_level: parsedHintLevel,
                  timestamp: new Date().toISOString()
                }
              })
              .then(({ error }) => {
                if (error) console.error('Error logging hint_shown tutor event:', error)
              })
          }

          // Log tutor event for socratic success (correct resolution)
          if (parsedHintLevel === 0 && messages && messages.length > 0) {
            void supabaseClient
              .from('tutor_events')
              .insert({
                user_id: userId,
                event_type: 'socratic_success',
                payload: {
                  session_id: activeSessionId,
                  concept_id: conceptId || null,
                  timestamp: new Date().toISOString()
                }
              })
              .then(({ error }) => {
                if (error) console.error('Error logging socratic_success tutor event:', error)
              })
          }

          // Parse mistake category for error_logs (7.1 & 7.2)
          let parsedErrorType: string | null = null
          const errorMatch = completeResponse.match(/\[ERROR_TYPE:(conceptual|procedural|calculation|strategic)\]/)
          if (errorMatch) {
            parsedErrorType = errorMatch[1]
          }

          if (parsedErrorType) {
            // Log to error_logs table
            void supabaseClient
              .from('error_logs')
              .insert({
                user_id: userId,
                concept_id: conceptId || null,
                error_type: parsedErrorType,
                raw_user_answer: userMessage,
                model_feedback: completeResponse.replace(/\[HINT_LEVEL:\d\]|\[ERROR_TYPE:\w+\]/g, '').trim(),
              })
              .then(({ error }) => {
                if (error) console.error('Error logging to error_logs:', error)
              })

            // Trigger background SRCard Flashcard Generation (7.4)
            if (conceptId) {
              void generateAndSaveSRCard(
                supabaseClient,
                userId,
                conceptId,
                userMessage,
                completeResponse.replace(/\[HINT_LEVEL:\d\]|\[ERROR_TYPE:\w+\]/g, '').trim(),
              )
            }
          }
        }
      } catch (err: any) {
        console.error('Error in Socratic AI loop:', err)
        await writer.write(encoder.encode(`\n\n⚠️ Hata oluştu: ${err.message || err}`))
      } finally {
        await writer.close()
      }
    }

    void runAI()

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    console.error('Serverless Function global error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

function getMockSocraticResponse(message: string, model: string): string {
  const query = message.toLowerCase()
  if (query.includes('integral') || query.includes('türev')) {
    return 'Harika bir matematik problemi! Çözüme doğrudan geçmeden önce, gelin konsepti analiz edelim. $\\int x \\cdot e^{x^2} dx$ integralinde hangi terime $u$ demeliyiz? Eğer $u = x^2$ dersek, diferansiyel diferansiyel $du$ ne olur?'
  }
  if (query.includes('big-o') || query.includes('karmaşıklık') || query.includes('zaman')) {
    return 'Algoritmik karmaşıklık analizi yapıyoruz! İçiçe iki döngümüz olduğunda, her döngü $N$ adım atıyorsa adım sayısını $N$ cinsinden nasıl formüle edebilirsin? Sence bu durumda Big-O limiti ne olacaktır?'
  }
  if (model === 'claude') {
    return 'Kodlama sorunuzu inceleyelim. İstenilen algoritmanın temel mantığını düşündünüz mü? Örneğin döngüyü kurarken hangi değişken sınırlarına dikkat etmeliyiz? Çözümü yazmaya nereden başlamak istersiniz?'
  }
  return 'Bu STEM konusunu inceleyelim. Karşılaştığınız problemi çözmek için hangi temel yasaları veya formülleri (örn. Newton yasaları, termodinamik kuralları vb.) kullanabileceğimizi belirtebilir misiniz? İlk adım olarak ne yapmalıyız?'
}

async function generateAndSaveSRCard(
  supabaseClient: any,
  userId: string,
  conceptId: string,
  userMessage: string,
  modelFeedback: string,
): Promise<void> {
  try {
    let conceptName = 'STEM Konusu'
    const { data: conceptData } = await supabaseClient
      .from('concepts')
      .select('name')
      .eq('id', conceptId)
      .single()
    if (conceptData?.name) {
      conceptName = conceptData.name
    }

    let front = `Konsept: ${conceptName}\nSoru: Hatayı analiz edip doğrusunu uygulayın.`
    let back = `Açıklama:\n${modelFeedback}`

    const systemPrompt = `Sen bir STEM eğitmenisin. Öğrencinin bir konuda yaptığı hatayı analiz ederek, bu hatayı düzeltmesini sağlayacak bir Spaced Repetition (Flashcard - Bilgi Kartı) oluşturmalısın.
Oluşturacağın kart doğrudan öğrencinin hatasını ve doğrusunu sorgulamalıdır. Kartın ön (front) yüzünde konsepti hatırlatacak ve hatayı sorgulayacak bir soru veya problem, arka (back) yüzünde ise doğru çözümün açıklaması ve cevabı bulunmalıdır.
Matematiksel ifadeleri mutlaka satır içi $...$ veya blok $$...$$ LaTeX formatında yaz.
Yanıtını kesinlikle sadece JSON formatında ver. Başka hiçbir açıklama, markdown kodu veya etiket ekleme. JSON yapısı şu şekilde olmalıdır:
{
  "front": "Kartın ön yüzü (soru/sorgu)",
  "back": "Kartın arka yüzü (cevap ve açıklama)"
}`

    const userPrompt = `Konsept: ${conceptName}
Öğrencinin Yanıtı / Hatası: ${userMessage}
Eğitmen Geri Bildirimi: ${modelFeedback}`

    try {
      const result = await callLLM({
        taskType: 'flashcard',
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })

      if (result.content) {
        let cleanText = result.content.trim()
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '').trim()
        }
        const cardJson = JSON.parse(cleanText)
        if (cardJson.front && cardJson.back) {
          front = cardJson.front
          back = cardJson.back
        }
      }
    } catch (apiErr) {
      console.error('Error during card generation API call:', apiErr)
    }

    const { error: insertErr } = await supabaseClient
      .from('sr_cards')
      .insert({
        user_id: userId,
        concept_id: conceptId,
        front,
        back,
        due_at: new Date().toISOString(),
        difficulty: 5.0,
        stability: 1.0,
        retrievability: 1.0,
        state: 0,
        reps: 0,
        lapses: 0
      })

    if (insertErr) {
      console.error('Error inserting SR card:', insertErr)
    } else {
      console.log(`SR card generated and saved successfully for concept: ${conceptName}`)
    }
  } catch (err) {
    console.error('Error in generateAndSaveSRCard:', err)
  }
}

