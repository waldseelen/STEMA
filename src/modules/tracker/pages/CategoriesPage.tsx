import {
    deleteCategory,
    deleteTag,
    useActiveCategories,
    useAllTags,
} from '@/db/time-tracking/queries/activityQueries'
import { deleteReminder, useReminders } from '@/db/time-tracking/queries/reminderQueries'
import type { Category, Reminder, Tag as TagType } from '@/db/time-tracking/types'
import { useTranslations } from '@/i18n'
import { EntityIcon, useToast } from '@/shared/components'
import { ArrowLeft, Bell, Inbox, Plus, Tag, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { CategoryEditModal } from '../components/features/CategoryEditModal'
import { ReminderEditModal } from '../components/features/ReminderEditModal'
import { TagEditModal } from '../components/features/TagEditModal'

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message.trim() ? error.message : fallback
}

export function CategoriesPage() {
    const t = useTranslations(['common', 'tracker'])
    const { showToast } = useToast()
    const categories = useActiveCategories()
    const tags = useAllTags()
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingTag, setEditingTag] = useState<TagType | null>(null)
    const [tagModalOpen, setTagModalOpen] = useState(false)
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
    const [deletingTagId, setDeletingTagId] = useState<string | null>(null)
    const [deletingReminderId, setDeletingReminderId] = useState<string | null>(null)

    const handleNewCategory = useCallback(() => {
        setEditingCategory(null)
        setModalOpen(true)
    }, [])

    const handleEditCategory = useCallback((category: Category) => {
        setEditingCategory(category)
        setModalOpen(true)
    }, [])

    const handleClose = useCallback(() => {
        setModalOpen(false)
        setEditingCategory(null)
    }, [])

    const handleNewTag = useCallback(() => {
        setEditingTag(null)
        setTagModalOpen(true)
    }, [])

    const handleEditTag = useCallback((tag: TagType) => {
        setEditingTag(tag)
        setTagModalOpen(true)
    }, [])

    const reminders = useReminders()
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
    const [reminderModalOpen, setReminderModalOpen] = useState(false)

    const handleNewReminder = useCallback(() => {
        setEditingReminder(null)
        setReminderModalOpen(true)
    }, [])

    const handleEditReminder = useCallback((reminder: Reminder) => {
        setEditingReminder(reminder)
        setReminderModalOpen(true)
    }, [])

    const handleCloseReminder = useCallback(() => {
        setReminderModalOpen(false)
        setEditingReminder(null)
    }, [])

    const handleDeleteReminder = useCallback(async (reminderId: string) => {
        setDeletingReminderId(reminderId)
        try {
            await deleteReminder(reminderId)
            showToast(t('common', 'toast.deleted'), { variant: 'success' })
        } catch (error) {
            showToast(getErrorMessage(error, t('common', 'toast.error')), { variant: 'error' })
        } finally {
            setDeletingReminderId(null)
        }
    }, [showToast, t])

    const handleCloseTag = useCallback(() => {
        setTagModalOpen(false)
        setEditingTag(null)
    }, [])

    const handleDeleteCategory = useCallback(async (categoryId: string) => {
        setDeletingCategoryId(categoryId)
        try {
            await deleteCategory(categoryId)
            showToast(t('common', 'toast.deleted'), { variant: 'success' })
        } catch (error) {
            showToast(getErrorMessage(error, t('common', 'toast.error')), { variant: 'error' })
        } finally {
            setDeletingCategoryId(null)
        }
    }, [showToast, t])

    const handleDeleteTag = useCallback(async (tagId: string) => {
        setDeletingTagId(tagId)
        try {
            await deleteTag(tagId)
            showToast(t('common', 'toast.deleted'), { variant: 'success' })
        } catch (error) {
            showToast(getErrorMessage(error, t('common', 'toast.error')), { variant: 'error' })
        } finally {
            setDeletingTagId(null)
        }
    }, [showToast, t])

    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                    <Link to="/tracker" className="btn-icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-surface-200 text-text-secondary">
                        <Tag className="h-4.5 w-4.5" />
                    </span>
                    <div>
                        <h1 className="text-xl font-semibold text-text-primary">{t('tracker', 'nav.categories')}</h1>
                        <p className="mt-1 text-sm text-text-secondary">
                            {t('tracker', 'page.categoriesSummary', { categories: categories.length, tags: tags.length })}
                        </p>
                    </div>
                </div>

                <button type="button" onClick={handleNewCategory} className="btn-primary gap-2">
                    <Plus className="h-4 w-4" />
                    {t('tracker', 'page.newShort')}
                </button>
            </div>

            <section className="flex flex-col gap-3">
                <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    {t('tracker', 'nav.categories')}
                </h2>

                {categories.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {categories.map(category => (
                            <div key={category.id} className="card flex items-center gap-3 p-4">
                                <span
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-surface-100"
                                    style={{ color: category.color }}
                                >
                                    <EntityIcon name={category.icon} fallback="FolderOpen" className="h-4 w-4" size={16} />
                                </span>
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                                <button
                                    type="button"
                                    onClick={() => handleEditCategory(category)}
                                    className="flex-1 truncate text-left text-sm font-medium text-text-primary"
                                >
                                    {category.name}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleDeleteCategory(category.id)}
                                    disabled={deletingCategoryId === category.id}
                                    className="btn-ghost p-2 text-status-red disabled:opacity-40"
                                    title={t('common', 'common.delete')}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card flex flex-col items-center gap-3 py-12 text-center">
                        <Inbox className="h-6 w-6 text-text-muted" />
                        <p className="text-sm text-text-primary">{t('tracker', 'category.noCategories')}</p>
                    </div>
                )}
            </section>

            <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                        {t('tracker', 'page.tags')}
                    </h2>
                    <button type="button" onClick={handleNewTag} className="btn-secondary gap-2">
                        <Plus className="h-4 w-4" />
                        {t('tracker', 'page.newTag')}
                    </button>
                </div>

                {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <div
                                key={tag.id}
                                className="flex items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-surface-100 px-3 py-2"
                            >
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                <button
                                    type="button"
                                    onClick={() => handleEditTag(tag)}
                                    className="text-xs text-text-secondary transition-colors hover:text-text-primary"
                                >
                                    {tag.name}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleDeleteTag(tag.id)}
                                    disabled={deletingTagId === tag.id}
                                    className="text-status-red transition-colors hover:opacity-80 disabled:opacity-40"
                                    title={t('common', 'common.delete')}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card flex flex-col items-center gap-3 py-12 text-center">
                        <Inbox className="h-6 w-6 text-text-muted" />
                        <p className="text-sm text-text-primary">{t('tracker', 'page.noTags')}</p>
                    </div>
                )}
            </section>

            <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                        {t('tracker', 'reminder.manage')}
                    </h2>
                    <button type="button" onClick={handleNewReminder} className="btn-secondary gap-2">
                        <Plus className="h-4 w-4" />
                        {t('tracker', 'reminder.new')}
                    </button>
                </div>

                {reminders.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {reminders.map(reminder => (
                            <div key={reminder.id} className="card flex items-center gap-3 p-4">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-surface-100 text-text-secondary">
                                    <Bell className="h-4 w-4" />
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleEditReminder(reminder)}
                                    className="flex-1 truncate text-left"
                                >
                                    <p className="text-sm font-medium text-text-primary">{reminder.title}</p>
                                    <p className="text-xs text-text-muted">{reminder.schedule.time}</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleDeleteReminder(reminder.id)}
                                    disabled={deletingReminderId === reminder.id}
                                    className="btn-ghost p-2 text-status-red disabled:opacity-40"
                                    title={t('common', 'common.delete')}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card flex flex-col items-center gap-3 py-12 text-center">
                        <Inbox className="h-6 w-6 text-text-muted" />
                        <p className="text-sm text-text-primary">{t('tracker', 'reminder.noReminders')}</p>
                    </div>
                )}
            </section>

            <CategoryEditModal category={editingCategory} isOpen={modalOpen} onClose={handleClose} />
            <TagEditModal tag={editingTag} isOpen={tagModalOpen} onClose={handleCloseTag} />
            <ReminderEditModal reminder={editingReminder} isOpen={reminderModalOpen} onClose={handleCloseReminder} />
        </div>
    )
}
