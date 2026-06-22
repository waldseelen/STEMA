// Academic boundary markers for intelligent chunking
const ACADEMIC_BOUNDARIES = [
  /^(?:Theorem|Definition|Proof|Example|Lemma|Corollary|Proposition|Remark|Note|Exercise|Solution)\s*\d*(?:\s*[:.])/gmi,
  /^(?:Teorem|Tanım|İspat|Örnek|Lemma|Sonuç|Uyarı|Not|Alıştırma|Çözüm)\s*\d*(?:\s*[:.])/gmi,
  /^(?:CHAPTER|SECTION|BÖLÜM|KISIM)\s+\d+/gmi,
  /^(?:#|##|###)\s+.+$/gm,
]

// Concept keywords for tagging chunks with concept codes
const CONCEPT_KEYWORDS: Record<string, RegExp> = {
  math101: /limit|süreklilik|sandviç|squeeze/i,
  math102: /türev|derivative|zincir kuralı|chain rule|maksimum|minimum|optimizasyon/i,
  math103: /integral|riemann|alan|hacim|belirsiz integral|belirli integral|antiderivative/i,
  math104: /kısmi integrasyon|integration by parts|değişken değiştirme|substitution/i,
  phys101: /newton|kuvvet|kütle|ivme|force|mass|acceleration|sürtünme|friction|serbest cisim/i,
  phys102: /iş|work|enerji|energy|kinetik|potansiyel|korunum|conservation/i,
  phys103: /elektriksel alan|electric field|potansiyel|potential|voltaj|voltage|güç|power/i,
  eee201: /kirchhoff|kcl|kvl|düğüm|node|çevre|mesh|devre|circuit|akım|current/i,
}

export interface ChunkMetadata {
  page: number
  chunkIndex?: number
  subIndex?: number
  concept_tags?: string[]
  difficulty?: 'easy' | 'medium' | 'hard'
  source_page?: number
  error_related_concepts?: string[]
  error_frequencies?: Array<{
    concept_id: string
    frequency: number
    types: string[]
  }>
}

export interface Chunk {
  content: string
  metadata: ChunkMetadata
}

function estimateTokenCount(text: string): number {
  const words = text.split(/\s+/).length
  return Math.ceil(words * 1.3)
}

function detectConceptTags(text: string): string[] {
  const tags: string[] = []
  for (const [code, regex] of Object.entries(CONCEPT_KEYWORDS)) {
    if (regex.test(text)) {
      tags.push(code)
    }
  }
  return tags
}

function estimateDifficulty(text: string): 'easy' | 'medium' | 'hard' {
  const complexTerms = /teorem|theorem|ispat|proof|lemma|integral|türev|differential|matrix|determinant|eigenvalue|laplace|fourier/gi
  const matches = text.match(complexTerms)
  const count = matches ? matches.length : 0
  if (count >= 3) return 'hard'
  if (count >= 1) return 'medium'
  return 'easy'
}

function extractLatexBlocks(text: string): { clean: string; blocks: string[] } {
  const blocks: string[] = []
  const clean = text.replace(/\$\$(.+?)\$\$/gs, (match) => {
    blocks.push(match)
    return '<<LATEX_BLOCK>>'
  })
  return { clean, blocks }
}

function restoreLatexBlocks(text: string, blocks: string[]): string {
  let idx = 0
  return text.replace(/<<LATEX_BLOCK>>/g, () => blocks[idx++] || '')
}

function findSplitPoint(text: string, targetStart: number, targetEnd: number): number {
  const searchFrom = Math.max(targetStart, 0)
  const searchTo = Math.min(targetEnd, text.length)

  const segment = text.slice(searchFrom, searchTo)

  const newlineBreak = segment.lastIndexOf('\n\n')
  if (newlineBreak > 10) return searchFrom + newlineBreak

  const sentenceBreak = segment.search(/(?<=[.?!])\s+(?=[A-Z"'(])/)
  if (sentenceBreak > 10) return searchFrom + sentenceBreak + 1

  const nearestNewline = segment.lastIndexOf('\n')
  if (nearestNewline > 10) return searchFrom + nearestNewline

  return searchFrom
}

export function smartChunkText(
  text: string,
  concepts: Array<{ id: string; name: string; description: string }>,
  pageNumber: number = 1
): Chunk[] {
  const chunks: Chunk[] = []
  const minChunkTokens = 200
  const maxChunkTokens = 500

  if (!text.trim()) return chunks

  const { clean: textWithoutLatex, blocks: latexBlocks } = extractLatexBlocks(text)

  const boundaryRegex = ACADEMIC_BOUNDARIES.map(r => r.source).join('|')
  const segments = textWithoutLatex.split(new RegExp(`(${boundaryRegex})`, 'gmi'))

  let currentSegment = ''

  function flushSegment() {
    if (!currentSegment.trim()) return

    const restored = restoreLatexBlocks(currentSegment, latexBlocks)
    const conceptTags = detectConceptTags(restored)
    const difficulty = estimateDifficulty(restored)

    chunks.push({
      content: restored,
      metadata: {
        page: pageNumber,
        chunkIndex: chunks.length,
        concept_tags: conceptTags,
        difficulty,
        source_page: pageNumber,
      },
    })
    currentSegment = ''
  }

  for (const seg of segments) {
    const isBoundary = ACADEMIC_BOUNDARIES.some(r => r.test(seg))
    const combined = currentSegment ? currentSegment + seg : seg

    if (isBoundary && currentSegment && estimateTokenCount(currentSegment) >= minChunkTokens) {
      flushSegment()
      currentSegment = seg
    } else if (estimateTokenCount(combined) <= maxChunkTokens) {
      currentSegment = combined
    } else {
      if (currentSegment) {
        chunks.push({
          content: restoreLatexBlocks(currentSegment, latexBlocks),
          metadata: {
            page: pageNumber,
            chunkIndex: chunks.length,
            concept_tags: detectConceptTags(currentSegment),
            difficulty: estimateDifficulty(currentSegment),
            source_page: pageNumber,
          },
        })
      }

      const overflowTokens = estimateTokenCount(seg)
      if (overflowTokens > maxChunkTokens) {
        let remaining = seg
        while (estimateTokenCount(remaining) > maxChunkTokens) {
          const splitPoint = findSplitPoint(
            remaining,
            Math.floor(remaining.length * (minChunkTokens / overflowTokens)),
            Math.floor(remaining.length * (maxChunkTokens / overflowTokens))
          )
          const part = remaining.slice(0, splitPoint).trim()
          if (part) {
            chunks.push({
              content: restoreLatexBlocks(part, latexBlocks),
              metadata: {
                page: pageNumber,
                chunkIndex: chunks.length,
                concept_tags: detectConceptTags(part),
                difficulty: estimateDifficulty(part),
                source_page: pageNumber,
              },
            })
          }
          remaining = remaining.slice(splitPoint).trim()
        }
        currentSegment = remaining
      } else {
        currentSegment = seg
      }
    }
  }

  if (currentSegment.trim()) {
    chunks.push({
      content: restoreLatexBlocks(currentSegment, latexBlocks),
      metadata: {
        page: pageNumber,
        chunkIndex: chunks.length,
        concept_tags: detectConceptTags(currentSegment),
        difficulty: estimateDifficulty(currentSegment),
        source_page: pageNumber,
      },
    })
  }

  return chunks
}

export function splitIntoChunksWithBoundaries(
  text: string,
  concepts: Array<{ id: string; name: string; description: string }>,
  pageNumber: number = 1
): Chunk[] {
  return smartChunkText(text, concepts, pageNumber)
}
