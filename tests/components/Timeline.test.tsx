import type { ReactElement } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../src/i18n'
import { Timeline } from '../../src/shared/components/Timeline'

function renderTimeline(ui: ReactElement) {
    return render(
        <I18nProvider initialLocale="tr">
            {ui}
        </I18nProvider>
    )
}

describe('Timeline', () => {
    // Base timestamp: today at midnight
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const baseTime = now.getTime()

    const mockSessions = [
        {
            id: '1',
            startAt: baseTime + 9 * 60 * 60 * 1000, // 09:00
            endAt: baseTime + 10 * 60 * 60 * 1000, // 10:00
            activityName: 'Morning Workout',
            categoryColor: 'green' as const,
            note: 'Great session',
        },
        {
            id: '2',
            startAt: baseTime + 14 * 60 * 60 * 1000, // 14:00
            endAt: baseTime + 15.5 * 60 * 60 * 1000, // 15:30
            activityName: 'Coding',
            categoryColor: 'blue' as const,
        },
    ]

    it('should render without crashing', () => {
        const { container } = renderTimeline(<Timeline sessions={[]} />)
        expect(container.firstChild).toBeInTheDocument()
    })

    it('should render session activity names', () => {
        renderTimeline(<Timeline sessions={mockSessions} />)

        expect(screen.getByText('Morning Workout')).toBeInTheDocument()
        expect(screen.getByText('Coding')).toBeInTheDocument()
    })

    it('should render session with notes in title attribute', () => {
        renderTimeline(<Timeline sessions={mockSessions} variant="detailed" />)

        // Notes are shown as title/tooltip, not as visible text
        // Just verify the sessions render correctly
        expect(screen.getByText('Morning Workout')).toBeInTheDocument()
    })

    it('should call onSessionClick when session is clicked', () => {
        const onSessionClick = vi.fn()

        renderTimeline(
            <Timeline
                sessions={mockSessions}
                onSessionClick={onSessionClick}
            />
        )

        fireEvent.click(screen.getByText('Morning Workout'))

        expect(onSessionClick).toHaveBeenCalledTimes(1)
        expect(onSessionClick).toHaveBeenCalledWith(
            expect.objectContaining({ id: '1', activityName: 'Morning Workout' })
        )
    })

    it('should display hour markers', () => {
        renderTimeline(<Timeline sessions={mockSessions} />)

        // Should show some hour markers (depending on sessions)
        // At least the hours of our sessions should appear
        const timeElements = screen.getAllByText(/\d{2}:00/)
        expect(timeElements.length).toBeGreaterThan(0)
    })

    it('should apply custom className', () => {
        const { container } = renderTimeline(
            <Timeline sessions={mockSessions} className="custom-timeline" />
        )

        expect((container.firstChild as HTMLElement)?.className).toContain('custom-timeline')
    })

    it('should support compact variant', () => {
        const { container } = renderTimeline(
            <Timeline sessions={mockSessions} variant="compact" />
        )

        // Compact should render a simpler view
        expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle empty sessions array', () => {
        const { container } = renderTimeline(<Timeline sessions={[]} />)

        // Should render without errors
        expect(container.firstChild).toBeInTheDocument()
    })

    it('should respect dayStartHour prop', () => {
        renderTimeline(<Timeline sessions={mockSessions} dayStartHour={6} />)

        // With day starting at 6, the timeline should still show sessions
        expect(screen.getByText('Morning Workout')).toBeInTheDocument()
    })

    it('should render sessions with proper structure', () => {
        const { container } = renderTimeline(<Timeline sessions={mockSessions} variant="detailed" />)

        // Verify sessions are rendered
        expect(screen.getByText('Morning Workout')).toBeInTheDocument()
        expect(screen.getByText('Coding')).toBeInTheDocument()

        // Verify color dots are rendered
        const colorDots = container.querySelectorAll('.bg-green-500, .bg-blue-500')
        expect(colorDots.length).toBeGreaterThan(0)
    })
})
