import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
    CategoryBadge,
    categoryColors,
    CategoryDot,
    getCategoryColorStyles,
} from '../../src/shared/components/CategoryColors'

describe('CategoryColors', () => {
    describe('categoryColors', () => {
        it('should have all expected color keys', () => {
            const expectedColors = ['blue', 'green', 'red', 'orange', 'yellow', 'purple', 'pink', 'cyan', 'gray']

            expectedColors.forEach(color => {
                expect(categoryColors).toHaveProperty(color)
            })
        })

        it('should have required style properties for each color', () => {
            Object.values(categoryColors).forEach(colorStyle => {
                expect(colorStyle).toHaveProperty('name')
                expect(colorStyle).toHaveProperty('bg')
                expect(colorStyle).toHaveProperty('bgLight')
                expect(colorStyle).toHaveProperty('text')
                expect(colorStyle).toHaveProperty('border')
                expect(colorStyle).toHaveProperty('dot')
                expect(colorStyle).toHaveProperty('ring')
            })
        })
    })

    describe('getCategoryColorStyles', () => {
        it('should return correct styles for known colors', () => {
            const blueStyles = getCategoryColorStyles('blue')
            expect(blueStyles.name).toBe('Mavi')
            expect(blueStyles.bg).toBe('bg-blue-500')
        })

        it('should fallback to gray for unknown colors', () => {
            const unknownStyles = getCategoryColorStyles('unknown-color')
            expect(unknownStyles).toEqual(categoryColors.gray)
        })
    })

    describe('CategoryDot', () => {
        it('should render with correct color class', () => {
            const { container } = render(<CategoryDot color="blue" />)

            const dot = container.querySelector('span')
            expect(dot?.className).toContain('bg-blue-500')
        })

        it('should apply different sizes', () => {
            const { container: smContainer } = render(<CategoryDot color="green" size="sm" />)
            const { container: lgContainer } = render(<CategoryDot color="green" size="lg" />)

            expect(smContainer.querySelector('span')?.className).toContain('w-2 h-2')
            expect(lgContainer.querySelector('span')?.className).toContain('w-4 h-4')
        })

        it('should apply custom className', () => {
            const { container } = render(<CategoryDot color="red" className="custom-class" />)

            expect(container.querySelector('span')?.className).toContain('custom-class')
        })
    })

    describe('CategoryBadge', () => {
        it('should render label text', () => {
            render(<CategoryBadge color="purple" label="Test Label" />)

            expect(screen.getByText('Test Label')).toBeInTheDocument()
        })

        it('should apply color styles', () => {
            const { container } = render(<CategoryBadge color="orange" label="Badge" />)

            const badge = container.firstChild as HTMLElement
            // Should have background light style
            expect(badge?.className).toContain('bg-orange')
        })

        it('should apply different sizes', () => {
            const { container: smContainer } = render(
                <CategoryBadge color="blue" label="Small" size="sm" />
            )
            const { container: mdContainer } = render(
                <CategoryBadge color="blue" label="Medium" size="md" />
            )

            expect((smContainer.firstChild as HTMLElement)?.className).toContain('text-xs')
            expect((mdContainer.firstChild as HTMLElement)?.className).toContain('text-sm')
        })
    })
})
