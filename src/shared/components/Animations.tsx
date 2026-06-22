import { CheckIcon } from '@heroicons/react/24/solid'
import { clsx } from 'clsx'
import { useState, type ReactNode } from 'react'

// ============================================
// Confetti Animation
// ============================================

interface ConfettiParticle {
    id: number
    x: number
    color: string
    delay: number
    duration: number
}

function Confetti({ active }: { active: boolean }) {
    if (!active) return null

    const particles: ConfettiParticle[] = Array.from({ length: 12 }, (_, i) => {
        const colorArr = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899']
        return {
            id: i,
            x: Math.random() * 100,
            color: colorArr[Math.floor(Math.random() * 5)] ?? '#10b981',
            delay: Math.random() * 0.2,
            duration: 0.6 + Math.random() * 0.4,
        }
    })

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute w-2 h-2 rounded-full animate-confetti"
                    style={{
                        left: `${p.x}%`,
                        backgroundColor: p.color,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// Animated Checkbox
// ============================================

interface AnimatedCheckboxProps {
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'success' | 'primary'
    showConfetti?: boolean
    className?: string
}

/**
 * Mikro-animasyonlu checkbox
 * Tamamlama anında konfeti ve dolan halka animasyonu
 */
export function AnimatedCheckbox({
    checked,
    onChange,
    disabled = false,
    size = 'md',
    variant = 'success',
    showConfetti = true,
    className,
}: AnimatedCheckboxProps) {
    const [justChecked, setJustChecked] = useState(false)

    const handleChange = () => {
        if (disabled) return

        if (!checked) {
            setJustChecked(true)
            setTimeout(() => setJustChecked(false), 700)

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50)
            }
        }

        onChange(!checked)
    }

    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
    }

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    }

    const variantStyles = {
        default: {
            unchecked: 'border-surface-300 dark:border-surface-600 hover:border-surface-400 dark:hover:border-surface-500',
            checked: 'bg-surface-600 dark:bg-surface-500 border-surface-600 dark:border-surface-500',
        },
        success: {
            unchecked: 'border-success-300 dark:border-success-700 hover:border-success-400 dark:hover:border-success-600 hover:bg-success-50 dark:hover:bg-success-900/20',
            checked: 'bg-gradient-to-br from-success-500 to-accent-500 border-success-500 shadow-glow-success',
        },
        primary: {
            unchecked: 'border-primary-300 dark:border-primary-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
            checked: 'bg-gradient-to-br from-primary-500 to-primary-400 border-primary-500 shadow-glow',
        },
    }

    const styles = variantStyles[variant]

    return (
        <button
            type="button"
            onClick={handleChange}
            disabled={disabled}
            className={clsx(
                'relative rounded-full border-2 flex items-center justify-center',
                'transition-all duration-300',
                sizeClasses[size],
                checked ? styles.checked : styles.unchecked,
                checked && 'scale-100',
                justChecked && 'animate-bounce-small',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            {/* Check icon with animation */}
            <CheckIcon
                className={clsx(
                    'text-white transition-all duration-300',
                    iconSizes[size],
                    checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                )}
            />

            {/* Ring animation on check */}
            {justChecked && (
                <span
                    className="absolute inset-0 rounded-full animate-ping-once"
                    style={{
                        backgroundColor: variant === 'success' ? 'rgb(16, 185, 129)' : 'rgb(6, 182, 212)',
                        opacity: 0.3,
                    }}
                />
            )}

            {/* Confetti */}
            {showConfetti && <Confetti active={justChecked} />}
        </button>
    )
}

// ============================================
// Streak Badge
// ============================================

interface StreakBadgeProps {
    streak: number
    showFlame?: boolean
    animate?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

/**
 * Streak gösterge badge'i
 * Ateş ikonu ile animasyonlu gösterim
 */
export function StreakBadge({
    streak,
    showFlame = true,
    animate = true,
    size = 'md',
    className,
}: StreakBadgeProps) {
    if (streak <= 0) return null

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-1 text-sm gap-1.5',
        lg: 'px-3 py-1.5 text-base gap-2',
    }

    // iconSizes reserved for future use with icon components
    void { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }

    return (
        <div
            className={clsx(
                'inline-flex items-center rounded-full font-semibold',
                'bg-gradient-to-r from-timer-100 to-timer-50 dark:from-timer-900/40 dark:to-timer-800/20',
                'text-timer-600 dark:text-timer-400',
                'border border-timer-200 dark:border-timer-700',
                sizeClasses[size],
                className
            )}
        >
            {showFlame && (
                <span className={clsx(animate && streak >= 3 && 'animate-pulse-slow')}>
                    🔥
                </span>
            )}
            <span>{streak}</span>
            <span className="text-timer-500/70 dark:text-timer-500/50 font-normal">gün</span>
        </div>
    )
}

// ============================================
// Success Animation Overlay
// ============================================

interface SuccessAnimationProps {
    show: boolean
    message?: string
    onComplete?: () => void
    children?: ReactNode
}

/**
 * Başarı animasyonu overlay'i
 * Önemli aksiyonlar tamamlandığında gösterilir
 */
export function SuccessAnimation({
    show,
    message = 'Tamamlandı!',
    onComplete,
    children,
}: SuccessAnimationProps) {
    if (!show) return <>{children}</>

    return (
        <div className="relative">
            {children}
            <div
                className="absolute inset-0 flex items-center justify-center bg-success-500/90 dark:bg-success-600/90 rounded-2xl animate-fade-in"
                onAnimationEnd={() => {
                    setTimeout(() => onComplete?.(), 500)
                }}
            >
                <div className="text-center text-white">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center animate-bounce-small">
                        <CheckIcon className="w-8 h-8" />
                    </div>
                    <p className="font-semibold">{message}</p>
                </div>
            </div>
        </div>
    )
}

// ============================================
// Loading Dots
// ============================================

export function LoadingDots({ className }: { className?: string }) {
    return (
        <div className={clsx('flex items-center gap-1', className)}>
            {[0, 1, 2].map(i => (
                <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-current animate-bounce"
                    style={{
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '0.6s',
                    }}
                />
            ))}
        </div>
    )
}
