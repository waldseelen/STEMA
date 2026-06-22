import { useTranslation } from '@/i18n'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { memo, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Modal (Pop-up) Bileşeni
 *
 * Özellikler:
 * - ESC tuşu ile kapanma
 * - Dışına tıklayınca kapanma
 * - Tam responsive tasarım
 * - Focus trap (erişilebilirlik)
 * - Smooth animasyonlar
 * - Portal ile DOM'un dışında render
 */

interface ModalProps {
    /** Modal'ın açık/kapalı durumu */
    isOpen: boolean
    /** Kapanış callback'i */
    onClose: () => void
    /** Modal başlığı (opsiyonel - başlıksız modal için) */
    title?: string
    /** Modal içeriği */
    children: ReactNode
    /** Modal boyutu */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    /** Kapatma butonunu gizle */
    hideCloseButton?: boolean
    /** Dış tıklamayı devre dışı bırak */
    disableOutsideClick?: boolean
    /** Footer alanı (aksiyonlar için) */
    footer?: ReactNode
    /** Custom class ekleme */
    className?: string
}

export const Modal = memo(function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    hideCloseButton = false,
    disableOutsideClick = false,
    footer,
    className
}: ModalProps) {
    const tc = useTranslation('common')
    const modalRef = useRef<HTMLDivElement>(null)
    const previousActiveElement = useRef<HTMLElement | null>(null)

    // ESC tuşu ile kapanma
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
        }
    }, [onClose])

    // Focus trap - Tab ile modal dışına çıkmayı engelle
    const handleTabKey = useCallback((e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !modalRef.current) return

        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
        }
    }, [])

    useEffect(() => {
        if (isOpen) {
            // Önceki aktif elementi kaydet
            previousActiveElement.current = document.activeElement as HTMLElement

            // Event listener'ları ekle
            document.addEventListener('keydown', handleEscape)
            document.addEventListener('keydown', handleTabKey)

            // Body scroll'u engelle
            document.body.style.overflow = 'hidden'

            // Modal'a focus ver - anında
            requestAnimationFrame(() => {
                modalRef.current?.focus()
            })
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.removeEventListener('keydown', handleTabKey)
            document.body.style.overflow = ''

            // Önceki elemente focus'u geri ver
            previousActiveElement.current?.focus()
        }
    }, [isOpen, handleEscape, handleTabKey])

    // Dışarı tıklama handler'ı
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (!disableOutsideClick && e.target === e.currentTarget) {
            onClose()
        }
    }

    if (!isOpen) return null

    // Boyut sınıfları - responsive
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
        full: 'max-w-4xl'
    }

    const modalContent = (
        <div
            className="modal-backdrop"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
        >
            <div
                ref={modalRef}
                tabIndex={-1}
                className={clsx(
                    'modal-content',
                    sizeClasses[size],
                    'focus:outline-none',
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - yalnızca başlık varsa veya kapatma butonu görünürse göster */}
                {(title || !hideCloseButton) && (
                    <div className="flex items-center justify-between mb-6">
                        {title && (
                            <h2
                                id="modal-title"
                                className="text-display-lg text-text-primary"
                            >
                                {title}
                            </h2>
                        )}
                        {!hideCloseButton && (
                            <button
                                onClick={onClose}
                                className={clsx('btn-icon rounded-full border border-[var(--border-subtle)] bg-surface-100', !title && 'ml-auto')}
                                aria-label={tc('common.close')}
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="modal-body">
                    {children}
                </div>

                {/* Footer - varsa göster */}
                {footer && (
                    <div className="modal-footer mt-6 border-t border-[var(--border-subtle)] pt-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )

    // Portal ile body'ye direkt render (z-index sorunlarını önler)
    return createPortal(modalContent, document.body)
})
