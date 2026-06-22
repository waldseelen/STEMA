/**
 * Plan-Ex SaaS - Subscription Plans Configuration
 * 
 * Free vs Pro plan özellikleri ve limitleri
 */

export const PLAN_TYPES = {
  FREE: 'free',
  PRO: 'pro',
} as const

export type PlanType = typeof PLAN_TYPES[keyof typeof PLAN_TYPES]

export interface PlanLimits {
  courses: number | 'unlimited'
  pdfPerCourse: number | 'unlimited'
  habits: number | 'unlimited'
  personalTasks: number | 'unlimited'
  aiFeatures: boolean
  emailDigests: boolean
  calendarSync: boolean
  socialFeatures: boolean
  exportFeatures: boolean
  prioritySupport: boolean
}

export interface PlanConfig {
  id: PlanType
  name: string
  displayName: string
  description: string
  price: {
    monthly: number
    yearly: number
    currency: string
  }
  limits: PlanLimits
  features: string[]
  popular?: boolean
}

/**
 * Free Plan - Temel özellikler
 */
export const FREE_PLAN: PlanConfig = {
  id: PLAN_TYPES.FREE,
  name: 'free',
  displayName: 'Ücretsiz',
  description: 'Başlamak için ideal',
  price: {
    monthly: 0,
    yearly: 0,
    currency: 'TRY',
  },
  limits: {
    courses: 3,
    pdfPerCourse: 2,
    habits: 5,
    personalTasks: 20,
    aiFeatures: false,
    emailDigests: false,
    calendarSync: false,
    socialFeatures: false,
    exportFeatures: false,
    prioritySupport: false,
  },
  features: [
    '3 ders',
    'Ders başına 2 PDF',
    '5 alışkanlık',
    '20 kişisel görev',
    'Temel istatistikler',
    'Pomodoro timer',
    'Offline çalışma',
    'Takvim görünümü',
  ],
}

/**
 * Pro Plan - Tüm özellikler
 */
export const PRO_PLAN: PlanConfig = {
  id: PLAN_TYPES.PRO,
  name: 'pro',
  displayName: 'Pro',
  description: 'Tam güç, sınırsız özellikler',
  price: {
    monthly: 49.99,
    yearly: 499.99, // ~%17 indirim
    currency: 'TRY',
  },
  limits: {
    courses: 'unlimited',
    pdfPerCourse: 'unlimited',
    habits: 'unlimited',
    personalTasks: 'unlimited',
    aiFeatures: true,
    emailDigests: true,
    calendarSync: true,
    socialFeatures: true,
    exportFeatures: true,
    prioritySupport: true,
  },
  features: [
    '✨ Sınırsız ders',
    '✨ Sınırsız PDF',
    '✨ Sınırsız alışkanlık',
    '✨ Sınırsız görev',
    '🤖 AI soru üretimi',
    '🤖 AI özet çıkarma',
    '🤖 Akıllı planlayıcı',
    '📧 E-posta özetleri',
    '📅 Google Calendar sync',
    '🔗 Ders programı paylaşma',
    '👥 Grup çalışma odaları',
    '📊 Gelişmiş analitik',
    '📤 Export özellikleri (Markdown, PDF, PNG)',
    '🏆 Leaderboard ve rozetler',
    '⚡ Öncelikli destek',
  ],
  popular: true,
}

/**
 * Tüm planlar
 */
export const PLANS: Record<PlanType, PlanConfig> = {
  [PLAN_TYPES.FREE]: FREE_PLAN,
  [PLAN_TYPES.PRO]: PRO_PLAN,
}

/**
 * Stripe Price ID'leri (Stripe Dashboard'dan alınacak)
 */
export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || '',
  PRO_YEARLY: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID || '',
} as const

/**
 * Feature gating helper
 */
export function canUseFeature(
  userPlan: PlanType,
  feature: keyof PlanLimits
): boolean {
  return PLANS[userPlan].limits[feature] === true
}

/**
 * Limit kontrolü helper
 */
export function checkLimit(
  userPlan: PlanType,
  feature: keyof Pick<PlanLimits, 'courses' | 'pdfPerCourse' | 'habits' | 'personalTasks'>,
  currentCount: number
): { allowed: boolean; limit: number | 'unlimited' } {
  const limit = PLANS[userPlan].limits[feature]
  
  if (limit === 'unlimited') {
    return { allowed: true, limit: 'unlimited' }
  }
  
  return {
    allowed: currentCount < limit,
    limit,
  }
}

/**
 * Upgrade gerekli mi?
 */
export function needsUpgrade(
  userPlan: PlanType,
  feature: keyof PlanLimits
): boolean {
  if (userPlan === PLAN_TYPES.PRO) return false
  return !canUseFeature(userPlan, feature)
}
