import { clsx } from 'clsx'
import { useMemo, type ReactNode } from 'react'

// ============================================
// Types
// ============================================

type HeatmapValue = number | null
type ColorScale = 'green' | 'blue' | 'orange' | 'purple' | 'custom'

interface HeatmapData {
    date: string // YYYY-MM-DD format
    value: number
    label?: string
}

interface HeatmapProps {
    /** Veri noktaları */
    data: HeatmapData[]
    /** Başlangıç tarihi (varsayılan: 1 yıl önce) */
    startDate?: Date
    /** Bitiş tarihi (varsayılan: bugün) */
    endDate?: Date
    /** Renk paleti */
    colorScale?: ColorScale
    /** Özel renkler (colorScale='custom' ise) */
    customColors?: string[]
    /** Hücre boyutu (px) */
    cellSize?: number
    /** Hücreler arası boşluk (px) */
    cellGap?: number
    /** Ay etiketlerini göster */
    showMonthLabels?: boolean
    /** Gün etiketlerini göster */
    showDayLabels?: boolean
    /** Tıklama handler'ı */
    onCellClick?: (data: HeatmapData | null, date: string) => void
    /** Tooltip render fonksiyonu */
    renderTooltip?: (data: HeatmapData | null) => ReactNode
    /** Ek CSS sınıfı */
    className?: string
}

// ============================================
// Color Scales
// ============================================

const colorScales: Record<string, string[]> = {
    green: [
        'bg-surface-100 dark:bg-surface-800',
        'bg-success-200 dark:bg-success-900',
        'bg-success-300 dark:bg-success-800',
        'bg-success-400 dark:bg-success-700',
        'bg-success-500 dark:bg-success-600',
    ],
    blue: [
        'bg-surface-100 dark:bg-surface-800',
        'bg-primary-200 dark:bg-primary-900',
        'bg-primary-300 dark:bg-primary-800',
        'bg-primary-400 dark:bg-primary-700',
        'bg-primary-500 dark:bg-primary-600',
    ],
    orange: [
        'bg-surface-100 dark:bg-surface-800',
        'bg-timer-200 dark:bg-timer-900',
        'bg-timer-300 dark:bg-timer-800',
        'bg-timer-400 dark:bg-timer-700',
        'bg-timer-500 dark:bg-timer-600',
    ],
    purple: [
        'bg-surface-100 dark:bg-surface-800',
        'bg-purple-200 dark:bg-purple-900',
        'bg-purple-300 dark:bg-purple-800',
        'bg-purple-400 dark:bg-purple-700',
        'bg-purple-500 dark:bg-purple-600',
    ],
}

const dayLabels = ['Pzt', '', 'Çar', '', 'Cum', '', 'Paz']
const monthLabels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

// ============================================
// Utils
// ============================================

function getDateKey(date: Date): string {
    return date.toISOString().split('T')[0] ?? ''
}

function getDayOfWeek(date: Date): number {
    // 0 = Pazartesi, 6 = Pazar
    return (date.getDay() + 6) % 7
}

// ============================================
// Component
// ============================================

/**
 * GitHub tarzı ısı haritası bileşeni
 * Yıllık veya dönemsel aktivite/habit başarısını görselleştirir
 */
export function Heatmap({
    data,
    startDate,
    endDate,
    colorScale = 'green',
    customColors,
    cellSize = 12,
    cellGap = 3,
    showMonthLabels = true,
    showDayLabels = true,
    onCellClick,
    renderTooltip,
    className,
}: HeatmapProps) {
    // Tarih aralığını hesapla
    const { start, end } = useMemo(() => {
        const e = endDate || new Date()
        const s = startDate || new Date(e.getFullYear() - 1, e.getMonth(), e.getDate())
        return { start: s, end: e }
    }, [startDate, endDate])

    // Veriyi date map'e çevir
    const dataMap = useMemo(() => {
        const map = new Map<string, HeatmapData>()
        data.forEach(d => map.set(d.date, d))
        return map
    }, [data])

    // Max değeri bul (renk skalası için)
    const maxValue = useMemo(() => {
        if (data.length === 0) return 1
        return Math.max(...data.map(d => d.value))
    }, [data])

    // Renk paletini al
    const fallbackColors: string[] = [
        'bg-surface-100 dark:bg-surface-800',
        'bg-success-200 dark:bg-success-900',
        'bg-success-300 dark:bg-success-800',
        'bg-success-400 dark:bg-success-700',
        'bg-success-500 dark:bg-success-600',
    ]
    const scaleColors = colorScales[colorScale]
    const customOrScale = colorScale === 'custom' && customColors ? customColors : scaleColors
    const colors: string[] = customOrScale ?? fallbackColors

    // Değere göre renk döndür
    const getColor = (value: HeatmapValue): string => {
        const fallback = 'bg-surface-100'
        if (value === null || value === 0) return colors[0] ?? fallback
        const level = Math.ceil((value / maxValue) * (colors.length - 1))
        return colors[Math.min(level, colors.length - 1)] ?? fallback
    }

    // Haftalık grid oluştur
    const weeks = useMemo(() => {
        const result: { date: Date; data: HeatmapData | null }[][] = []
        let currentWeek: { date: Date; data: HeatmapData | null }[] = []

        const current = new Date(start)

        // İlk haftayı doldur (eksik günler için boş hücreler)
        const firstDayOfWeek = getDayOfWeek(current)
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push({ date: new Date(0), data: null })
        }

        while (current <= end) {
            const dateKey = getDateKey(current)
            const dayData = dataMap.get(dateKey) || null

            currentWeek.push({
                date: new Date(current),
                data: dayData,
            })

            if (getDayOfWeek(current) === 6) {
                result.push(currentWeek)
                currentWeek = []
            }

            current.setDate(current.getDate() + 1)
        }

        // Son haftayı ekle
        if (currentWeek.length > 0) {
            result.push(currentWeek)
        }

        return result
    }, [start, end, dataMap])

    // Ay etiketleri için pozisyonları hesapla
    const monthPositions = useMemo(() => {
        if (!showMonthLabels) return []

        const positions: { month: number; x: number }[] = []
        let lastMonth = -1

        weeks.forEach((week, weekIndex) => {
            const firstDay = week.find(d => d.date.getTime() > 0)
            if (firstDay) {
                const month = firstDay.date.getMonth()
                if (month !== lastMonth) {
                    positions.push({
                        month,
                        x: weekIndex * (cellSize + cellGap),
                    })
                    lastMonth = month
                }
            }
        })

        return positions
    }, [weeks, showMonthLabels, cellSize, cellGap])

    const gridWidth = weeks.length * (cellSize + cellGap)
    const gridHeight = 7 * (cellSize + cellGap)
    const labelOffset = showDayLabels ? 28 : 0
    const monthLabelHeight = showMonthLabels ? 20 : 0

    return (
        <div className={clsx('overflow-x-auto', className)}>
            <svg
                width={gridWidth + labelOffset + cellGap}
                height={gridHeight + monthLabelHeight}
                className="select-none"
            >
                {/* Ay etiketleri */}
                {showMonthLabels && (
                    <g className="text-xs fill-surface-500 dark:fill-surface-400">
                        {monthPositions.map(({ month, x }) => (
                            <text
                                key={`month-${month}-${x}`}
                                x={x + labelOffset}
                                y={12}
                                className="font-medium"
                            >
                                {monthLabels[month]}
                            </text>
                        ))}
                    </g>
                )}

                {/* Gün etiketleri */}
                {showDayLabels && (
                    <g className="text-xs fill-surface-500 dark:fill-surface-400">
                        {dayLabels.map((label, index) => (
                            label && (
                                <text
                                    key={`day-${index}`}
                                    x={0}
                                    y={monthLabelHeight + index * (cellSize + cellGap) + cellSize - 2}
                                    className="font-medium"
                                >
                                    {label}
                                </text>
                            )
                        ))}
                    </g>
                )}

                {/* Grid hücreleri */}
                <g transform={`translate(${labelOffset}, ${monthLabelHeight})`}>
                    {weeks.map((week, weekIndex) => (
                        <g key={weekIndex} transform={`translate(${weekIndex * (cellSize + cellGap)}, 0)`}>
                            {week.map((day, dayIndex) => {
                                if (day.date.getTime() === 0) return null

                                const dateKey = getDateKey(day.date)
                                const value = day.data?.value ?? null
                                const color = getColor(value)

                                return (
                                    <rect
                                        key={dateKey}
                                        x={0}
                                        y={dayIndex * (cellSize + cellGap)}
                                        width={cellSize}
                                        height={cellSize}
                                        rx={2}
                                        className={clsx(
                                            color,
                                            'transition-all duration-200',
                                            onCellClick && 'cursor-pointer hover:ring-2 hover:ring-primary-400'
                                        )}
                                        onClick={() => onCellClick?.(day.data, dateKey)}
                                    >
                                        {renderTooltip && (
                                            <title>{renderTooltip(day.data)}</title>
                                        )}
                                    </rect>
                                )
                            })}
                        </g>
                    ))}
                </g>
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-2 text-xs text-surface-500 dark:text-surface-400">
                <span>Az</span>
                {colors.map((color, index) => (
                    <div
                        key={index}
                        className={clsx(color, 'w-3 h-3 rounded-sm')}
                    />
                ))}
                <span>Çok</span>
            </div>
        </div>
    )
}
