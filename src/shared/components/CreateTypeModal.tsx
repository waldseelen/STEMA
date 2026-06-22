/**
 * Plan.Ex - Oluştur Tipi Seçme Modal
 *
 * Kullanıcıdan ne oluşturmak istediğini sorar:
 * - Görev
 * - Alışkanlık
 * - Ders
 * - Etkinlik/Sınav
 */

import { useTranslations } from '@/i18n'
import { BookOpenIcon, CalendarIcon, CheckCircleIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { type ReactNode } from 'react'
import { Modal } from './Modal'

export type CreateType = 'task' | 'habit' | 'course' | 'event'

interface CreateTypeModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (type: CreateType) => void
}

interface CreateOption {
    id: CreateType
    labelKey: string
    descriptionKey: string
    icon: ReactNode
    color: string
}

const CREATE_OPTIONS: CreateOption[] = [
    {
        id: 'task',
        labelKey: 'planner.task.title',
        descriptionKey: 'common.app.createTaskDesc',
        icon: <DocumentTextIcon className="w-8 h-8" />,
        color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    },
    {
        id: 'habit',
        labelKey: 'habits.habit.title',
        descriptionKey: 'common.app.createHabitDesc',
        icon: <CheckCircleIcon className="w-8 h-8" />,
        color: 'from-green-500/20 to-green-600/20 border-green-500/30',
    },
    {
        id: 'course',
        labelKey: 'planner.course.title',
        descriptionKey: 'common.app.createCourseDesc',
        icon: <BookOpenIcon className="w-8 h-8" />,
        color: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    },
    {
        id: 'event',
        labelKey: 'common.app.eventOrExam',
        descriptionKey: 'common.app.createEventDesc',
        icon: <CalendarIcon className="w-8 h-8" />,
        color: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    },
]

export function CreateTypeModal({ isOpen, onClose, onSelect }: CreateTypeModalProps) {
    const t = useTranslations(['common', 'planner', 'habits'])
    const handleSelect = (type: CreateType) => {
        onSelect(type)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('common', 'app.whatCreate')}
            size="md"
        >
            <div className="space-y-3">
                {CREATE_OPTIONS.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleSelect(option.id)}
                        className={clsx(
                            'w-full p-4 rounded-xl border-2 transition-all duration-200',
                            'hover:scale-102 active:scale-98',
                            'flex items-center gap-4',
                            'bg-gradient-to-br',
                            option.color,
                            'hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
                        )}
                    >
                        <div className="text-white">{option.icon}</div>
                        <div className="text-left flex-1">
                            <h3 className="font-semibold text-white text-lg">{option.labelKey.startsWith('common.') ? t('common', option.labelKey.replace('common.', '')) : option.labelKey.startsWith('planner.') ? t('planner', option.labelKey.replace('planner.', '')) : t('habits', option.labelKey.replace('habits.', ''))}</h3>
                            <p className="text-white/70 text-sm">{t('common', option.descriptionKey.replace('common.', ''))}</p>
                        </div>
                    </button>
                ))}

                {/* Kapat butonu */}
                <button
                    onClick={onClose}
                    className={clsx(
                        'w-full p-3 mt-4 rounded-lg border-2 border-default',
                        'text-secondary hover:text-primary',
                        'transition-colors duration-200',
                        'flex items-center justify-center gap-2'
                    )}
                >
                    <XMarkIcon className="w-4 h-4" />
                    <span>{t('common', 'common.cancel')}</span>
                </button>
            </div>
        </Modal>
    )
}
