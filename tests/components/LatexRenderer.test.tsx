import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LatexRenderer } from '../../src/modules/learn/components/LatexRenderer'

describe('LatexRenderer', () => {
  it('should render null when no text is provided', () => {
    const { container } = render(<LatexRenderer text="" />)
    expect(container.firstChild).toBeNull()
  })

  it('should render standard paragraph text', () => {
    render(<LatexRenderer text="Merhaba Dünya!" />)
    expect(screen.getByText('Merhaba Dünya!')).toBeInTheDocument()
  })

  it('should render bold text', () => {
    render(<LatexRenderer text="Bu **kalın** yazı." />)
    const boldEl = screen.getByText('kalın')
    expect(boldEl.tagName).toBe('STRONG')
  })

  it('should render headings', () => {
    render(<LatexRenderer text="# Başlık 1\n## Başlık 2" />)
    expect(screen.getByText('Başlık 1').tagName).toBe('H1')
    expect(screen.getByText('Başlık 2').tagName).toBe('H2')
  })

  it('should render list items', () => {
    render(<LatexRenderer text="- Madde A\n- Madde B" />)
    expect(screen.getByText('Madde A').tagName).toBe('LI')
    expect(screen.getByText('Madde B').tagName).toBe('LI')
  })

  it('should render code blocks', () => {
    const codeText = '```javascript\nconst a = 5;\nconsole.log(a);\n```'
    const { container } = render(<LatexRenderer text={codeText} />)
    expect(container.querySelector('.font-mono')).toBeInTheDocument()
    expect(screen.getByText('javascript')).toBeInTheDocument()
    expect(container.querySelector('pre')?.textContent).toContain('const a = 5;')
  })
})
