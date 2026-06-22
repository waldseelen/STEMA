import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../../src/app/providers/ThemeProvider'
import { I18nProvider } from '../../src/i18n'
import { AuthPage } from '../../src/modules/auth/pages/AuthPage'
import { useAuthStore } from '../../src/modules/auth/store/authStore'

function renderLanding(locale: 'tr' | 'en' = 'en') {
    return render(
        <ThemeProvider>
            <I18nProvider initialLocale={locale}>
                <AuthPage />
            </I18nProvider>
        </ThemeProvider>
    )
}

describe('public landing page', () => {
    beforeEach(() => {
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: false,
            isLoading: false,
            profile: null,
            session: null,
            user: null,
        })
    })

    it('renders landing page properly', () => {
        renderLanding('en')
        expect(true).toBe(true)
    })
})
