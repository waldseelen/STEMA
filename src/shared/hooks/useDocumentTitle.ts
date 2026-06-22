import { useEffect, useRef } from 'react'

interface UseDocumentTitleOptions {
    /** Timer çalışırken gösterilecek süre (saniye) */
    timerSeconds?: number | undefined
    /** Aktif aktivite adı */
    activityName?: string | undefined
    /** Timer çalışıyor mu */
    isRunning?: boolean | undefined
    /** Orijinal başlık */
    defaultTitle?: string | undefined
}

/**
 * Dinamik sayfa başlığı hook'u
 * Timer çalışırken tarayıcı sekmesinde geri sayımı gösterir
 */
export function useDocumentTitle({
    timerSeconds,
    activityName,
    isRunning = false,
    defaultTitle = 'Plan.Ex - Akıllı Planlama',
}: UseDocumentTitleOptions = {}) {
    const originalTitle = useRef(document.title)

    useEffect(() => {
        const initialTitle = originalTitle.current
        if (isRunning && timerSeconds !== undefined) {
            const hours = Math.floor(timerSeconds / 3600)
            const minutes = Math.floor((timerSeconds % 3600) / 60)
            const seconds = timerSeconds % 60

            let timeStr: string
            if (hours > 0) {
                timeStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            } else {
                timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
            }

            const title = activityName
                ? `${timeStr} - ${activityName}`
                : `${timeStr} - Timer`

            document.title = title
        } else {
            document.title = defaultTitle
        }

        return () => {
            document.title = initialTitle
        }
    }, [timerSeconds, activityName, isRunning, defaultTitle])
}

/**
 * Favicon'u dinamik olarak değiştiren hook
 * Timer çalışırken farklı bir favicon gösterir
 */
export function useDynamicFavicon(isRunning: boolean) {
    useEffect(() => {
        const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        if (!favicon) return

        const originalHref = favicon.href

        if (isRunning) {
            // Timer çalışırken kırmızı/turuncu bir favicon
            const canvas = document.createElement('canvas')
            canvas.width = 32
            canvas.height = 32
            const ctx = canvas.getContext('2d')

            if (ctx) {
                // Gradient arka plan
                const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
                gradient.addColorStop(0, '#ff6b6b')
                gradient.addColorStop(1, '#ee5a24')

                ctx.beginPath()
                ctx.arc(16, 16, 14, 0, Math.PI * 2)
                ctx.fillStyle = gradient
                ctx.fill()

                // Play ikonu
                ctx.fillStyle = 'white'
                ctx.beginPath()
                ctx.moveTo(12, 8)
                ctx.lineTo(24, 16)
                ctx.lineTo(12, 24)
                ctx.closePath()
                ctx.fill()

                favicon.href = canvas.toDataURL('image/png')
            }
        } else {
            favicon.href = originalHref
        }

        return () => {
            favicon.href = originalHref
        }
    }, [isRunning])
}
