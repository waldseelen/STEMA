import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Heatmap } from '../../src/shared/components/Heatmap'

describe('Heatmap', () => {
    const mockData = [
        { date: '2025-12-25', value: 10, label: 'Christmas' },
        { date: '2025-12-26', value: 20 },
        { date: '2025-12-27', value: 0 },
        { date: '2025-12-28', value: 50 },
    ]

    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 30)

    it('should render without crashing', () => {
        const { container } = render(
            <Heatmap data={mockData} startDate={startDate} endDate={today} />
        )

        expect(container.firstChild).toBeInTheDocument()
    })

    it('should render month labels when enabled', () => {
        render(
            <Heatmap
                data={mockData}
                startDate={startDate}
                endDate={today}
                showMonthLabels={true}
            />
        )

        // At least one month label should be visible
        const monthLabels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
        const hasMonthLabel = monthLabels.some(label =>
            screen.queryByText(label) !== null
        )
        expect(hasMonthLabel).toBe(true)
    })

    it('should render day labels when enabled', () => {
        render(
            <Heatmap
                data={mockData}
                startDate={startDate}
                endDate={today}
                showDayLabels={true}
            />
        )

        // Should show at least Pzt or Çar
        const hasDayLabel = screen.queryByText('Pzt') !== null || screen.queryByText('Çar') !== null
        expect(hasDayLabel).toBe(true)
    })

    it('should render cells for the date range', () => {
        const { container } = render(
            <Heatmap
                data={mockData}
                startDate={startDate}
                endDate={today}
            />
        )

        // Should render multiple cells (rounded divs for each day)
        const cells = container.querySelectorAll('[class*="rounded"]')
        expect(cells.length).toBeGreaterThan(0)
    })

    it('should apply custom className', () => {
        const { container } = render(
            <Heatmap
                data={mockData}
                startDate={startDate}
                endDate={today}
                className="custom-heatmap-class"
            />
        )

        expect((container.firstChild as HTMLElement)?.className).toContain('custom-heatmap-class')
    })

    it('should use different color scales', () => {
        const { rerender, container } = render(
            <Heatmap
                data={mockData}
                startDate={startDate}
                endDate={today}
                colorScale="green"
            />
        )

        // Green scale uses success colors
        let cells = container.querySelectorAll('[class*="success"]')
        const greenCount = cells.length

        rerender(
            <Heatmap
                data={mockData}
                startDate={startDate}
                endDate={today}
                colorScale="blue"
            />
        )

        // Blue scale uses primary colors
        cells = container.querySelectorAll('[class*="primary"]')
        const blueCount = cells.length

        // Both should have some colored cells
        expect(greenCount + blueCount).toBeGreaterThan(0)
    })

    it('should render with custom cell size', () => {
        const { container } = render(
            <Heatmap
                data={mockData}
                startDate={startDate}
                endDate={today}
                cellSize={16}
            />
        )

        // Component should render without errors
        expect(container.firstChild).toBeInTheDocument()
    })
})
