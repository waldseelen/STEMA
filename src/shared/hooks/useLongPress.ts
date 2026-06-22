import { useCallback, useRef, useState } from 'react'

interface UseLongPressOptions {
    /** Uzun basma süresi (ms) */
    delay?: number
    /** Normal tıklama callback'i */
    onClick?: () => void
    /** Uzun basma callback'i */
    onLongPress?: () => void
    /** Uzun basma sırasında hareket eşiği (px) */
    moveThreshold?: number
}

/**
 * Uzun basma aksiyonları için hook
 * FAB'da tek tıklama ve uzun basma için farklı aksiyonlar
 */
export function useLongPress({
    delay = 500,
    onClick,
    onLongPress,
    moveThreshold = 10,
}: UseLongPressOptions = {}) {
    const [isLongPress, setIsLongPress] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const startPos = useRef<{ x: number; y: number } | null>(null)
    const isLongPressTriggered = useRef(false)

    const clear = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        startPos.current = null
    }, [])

    const start = useCallback(
        (e: React.TouchEvent | React.MouseEvent) => {
            setIsLongPress(false)
            isLongPressTriggered.current = false

            // Başlangıç pozisyonunu kaydet
            if ('touches' in e && e.touches[0]) {
                startPos.current = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                }
            } else if ('clientX' in e) {
                startPos.current = {
                    x: e.clientX,
                    y: e.clientY,
                }
            }

            timerRef.current = setTimeout(() => {
                setIsLongPress(true)
                isLongPressTriggered.current = true
                onLongPress?.()

                // Haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(50)
                }
            }, delay)
        },
        [delay, onLongPress]
    )

    const move = useCallback(
        (e: React.TouchEvent | React.MouseEvent) => {
            if (!startPos.current) return

            let currentX: number
            let currentY: number

            if ('touches' in e && e.touches[0]) {
                currentX = e.touches[0].clientX
                currentY = e.touches[0].clientY
            } else if ('clientX' in e) {
                currentX = e.clientX
                currentY = e.clientY
            } else {
                return
            }

            const diffX = Math.abs(currentX - startPos.current.x)
            const diffY = Math.abs(currentY - startPos.current.y)

            // Eşiği aştıysa uzun basma iptal
            if (diffX > moveThreshold || diffY > moveThreshold) {
                clear()
            }
        },
        [moveThreshold, clear]
    )

    const end = useCallback(
        (_e: React.TouchEvent | React.MouseEvent) => {
            clear()

            // Uzun basma tetiklendiyse normal tıklamayı çalıştırma
            if (!isLongPressTriggered.current) {
                onClick?.()
            }

            setIsLongPress(false)
        },
        [clear, onClick]
    )

    return {
        isLongPress,
        handlers: {
            onMouseDown: start,
            onMouseMove: move,
            onMouseUp: end,
            onMouseLeave: clear,
            onTouchStart: start,
            onTouchMove: move,
            onTouchEnd: end,
        },
    }
}
