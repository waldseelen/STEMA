import type { DailyDuration } from '@/db/time-tracking/queries/statsQueries'
import { formatDuration } from '@/db/time-tracking/queries/timerQueries'
import { useLocale, useTranslation } from '@/i18n'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import { echarts } from '@/shared/lib/echarts'
import { useMemo } from 'react'

interface DailyBarChartProps {
    data: DailyDuration[]
}

function shortDate(dateKey: string, locale: string): string {
    const date = new Date(`${dateKey}T12:00:00`)
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

function readCssColor(variable: string, fallback: string) {
    if (typeof window === 'undefined') {
        return fallback
    }

    const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
    return value || fallback
}

export function DailyBarChart({ data }: DailyBarChartProps) {
    const t = useTranslation('tracker')
    const locale = useLocale()
    const accent = readCssColor('--color-accent', '#3b82f6')
    const accentAlt = readCssColor('--color-accent-2', '#f59e0b')
    const textMuted = readCssColor('--text-muted', '#4a4a4a')
    const surface = readCssColor('--bg-surface-100', '#111111')
    const border = readCssColor('--border-subtle', 'rgba(255,255,255,0.07)')
    const peakValue = Math.max(...data.map(item => item.totalSec), 0)

    const option = useMemo(() => ({
        tooltip: {
            trigger: 'axis' as const,
            backgroundColor: surface,
            borderColor: border,
            borderWidth: 1,
            textStyle: { color: textMuted, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' },
            formatter: (params: Array<{ name: string; value: number }>) => {
                const point = params[0]
                return `${point.name}<br/>${formatDuration(point.value)}`
            },
            extraCssText: 'border-radius: 12px; padding: 8px 12px;',
        },
        grid: { left: 8, right: 8, top: 20, bottom: 32, containLabel: true },
        xAxis: {
            type: 'category' as const,
            data: data.map(item => shortDate(item.dateKey, locale)),
            axisLine: { lineStyle: { color: border } },
            axisTick: { show: false },
            axisLabel: { color: textMuted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
        },
        yAxis: {
            type: 'value' as const,
            splitLine: { show: false },
            axisLabel: { show: false },
        },
        series: [
            {
                type: 'bar',
                data: data.map(item => ({
                    value: item.totalSec,
                    itemStyle: {
                        color: item.totalSec === peakValue ? accentAlt : accent,
                        borderRadius: [6, 6, 0, 0],
                    },
                })),
                barWidth: '56%',
            },
        ],
    }), [accent, accentAlt, border, data, locale, peakValue, surface, textMuted])

    if (data.length === 0) {
        return null
    }

    return (
        <div className="card p-5">
            <h3 className="text-2xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                {t('stats.byDay')}
            </h3>
            <ReactEChartsCore echarts={echarts} option={option} style={{ height: 220 }} opts={{ renderer: 'svg' }} />
        </div>
    )
}
