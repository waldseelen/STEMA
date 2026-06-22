/**
 * Görev/ünite tamamlama geri bildirimi
 * Confetti animasyonu ve ses efekti
 */

import { useCallback, useRef } from 'react'

interface CompletionFeedbackOptions {
    soundEnabled?: boolean
    vibrationEnabled?: boolean
}

export function useCompletionFeedback(options: CompletionFeedbackOptions = {}) {
    const { soundEnabled = true, vibrationEnabled = true } = options
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Ses efektini önceden yükle
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio('/notification.mp3')
        audioRef.current.volume = 0.3
    }

    const playCompletionSound = useCallback(() => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {
                // Autoplay engellenmiş olabilir
            })
        }
    }, [soundEnabled])

    const triggerVibration = useCallback(() => {
        if (vibrationEnabled && navigator.vibrate) {
            navigator.vibrate([50, 30, 50])
        }
    }, [vibrationEnabled])

    const triggerCompletionFeedback = useCallback(() => {
        playCompletionSound()
        triggerVibration()
    }, [playCompletionSound, triggerVibration])

    return {
        playCompletionSound,
        triggerVibration,
        triggerCompletionFeedback,
    }
}

// Confetti tetiklemek için global event
export const COMPLETION_EVENT = 'planex:task-completed'

export function dispatchCompletionEvent(taskId: string, courseComplete = false) {
    window.dispatchEvent(
        new CustomEvent(COMPLETION_EVENT, {
            detail: { taskId, courseComplete },
        })
    )
}
