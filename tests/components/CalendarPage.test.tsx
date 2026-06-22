import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { clearPlannerData } from '../../src/db/planner/database'
import { I18nProvider } from '../../src/i18n'
import { CalendarPage } from '../../src/modules/planner/pages/CalendarPage'
import { ToastProvider } from '../../src/shared/components'

function renderCalendarPage() {
    return render(
        <MemoryRouter initialEntries={['/calendar']}>
            <I18nProvider initialLocale="tr">
                <ToastProvider>
                    <CalendarPage />
                </ToastProvider>
            </I18nProvider>
        </MemoryRouter>,
    )
}

describe('CalendarPage', () => {
    beforeEach(async () => {
        await clearPlannerData()
    })

    afterEach(async () => {
        await clearPlannerData()
    })

    it('renders without crashing and shows weekday headers', () => {
        renderCalendarPage()

        expect(screen.getByText('Takvim')).toBeInTheDocument()
        expect(screen.getByText('Pzt')).toBeInTheDocument()
    })
})
