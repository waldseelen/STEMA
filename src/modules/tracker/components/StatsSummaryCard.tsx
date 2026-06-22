import type { StatsResult } from '@/db/time-tracking/queries/statsQueries'
import { formatDuration } from '@/db/time-tracking/queries/timerQueries'
import { useTranslation } from '@/i18n'
import { Clock, Flame, Trophy } from 'lucide-react'

interface StatsSummaryCardProps {
    stats: StatsResult
}

export function StatsSummaryCard({ stats }: StatsSummaryCardProps) {
    const t = useTranslation('tracker')

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-5 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-surface-200 text-text-secondary">
                    <Clock className="h-4.5 w-4.5" />
                </span>
                <p className="mt-4 font-mono text-xl font-semibold tabular-nums text-text-primary">
                    {formatDuration(stats.totalSec)}
                </p>
                <p className="mt-1 text-xs text-text-secondary">{t('stats.totalTime')}</p>
            </div>

            <div className="card p-5 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-status-green/20 bg-status-green-soft text-status-green">
                    <Flame className="h-4.5 w-4.5" />
                </span>
                <p className="mt-4 text-xl font-semibold text-text-primary">{stats.activeDays}</p>
                <p className="mt-1 text-xs text-text-secondary">{t('stats.activeDays')}</p>
            </div>

            <div className="card p-5 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-status-amber/20 bg-status-amber-soft text-status-amber">
                    <Trophy className="h-4.5 w-4.5" />
                </span>
                <p className="mt-4 truncate text-sm font-semibold text-text-primary">
                    {stats.topActivity?.activityName ?? '—'}
                </p>
                <p className="mt-1 text-xs text-text-secondary">{t('stats.byActivity')}</p>
            </div>
        </div>
    )
}
