import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Modal } from './Modal'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    isLoading?: boolean
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    variant = 'danger',
    isLoading = false,
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    const variantClasses = {
        danger: 'btn-danger',
        warning: 'btn-timer',
        info: 'btn-primary',
    }

    const iconClasses = {
        danger: 'text-red-500 bg-red-100 dark:bg-red-900/30',
        warning: 'text-timer-500 bg-timer-100 dark:bg-timer-900/30',
        info: 'text-primary-500 bg-primary-100 dark:bg-primary-900/30',
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${iconClasses[variant]}`}>
                    <ExclamationTriangleIcon className="w-7 h-7" />
                </div>
                <p className="text-surface-600 dark:text-surface-400 mb-6">
                    {message}
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="btn-secondary flex-1"
                    disabled={isLoading}
                >
                    {cancelText}
                </button>
                <button
                    onClick={handleConfirm}
                    className={`flex-1 ${variantClasses[variant]}`}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                        confirmText
                    )}
                </button>
            </div>
        </Modal>
    )
}
