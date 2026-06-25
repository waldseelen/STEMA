import { useAllTags } from '@/db/time-tracking/queries/activityQueries'
import type { TagDuration } from '@/db/time-tracking/queries/statsQueries'
import { formatDuration } from '@/db/time-tracking/queries/timerQueries'
import { useTranslation } from '@/i18n'
import { Tag } from 'lucide-react'
import { useMemo } from 'react'

interface TagValueBreakdownProps {
    byTag: TagDuration[]
}

export function TagValueBreakdown({ byTag }: TagValueBreakdownProps) {
    const t = useTranslation('tracker')
    const tags = useAllTags()

    const tagLookup = useMemo(() => new Map(tags.map(tag => [tag.id, tag])), [tags])
    const tagItems = useMemo(() => {
        return byTag
            .map(({ tagId, totalSec }) => ({ tag: tagLookup.get(tagId), totalSec }))
            .filter((item): item is { tag: NonNullable<typeof item.tag>; totalSec: number } => item.tag != null && item.totalSec > 0)
            .sort((left, right) => right.totalSec - left.totalSec)
    }, [byTag, tagLookup])

    if (tagItems.length === 0) {
        return null
    }

    const maxSec = tagItems[0]?.totalSec ?? 1

    return (
        <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-surface-200 text-text-secondary">
                    <Tag className="h-4 w-4" />
                </span>
                <h3 className="text-2xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    {t('tag.distribution')}
                </h3>
            </div>

            <div className="flex flex-col gap-3">
                {tagItems.map(({ tag, totalSec }, index) => {
                    const percent = Math.round((totalSec / maxSec) * 100)
                    const fillColor = index === 0 ? 'var(--color-accent-2)' : 'var(--color-accent)'

                    return (
                        <div key={tag.id} className="flex items-center gap-3">
                            <div className="flex w-28 flex-shrink-0 items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: fillColor }} />
                                <span className="truncate text-xs text-text-secondary">{tag.name}</span>
                            </div>

                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-200">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${percent}%`,
                                        backgroundColor: fillColor,
                                    }}
                                />
                            </div>

                            <span className="w-16 flex-shrink-0 text-right font-mono text-xs tabular-nums text-text-muted">
                                {formatDuration(totalSec)}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
