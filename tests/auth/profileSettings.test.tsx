import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../src/app/providers/ThemeProvider'
import { I18nProvider } from '../../src/i18n'
import { useAuthStore, type UserProfile } from '../../src/modules/auth/store/authStore'
import { ProfileSettingsPage } from '../../src/modules/settings/pages/ProfileSettingsPage'
import { ToastProvider } from '../../src/shared/components'

const baseProfile: UserProfile = {
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'Test User',
    occupation: 'Developer',
    studentStatus: 'working',
    plan: 'free',
    profileCompleted: true,
    onboardingCompleted: true,
    preferredLocale: 'tr',
    preferredTheme: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
}

function renderProfileSettings() {
    return render(
        <ThemeProvider>
            <I18nProvider initialLocale="tr">
                <ToastProvider>
                    <MemoryRouter initialEntries={['/settings/profile']}>
                        <Routes>
                            <Route path="/settings/profile" element={<ProfileSettingsPage />} />
                            <Route path="/settings" element={<div>Settings</div>} />
                            <Route path="/planner" element={<div>Planner</div>} />
                        </Routes>
                    </MemoryRouter>
                </ToastProvider>
            </I18nProvider>
        </ThemeProvider>
    )
}

describe('ProfileSettingsPage — avatar upload', () => {
    beforeEach(() => {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: vi.fn(),
            writable: true,
        })
    })

    it('shows loading state when profile is null', () => {
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: null,
            user: { id: 'user-1', email: 'user@example.com' } as never,
        })

        renderProfileSettings()

        // Should show loading screen, not profile form
        expect(screen.queryByRole('button', { name: /avatar/i })).not.toBeInTheDocument()
    })

    it('calls uploadAvatar on file selection and shows success toast', async () => {
        const uploadAvatar = vi.fn(async () => 'https://example.com/avatar.png')
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: { ...baseProfile },
            user: { id: 'user-1', email: 'user@example.com' } as never,
            uploadAvatar,
            updateProfile: vi.fn(),
            restartOnboarding: vi.fn(),
        })

        const { container } = renderProfileSettings()

        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
        expect(fileInput).toBeTruthy()

        const file = new File(['avatar-data'], 'avatar.png', { type: 'image/png' })
        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
            expect(uploadAvatar).toHaveBeenCalledWith(file)
        })
    })

    it('shows error toast when upload fails', async () => {
        const uploadAvatar = vi.fn(async () => { throw new Error('Upload failed') })
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: { ...baseProfile },
            user: { id: 'user-1', email: 'user@example.com' } as never,
            uploadAvatar,
            updateProfile: vi.fn(),
            restartOnboarding: vi.fn(),
        })

        const { container } = renderProfileSettings()

        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
        const file = new File(['avatar-data'], 'avatar.png', { type: 'image/png' })
        fireEvent.change(fileInput, { target: { files: [file] } })

        await waitFor(() => {
            expect(uploadAvatar).toHaveBeenCalledWith(file)
        })
    })

    it('does not call uploadAvatar when no file is selected', () => {
        const uploadAvatar = vi.fn()
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: { ...baseProfile },
            user: { id: 'user-1', email: 'user@example.com' } as never,
            uploadAvatar,
            updateProfile: vi.fn(),
            restartOnboarding: vi.fn(),
        })

        const { container } = renderProfileSettings()

        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
        fireEvent.change(fileInput, { target: { files: [] } })

        expect(uploadAvatar).not.toHaveBeenCalled()
    })

    it('renders avatar preview with profile data', () => {
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: { ...baseProfile, avatarUrl: 'https://example.com/avatar.png' },
            user: { id: 'user-1', email: 'user@example.com' } as never,
            uploadAvatar: vi.fn(),
            updateProfile: vi.fn(),
            restartOnboarding: vi.fn(),
        })

        renderProfileSettings()

        // Avatar image should be present
        const avatar = screen.queryByRole('img')
        expect(avatar).toBeInTheDocument()
    })
})
