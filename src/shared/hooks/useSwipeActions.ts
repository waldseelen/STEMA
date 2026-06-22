import { useCallback, useRef, useState } from 'react'

interface SwipeState {
    isDragging: boolean
    offsetX: number
    direction: 'left' | 'right' | null
}

interface SwipeActionsOptions {
    /** Sola kaydırma eşiği (px) */
    leftThreshold?: number
    /** Sağa kaydırma eşiği (px) */
    rightThreshold?: number
    /** Sola kaydırma aksiyonu */
    onSwipeLeft?: () => void
    /** Sağa kaydırma aksiyonu */
    onSwipeRight?: () => void
    /** Kaydırma tamamlandığında resetle */
    resetOnAction?: boolean
}

/**
 * Mobilde swipe aksiyonları için hook
 * Habit listesinde sağa kaydırarak "Tamamla", sola kaydırarak "Atla" veya "Düzenle"
 */
export function useSwipeActions({
    leftThreshold = 80,
    rightThreshold = 80,
    onSwipeLeft,
    onSwipeRight,
    resetOnAction = true,
}: SwipeActionsOptions = {}) {
    const [state, setState] = useState<SwipeState>({
        isDragging: false,
        offsetX: 0,
        direction: null,
    })

    const startX = useRef(0)
    const startY = useRef(0)
    const isScrolling = useRef<boolean | null>(null)

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!e.touches[0]) return
        startX.current = e.touches[0].clientX
        startY.current = e.touches[0].clientY
        isScrolling.current = null
        setState(prev => ({ ...prev, isDragging: true }))
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!state.isDragging || !e.touches[0]) return

        const currentX = e.touches[0].clientX
        const currentY = e.touches[0].clientY
        const diffX = currentX - startX.current
        const diffY = currentY - startY.current

        // İlk harekette dikey mi yatay mı kaydırma olduğunu belirle
        if (isScrolling.current === null) {
            isScrolling.current = Math.abs(diffY) > Math.abs(diffX)
        }

        // Dikey kaydırma ise swipe'ı iptal et
        if (isScrolling.current) {
            setState(prev => ({ ...prev, isDragging: false, offsetX: 0 }))
            return
        }

        // Kaydırma yönünü ve offset'i güncelle
        const direction = diffX > 0 ? 'right' : diffX < 0 ? 'left' : null

        // Maksimum kaydırma mesafesini sınırla
        const maxOffset = Math.max(leftThreshold, rightThreshold) * 1.2
        const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diffX))

        setState({
            isDragging: true,
            offsetX: clampedOffset,
            direction,
        })
    }, [state.isDragging, leftThreshold, rightThreshold])

    const handleTouchEnd = useCallback(() => {
        if (!state.isDragging) return

        const { offsetX } = state

        // Eşiği aştıysa aksiyonu tetikle
        if (offsetX >= rightThreshold && onSwipeRight) {
            onSwipeRight()
            if (resetOnAction) {
                setState({ isDragging: false, offsetX: 0, direction: null })
                return
            }
        } else if (offsetX <= -leftThreshold && onSwipeLeft) {
            onSwipeLeft()
            if (resetOnAction) {
                setState({ isDragging: false, offsetX: 0, direction: null })
                return
            }
        }

        // Eşiğe ulaşmadıysa sıfırla
        setState({ isDragging: false, offsetX: 0, direction: null })
    }, [state, leftThreshold, rightThreshold, onSwipeLeft, onSwipeRight, resetOnAction])

    const reset = useCallback(() => {
        setState({ isDragging: false, offsetX: 0, direction: null })
    }, [])

    return {
        ...state,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
        reset,
        // Eşiğe yaklaşma yüzdesi (0-1)
        leftProgress: Math.min(1, Math.abs(Math.min(0, state.offsetX)) / leftThreshold),
        rightProgress: Math.min(1, Math.max(0, state.offsetX) / rightThreshold),
    }
}
