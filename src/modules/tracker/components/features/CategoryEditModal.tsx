/**
 * CategoryEditModal — Kategori Oluştur/Düzenle Modal
 */

import { useTranslations } from '@/i18n'
import { CATEGORY_COLORS } from '@/config/defaults'
import { createCategory, updateCategory } from '@/db/time-tracking/queries/activityQueries'
import type { Category } from '@/db/time-tracking/types'
import { EntityIcon, useToast } from '@/shared/components'
import { IconPicker } from '@/shared/components/IconPicker'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Save, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface CategoryEditModalProps {
    category: Category | null
    isOpen: boolean
    onClose: () => void
}

interface FormData {
    name: string
    color: string
    icon: string
}

export function CategoryEditModal({ category, isOpen, onClose }: CategoryEditModalProps) {
    const t = useTranslations(['common', 'tracker'])
    const { showToast } = useToast()
    const isEditing = category != null

    const [form, setForm] = useState<FormData>({
        name: '',
        color: CATEGORY_COLORS[0].value,
        icon: 'FolderOpen',
    })
    const [saving, setSaving] = useState(false)
    const [showIconPicker, setShowIconPicker] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (category) {
            setForm({ name: category.name, color: category.color, icon: category.icon })
        } else {
            setForm({ name: '', color: CATEGORY_COLORS[0].value, icon: 'FolderOpen' })
        }
        setShowIconPicker(false)
        setErrorMessage(null)
    }, [category, isOpen])

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
            if (isEditing && category) {
                await updateCategory(category.id, {
                    name: form.name.trim(),
                    color: form.color,
                    icon: form.icon,
                })
            } else {
                await createCategory({
                    name: form.name.trim(),
                    color: form.color,
                    icon: form.icon,
                })
            }
            showToast(
                isEditing ? t('common', 'toast.updated') : t('common', 'toast.created'),
                { variant: 'success' },
            )
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
    }, [category, form, isEditing, onClose, showToast, t])

    const modalContent = (
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
                        transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
                        className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md"
                    >
                        <div className="modal-content overflow-hidden p-0">
                        <div className="flex items-center justify-between px-5 pt-5 pb-3">
                            <h2 className="text-base font-bold text-text-primary">
                                {isEditing ? t('tracker', 'category.edit') : t('tracker', 'category.new')}
                            </h2>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors">
                                <X size={18} className="text-text-secondary" />
                            </button>
                        </div>

                        <div className="px-5 pb-5 flex flex-col gap-4">
                            {/* İsim */}
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('tracker', 'category.name')}</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder={t('tracker', 'category.name')}
                                    className="w-full rounded-xl bg-surface-100 border border-[var(--border-subtle)] px-3 py-2.5 text-sm text-text-primary placeholder:text-surface-600 focus:border-[var(--border-medium)] focus:ring-1 focus:ring-[var(--border-medium)] outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Renk */}
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('tracker', 'category.color')}</label>
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

                            {/* İkon */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="block text-xs font-medium text-text-secondary mb-0">{t('tracker', 'category.icon')}</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowIconPicker(current => !current)}
                                        aria-expanded={showIconPicker}
                                        className="inline-flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-surface-100 px-3 py-2 text-sm text-text-primary transition-colors hover:bg-surface-200"
                                    >
                                        <span
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-primary"
                                            style={{ color: form.color }}
                                        >
                                            <EntityIcon name={form.icon} fallback="FolderOpen" className="h-4 w-4" size={16} />
                                        </span>
                                        <span className="truncate">{form.icon}</span>
                                        <ChevronDown className={clsx('h-4 w-4 text-text-muted transition-transform', showIconPicker && 'rotate-180')} />
                                    </button>
                                </div>

                                {showIconPicker && (
                                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-surface-100 p-3">
                                        <IconPicker
                                            value={form.icon}
                                            onSelect={icon => {
                                                setForm(current => ({ ...current, icon }))
                                                setShowIconPicker(false)
                                            }}
                                        />
                                    </div>
                                )}
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

    return createPortal(modalContent, document.body)
}
