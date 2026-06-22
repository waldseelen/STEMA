import { useLocale, useTranslation } from '@/i18n'
import { clsx } from 'clsx'
import { useMemo } from 'react'
import { CategoryDot, type CategoryColorKey } from './CategoryColors'

// ============================================
// Types
// ============================================

interface TimelineSession {
    id: string
    startAt: number // timestamp
    endAt: number // timestamp
    activityName: string
    categoryColor?: CategoryColorKey | string
    note?: string
}

interface TimelineProps {
    /** Zaman session'ları */
    sessions: TimelineSession[]
    /** Gün başlangıç saati (0-23) */
    dayStartHour?: number
    /** Tıklama handler'ı */
    onSessionClick?: (session: TimelineSession) => void
    /** Boşluğa tıklama handler'ı */
    onGapClick?: (startTime: number, endTime: number) => void
    /** Sürükle-bırak için drop handler'ı */
    onSessionDrop?: (sessionId: string, targetSessionId: string) => void
    /** Görünüm modu */
    variant?: 'compact' | 'detailed'
    /** Ek CSS sınıfı */
    className?: string
}

// ============================================
// Utils
// ============================================

function formatTime(timestamp: number, locale: string): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(seconds: number, t: (key: string, params?: Record<string, string | number>) => string): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return t('timeline.durationHoursMinutes', { hours, minutes })
    }
    return t('timeline.durationMinutes', { minutes })
}

// ============================================
// Component
// ============================================

/**
 * Görsel zaman çizelgesi
 * Günlük görünümde 00:00 - 23:59 arasını dikey çizgi üzerinde bloklar halinde gösterir
 */
export function Timeline({
    sessions,
    dayStartHour = 0,
    onSessionClick,
    onGapClick,
    onSessionDrop,
    variant = 'detailed',
    className,
}: TimelineProps) {
    const t = useTranslation('common')
    const locale = useLocale()
    // Saat çizgilerini oluştur
    const hours = useMemo(() => {
        const result: number[] = []
        for (let i = 0; i < 24; i++) {
            const hour = (dayStartHour + i) % 24
            result.push(hour)
        }
        return result
    }, [dayStartHour])

    // Session'ları pozisyonlarına göre hesapla
    const positionedSessions = useMemo(() => {
        // Günün başlangıç timestamp'ini bul
        const now = new Date()
        const dayStart = new Date(now)
        dayStart.setHours(dayStartHour, 0, 0, 0)

        const dayMs = 24 * 60 * 60 * 1000 // 1 gün
        const dayStartTs = dayStart.getTime()
        const dayEndTs = dayStartTs + dayMs

        return sessions
            .filter(s => s.startAt < dayEndTs && s.endAt > dayStartTs)
            .map(session => {
                const clampedStart = Math.max(session.startAt, dayStartTs)
                const clampedEnd = Math.min(session.endAt, dayEndTs)

                const startPercent = ((clampedStart - dayStartTs) / dayMs) * 100
                const endPercent = ((clampedEnd - dayStartTs) / dayMs) * 100
                const heightPercent = endPercent - startPercent

                return {
                    ...session,
                    startPercent,
                    heightPercent,
                    durationSec: Math.round((clampedEnd - clampedStart) / 1000),
                }
            })
            .sort((a, b) => a.startPercent - b.startPercent)
    }, [sessions, dayStartHour])

    // Boşlukları hesapla
    const gaps = useMemo(() => {
        if (positionedSessions.length === 0) {
            return [{ startPercent: 0, heightPercent: 100 }]
        }

        const result: { startPercent: number; heightPercent: number }[] = []
        let lastEnd = 0

        for (const session of positionedSessions) {
            if (session.startPercent > lastEnd) {
                result.push({
                    startPercent: lastEnd,
                    heightPercent: session.startPercent - lastEnd,
                })
            }
            lastEnd = session.startPercent + session.heightPercent
        }

        if (lastEnd < 100) {
            result.push({
                startPercent: lastEnd,
                heightPercent: 100 - lastEnd,
            })
        }

        return result
    }, [positionedSessions])

    const isCompact = variant === 'compact'

    return (
        <div className={clsx('flex gap-2', isCompact ? 'h-96' : 'h-[600px]', className)}>
            {/* Saat etiketleri */}
            <div className="flex flex-col justify-between text-xs text-surface-400 dark:text-surface-500 py-1">
                {hours.filter((_, i) => i % (isCompact ? 4 : 2) === 0).map(hour => (
                    <span key={hour} className="leading-none">
                        {hour.toString().padStart(2, '0')}:00
                    </span>
                ))}
            </div>

            {/* Ana timeline */}
            <div className="flex-1 relative bg-surface-50 dark:bg-surface-900 rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700">
                {/* Saat çizgileri */}
                {hours.map((hour, index) => (
                    <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-surface-200 dark:border-surface-700"
                        style={{ top: `${(index / 24) * 100}%` }}
                    />
                ))}

                {/* Boşluklar (gri alanlar) */}
                {gaps.map((gap, index) => (
                    <div
                        key={`gap-${index}`}
                        className={clsx(
                            'absolute left-1 right-1 rounded-lg',
                            'bg-surface-100 dark:bg-surface-800',
                            onGapClick && 'cursor-pointer hover:bg-surface-200 dark:hover:bg-surface-700',
                            'transition-colors duration-200'
                        )}
                        style={{
                            top: `${gap.startPercent}%`,
                            height: `${gap.heightPercent}%`,
                        }}
                        onClick={() => {
                            if (onGapClick) {
                                // TODO: Calculate actual timestamps
                            }
                        }}
                    />
                ))}

                {/* Session blokları */}
                {positionedSessions.map(session => (
                    <div
                        key={session.id}
                        className={clsx(
                            'absolute left-2 right-2 rounded-xl',
                            'bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-800/20',
                            'border-l-4',
                            session.categoryColor ? `border-${session.categoryColor}-500` : 'border-primary-500',
                            'shadow-sm hover:shadow-md',
                            'cursor-pointer transition-all duration-200',
                            'hover:scale-[1.02] hover:z-10',
                            session.heightPercent < 5 && 'overflow-hidden'
                        )}
                        style={{
                            top: `${session.startPercent}%`,
                            height: `${Math.max(session.heightPercent, 2)}%`,
                            minHeight: '24px',
                        }}
                        onClick={() => onSessionClick?.(session)}
                        draggable={!!onSessionDrop}
                        onDragStart={(e) => {
                            e.dataTransfer.setData('sessionId', session.id)
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault()
                            const draggedId = e.dataTransfer.getData('sessionId')
                            if (draggedId && draggedId !== session.id) {
                                onSessionDrop?.(draggedId, session.id)
                            }
                        }}
                    >
                        <div className="p-2 h-full flex flex-col justify-between">
                            {/* Session info */}
                            <div className="flex items-start gap-2">
                                {session.categoryColor && (
                                    <CategoryDot color={session.categoryColor} size="sm" className="mt-1" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                                        {session.activityName}
                                    </p>
                                    {!isCompact && session.note && session.heightPercent > 10 && (
                                        <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">
                                            {session.note}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Time range */}
                            {session.heightPercent > 8 && (
                                <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
                                    <span>{formatTime(session.startAt, locale)}</span>
                                    <span className="font-medium text-primary-600 dark:text-primary-400">
                                        {formatDuration(session.durationSec, t)}
                                    </span>
                                    <span>{formatTime(session.endAt, locale)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Şu anki zaman çizgisi */}
                <CurrentTimeLine dayStartHour={dayStartHour} />
            </div>
        </div>
    )
}

// ============================================
// Current Time Line
// ============================================

function CurrentTimeLine({ dayStartHour }: { dayStartHour: number }) {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // Günün başlangıcından geçen dakikaları hesapla
    const minutesSinceDayStart = ((currentHour - dayStartHour + 24) % 24) * 60 + currentMinute
    const totalMinutesInDay = 24 * 60
    const position = (minutesSinceDayStart / totalMinutesInDay) * 100

    return (
        <div
            className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
            style={{ top: `${position}%` }}
        >
            <div className="w-3 h-3 rounded-full bg-timer-500 shadow-lg shadow-timer-500/50 -ml-1.5" />
            <div className="flex-1 h-0.5 bg-timer-500" />
        </div>
    )
}

// ============================================
// Compact Timeline (for Dashboard)
// ============================================

interface CompactTimelineProps {
    sessions: TimelineSession[]
    maxItems?: number
    onViewAll?: () => void
    className?: string
}

export function CompactTimeline({
    sessions,
    maxItems = 5,
    onViewAll,
    className,
}: CompactTimelineProps) {
    const t = useTranslation('common')
    const locale = useLocale()
    const displaySessions = sessions.slice(0, maxItems)
    const hasMore = sessions.length > maxItems

    if (sessions.length === 0) {
        return (
            <div className={clsx('text-center py-6 text-surface-400 dark:text-surface-500', className)}>
                <p className="text-sm">{t('timeline.noRecords')}</p>
            </div>
        )
    }

    return (
        <div className={className}>
            <div className="space-y-2">
                {displaySessions.map((session, index) => (
                    <div
                        key={session.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                    >
                        {/* Timeline dot and line */}
                        <div className="flex flex-col items-center">
                            <div
                                className={clsx(
                                    'w-3 h-3 rounded-full',
                                    session.categoryColor ? `bg-${session.categoryColor}-500` : 'bg-primary-500'
                                )}
                            />
                            {index < displaySessions.length - 1 && (
                                <div className="w-0.5 h-8 bg-surface-200 dark:bg-surface-700 mt-1" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                                {session.activityName}
                            </p>
                            <p className="text-xs text-surface-500 dark:text-surface-400">
                                {formatTime(session.startAt, locale)} - {formatTime(session.endAt, locale)}
                            </p>
                        </div>

                        {/* Duration */}
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {formatDuration(Math.round((session.endAt - session.startAt) / 1000), t)}
                        </span>
                    </div>
                ))}
            </div>

            {hasMore && onViewAll && (
                <button
                    onClick={onViewAll}
                    className="w-full mt-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                    {t('timeline.showMore', { count: sessions.length - maxItems })}
                </button>
            )}
        </div>
    )
}
