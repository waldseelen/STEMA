interface ConceptErrorSummary {
  conceptId: string
  errorTypes: string[]
  frequency: number
}

interface ErrorIndexMap {
  [conceptId: string]: ConceptErrorSummary
}

export function buildErrorIndex(errorLogs: any[]): ErrorIndexMap {
  const index: ErrorIndexMap = {}

  for (const log of errorLogs) {
    if (!log.concept_id) continue
    if (!index[log.concept_id]) {
      index[log.concept_id] = {
        conceptId: log.concept_id,
        errorTypes: [],
        frequency: 0,
      }
    }
    if (!index[log.concept_id].errorTypes.includes(log.error_type)) {
      index[log.concept_id].errorTypes.push(log.error_type)
    }
    index[log.concept_id].frequency++
  }

  return index
}

interface ConceptMapEntry {
  id: string
  code: string
  name: string
  keywords: string[]
}

export function buildConceptKeywordMap(
  concepts: Array<{ id: string; code: string; name: string; description?: string }>
): ConceptMapEntry[] {
  return concepts.map(c => {
    const stopWords = ['ve', 'bir', 'ile', 'için', 'bu', 'olarak', 'olan', 'the', 'and', 'for', 'that', 'this']
    const text = `${c.name} ${c.description || ''}`
    const rawKeywords = text
      .split(/[\s,.\n]+/)
      .map(w => w.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ-]/g, '').toLowerCase())
      .filter(w => w.length > 2 && !stopWords.includes(w) && !/^\d+$/.test(w))
    const unique = [...new Set(rawKeywords)]
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      keywords: unique,
    }
  })
}

export function matchChunkToConcepts(
  chunkContent: string,
  conceptMap: ConceptMapEntry[],
  threshold: number = 0.05
): string[] {
  const lowerContent = chunkContent.toLowerCase()
  const matchedIds: string[] = []

  for (const entry of conceptMap) {
    let matchCount = 0
    for (const kw of entry.keywords) {
      if (lowerContent.includes(kw)) {
        matchCount++
      }
    }
    const ratio = entry.keywords.length > 0 ? matchCount / entry.keywords.length : 0
    if (ratio >= threshold) {
      matchedIds.push(entry.id)
    }
  }

  return matchedIds
}
