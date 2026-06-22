/**
 * Plan.Ex - Accessibility (A11y) Utilities
 *
 * Screen reader bildirimleri, ARIA live regions,
 * ve erişilebilirlik yardımcıları.
 */

import { useCallback, useEffect, useRef } from 'react'
import { getCurrentLocale, translateCurrentLocale } from '@/i18n/config'

// ============================================
// Live Region Component
// ============================================

const LIVE_REGION_ID = 'a11y-live-region'
const ASSERTIVE_REGION_ID = 'a11y-assertive-region'

/**
 * A11y live regions'ı document'a ekle
 * App.tsx'te bir kez çağır
 */
export function initA11yLiveRegions(): void {
    if (typeof document === 'undefined') return

    // Polite region (normal duyurular)
    if (!document.getElementById(LIVE_REGION_ID)) {
        const politeRegion = document.createElement('div')
        politeRegion.id = LIVE_REGION_ID
        politeRegion.setAttribute('aria-live', 'polite')
        politeRegion.setAttribute('aria-atomic', 'true')
        politeRegion.className = 'sr-only'
        politeRegion.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `
        document.body.appendChild(politeRegion)
    }

    // Assertive region (acil duyurular)
    if (!document.getElementById(ASSERTIVE_REGION_ID)) {
        const assertiveRegion = document.createElement('div')
        assertiveRegion.id = ASSERTIVE_REGION_ID
        assertiveRegion.setAttribute('aria-live', 'assertive')
        assertiveRegion.setAttribute('aria-atomic', 'true')
        assertiveRegion.className = 'sr-only'
        assertiveRegion.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `
        document.body.appendChild(assertiveRegion)
    }
}

// ============================================
// Announce Functions
// ============================================

/**
 * Screen reader'a mesaj duyur (polite)
 * Kullanıcı işlemini kesmez, sıradaki boşlukta duyurulur
 *
 * @example
 * announce('Timer başlatıldı')
 * announce('5 dakika geçti')
 */
export function announce(message: string): void {
    const region = document.getElementById(LIVE_REGION_ID)
    if (!region) return

    // Önce temizle (screen reader'ın değişikliği algılaması için)
    region.textContent = ''

    // Biraz bekle ve yeni mesajı ekle
    requestAnimationFrame(() => {
        region.textContent = message
    })
}

/**
 * Screen reader'a acil mesaj duyur (assertive)
 * Mevcut okunan içeriği keser ve hemen duyurur
 *
 * @example
 * announceUrgent('Hata: İşlem başarısız')
 * announceUrgent('Timer durduruldu')
 */
export function announceUrgent(message: string): void {
    const region = document.getElementById(ASSERTIVE_REGION_ID)
    if (!region) return

    region.textContent = ''
    requestAnimationFrame(() => {
        region.textContent = message
    })
}

// ============================================
// useAnnounce Hook
// ============================================

interface UseAnnounceReturn {
    /** Normal duyuru (polite) */
    announce: (message: string) => void
    /** Acil duyuru (assertive) */
    announceUrgent: (message: string) => void
}

/**
 * Screen reader duyuruları için hook
 *
 * @example
 * function TimerCard() {
 *   const { announce } = useAnnounce()
 *
 *   const handleStart = () => {
 *     startTimer()
 *     announce('Timer başlatıldı')
 *   }
 * }
 */
export function useAnnounce(): UseAnnounceReturn {
    return {
        announce: useCallback((message: string) => announce(message), []),
        announceUrgent: useCallback((message: string) => announceUrgent(message), []),
    }
}

// ============================================
// Timer Announcements
// ============================================

/**
 * Timer için periyodik duyurular (örn: her 5 dakikada bir)
 *
 * @example
 * useTimerAnnouncement(elapsedSeconds, { intervalMinutes: 5 })
 */
export function useTimerAnnouncement(
    elapsedSeconds: number,
    options: {
        intervalMinutes?: number
        enabled?: boolean
    } = {}
): void {
    const { intervalMinutes = 5, enabled = true } = options
    const lastAnnouncedRef = useRef(0)

    useEffect(() => {
        if (!enabled) return

        const elapsedMinutes = Math.floor(elapsedSeconds / 60)
        const intervalSeconds = intervalMinutes * 60

        // Her interval'da bir duyur
        if (elapsedSeconds > 0 &&
            elapsedSeconds % intervalSeconds === 0 &&
            elapsedSeconds !== lastAnnouncedRef.current) {

            lastAnnouncedRef.current = elapsedSeconds

            const hours = Math.floor(elapsedMinutes / 60)
            const mins = elapsedMinutes % 60

            let message = ''
            if (hours > 0) {
                message = translateCurrentLocale('common', 'a11y.timerElapsedHoursMinutes', { hours, minutes: mins })
            } else {
                message = translateCurrentLocale('common', 'a11y.timerElapsedMinutes', { minutes: mins })
            }

            announce(message)
        }
    }, [elapsedSeconds, intervalMinutes, enabled])
}

// ============================================
// Reduced Motion Hook
// ============================================

/**
 * Kullanıcının reduced motion tercihini kontrol et
 *
 * @example
 * const prefersReducedMotion = usePrefersReducedMotion()
 *
 * return (
 *   <motion.div
 *     animate={prefersReducedMotion ? {} : { scale: 1.1 }}
 *   />
 * )
 */
export function usePrefersReducedMotion(): boolean {
    const query = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null

    const prefersRef = useRef(query?.matches ?? false)

    useEffect(() => {
        if (!query) return

        const handler = (e: MediaQueryListEvent) => {
            prefersRef.current = e.matches
        }

        query.addEventListener('change', handler)
        return () => query.removeEventListener('change', handler)
    }, [query])

    return prefersRef.current
}

// ============================================
// Focus Management
// ============================================

/**
 * Modal açıldığında focus'u yakala ve kapatıldığında geri ver
 *
 * @example
 * function Modal({ isOpen, onClose, children }) {
 *   const containerRef = useFocusTrap(isOpen)
 *
 *   return isOpen ? (
 *     <div ref={containerRef}>{children}</div>
 *   ) : null
 * }
 */
export function useFocusTrap(isActive: boolean): React.RefObject<HTMLDivElement | null> {
    const containerRef = useRef<HTMLDivElement>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (!isActive) {
            // Önceki focus'a geri dön
            if (previousFocusRef.current) {
                previousFocusRef.current.focus()
            }
            return
        }

        // Mevcut focus'u kaydet
        previousFocusRef.current = document.activeElement as HTMLElement

        // Container'daki ilk focuslanabilir elemente odaklan
        const container = containerRef.current
        if (!container) return

        const focusables = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )

        if (focusables.length > 0) {
            focusables[0]?.focus()
        }

        // Tab trap
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return
            if (focusables.length === 0) return

            const first = focusables[0]
            const last = focusables[focusables.length - 1]

            if (!first || !last) return

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault()
                    last.focus()
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault()
                    first.focus()
                }
            }
        }

        container.addEventListener('keydown', handleKeyDown)

        return () => {
            container.removeEventListener('keydown', handleKeyDown)
        }
    }, [isActive])

    return containerRef
}

// ============================================
// Skip Link
// ============================================

/**
 * Skip to main content link için target ID
 */
export const MAIN_CONTENT_ID = 'main-content'

/**
 * Ana içeriğe atla butonunu göster
 * Layout'ta kullan
 */
export function SkipToMainContent(): React.ReactElement {
    return (
        <a
            href={`#${MAIN_CONTENT_ID}`}
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
            {translateCurrentLocale('common', 'a11y.skipToMain')}
        </a>
    )
}

// ============================================
// High Contrast Mode
// ============================================

/**
 * Yüksek kontrast modunu kontrol et
 */
export function usePrefersHighContrast(): boolean {
    const query = typeof window !== 'undefined'
        ? window.matchMedia('(prefers-contrast: more)')
        : null

    const prefersRef = useRef(query?.matches ?? false)

    useEffect(() => {
        if (!query) return

        const handler = (e: MediaQueryListEvent) => {
            prefersRef.current = e.matches
        }

        query.addEventListener('change', handler)
        return () => query.removeEventListener('change', handler)
    }, [query])

    return prefersRef.current
}

// ============================================
// Screen Reader Only Text
// ============================================

/**
 * Sadece screen reader için görünür metin
 *
 * @example
 * <button>
 *   <Icon />
 *   <SrOnly>Ayarlar</SrOnly>
 * </button>
 */
export function SrOnly({ children }: { children: React.ReactNode }): React.ReactElement {
    return (
        <span className="sr-only">
            {children}
        </span>
    )
}

// ============================================
// ARIA Labels Generator
// ============================================

/**
 * Timer için ARIA label oluştur
 */
export function getTimerAriaLabel(
    activityName: string,
    elapsedSeconds: number,
    isPaused: boolean
): string {
    const locale = getCurrentLocale()
    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    const seconds = elapsedSeconds % 60

    let timeStr = ''
    if (hours > 0) {
        timeStr = translateCurrentLocale('common', 'a11y.timerAriaHoursMinutesSeconds', { hours, minutes, seconds })
    } else if (minutes > 0) {
        timeStr = translateCurrentLocale('common', 'a11y.timerAriaMinutesSeconds', { minutes, seconds })
    } else {
        timeStr = translateCurrentLocale('common', 'a11y.timerAriaSeconds', { seconds })
    }

    const status = isPaused
        ? translateCurrentLocale('common', 'a11y.timerStatusPaused')
        : translateCurrentLocale('common', 'a11y.timerStatusRunning')

    return translateCurrentLocale('common', 'a11y.timerAriaLabel', {
        activityName,
        time: timeStr,
        status,
        locale,
    })
}

/**
 * Habit için ARIA label oluştur
 */
export function getHabitAriaLabel(
    habitName: string,
    isCompleted: boolean,
    streak: number
): string {
    const status = isCompleted
        ? translateCurrentLocale('common', 'a11y.habitStatusCompleted')
        : translateCurrentLocale('common', 'a11y.habitStatusIncomplete')
    const streakStr = streak > 0
        ? translateCurrentLocale('common', 'a11y.habitStreak', { count: streak })
        : ''

    return translateCurrentLocale('common', 'a11y.habitAriaLabel', {
        habitName,
        status,
        streak: streakStr,
    })
}

/**
 * Progress için ARIA label oluştur
 */
export function getProgressAriaLabel(
    label: string,
    current: number,
    total: number
): string {
    const percent = Math.round((current / total) * 100)
    return `${label}: ${current}/${total} (${percent}%)`
}
