/**
 * RecordEditModal — Session Düzenleme Modal
 *
 * Bir TimeSession kaydının başlangıç/bitiş zamanını ve notunu düzenler.
 * Proje pattern'i: framer-motion AnimatePresence + Escape kapatma.
 */

import { useActiveActivities, useActiveCategories } from '@/db/time-tracking/queries/activityQueries'
import { deleteSession, getSessionById, updateSession } from '@/db/time-tracking/queries/sessionQueries'
import { formatDuration } from '@/db/time-tracking/queries/timerQueries'
import type { TimeSession } from '@/db/types'
import { useTranslations } from '@/i18n'
import { useToast } from '@/shared/components/Toast'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Save, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

// ============================================
// Yardımcılar
// ============================================

/** Unix timestamp → YYYY-MM-DDTHH:MM (datetime-local input formatı) */
function timestampToLocal(ts: number): string {
    const d = new Date(ts)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** YYYY-MM-DDTHH:MM → Unix timestamp */
function localToTimestamp(val: string): number {
    return new Date(val).getTime()
}

/** YYYY-MM-DD dateKey from timestamp */
function dateKeyFromTimestamp(ts: number): string {
    const d = new Date(ts)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ============================================
// Props
// ============================================

interface RecordEditModalProps {
    sessionId: string | null
    isOpen: boolean
    onClose: () => void
}

// ============================================
// Form State
// ============================================

interface FormData {
    startAt: string  // datetime-local string
    endAt: string
    note: string
}

// ============================================
// Bileşen
// ============================================

export function RecordEditModal({ sessionId, isOpen, onClose }: RecordEditModalProps) {
    const t = useTranslations(['common', 'tracker'])
    const { showToast } = useToast()
    const [session, setSession] = useState<TimeSession | null>(null)
    const [form, setForm] = useState<FormData>({ startAt: '', endAt: '', note: '' })
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const activities = useActiveActivities()
    const categories = useActiveCategories()

    // Session'ı yükle
    useEffect(() => {
        if (!sessionId || !isOpen) {
            setSession(null)
            setConfirmDelete(false)
            setError(null)
            return
        }
        getSessionById(sessionId)
            .then(s => {
                if (s) {
                    setSession(s)
                    setForm({
                        startAt: timestampToLocal(s.startAt),
                        endAt: timestampToLocal(s.endAt),
                        note: s.note ?? '',
                    })
                }
            })
            .catch(() => {
                setSession(null)
                setError('Failed to load session data')
            })
    }, [sessionId, isOpen])

    // Escape kapatma
    useEffect(() => {
        if (!isOpen) return
        function handleEsc(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            return () => { document.body.style.overflow = '' }
        }
    }, [isOpen])

    const handleSave = useCallback(async () => {
        if (!session) return
        setError(null)

        const startTs = localToTimestamp(form.startAt)
        const endTs = localToTimestamp(form.endAt)

        if (endTs <= startTs) {
            setError(t('tracker', 'validation.endAfterStart'))
            return
        }

        setSaving(true)
        try {
            const durationSec = Math.floor((endTs - startTs) / 1000)
            const dateKey = dateKeyFromTimestamp(startTs)
            await updateSession(session.id, {
                startAt: startTs,
                endAt: endTs,
                durationSec,
                dateKey,
                note: form.note,
            })
            onClose()
        } catch {
            setError(t('tracker', 'validation.recordUpdateError'))
        } finally {
            setSaving(false)
        }
    }, [form, onClose, session, t])

    const handleDelete = useCallback(async () => {
        if (!session) return
        if (!confirmDelete) {
            setConfirmDelete(true)
            return
        }
        setDeleting(true)
        try {
            await deleteSession(session.id)
            showToast(t('tracker', 'record.deletedSuccess'), { variant: 'success' })
            onClose()
        } catch (err) {
            showToast(err instanceof Error ? err.message : t('common', 'toast.error'), { variant: 'error' })
            setConfirmDelete(false)
        } finally {
            setDeleting(false)
        }
    }, [session, confirmDelete, onClose, showToast, t])

    // Aktivite ve kategori bilgisini bul
    const activity = session ? activities.find(a => a.id === session.activityId) : undefined
    const category = activity ? categories.find(c => c.id === activity.categoryId) : undefined
    const color = category?.color ?? '#6366f1'

    // Süre hesapla (form'dan)
    const startTs = form.startAt ? localToTimestamp(form.startAt) : 0
    const endTs = form.endAt ? localToTimestamp(form.endAt) : 0
    const previewDuration = endTs > startTs ? Math.floor((endTs - startTs) / 1000) : 0

    return (
        <AnimatePresence>
            {isOpen && session && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="modal-backdrop fixed inset-0 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md"
                    >
                        <div className="modal-content overflow-hidden p-0">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: color }}
                                    />
                                    <div>
                                        <h2 className="text-base font-bold text-text-primary">
                                            {t('tracker', 'record.edit')}
                                        </h2>
                                        <p className="text-xs text-text-muted">
                                            {activity?.name ?? t('tracker', 'suggestion.unknownActivity')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors"
                                    aria-label={t('common', 'common.close')}
                                >
                                    <X size={18} className="text-text-secondary" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="px-5 pb-5 flex flex-col gap-4">
                                {/* Başlangıç */}
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                                        {t('tracker', 'record.start')}
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={form.startAt}
                                        onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
                                        className="w-full rounded-xl bg-surface-100 border border-[var(--border-subtle)] px-3 py-2.5 text-sm text-text-primary focus:border-[var(--border-medium)] focus:ring-1 focus:ring-[var(--border-medium)] outline-none transition-all"
                                    />
                                </div>

                                {/* Bitiş */}
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                                        {t('tracker', 'record.end')}
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={form.endAt}
                                        onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
                                        className="w-full rounded-xl bg-surface-100 border border-[var(--border-subtle)] px-3 py-2.5 text-sm text-text-primary focus:border-[var(--border-medium)] focus:ring-1 focus:ring-[var(--border-medium)] outline-none transition-all"
                                    />
                                </div>

                                {/* Süre önizleme */}
                                {previewDuration > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-100 border border-[var(--border-subtle)]">
                                        <Clock size={14} className="text-text-muted" />
                                        <span className="text-sm font-mono text-text-secondary tabular-nums">
                                            {formatDuration(previewDuration)}
                                        </span>
                                    </div>
                                )}

                                {/* Not */}
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                                        {t('tracker', 'record.note')}
                                    </label>
                                    <textarea
                                        value={form.note}
                                        onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                                        placeholder={t('tracker', 'record.notePlaceholder')}
                                        rows={3}
                                        className="w-full rounded-xl bg-surface-100 border border-[var(--border-subtle)] px-3 py-2.5 text-sm text-text-primary placeholder:text-surface-600 focus:border-[var(--border-medium)] focus:ring-1 focus:ring-[var(--border-medium)] outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Hata mesajı */}
                                {error && (
                                    <p className="text-xs text-status-red px-1">{error}</p>
                                )}

                                {/* Footer butonları */}
                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-status-red hover:bg-status-red/10 transition-colors disabled:opacity-40"
                                    >
                                        <Trash2 size={14} />
                                        {confirmDelete ? t('tracker', 'modal.confirmDelete') : t('common', 'common.delete')}
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={onClose}
                                            className="px-4 py-2 rounded-xl text-xs text-text-secondary hover:bg-surface-100 transition-colors"
                                        >
                                            {t('common', 'common.cancel')}
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving || previewDuration <= 0}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white dark:text-black bg-black dark:bg-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Save size={14} />
                                            {saving ? t('tracker', 'modal.saving') : t('common', 'common.save')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
