import { describe, it, expect } from 'vitest'
import { calculateMasteryScore } from '../src/modules/learn/lib/mastery'

describe('Concept Mastery scoring algorithm', () => {
  it('should cap mastery at 50 if one of the evidences is missing', () => {
    // Only Socratic success
    const score1 = calculateMasteryScore({
      socraticSuccessCount: 3,
      maxFeynmanScore: 0,
      cardSuccessCount: 0
    })
    expect(score1).toBeLessThanOrEqual(50)

    // Socratic + Feynman success but no card success
    const score2 = calculateMasteryScore({
      socraticSuccessCount: 2,
      maxFeynmanScore: 85,
      cardSuccessCount: 0
    })
    expect(score2).toBeLessThanOrEqual(50)

    // Socratic + Card success but no successful Feynman (score < 70)
    const score3 = calculateMasteryScore({
      socraticSuccessCount: 3,
      maxFeynmanScore: 50,
      cardSuccessCount: 5
    })
    expect(score3).toBeLessThanOrEqual(50)
  })

  it('should remove cap and calculate full weighted score if all three evidences are present', () => {
    // Socratic (3 = 100), Feynman (80 = 80), Card (5 = 100)
    // weighted = 0.2*100 + 0.5*80 + 0.3*100 = 20 + 40 + 30 = 90%
    const score = calculateMasteryScore({
      socraticSuccessCount: 3,
      maxFeynmanScore: 80,
      cardSuccessCount: 5
    })
    expect(score).toBe(90)
    expect(score).toBeGreaterThan(50)
  })

  it('should return 100 for perfect performance across all metrics', () => {
    const score = calculateMasteryScore({
      socraticSuccessCount: 5,
      maxFeynmanScore: 100,
      cardSuccessCount: 10
    })
    expect(score).toBe(100)
  })

  it('should return 0 when there is no activity', () => {
    const score = calculateMasteryScore({
      socraticSuccessCount: 0,
      maxFeynmanScore: 0,
      cardSuccessCount: 0
    })
    expect(score).toBe(0)
  })
})
