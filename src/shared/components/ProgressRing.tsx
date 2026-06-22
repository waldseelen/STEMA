import { clsx } from 'clsx'

interface ProgressRingProps {
    progress: number // 0-100
    size?: number
    strokeWidth?: number
    className?: string
    children?: React.ReactNode
    variant?: 'primary' | 'success' | 'timer' | 'accent'
}

export function ProgressRing({
    progress,
    size = 120,
    strokeWidth = 8,
    className,
    children,
    variant = 'primary',
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference

    // Gradient IDs for each variant
    const gradientId = `progress-gradient-${variant}`

    const gradientColors = {
        primary: ['#06b6d4', '#a3e635'],
        success: ['#22c55e', '#a3e635'],
        timer: ['#f59e0b', '#fbbf24'],
        accent: ['#a3e635', '#22c55e'],
    }

    return (
        <div className={clsx('relative inline-flex items-center justify-center', className)}>
            <svg width={size} height={size} className="progress-ring">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={gradientColors[variant][0]} />
                        <stop offset="100%" stopColor={gradientColors[variant][1]} />
                    </linearGradient>
                </defs>
                {/* Background circle */}
                <circle
                    className="progress-ring-bg"
                    fill="none"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress circle */}
                <circle
                    className="transition-all duration-500 ease-out"
                    stroke={`url(#${gradientId})`}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            {children && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {children}
                </div>
            )}
        </div>
    )
}
