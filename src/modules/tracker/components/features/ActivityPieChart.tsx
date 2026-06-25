import type { ActivityDuration } from '@/db/time-tracking/queries/statsQueries'
import { formatDuration } from '@/db/time-tracking/queries/timerQueries'
import { useTranslation } from '@/i18n'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import { echarts } from '@/shared/lib/echarts'
import { useMemo } from 'react'

interface ActivityPieChartProps {
    data: ActivityDuration[]
}

function readCssColor(variable: string, fallback: string) {
    if (typeof window === 'undefined') {
        return fallback
    }

    const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
    return value || fallback
}

export function ActivityPieChart({ data }: ActivityPieChartProps) {
    const t = useTranslation('tracker')
    const accent = readCssColor('--color-accent', '#3b82f6')
    const accentAlt = readCssColor('--color-accent-2', '#f59e0b')
    const textSecondary = readCssColor('--text-secondary', '#9b9b9b')
    const border = readCssColor('--border-subtle', 'rgba(255,255,255,0.07)')
    const surface = readCssColor('--bg-surface-100', '#111111')

    const option = useMemo(() => {
        const chartPalette = [accent, accentAlt, '#60a5fa', '#fbbf24', '#93c5fd', '#fcd34d']

        return {
            color: chartPalette,
            tooltip: {
                trigger: 'item' as const,
                backgroundColor: surface,
                borderColor: border,
                borderWidth: 1,
                textStyle: { color: textSecondary, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' },
                formatter: (params: { name: string; value: number; percent: number }) =>
                    `${params.name}<br/>${formatDuration(params.value)} (${params.percent}%)`,
                extraCssText: 'border-radius: 12px; padding: 8px 12px;',
            },
            series: [
                {
                    type: 'pie',
                    radius: ['46%', '74%'],
                    center: ['50%', '52%'],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 8,
                        borderColor: surface,
                        borderWidth: 2,
                    },
                    label: {
                        show: true,
                        color: textSecondary,
                        fontSize: 11,
                        formatter: '{b}',
                    },
                    labelLine: {
                        lineStyle: { color: border },
                    },
                    emphasis: {
                        scale: true,
                        itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0, 0, 0, 0.16)' },
                    },
                    data: data.map((item, index) => ({
                        name: item.activityName,
                        value: item.totalSec,
                        itemStyle: { color: chartPalette[index % chartPalette.length] },
                    })),
                },
            ],
        }
    }, [accent, accentAlt, border, data, surface, textSecondary])

    if (data.length === 0) {
        return null
    }

    return (
        <div className="card p-5">
            <h3 className="text-2xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                {t('stats.byActivity')}
            </h3>
            <ReactEChartsCore echarts={echarts} option={option} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
        </div>
    )
}
