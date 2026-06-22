import { ArrowUturnLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

// ============================================
// Toast Types
// ============================================

type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'undo'

interface Toast {
    id: string
    message: string
    variant: ToastVariant
    duration: number
    action?: {
        label: string
        onClick: () => void
    } | undefined
}

interface ToastContextValue {
    toasts: Toast[]
    showToast: (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) => string
    showUndoToast: (message: string, onUndo: () => void, duration?: number) => string
    hideToast: (id: string) => void
}

// ============================================
// Context
// ============================================

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

// ============================================
// Provider
// ============================================

interface ToastProviderProps {
    children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const showToast = useCallback(
        (message: string, options: Partial<Omit<Toast, 'id' | 'message'>> = {}) => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            const toast: Toast = {
                id,
                message,
                variant: options.variant || 'default',
                duration: options.duration || 3000,
                action: options.action,
            }

            setToasts(prev => [...prev, toast])

            // Otomatik kaldır
            if (toast.duration > 0) {
                setTimeout(() => hideToast(id), toast.duration)
            }

            return id
        },
        [hideToast]
    )

    const showUndoToast = useCallback(
        (message: string, onUndo: () => void, duration = 5000) => {
            return showToast(message, {
                variant: 'undo',
                duration,
                action: {
                    label: 'Geri Al',
                    onClick: onUndo,
                },
            })
        },
        [showToast]
    )

    return (
        <ToastContext.Provider value={{ toasts, showToast, showUndoToast, hideToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    )
}

// ============================================
// Toast Container
// ============================================

function ToastContainer() {
    const { toasts, hideToast } = useToast()

    return (
        <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-50 flex flex-col gap-2">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
            ))}
        </div>
    )
}

// ============================================
// Toast Item
// ============================================

interface ToastItemProps {
    toast: Toast
    onClose: () => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
    const handleAction = () => {
        toast.action?.onClick()
        onClose()
    }

    const accentClass = {
        default: '',
        success: 'border-l-[3px] border-status-green',
        warning: 'border-l-[3px] border-status-amber',
        error: 'border-l-[3px] border-status-red',
        undo: 'border-l-[3px] border-status-blue',
    }

    const dotEl = {
        default: null,
        success: <span className="h-2 w-2 rounded-full bg-status-green flex-shrink-0" />,
        warning: <span className="h-2 w-2 rounded-full bg-status-amber flex-shrink-0" />,
        error: <span className="h-2 w-2 rounded-full bg-status-red flex-shrink-0" />,
        undo: <ArrowUturnLeftIcon className="w-4 h-4 text-status-blue flex-shrink-0" />,
    }

    return (
        <div
            className={clsx(
                'flex items-center gap-3 rounded-xl border px-4 py-3',
                'bg-surface-100',
                'border border-[var(--border-subtle)]',
                'shadow-[var(--shadow-card-elevated)]',
                'animate-slide-up text-text-primary',
                accentClass[toast.variant]
            )}
        >
            {dotEl[toast.variant]}

            <p className="flex-1 text-sm font-medium">{toast.message}</p>

            {toast.action && (
                <button
                    onClick={handleAction}
                    className="px-3 py-1 rounded-full text-xs font-semibold transition-colors bg-surface-300 hover:bg-surface-200 text-text-secondary hover:text-text-primary"
                >
                    {toast.action.label}
                </button>
            )}

            <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-surface-300 transition-colors text-text-muted hover:text-text-primary"
            >
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    )
}
