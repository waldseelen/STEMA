/**
 * RecordItem — Tek Session Satırı
 *
 * Aktivite adı, kategori rengi, süre, başlangıç-bitiş zamanı ve notu gösterir.
 * Tıklamak düzenleme modalını açar.
 */

import { formatDuration } from '@/db/time-tracking/queries/timerQueries'
import type { Activity, Category, TimeSession } from '@/db/time-tracking/types'
import { useTranslations } from '@/i18n'
import { clsx } from 'clsx'
import { Clock, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'

// ============================================
// Zaman Formatlama Yardımcıları
// ============================================

/** Unix timestamp → HH:MM */
function formatTime(timestamp: number): string {
    const d = new Date(timestamp)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ============================================
// Props
// ============================================

interface RecordItemProps {
    session: TimeSession
    activity: Activity | undefined
    category: Category | undefined
    onEdit: (sessionId: string) => void
    onDelete: (sessionId: string) => void
}

// ============================================
// Bileşen
// ============================================

export function RecordItem({ session, activity, category, onEdit, onDelete }: RecordItemProps) {
    const t = useTranslations(['common', 'tracker'])
    const [menuOpen, setMenuOpen] = useState(false)
    const color = category?.color ?? '#6366f1'

    const handleEdit = useCallback(() => {
        setMenuOpen(false)
        onEdit(session.id)
    }, [session.id, onEdit])

    const handleDelete = useCallback(() => {
        setMenuOpen(false)
        onDelete(session.id)
    }, [session.id, onDelete])

    return (
        <div
            className={clsx(
                'group flex items-center gap-3 px-4 py-3',
                'rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-subtle)]',
                'bg-surface-100 hover:bg-surface-200 transition-all',
            )}
        >
            {/* Sol: Kategori renk çizgisi */}
            <div
                className="w-1 h-10 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
            />

            {/* Orta: Aktivite bilgisi */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                    {activity?.name ?? t('tracker', 'suggestion.unknownActivity')}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-text-muted">
                        {formatTime(session.startAt)} – {formatTime(session.endAt)}
                    </span>
                    {session.note && (
                        <span className="text-[11px] text-text-muted truncate max-w-[120px]">
                            · {session.note}
                        </span>
                    )}
                </div>
            </div>

            {/* Sağ: Süre + Menü */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1">
                    <Clock size={12} className="text-text-muted" />
                    <span className="text-sm font-mono tabular-nums text-text-secondary">
                        {formatDuration(session.durationSec)}
                    </span>
                </div>

                {/* Üç nokta menüsü */}
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className={clsx(
                            'p-1.5 rounded-lg transition-colors',
                            'opacity-0 group-hover:opacity-100 focus:opacity-100',
                            menuOpen ? 'bg-surface-200' : 'hover:bg-surface-200',
                        )}
                        aria-label={t('tracker', 'record.filterBy')}
                    >
                        <MoreVertical size={14} className="text-text-secondary" />
                    </button>

                    {menuOpen && (
                        <>
                            {/* Overlay — menüyü kapatır */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div
                                className={clsx(
                                    'absolute right-0 top-full mt-1 z-50',
                                    'w-36 py-1 rounded-xl',
                                    'bg-surface-100 border border-[var(--border-subtle)]',
                                    'shadow-xl shadow-black/30',
                                )}
                            >
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-text-secondary hover:bg-surface-100 transition-colors"
                                >
                                    <Pencil size={13} />
                                    {t('tracker', 'record.edit')}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-status-red hover:bg-status-red/10 transition-colors"
                                >
                                    <Trash2 size={13} />
                                    {t('common', 'common.delete')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
