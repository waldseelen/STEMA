type CubicBezier = [number, number, number, number]

export const duration = {
    instant: 60,
    fast: 120,
    base: 160,
    slow: 200,
    page: 130,
} as const

export const easing = {
    standard: [0.4, 0, 0.2, 1] as CubicBezier,
    enter: [0, 0, 0.2, 1] as CubicBezier,
    exit: [0.4, 0, 1, 1] as CubicBezier,
} as const

export const cssEasing = {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const

export const variants = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
    },
    slideUp: {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
    },
    scaleIn: {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
    },
} as const
