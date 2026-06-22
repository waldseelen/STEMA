import { announce, announceUrgent } from '@/shared/utils/a11y'
import { useEffect, useRef } from 'react'

interface UseAccessiblePageOptions {
    announceMessage?: string
    announceMode?: 'polite' | 'assertive'
    disabled?: boolean
    suffix?: string
}

export function useAccessiblePage(
    title: string,
    {
        announceMessage,
        announceMode = 'polite',
        disabled = false,
        suffix = 'PLAN.EX',
    }: UseAccessiblePageOptions = {}
) {
    const lastAnnouncedMessageRef = useRef<string | null>(null)

    useEffect(() => {
        if (typeof document === 'undefined' || !title.trim()) {
            return
        }

        document.title = title.includes(suffix) ? title : `${title} · ${suffix}`

        if (disabled) {
            return
        }

        const message = (announceMessage ?? title).trim()
        if (!message || lastAnnouncedMessageRef.current === message) {
            return
        }

        lastAnnouncedMessageRef.current = message

        if (announceMode === 'assertive') {
            announceUrgent(message)
            return
        }

        announce(message)
    }, [announceMessage, announceMode, disabled, suffix, title])
}
