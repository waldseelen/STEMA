import { useTranslation } from '@/i18n'
import { CheckCircleIcon, ClockIcon, PencilIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'

/**
 * Hızlı Aksiyon Modal Bileşeni
 *
 * Özellikler:
 * - Hızlı timer başlatma
 * - Alışkanlık ekleme
 * - Manuel kayıt formu
 * - Responsive tasarım
 * - Form validasyonu
 */

interface QuickActionModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit?: (data: QuickActionData) => void
}

interface QuickActionData {
    type: 'timer' | 'habit' | 'manual'
    name: string
    duration?: number | undefined
    notes?: string | undefined
}

type ActionType = 'timer' | 'habit' | 'manual'

export function QuickActionModal({ isOpen, onClose, onSubmit }: QuickActionModalProps) {
    const t = useTranslation('common')
    const [activeTab, setActiveTab] = useState<ActionType>('timer')
    const [formData, setFormData] = useState({
        name: '',
        duration: 25,
        notes: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) return

        setIsSubmitting(true)

        try {
            await onSubmit?.({
                type: activeTab,
                name: formData.name,
                duration: activeTab === 'timer' ? formData.duration : undefined,
                notes: formData.notes || undefined
            })

            // Formu sıfırla ve kapat
            setFormData({ name: '', duration: 25, notes: '' })
            onClose()
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setFormData({ name: '', duration: 25, notes: '' })
        onClose()
    }

    const tabs = [
        { id: 'timer' as const, label: t('quickAction.tabs.timer'), icon: ClockIcon },
        { id: 'habit' as const, label: t('quickAction.tabs.habit'), icon: CheckCircleIcon },
        { id: 'manual' as const, label: t('quickAction.tabs.manual'), icon: PencilIcon }
    ]

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={t('quickAction.title')}
            size="md"
            footer={
                <>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn-secondary min-h-[44px] px-6"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        form="quick-action-form"
                        disabled={!formData.name.trim() || isSubmitting}
                        className="btn-primary min-h-[44px] px-6"
                    >
                        {isSubmitting ? t('quickAction.saving') : t('common.save')}
                    </button>
                </>
            }
        >
            {/* Tab Navigasyonu */}
            <div className="flex gap-2 mb-6 p-1 bg-surface-100 dark:bg-surface-800 rounded-2xl">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl',
                            'min-h-[44px] transition-all duration-200',
                            'text-sm font-medium',
                            activeTab === tab.id
                                ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400'
                                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Form */}
            <form id="quick-action-form" onSubmit={handleSubmit} className="space-y-4">
                {/* İsim Alanı */}
                <div>
                    <label
                        htmlFor="action-name"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                    >
                        {activeTab === 'timer' ? t('quickAction.nameLabelTimer') :
                            activeTab === 'habit' ? t('quickAction.nameLabelHabit') : t('quickAction.nameLabelManual')}
                    </label>
                    <input
                        id="action-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={
                            activeTab === 'timer' ? t('quickAction.namePlaceholderTimer') :
                                activeTab === 'habit' ? t('quickAction.namePlaceholderHabit') :
                                    t('quickAction.namePlaceholderManual')
                        }
                        className="input"
                        autoComplete="off"
                        required
                    />
                </div>

                {/* Timer için süre ayarı */}
                {activeTab === 'timer' && (
                    <div>
                        <label
                            htmlFor="action-duration"
                            className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                        >
                            {t('quickAction.durationLabel')}
                        </label>
                        <div className="flex gap-2">
                            {[15, 25, 45, 60].map((min) => (
                                <button
                                    key={min}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, duration: min }))}
                                    className={clsx(
                                        'flex-1 py-3 rounded-xl min-h-[44px] font-medium transition-all',
                                        formData.duration === min
                                            ? 'bg-surface-300 text-text-primary'
                                            : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                                    )}
                                >
                                    {min}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Not Alanı */}
                <div>
                    <label
                        htmlFor="action-notes"
                        className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                    >
                        {t('quickAction.notesLabel')}
                    </label>
                    <textarea
                        id="action-notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder={t('quickAction.notesPlaceholder')}
                        rows={3}
                        className="input resize-none"
                    />
                </div>
            </form>
        </Modal>
    )
}
