/**
 * ActivityGrid — Aktivite Grid
 *
 * Aktiviteleri kategori bazlı gruplar ve ActivityCard bileşenlerini render eder.
 * Üstte kategori filtre tab'ları bulunur.
 */

import { useActivitiesGroupedByCategory } from '@/db/time-tracking/queries/activityQueries'
import { useGoalsWithProgress } from '@/db/time-tracking/queries/goalQueries'
import { useTranslations } from '@/i18n'
import { clsx } from 'clsx'
import { Inbox } from 'lucide-react'
import { useMemo } from 'react'
import { useTrackerUIStore } from '../store/trackerUIStore'
import { ActivityCard } from './ActivityCard'

export function ActivityGrid() {
    const t = useTranslations(['common', 'tracker'])
    const grouped = useActivitiesGroupedByCategory()
    const goalsWithProgress = useGoalsWithProgress()
    const { selectedCategoryId, setSelectedCategoryId } = useTrackerUIStore()

    // activityId → progressPercent map
    const progressMap = useMemo(() => {
        const map = new Map<string, number>()
        for (const { goal, progressPercent } of goalsWithProgress) {
            if (goal.activityId) {
                // Birden fazla hedef varsa en yüksek progress'i göster
                const existing = map.get(goal.activityId) ?? 0
                if (progressPercent > existing) map.set(goal.activityId, progressPercent)
            }
        }
        return map
    }, [goalsWithProgress])

    // Görüntülenecek aktiviteler
    const displayed = selectedCategoryId
        ? grouped.filter(g => g.category.id === selectedCategoryId)
        : grouped

    const hasActivities = grouped.some(g => g.activities.length > 0)

    return (
        <div className="flex flex-col gap-4">
            {/* Kategori filtre chip'leri */}
            {grouped.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        onClick={() => setSelectedCategoryId(null)}
                        className={clsx(
                            'px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all',
                            !selectedCategoryId
                                ? 'bg-surface-300 text-text-primary'
                                : 'bg-surface-100 text-text-secondary hover:bg-surface-200 hover:text-text-primary',
                        )}
                    >
                        {t('common', 'common.all')}
                    </button>
                    {grouped.map(({ category }) => (
                        <button
                            key={category.id}
                            onClick={() =>
                                setSelectedCategoryId(
                                    selectedCategoryId === category.id ? null : category.id
                                )
                            }
                            className={clsx(
                                'px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all flex items-center gap-1.5',
                                selectedCategoryId === category.id
                                    ? 'text-text-primary'
                                    : 'bg-surface-100 text-text-secondary hover:bg-surface-200 hover:text-text-primary',
                            )}
                            style={
                                selectedCategoryId === category.id
                                    ? { backgroundColor: category.color + '33', border: `1px solid ${category.color}55` }
                                    : undefined
                            }
                        >
                            <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Boş durum */}
            {!hasActivities && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center">
                        <Inbox size={24} className="text-text-muted" />
                    </div>
                    <p className="text-text-secondary text-sm">{t('tracker', 'activity.noActivities')}</p>
                    <p className="text-text-muted text-xs">{t('tracker', 'activity.noActivitiesHint')}</p>
                </div>
            )}

            {/* Kategori grupları */}
            {hasActivities &&
                displayed.map(({ category, activities }) => {
                    if (activities.length === 0) return null
                    return (
                        <section key={category.id}>
                            {/* Kategori başlığı (tüm görünümde göster) */}
                            {!selectedCategoryId && (
                                <div className="flex items-center gap-2 mb-3">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        {category.name}
                                    </h3>
                                </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                {activities.map(activity => (
                                    <ActivityCard
                                        key={activity.id}
                                        activity={activity}
                                        categoryColor={category.color}
                                        goalProgress={progressMap.get(activity.id)}
                                    />
                                ))}
                            </div>
                        </section>
                    )
                })}
        </div>
    )
}
