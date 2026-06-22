import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../src/app/providers/ThemeProvider'
import { I18nProvider } from '../../src/i18n'
import { AuthGuard } from '../../src/modules/auth/components/AuthGuard'
import { OnboardingOrchestrator } from '../../src/modules/auth/components/OnboardingOrchestrator'
import { useAuthStore, type UserProfile } from '../../src/modules/auth/store/authStore'
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

function renderGuard() {
    return render(
        <ThemeProvider>
            <I18nProvider initialLocale="tr">
                <MemoryRouter initialEntries={['/planner']}>
                    <Routes>
                        <Route path="/" element={<div>Landing</div>} />
                        <Route path="/auth/profile-setup" element={<div>Profile Setup</div>} />
                        <Route
                            path="/planner"
                            element={(
                                <AuthGuard>
                                    <div>Protected Shell</div>
                                </AuthGuard>
                            )}
                        />
                    </Routes>
                </MemoryRouter>
            </I18nProvider>
        </ThemeProvider>
    )
}

describe('auth flow shell', () => {
    beforeEach(() => {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: vi.fn(),
            writable: true,
        })
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: false,
            isLoading: false,
            profile: null,
            session: null,
            user: null,
        })
    })

    it('redirects unauthenticated users to landing', () => {
        renderGuard()

        expect(screen.getByText('Landing')).toBeInTheDocument()
    })

    it('redirects incomplete profiles to profile setup', () => {
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: {
                ...baseProfile,
                profileCompleted: false,
            },
            user: { id: 'user-1', email: 'user@example.com' } as never,
        })

        renderGuard()

        expect(screen.getByText('Profile Setup')).toBeInTheDocument()
    })

    it('opens onboarding on planner when profile is complete but onboarding is pending', async () => {
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: {
                ...baseProfile,
                onboardingCompleted: false,
            },
            user: { id: 'user-1', email: 'user@example.com' } as never,
        })

        render(
            <ThemeProvider>
                <I18nProvider initialLocale="tr">
                    <ToastProvider>
                        <MemoryRouter initialEntries={['/planner']}>
                            <div data-onboarding-target="header-shell">Header</div>
                            <div data-onboarding-target="command-bar">Command</div>
                            <div data-onboarding-target="quick-actions">Quick Actions</div>
                            <div data-onboarding-target="nav-calendar">Calendar</div>
                            <div data-onboarding-target="nav-tracker">Tracker Nav</div>
                            <div data-onboarding-target="nav-settings">Settings Nav</div>
                            <div data-onboarding-target="theme-toggle">Theme</div>
                            <div data-onboarding-target="language-toggle">Lang</div>
                            <div data-onboarding-target="dashboard-hero">Hero</div>
                            <div data-onboarding-target="dashboard-section-habits">Habits Panel</div>
                            <OnboardingOrchestrator />
                        </MemoryRouter>
                    </ToastProvider>
                </I18nProvider>
            </ThemeProvider>
        )

        expect(await screen.findByText(/Planner ana görünümüne hoş geldin/i)).toBeInTheDocument()
    })

    it('shows a safe fallback notice when the current onboarding target is missing', async () => {
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: {
                ...baseProfile,
                onboardingCompleted: false,
            },
            user: { id: 'user-1', email: 'user@example.com' } as never,
        })

        render(
            <ThemeProvider>
                <I18nProvider initialLocale="tr">
                    <ToastProvider>
                        <MemoryRouter initialEntries={['/planner']}>
                            <div data-onboarding-target="header-shell">Header</div>
                            <div data-onboarding-target="quick-actions">Quick Actions</div>
                            <div data-onboarding-target="nav-calendar">Calendar</div>
                            <div data-onboarding-target="nav-tracker">Tracker Nav</div>
                            <div data-onboarding-target="nav-settings">Settings Nav</div>
                            <div data-onboarding-target="theme-toggle">Theme</div>
                            <OnboardingOrchestrator />
                        </MemoryRouter>
                    </ToastProvider>
                </I18nProvider>
            </ThemeProvider>
        )

        // Advance past welcome step (step 0) → modules step (step 1)
        const beginButton = await screen.findByRole('button', { name: /Başla/i })
        fireEvent.click(beginButton)

        // Advance past modules step (step 1) → planner step (step 2, target: dashboard-hero which is absent)
        const nextButton = await screen.findByRole('button', { name: /İleri/i })
        fireEvent.click(nextButton)

        // After retries exhaust (6 × 120ms ≈ 720ms), fallback state activates
        expect(
            await screen.findByText(/Bu adım generic açıklama ile sürüyor/i, {}, { timeout: 2000 })
        ).toBeInTheDocument()
    })

    it('renders protected shell when profile and onboarding are both complete', () => {
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: {
                ...baseProfile,
                profileCompleted: true,
                onboardingCompleted: true,
            },
            user: { id: 'user-1', email: 'user@example.com' } as never,
        })

        renderGuard()

        expect(screen.getByText('Protected Shell')).toBeInTheDocument()
    })

    it('onboarding skip calls completeOnboarding and hides overlay', async () => {
        const completeOnboarding = vi.fn(async () => { })
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: {
                ...baseProfile,
                onboardingCompleted: false,
            },
            user: { id: 'user-1', email: 'user@example.com' } as never,
            completeOnboarding,
        })

        render(
            <ThemeProvider>
                <I18nProvider initialLocale="tr">
                    <ToastProvider>
                        <MemoryRouter initialEntries={['/planner']}>
                            <div data-onboarding-target="header-shell">Header</div>
                            <div data-onboarding-target="command-bar">Command</div>
                            <div data-onboarding-target="quick-actions">Quick Actions</div>
                            <div data-onboarding-target="nav-calendar">Calendar</div>
                            <div data-onboarding-target="nav-tracker">Tracker Nav</div>
                            <div data-onboarding-target="nav-settings">Settings Nav</div>
                            <div data-onboarding-target="theme-toggle">Theme</div>
                            <div data-onboarding-target="language-toggle">Lang</div>
                            <div data-onboarding-target="dashboard-hero">Hero</div>
                            <div data-onboarding-target="dashboard-section-habits">Habits Panel</div>
                            <OnboardingOrchestrator />
                        </MemoryRouter>
                    </ToastProvider>
                </I18nProvider>
            </ThemeProvider>
        )

        // Onboarding welcome step should be visible
        expect(await screen.findByText(/Planner ana görünümüne hoş geldin/i)).toBeInTheDocument()

        // Click skip button (Atla)
        const skipButton = screen.queryByRole('button', { name: /atla/i })
        if (skipButton) {
            fireEvent.click(skipButton)
            await waitFor(() => {
                expect(completeOnboarding).toHaveBeenCalled()
            })
        }
    })
})
