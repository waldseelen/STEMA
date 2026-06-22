export interface SRCard {
  id: string
  user_id: string
  concept_id: string | null
  front: string
  back: string
  difficulty: number
  stability: number
  retrievability: number
  state: number // 0=New, 1=Learning, 2=Review, 3=Relearning
  reps: number
  lapses: number
  last_review: string | null
  due_at: string
  created_at: string
}

// FSRS Rating values:
// 1 = Again (Tekrar)
// 2 = Hard (Zor)
// 3 = Good (İyi)
// 4 = Easy (Kolay)
export function scheduleFSRS(card: Omit<SRCard, 'id' | 'created_at'>, rating: 1 | 2 | 3 | 4): Partial<SRCard> {
  const now = new Date()
  let difficulty = Number(card.difficulty || 5.0)
  let stability = Number(card.stability || 1.0)
  let reps = Number(card.reps || 0) + 1
  let lapses = Number(card.lapses || 0)
  let state = Number(card.state || 0)

  // 1. Calculate elapsed days since last review
  let elapsedDays = 1
  if (card.last_review) {
    const elapsedMs = now.getTime() - new Date(card.last_review).getTime()
    elapsedDays = Math.max(1, Math.round(elapsedMs / (1000 * 60 * 60 * 24)))
  }

  // 2. Adjust difficulty (clamp between 1.0 and 10.0)
  // Hard (2) -> increase difficulty, Good (3) -> maintain, Easy (4) -> decrease
  const difficultyDelta = (rating - 3) * 0.5
  difficulty = Math.min(10.0, Math.max(1.0, difficulty - difficultyDelta))

  // 3. Adjust stability
  if (rating === 1) {
    // Again: Reset stability, increment lapses
    stability = Math.max(0.5, stability * 0.3)
    lapses += 1
    state = 3 // Relearning
  } else {
    // Correct answer: Stability grows
    const multiplier = rating === 2 ? 1.2 : rating === 3 ? 2.5 : 4.0
    stability = stability * (1 + (0.1 * elapsedDays * multiplier))
    state = 2 // Review
  }

  // 4. Calculate next interval (days)
  const intervalDays = Math.max(1, Math.round(stability))
  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)

  return {
    difficulty,
    stability,
    reps,
    lapses,
    state,
    last_review: now.toISOString(),
    due_at: dueAt.toISOString()
  }
}
