/**
 * RecordsGroupByDate — Tarih Bazlı Session Gruplama
 *
 * Session'ları dateKey'e göre gruplar, her grubun başında
 * formatlı tarih başlığı gösterir.
 */

import { useLocale, useTranslations } from '@/i18n'
import { formatDuration } from '@/db/time-tracking/queries/timerQueries'
import type { Activity, Category, TimeSession } from '@/db/time-tracking/types'
import { useMemo } from 'react'
import { RecordItem } from '../ui/RecordItem'

// ============================================
// Tarih Formatlama
// ============================================

/** YYYY-MM-DD → "11 Mart 2026, Çarşamba" formatı */
function formatDateLabel(dateKey: string, locale: string): string {
    const d = new Date(dateKey + 'T12:00:00')
    return d.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
    })
}

/** Bugün/dün kontrolü */
function getRelativeLabel(dateKey: string, todayLabel: string, yesterdayLabel: string): string | null {
    const today = new Date()
    const todayKey = today.toISOString().slice(0, 10)

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yesterdayKey = yesterday.toISOString().slice(0, 10)

    if (dateKey === todayKey) return todayLabel
    if (dateKey === yesterdayKey) return yesterdayLabel
    return null
}

// ============================================
// Tipler
// ============================================

interface DateGroup {
    dateKey: string
    sessions: TimeSession[]
    totalSec: number
}

interface RecordsGroupByDateProps {
    sessions: TimeSession[]
    activityMap: Map<string, Activity>
    categoryMap: Map<string, Category>
    onEdit: (sessionId: string) => void
    onDelete: (sessionId: string) => void
}

// ============================================
// Bileşen
// ============================================

export function RecordsGroupByDate({
    sessions,
    activityMap,
    categoryMap,
    onEdit,
    onDelete,
}: RecordsGroupByDateProps) {
    const t = useTranslations(['common', 'tracker'])
    const locale = useLocale()
    const groups = useMemo<DateGroup[]>(() => {
        const map = new Map<string, TimeSession[]>()
        for (const s of sessions) {
            const existing = map.get(s.dateKey)
            if (existing) {
                existing.push(s)
            } else {
                map.set(s.dateKey, [s])
            }
        }

        return Array.from(map.entries())
            .sort((a, b) => b[0].localeCompare(a[0])) // Yeniden eskiye
            .map(([dateKey, dateSessions]) => ({
                dateKey,
                sessions: dateSessions.sort((a, b) => b.startAt - a.startAt),
                totalSec: dateSessions.reduce((acc, s) => acc + s.durationSec, 0),
            }))
    }, [sessions])

    if (groups.length === 0) {
        return null
    }

    return (
        <div className="flex flex-col gap-6">
            {groups.map(group => {
                const relativeLabel = getRelativeLabel(group.dateKey, t('common', 'common.today'), t('common', 'common.yesterday'))
                return (
                    <section key={group.dateKey}>
                        {/* Tarih başlığı */}
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                {relativeLabel && (
                                    <span className="text-sm font-semibold text-text-primary mr-2">
                                        {relativeLabel}
                                    </span>
                                )}
                                <span className="text-xs text-text-muted">
                                    {formatDateLabel(group.dateKey, locale)}
                                </span>
                            </div>
                            <span className="text-xs font-mono text-text-secondary tabular-nums">
                                {formatDuration(group.totalSec)}
                            </span>
                        </div>

                        {/* Session listesi */}
                        <div className="flex flex-col gap-2">
                            {group.sessions.map(session => {
                                const activity = activityMap.get(session.activityId)
                                const category = activity
                                    ? categoryMap.get(activity.categoryId)
                                    : undefined
                                return (
                                    <RecordItem
                                        key={session.id}
                                        session={session}
                                        activity={activity}
                                        category={category}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                )
                            })}
                        </div>
                    </section>
                )
            })}
        </div>
    )
}
