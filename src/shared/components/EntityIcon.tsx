import * as LucideIcons from 'lucide-react'
import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'

type EntityIconProps = Omit<LucideProps, 'ref'> & {
    name?: string
    fallback?: string
    title?: string
}

const lucideIconMap =
    LucideIcons as unknown as Record<string, ComponentType<LucideProps>>

export function EntityIcon({
    name,
    fallback,
    className,
    color,
    size,
    style,
    title,
    'aria-hidden': ariaHidden,
    ...props
}: EntityIconProps) {
    const resolvedName = name?.trim() || fallback?.trim()

    if (!resolvedName) {
        return null
    }

    const Icon = lucideIconMap[resolvedName]
    if (Icon) {
        return (
            <Icon
                {...props}
                className={className}
                color={color}
                size={size}
                style={style}
                aria-hidden={ariaHidden}
            />
        )
    }

    return (
        <span
            className={className}
            style={{
                ...style,
                color,
                fontSize: typeof size === 'number' ? `${size}px` : size,
            }}
            title={title}
            aria-hidden={ariaHidden}
        >
            {resolvedName}
        </span>
    )
}
