import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from '../../src/app/providers/ThemeProvider'
import { ProfilePreferencesSync } from '../../src/app/providers/ProfilePreferencesSync'
import { SettingsI18nSync } from '../../src/app/providers/SettingsI18nSync'
import { useI18n, I18nProvider } from '../../src/i18n'
import { type UserProfile, useAuthStore } from '../../src/modules/auth/store/authStore'
import { useSettingsStore } from '../../src/modules/settings/store/settingsStore'
import { ThemeToggle } from '../../src/shared/components'

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
    preferredTheme: 'dark',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
}

function ThemeProbe() {
    const { theme, setTheme } = useTheme()

    return (
        <>
            <div>{`theme:${theme}`}</div>
            <button type="button" onClick={() => setTheme('light')}>
                set-light
            </button>
        </>
    )
}

function LocaleProbe() {
    const { locale, setLocale } = useI18n()

    return (
        <>
            <div>{`locale:${locale}`}</div>
            <button type="button" onClick={() => setLocale('en')}>
                set-en
            </button>
        </>
    )
}

function renderPreferenceSync(children: ReactNode) {
    return render(
        <ThemeProvider>
            <I18nProvider initialLocale="tr">
                <SettingsI18nSync />
                <ProfilePreferencesSync />
                {children}
            </I18nProvider>
        </ThemeProvider>
    )
}

describe('preference sync guards', () => {
    const originalUpdateSetting = useSettingsStore.getState().updateSetting

    beforeEach(() => {
        localStorage.setItem('lifeflow-theme', 'dark')
        useSettingsStore.setState({ updateSetting: originalUpdateSetting })
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            profile: baseProfile,
            user: { id: 'user-1', email: 'user@example.com' } as never,
            syncProfilePreferences: vi.fn().mockResolvedValue(undefined),
        })
    })

    afterEach(() => {
        useSettingsStore.setState({ updateSetting: originalUpdateSetting })
    })

    it('keeps an explicit theme change instead of reverting to the profile theme', async () => {
        renderPreferenceSync(<ThemeProbe />)

        expect(screen.getByText('theme:dark')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'set-light' }))

        await waitFor(() => {
            expect(screen.getByText('theme:light')).toBeInTheDocument()
        })

        expect(useAuthStore.getState().syncProfilePreferences).toHaveBeenCalledWith('tr', 'light')
    })

    it('keeps an explicit locale change instead of snapping back to the profile locale', async () => {
        renderPreferenceSync(<LocaleProbe />)

        expect(screen.getByText('locale:tr')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'set-en' }))

        await waitFor(() => {
            expect(screen.getByText('locale:en')).toBeInTheDocument()
        })

        expect(useAuthStore.getState().syncProfilePreferences).toHaveBeenCalledWith('en', 'dark')
    })

    it('renders the header theme control as icon-only and reflects a system-dark state without text', async () => {
        localStorage.setItem('lifeflow-theme', 'system')

        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: query === '(prefers-color-scheme: dark)',
                media: query,
                onchange: null,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        })

        render(
            <ThemeProvider>
                <I18nProvider initialLocale="tr">
                    <ThemeToggle />
                </I18nProvider>
            </ThemeProvider>
        )

        const toggle = screen.getByRole('button', { name: 'Açık temaya geç' })

        expect(toggle).toHaveTextContent('')
        expect(toggle).toHaveAttribute('aria-pressed', 'true')
    })
})
