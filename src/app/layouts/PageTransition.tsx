import { duration, easing } from '@/config/motion'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { PropsWithChildren } from 'react'

interface PageTransitionProps extends PropsWithChildren {
    transitionKey: string
}

export function PageTransition({ children, transitionKey }: PageTransitionProps) {
    const shouldReduceMotion = useReducedMotion()

    return (
        <AnimatePresence initial={false} mode="wait">
            <motion.div
                key={transitionKey}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 3 }}
                animate={{
                    opacity: 1,
                    y: 0,
                    transition: shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: duration.page / 1000, ease: easing.enter },
                }}
                exit={{
                    opacity: 0,
                    y: shouldReduceMotion ? 0 : 3,
                    transition: shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.07, ease: easing.exit },
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
