import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../src/i18n'
import { Modal } from '../../src/shared/components/Modal'

function renderModal(ui: React.ReactElement) {
    return render(
        <I18nProvider initialLocale="tr">
            {ui}
        </I18nProvider>
    )
}

describe('Modal', () => {
    it('should not render when closed', () => {
        renderModal(
            <Modal isOpen={false} onClose={() => { }}>
                <div data-testid="modal-content">Content</div>
            </Modal>
        )

        expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument()
    })

    it('should render when open', () => {
        renderModal(
            <Modal isOpen={true} onClose={() => { }}>
                <div data-testid="modal-content">Content</div>
            </Modal>
        )

        expect(screen.getByTestId('modal-content')).toBeInTheDocument()
    })

    it('should render title when provided', () => {
        renderModal(
            <Modal isOpen={true} onClose={() => { }} title="Test Title">
                <div>Content</div>
            </Modal>
        )

        expect(screen.getByText('Test Title')).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', () => {
        const onClose = vi.fn()

        renderModal(
            <Modal isOpen={true} onClose={onClose} title="Test">
                <div>Content</div>
            </Modal>
        )

        const closeButton = screen.getByRole('button', { name: /kapat/i })
        fireEvent.click(closeButton)

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when ESC key is pressed', () => {
        const onClose = vi.fn()

        renderModal(
            <Modal isOpen={true} onClose={onClose}>
                <div>Content</div>
            </Modal>
        )

        fireEvent.keyDown(document, { key: 'Escape' })

        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should hide close button when hideCloseButton is true', () => {
        renderModal(
            <Modal isOpen={true} onClose={() => { }} hideCloseButton title="Test">
                <div>Content</div>
            </Modal>
        )

        expect(screen.queryByRole('button', { name: /kapat/i })).not.toBeInTheDocument()
    })

    it('should render footer when provided', () => {
        renderModal(
            <Modal
                isOpen={true}
                onClose={() => { }}
                footer={<button data-testid="footer-btn">Footer Button</button>}
            >
                <div>Content</div>
            </Modal>
        )

        expect(screen.getByTestId('footer-btn')).toBeInTheDocument()
    })

    it('should apply correct size classes', () => {
        const { rerender, baseElement } = render(
            <I18nProvider initialLocale="tr">
                <Modal isOpen={true} onClose={() => { }} size="sm">
                    <div data-testid="modal-content">Content</div>
                </Modal>
            </I18nProvider>
        )

        // Modal wrapper should have max-w-sm for small size
        let modalWrapper = baseElement.querySelector('.modal-content')
        expect(modalWrapper?.className).toContain('max-w-sm')

        rerender(
            <I18nProvider initialLocale="tr">
                <Modal isOpen={true} onClose={() => { }} size="xl">
                    <div data-testid="modal-content">Content</div>
                </Modal>
            </I18nProvider>
        )

        modalWrapper = baseElement.querySelector('.modal-content')
        expect(modalWrapper?.className).toContain('max-w-2xl')
    })
})
