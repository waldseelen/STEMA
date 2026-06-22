import { describe, it, expect } from 'vitest'
import { scheduleFSRS } from '../src/modules/learn/lib/fsrs'

describe('FSRS spaced repetition scheduling algorithm', () => {
  const mockCard = {
    user_id: 'user-123',
    concept_id: 'concept-abc',
    front: 'Soru',
    back: 'Cevap',
    difficulty: 5.0,
    stability: 1.0,
    retrievability: 1.0,
    state: 0, // New
    reps: 0,
    lapses: 0,
    last_review: null,
    due_at: new Date().toISOString()
  }

  it('should schedule card correctly for rating 1 (Again)', () => {
    const updates = scheduleFSRS(mockCard, 1)

    expect(updates.difficulty).toBe(6.0) // difficulty increases by (3 - rating) * 0.5 = 1.0
    expect(updates.lapses).toBe(1)
    expect(updates.state).toBe(3) // Relearning
    expect(updates.reps).toBe(1)
    expect(updates.last_review).toBeDefined()
    expect(updates.due_at).toBeDefined()
    
    // stability should be reduced
    expect(updates.stability).toBeLessThanOrEqual(mockCard.stability)
  })

  it('should schedule card correctly for rating 3 (Good)', () => {
    const updates = scheduleFSRS(mockCard, 3)

    expect(updates.difficulty).toBe(5.0) // difficulty unchanged since rating is 3
    expect(updates.lapses).toBe(0)
    expect(updates.state).toBe(2) // Review
    expect(updates.reps).toBe(1)
    expect(updates.last_review).toBeDefined()
    expect(updates.due_at).toBeDefined()

    // stability should grow
    expect(updates.stability).toBeGreaterThan(mockCard.stability)
  })

  it('should adjust difficulty correctly (clamp within bounds)', () => {
    // Test upper limit (10.0)
    const difficultCard = { ...mockCard, difficulty: 9.8 }
    const updatesAgain = scheduleFSRS(difficultCard, 1) // again increases difficulty
    expect(updatesAgain.difficulty).toBe(10.0) // clamped to 10.0

    // Test lower limit (1.0)
    const easyCard = { ...mockCard, difficulty: 1.2 }
    const updatesEasy = scheduleFSRS(easyCard, 4) // easy decreases difficulty
    expect(updatesEasy.difficulty).toBe(1.0) // clamped to 1.0
  })

  it('should use default fallbacks for undefined values', () => {
    const freshCard = {
      user_id: 'user-123',
      concept_id: 'concept-abc',
      front: 'Soru',
      back: 'Cevap',
      difficulty: undefined as any,
      stability: undefined as any,
      retrievability: undefined as any,
      state: undefined as any,
      reps: undefined as any,
      lapses: undefined as any,
      last_review: null,
      due_at: new Date().toISOString()
    }

    const updates = scheduleFSRS(freshCard, 3)
    expect(updates.difficulty).toBe(5.0)
    expect(updates.stability).toBeGreaterThan(1.0)
    expect(updates.reps).toBe(1)
    expect(updates.lapses).toBe(0)
    expect(updates.state).toBe(2)
  })
})
