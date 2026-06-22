import { useTranslation } from '@/i18n'
import { Flame, Zap } from 'lucide-react'

interface StreakBadgeProps {
    streak: number
    weeklyCount: number
    hasCompletedToday: boolean
}

export const StreakBadge = ({ streak, weeklyCount, hasCompletedToday }: StreakBadgeProps) => {
    const habitsT = useTranslation('habits')
    if (streak === 0 && weeklyCount === 0) return null

    return (
        <div className="flex items-center gap-3">
            {/* Streak Badge */}
            {streak > 0 && (
                <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${streak >= 7
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                            : streak >= 3
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-[#2a2438] text-slate-400'
                        }`}
                >
                    <Flame size={16} className={streak >= 7 ? 'animate-pulse' : ''} />
                    <span>{habitsT('streak.days', { count: streak })}</span>
                </div>
            )}

            {/* Weekly Progress */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
                <Zap size={14} />
                <span>{habitsT('progress.weekly')}: {weeklyCount}</span>
            </div>

            {/* Today indicator */}
            {hasCompletedToday && (
                <div
                    className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                    title={habitsT('dashboard.todayCompleted', { completed: 1, total: 1 })}
                />
            )}
        </div>
    )
}
