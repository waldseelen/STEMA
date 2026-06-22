import { useEffect, useRef, useState } from 'react'

interface UseScrollRevealOptions {
    delayMs?: number
}

export function useScrollReveal({ delayMs = 0 }: UseScrollRevealOptions = {}) {
    const ref = useRef<HTMLElement | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const element = ref.current
        if (!element || typeof IntersectionObserver === 'undefined') {
            setIsVisible(true)
            return
        }

        const observer = new IntersectionObserver(
            entries => {
                const entry = entries[0]
                if (!entry?.isIntersecting) {
                    return
                }

                const timeout = window.setTimeout(() => {
                    setIsVisible(true)
                }, delayMs)

                observer.disconnect()

                return () => {
                    window.clearTimeout(timeout)
                }
            },
            {
                threshold: 0.12,
                rootMargin: '0px 0px -40px 0px',
            },
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [delayMs])

    return { ref, isVisible }
}
