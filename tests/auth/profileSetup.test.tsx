import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '../../src/app/providers/ThemeProvider'
import { I18nProvider } from '../../src/i18n'
import { ProfileSetupPage } from '../../src/modules/auth/pages/ProfileSetupPage'
import { useAuthStore, type UserProfile } from '../../src/modules/auth/store/authStore'

const incompleteStudentProfile: UserProfile = {
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'Test User',
    occupation: 'Student',
    studentStatus: 'student',
    school: 'Example University',
    department: 'Computer Science',
    grade: '2',
    plan: 'free',
    profileCompleted: false,
    onboardingCompleted: false,
    preferredLocale: 'tr',
    preferredTheme: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
}

function renderProfileSetup() {
    return render(
        <ThemeProvider>
            <I18nProvider initialLocale="tr">
                <MemoryRouter initialEntries={['/auth/profile-setup']}>
                    <Routes>
                        <Route path="/" element={<div>Landing</div>} />
                        <Route path="/planner" element={<div>Planner</div>} />
                        <Route path="/auth/profile-setup" element={<ProfileSetupPage />} />
                    </Routes>
                </MemoryRouter>
            </I18nProvider>
        </ThemeProvider>
    )
}

describe('profile setup form', () => {
    beforeEach(() => {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: vi.fn(),
            writable: true,
        })
        Object.defineProperty(window, 'scrollTo', {
            configurable: true,
            value: vi.fn(),
            writable: true,
        })

        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: incompleteStudentProfile,
            user: {
                id: 'user-1',
                email: 'user@example.com',
                user_metadata: {},
            } as never,
            completeProfile: vi.fn(),
        })
    })

    it('clears student-only fields when switching to a non-student status', async () => {
        renderProfileSetup()

        expect(document.getElementById('profile-school')).toHaveValue('Example University')
        expect(document.getElementById('profile-department')).toHaveValue('Computer Science')

        const statusOptions = screen.getAllByRole('radio')
        fireEvent.click(statusOptions[1])
        await waitFor(() => {
            expect(document.getElementById('profile-school')).not.toBeInTheDocument()
        })

        fireEvent.click(statusOptions[2])

        await waitFor(() => {
            expect(document.getElementById('profile-school')).toHaveValue('')
            expect(document.getElementById('profile-department')).toHaveValue('')
            expect(document.getElementById('profile-grade')).toHaveValue('')
        })
    })
})
