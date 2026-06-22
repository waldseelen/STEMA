import React from 'react'
import InlineMath, { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface LatexRendererProps {
  text: string
}

export function LatexRenderer({ text }: LatexRendererProps) {
  if (!text) return null

  // 1. Split text into code blocks and normal text blocks
  // Code block pattern: ```[language]\n[content]```
  const tokens = text.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {tokens.map((token, index) => {
        if (token.startsWith('```')) {
          // Parse code block
          const match = token.match(/```(\w*)\n([\s\S]*?)```/)
          const lang = match ? match[1] : ''
          const code = match ? match[2] : token.slice(3, -3)
          return (
            <div key={index} className="my-3 rounded-lg border border-[var(--border-subtle)] bg-surface-200 p-4 font-mono text-xs overflow-x-auto relative group">
              {lang && (
                <div className="absolute top-2 right-2 text-[10px] text-text-muted font-sans uppercase font-semibold tracking-wider">
                  {lang}
                </div>
              )}
              <pre className="text-text-primary whitespace-pre">{code.trim()}</pre>
            </div>
          )
        } else {
          // Split by line to process block elements (headings, list items, block math, etc.)
          const lines = token.split(/\r?\n|\\n/)
          let listItems: React.ReactNode[] = []
          const elements: React.ReactNode[] = []

          const renderLineContent = (lineText: string, key: string | number) => {
            // Split by Block Math first: $$ ... $$
            const blockParts = lineText.split(/(\$\$.*?\$\$)/gs)

            return (
              <React.Fragment key={key}>
                {blockParts.map((part, i) => {
                  if (part.startsWith('$$') && part.endsWith('$$')) {
                    const math = part.slice(2, -2).trim()
                    return (
                      <div key={i} className="my-3 overflow-x-auto py-1 text-center">
                        <BlockMath math={math} />
                      </div>
                    )
                  }

                  // Split by Inline Math: $ ... $
                  const inlineParts = part.split(/(\$.*?\$)/g)
                  return (
                    <React.Fragment key={i}>
                      {inlineParts.map((subPart, j) => {
                        if (subPart.startsWith('$') && subPart.endsWith('$')) {
                          const math = subPart.slice(1, -1).trim()
                          return <InlineMath key={j} math={math} />
                        }

                        // Parse simple bold (**text**) and italic (*text*)
                        const boldParts = subPart.split(/(\*\*.*?\*\*)/g)
                        return (
                          <React.Fragment key={j}>
                            {boldParts.map((bPart, k) => {
                              if (bPart.startsWith('**') && bPart.endsWith('**')) {
                                return <strong key={k} className="font-bold text-text-primary">{bPart.slice(2, -2)}</strong>
                              }
                              const italicParts = bPart.split(/(\*.*?\*)/g)
                              return (
                                <React.Fragment key={k}>
                                  {italicParts.map((iPart, l) => {
                                    if (iPart.startsWith('*') && iPart.endsWith('*')) {
                                      return <em key={l} className="italic text-text-secondary">{iPart.slice(1, -1)}</em>
                                    }
                                    return iPart
                                  })}
                                </React.Fragment>
                              )
                            })}
                          </React.Fragment>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </React.Fragment>
            )
          }

          const flushList = (key: number) => {
            if (listItems.length > 0) {
              elements.push(
                <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1">
                  {listItems}
                </ul>
              )
              listItems = []
            }
          }

          lines.forEach((line, lineIdx) => {
            const trimmed = line.trim()
            if (trimmed.startsWith('# ')) {
              flushList(lineIdx)
              elements.push(<h1 key={lineIdx} className="text-xl font-bold text-text-primary mt-4 mb-2">{renderLineContent(trimmed.substring(2), lineIdx)}</h1>)
            } else if (trimmed.startsWith('## ')) {
              flushList(lineIdx)
              elements.push(<h2 key={lineIdx} className="text-lg font-bold text-text-primary mt-3 mb-1.5">{renderLineContent(trimmed.substring(3), lineIdx)}</h2>)
            } else if (trimmed.startsWith('### ')) {
              flushList(lineIdx)
              elements.push(<h3 key={lineIdx} className="text-base font-bold text-text-primary mt-2 mb-1">{renderLineContent(trimmed.substring(4), lineIdx)}</h3>)
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              listItems.push(<li key={lineIdx} className="text-text-secondary">{renderLineContent(trimmed.substring(2), lineIdx)}</li>)
            } else if (/^\d+\.\s/.test(trimmed)) {
              flushList(lineIdx)
              const match = trimmed.match(/^(\d+)\.\s(.*)/)
              const num = match ? match[1] : '1'
              const content = match ? match[2] : trimmed
              elements.push(
                <div key={lineIdx} className="flex gap-2 text-text-secondary my-1">
                  <span className="font-semibold text-status-violet">{num}.</span>
                  <div className="flex-1">{renderLineContent(content, lineIdx)}</div>
                </div>
              )
            } else if (trimmed === '') {
              flushList(lineIdx)
            } else {
              flushList(lineIdx)
              elements.push(<p key={lineIdx} className="text-text-secondary my-1.5 leading-relaxed">{renderLineContent(line, lineIdx)}</p>)
            }
          })

          flushList(lines.length)
          return <React.Fragment key={index}>{elements}</React.Fragment>
        }
      })}
    </div>
  )
}
