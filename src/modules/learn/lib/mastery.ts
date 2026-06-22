export interface MasteryEvidenceData {
  socraticSuccessCount: number
  maxFeynmanScore: number
  cardSuccessCount: number
}

/**
 * Calculates the concept mastery score (0-100) based on three independent evidences:
 * 1. Socratic Success (solved questions with 0 hints or correctly verified)
 * 2. Feynman Success (explaining the concept with score >= 70)
 * 3. FSRS Card Success (correct flashcard reviews with rating 3 or 4)
 * 
 * Rules:
 * - If any of the three independent evidence types is missing, the score is capped at 50.
 * - If all three are present, the score can grow up to 100 based on a weighted average.
 */
export function calculateMasteryScore(data: MasteryEvidenceData): number {
  const { socraticSuccessCount, maxFeynmanScore, cardSuccessCount } = data

  const hasSocratic = socraticSuccessCount > 0
  const hasFeynman = maxFeynmanScore >= 70
  const hasCard = cardSuccessCount > 0

  // Calculate individual components (0-100)
  const socraticComponent = Math.min(100, socraticSuccessCount * 35) // 3 successes give ~100%
  const feynmanComponent = maxFeynmanScore // directly uses the best score
  const cardComponent = Math.min(100, cardSuccessCount * 20) // 5 reviews give ~100%

  // Weighted average: Socratic (20%), Feynman (50%), Card (30%)
  const weightedAverage = Math.round(
    0.2 * socraticComponent + 
    0.5 * feynmanComponent + 
    0.3 * cardComponent
  )

  const hasThreeEvidences = hasSocratic && hasFeynman && hasCard

  if (!hasThreeEvidences) {
    return Math.min(50, weightedAverage)
  }

  return Math.min(100, weightedAverage)
}
