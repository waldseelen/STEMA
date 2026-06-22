// Common OCR-to-LaTeX error patterns and their corrections
type Correction = [RegExp, string] | [RegExp, (match: string, ...args: string[]) => string]
const CORRECTIONS: Correction[] = [
  // Escape sequences: raw backslash should be \\ in strings, but OCR often drops one
  [/(?<!\\)\\(?![\\{}[\]()$^_#&%])/g, '\\\\'],

  // Integral bounds: OCR often writes \int_{a}^{b} as \int_a^b or with wrong braces
  [/\\int_(\w+)\^(\w+)/g, '\\int_{$1}^{$2}'],
  [/\\sum_(\w+)\^(\w+)/g, '\\sum_{$1}^{$2}'],
  [/\\lim_(\w+)/g, '\\lim_{$1}'],

  // Limit arrows: \to -> \to (already fine), but OCR sometimes writes ->
  [/->|→/g, '\\to'],
  [/=>|⇒/g, '\\Rightarrow'],

  // Fractions: OCR sometimes writes a/b instead of \frac{a}{b}
  [/(\w+)\/(\w+)/g, (m: string, a: string, b: string) => {
    if (/^\\/.test(a) || /^\\/.test(b)) return m
    if (/\d/.test(a) && /\d/.test(b)) return `\\frac{${a}}{${b}}`
    return m
  }],

  // Greek letter common OCR mistakes
  [/α/g, '\\alpha'],
  [/β/g, '\\beta'],
  [/γ/g, '\\gamma'],
  [/δ/g, '\\delta'],
  [/ε/g, '\\epsilon'],
  [/θ/g, '\\theta'],
  [/π/g, '\\pi'],
  [/σ/g, '\\sigma'],
  [/φ/g, '\\phi'],
  [/ω/g, '\\omega'],
  [/Δ/g, '\\Delta'],
  [/Σ/g, '\\Sigma'],
  [/Ω/g, '\\Omega'],

  // Derivative notation: d/dx -> \frac{d}{dx}
  [/(\w+)\s*'\s*\(/g, (m: string, f: string) => `${f}'(`],
  [/(?<!\\)d\/(dx|dy|dz|dt)/g, '\\frac{d}{$1}'],
  [/(?<!\\)d\^2\/(dx\^2)/g, '\\frac{d^2}{$1}'],

  // Remove redundant curly braces
  [/\{\}/g, ''],

  // Fix mismatched braces (simple cases)
  [/\{(\w+)\s+(\w+)\}/g, '{$1}_{$2}'],

  // Superscript and subscript: OCR often writes x2 as x^2 or x_2
  [/([a-zA-Z])\s*\^\s*(\d)/g, '$1^{$2}'],
  [/([a-zA-Z])\s*_\s*(\d)/g, '_{$1}$2'],

  // Fix common LaTeX command typos
  [/\balpha\b/g, '\\alpha'],
  [/\bbeta\b/g, '\\beta'],
  [/\bgamma\b/g, '\\gamma'],
  [/\bdelta\b/g, '\\delta'],
  [/\bepsilon\b/g, '\\epsilon'],
  [/\btheta\b/g, '\\theta'],
  [/\brightarrow\b/g, '\\rightarrow'],
  [/\bleftarrow\b/g, '\\leftarrow'],
  [/\binfty\b/g, '\\infty'],
  [/\bsqrt\b/g, '\\sqrt'],
  [/\bfrac\b/g, '\\frac'],
  [/\bint\b/g, '\\int'],
  [/\bsum\b/g, '\\sum'],
  [/\blim\b/g, '\\lim'],
  [/\bpartial\b/g, '\\partial'],

  // Degree symbol
  [/°/g, '^{\\circ}'],
]

export interface OcrCleanResult {
  cleaned: string
  changes: number
}

export function cleanLatex(raw: string): OcrCleanResult {
  let cleaned = raw.trim()
  let changes = 0

  // Remove markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json|latex)?\s*/gi, '').replace(/```\s*$/g, '').trim()

  for (const [pattern, replacement] of CORRECTIONS) {
    const before = cleaned
    cleaned = cleaned.replace(pattern, replacement as any)
    if (before !== cleaned) changes++
  }

  return { cleaned, changes }
}

export function isLatexExpression(text: string): boolean {
  return /\\[a-zA-Z]+/.test(text) || /\$\$.+\$\$/.test(text) || /\$.+\$/.test(text)
}
