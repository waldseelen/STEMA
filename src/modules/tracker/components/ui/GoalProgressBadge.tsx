/**
 * GoalProgressBadge — Aktivite Kartı Üzerinde Mini İlerleme Rozeti
 *
 * ActivityCard'ın sağ alt köşesine eklenen progress ring.
 * progress: 0-100 arası yüzde değeri
 */

interface GoalProgressBadgeProps {
    progress: number   // 0–100
    size?: number
}

export function GoalProgressBadge({ progress, size = 22 }: GoalProgressBadgeProps) {
    const r = (size - 4) / 2
    const circumference = 2 * Math.PI * r
    const clampedProgress = Math.min(100, Math.max(0, progress))
    const offset = circumference * (1 - clampedProgress / 100)
    const isCompleted = clampedProgress >= 100

    return (
        <div className="absolute bottom-2 right-2">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth={2}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={isCompleted ? 'var(--status-green)' : 'var(--status-blue)'}
                    strokeWidth={2}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    className="transition-all duration-700"
                />
            </svg>
        </div>
    )
}
