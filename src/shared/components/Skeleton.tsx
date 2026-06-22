import { clsx } from 'clsx'

interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circular' | 'rectangular' | 'card'
    width?: string | number
    height?: string | number
    count?: number
}

export function Skeleton({
    className,
    variant = 'text',
    width,
    height,
    count = 1,
}: SkeletonProps) {
    const baseClasses = 'skeleton'

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-xl',
        card: 'rounded-3xl p-4',
    }

    const items = Array.from({ length: count }, (_, i) => i)

    return (
        <div className="space-y-2">
            {items.map((i) => (
                <div
                    key={i}
                    className={clsx(baseClasses, variantClasses[variant], className)}
                    style={{
                        width: width ?? (variant === 'text' ? '100%' : undefined),
                        height: height ?? (variant === 'circular' ? width : undefined),
                    }}
                />
            ))}
        </div>
    )
}

// Pre-built skeleton components
export function SkeletonCard() {
    return (
        <div className="card p-4 space-y-3">
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
        </div>
    )
}

export function SkeletonActivityCard() {
    return (
        <div className="card p-4 flex items-center gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="70%" height={16} />
                <Skeleton variant="text" width="40%" height={12} />
            </div>
        </div>
    )
}

export function SkeletonHabitCard() {
    return (
        <div className="card p-4 flex items-center gap-4">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="30%" height={12} />
            </div>
        </div>
    )
}

export function SkeletonStatCard() {
    return (
        <div className="card p-5 text-center space-y-2">
            <Skeleton variant="text" width="50%" height={32} className="mx-auto" />
            <Skeleton variant="text" width="70%" height={14} className="mx-auto" />
        </div>
    )
}
