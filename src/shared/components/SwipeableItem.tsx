import { clsx } from 'clsx'
import { useState, type ReactNode } from 'react'

// ============================================
// Swipeable Item
// ============================================

interface SwipeableItemProps {
    children: ReactNode
    /** Sağa kaydırma aksiyonu */
    leftAction?: {
        icon: ReactNode
        label: string
        color: 'success' | 'primary' | 'warning' | 'danger'
        onClick: () => void
    }
    /** Sola kaydırma aksiyonu */
    rightAction?: {
        icon: ReactNode
        label: string
        color: 'success' | 'primary' | 'warning' | 'danger'
        onClick: () => void
    }
    /** İkinci sola kaydırma aksiyonu (daha uzun kaydırma) */
    rightSecondaryAction?: {
        icon: ReactNode
        label: string
        color: 'success' | 'primary' | 'warning' | 'danger'
        onClick: () => void
    }
    /** Eşik değeri (px) */
    threshold?: number
    /** Kaydırma sonrası resetle */
    resetOnAction?: boolean
    /** Devre dışı bırak */
    disabled?: boolean
    className?: string
}

const colorStyles = {
    success: 'bg-success-500',
    primary: 'bg-primary-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
}

/**
 * Kaydırma hareketleri destekleyen liste öğesi
 * Mobilde habit listesinde sağa/sola kaydırarak aksiyon tetikleme
 */
export function SwipeableItem({
    children,
    leftAction,
    rightAction,
    rightSecondaryAction,
    threshold = 80,
    resetOnAction = true,
    disabled = false,
    className,
}: SwipeableItemProps) {
    const [offsetX, setOffsetX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [startY, setStartY] = useState(0)
    const [isHorizontal, setIsHorizontal] = useState<boolean | null>(null)

    const handleTouchStart = (e: React.TouchEvent) => {
        if (disabled) return
        const touch = e.touches[0]
        if (!touch) return
        setStartX(touch.clientX)
        setStartY(touch.clientY)
        setIsDragging(true)
        setIsHorizontal(null)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || disabled) return
        const touch = e.touches[0]
        if (!touch) return

        const currentX = touch.clientX
        const currentY = touch.clientY
        const diffX = currentX - startX
        const diffY = currentY - startY

        // İlk harekette yönü belirle
        if (isHorizontal === null) {
            if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
                setIsHorizontal(Math.abs(diffX) > Math.abs(diffY))
            }
            return
        }

        // Dikey kaydırma ise atla
        if (!isHorizontal) return

        // Kaydırma sınırlarını kontrol et
        const maxLeft = rightSecondaryAction ? threshold * 2 : rightAction ? threshold : 0
        const maxRight = leftAction ? threshold : 0

        const clampedOffset = Math.max(-maxLeft * 1.2, Math.min(maxRight * 1.2, diffX))
        setOffsetX(clampedOffset)
    }

    const handleTouchEnd = () => {
        if (!isDragging || disabled) return

        // Aksiyon tetikle
        if (offsetX >= threshold && leftAction) {
            leftAction.onClick()
        } else if (offsetX <= -threshold * 1.8 && rightSecondaryAction) {
            rightSecondaryAction.onClick()
        } else if (offsetX <= -threshold && rightAction) {
            rightAction.onClick()
        }

        // Reset
        if (resetOnAction) {
            setOffsetX(0)
        }
        setIsDragging(false)
        setIsHorizontal(null)
    }

    // Eşik aşımı yüzdeleri
    const leftProgress = leftAction ? Math.min(1, Math.max(0, offsetX) / threshold) : 0
    const rightProgress = rightAction ? Math.min(1, Math.abs(Math.min(0, offsetX)) / threshold) : 0
    const rightSecondaryProgress = rightSecondaryAction ? Math.min(1, Math.abs(Math.min(0, offsetX)) / (threshold * 2)) : 0

    return (
        <div className={clsx('relative overflow-hidden rounded-2xl', className)}>
            {/* Left action background */}
            {leftAction && (
                <div
                    className={clsx(
                        'absolute inset-y-0 left-0 flex items-center justify-start px-4',
                        colorStyles[leftAction.color],
                        'transition-opacity duration-200'
                    )}
                    style={{
                        width: `${Math.max(offsetX, 0) + 60}px`,
                        opacity: leftProgress,
                    }}
                >
                    <div className="flex items-center gap-2 text-white">
                        <span className={clsx('transition-transform', leftProgress >= 1 && 'scale-125')}>
                            {leftAction.icon}
                        </span>
                        {leftProgress >= 0.5 && (
                            <span className="text-sm font-medium animate-fade-in">
                                {leftAction.label}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Right action background */}
            {rightAction && (
                <div
                    className={clsx(
                        'absolute inset-y-0 right-0 flex items-center justify-end px-4',
                        rightSecondaryAction && rightSecondaryProgress >= 0.9
                            ? colorStyles[rightSecondaryAction.color]
                            : colorStyles[rightAction.color],
                        'transition-colors duration-200'
                    )}
                    style={{
                        width: `${Math.max(-offsetX, 0) + 60}px`,
                        opacity: Math.max(rightProgress, rightSecondaryProgress),
                    }}
                >
                    <div className="flex items-center gap-2 text-white">
                        {rightSecondaryProgress >= 0.9 && rightSecondaryAction ? (
                            <>
                                <span className="text-sm font-medium animate-fade-in">
                                    {rightSecondaryAction.label}
                                </span>
                                <span className="scale-125">{rightSecondaryAction.icon}</span>
                            </>
                        ) : (
                            <>
                                {rightProgress >= 0.5 && (
                                    <span className="text-sm font-medium animate-fade-in">
                                        {rightAction.label}
                                    </span>
                                )}
                                <span className={clsx('transition-transform', rightProgress >= 1 && 'scale-125')}>
                                    {rightAction.icon}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Main content */}
            <div
                className={clsx(
                    'relative bg-white dark:bg-surface-800 transition-transform',
                    !isDragging && 'transition-all duration-200'
                )}
                style={{
                    transform: `translateX(${offsetX}px)`,
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    )
}

// ============================================
// Swipeable List
// ============================================

interface SwipeableListProps {
    children: ReactNode
    className?: string
}

export function SwipeableList({ children, className }: SwipeableListProps) {
    return (
        <div className={clsx('space-y-2', className)}>
            {children}
        </div>
    )
}
