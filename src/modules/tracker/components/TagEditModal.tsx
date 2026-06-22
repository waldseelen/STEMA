/**
 * TagEditModal — Etiket Oluştur/Düzenle Modal
 */

import { useTranslations } from '@/i18n'
import { CATEGORY_COLORS } from '@/config/defaults'
import { createTag, updateTag } from '@/db/time-tracking/queries/activityQueries'
import type { Tag } from '@/db/types'
import { useToast } from '@/shared/components'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface TagEditModalProps {
    tag: Tag | null
    isOpen: boolean
    onClose: () => void
}

interface FormData {
    name: string
    color: string
    groupId: string
}

export function TagEditModal({ tag, isOpen, onClose }: TagEditModalProps) {
    const t = useTranslations(['common', 'tracker'])
    const { showToast } = useToast()
    const isEditing = tag != null

    const [form, setForm] = useState<FormData>({
        name: '',
        color: CATEGORY_COLORS[0].value,
        groupId: '',
    })
    const [saving, setSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (tag) {
            setForm({ name: tag.name, color: tag.color, groupId: tag.groupId ?? '' })
        } else {
            setForm({ name: '', color: CATEGORY_COLORS[0].value, groupId: '' })
        }
        setErrorMessage(null)
    }, [tag, isOpen])

    useEffect(() => {
        if (!isOpen) return
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            return () => { document.body.style.overflow = '' }
        }
    }, [isOpen])

    const handleSave = useCallback(async () => {
        if (!form.name.trim()) return
        setSaving(true)
        try {
            const groupId = form.groupId.trim() || undefined
            if (isEditing && tag) {
                await updateTag(tag.id, {
                    name: form.name.trim(),
                    color: form.color,
                    groupId,
                })
            } else {
                await createTag({
                    name: form.name.trim(),
                    color: form.color,
                    groupId,
                })
            }
            onClose()
        } catch (error) {
            const message = error instanceof Error && error.message.trim()
                ? error.message
                : t('common', 'toast.error')
            setErrorMessage(message)
            showToast(message, { variant: 'error' })
        } finally {
            setSaving(false)
        }
    }, [form, tag, isEditing, onClose, showToast, t])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-backdrop fixed inset-0 z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="fixed inset-x-4 top-[15%] z-50 mx-auto max-w-md"
                    >
                        <div className="modal-content overflow-hidden p-0">
                        <div className="flex items-center justify-between px-5 pt-5 pb-3">
                            <h2 className="text-base font-bold text-text-primary">
                                {isEditing ? t('tracker', 'tag.edit') : t('tracker', 'tag.new')}
                            </h2>
                            <button onClick={onClose} title={t('common', 'common.close')} className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors">
                                <X size={18} className="text-text-secondary" />
                            </button>
                        </div>

                        <div className="px-5 pb-5 flex flex-col gap-4">
                            {/* İsim */}
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('tracker', 'tag.name')}</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder={t('tracker', 'tag.placeholder')}
                                    className="w-full rounded-xl bg-surface-100 border border-[var(--border-subtle)] px-3 py-2.5 text-sm text-text-primary placeholder:text-surface-600 focus:border-[var(--border-medium)] focus:ring-1 focus:ring-[var(--border-medium)] outline-none transition-all"
                                    autoFocus
                                    onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                                />
                            </div>

                            {/* Renk */}
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('tracker', 'activity.color')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORY_COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, color: c.value }))}
                                            className={clsx(
                                                'w-8 h-8 rounded-lg transition-all',
                                                form.color === c.value
                                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-100 scale-110'
                                                    : 'hover:scale-105',
                                            )}
                                            style={{ backgroundColor: c.value }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Grup */}
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                                    {t('tracker', 'tag.group')} <span className="text-text-muted font-normal">{t('common', 'common.optional')}</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.groupId}
                                    onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
                                    placeholder={t('tracker', 'tag.groupPlaceholder')}
                                    className="w-full rounded-xl bg-surface-100 border border-[var(--border-subtle)] px-3 py-2.5 text-sm text-text-primary placeholder:text-surface-600 focus:border-[var(--border-medium)] focus:ring-1 focus:ring-[var(--border-medium)] outline-none transition-all"
                                />
                            </div>

                            {errorMessage && (
                                <p className="text-xs text-status-red">{errorMessage}</p>
                            )}

                            {/* Footer */}
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs text-text-secondary hover:bg-surface-100 transition-colors">
                                    {t('common', 'common.cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving || !form.name.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white dark:text-black bg-black dark:bg-white hover:opacity-90 disabled:opacity-40 transition-colors"
                                >
                                    <Save size={14} />
                                    {saving ? t('tracker', 'modal.saving') : t('common', 'common.save')}
                                </button>
                            </div>
                        </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
