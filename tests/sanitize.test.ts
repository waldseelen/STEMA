import { describe, expect, it } from 'vitest'
import {
    clampNumber,
    escapeHtml,
    parseUserNumber,
    safeJsonParse,
    sanitizeFileName,
    sanitizeFormData,
    sanitizeId,
    sanitizeName,
    sanitizeNote,
    sanitizeText,
    sanitizeUrl,
    stripHtml,
} from '../src/shared/utils/sanitize'

describe('Sanitization Utilities', () => {
    describe('stripHtml', () => {
        it('should remove HTML tags', () => {
            expect(stripHtml('<p>Hello</p>')).toBe('Hello')
            expect(stripHtml('<script>alert("xss")</script>')).toBe('alert("xss")')
            expect(stripHtml('<a href="test">Link</a>')).toBe('Link')
        })

        it('should decode HTML entities', () => {
            expect(stripHtml('&amp; &lt; &gt;')).toBe('& < >')
            expect(stripHtml('&quot;test&quot;')).toBe('"test"')
        })

        it('should handle nested tags', () => {
            expect(stripHtml('<div><p><span>Text</span></p></div>')).toBe('Text')
        })
    })

    describe('escapeHtml', () => {
        it('should escape special characters', () => {
            expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
            expect(escapeHtml('"test"')).toBe('&quot;test&quot;')
            expect(escapeHtml("'test'")).toBe('&#039;test&#039;')
        })

        it('should handle ampersands', () => {
            expect(escapeHtml('A & B')).toBe('A &amp; B')
        })
    })

    describe('sanitizeText', () => {
        it('should trim whitespace', () => {
            expect(sanitizeText('  hello  ')).toBe('hello')
        })

        it('should remove HTML', () => {
            expect(sanitizeText('<b>bold</b>')).toBe('bold')
        })

        it('should respect maxLength', () => {
            const long = 'a'.repeat(200)
            expect(sanitizeText(long, { maxLength: 100 })).toHaveLength(100)
        })

        it('should collapse multiple spaces', () => {
            expect(sanitizeText('hello    world')).toBe('hello world')
        })

        it('should handle newlines based on option', () => {
            const text = 'line1\nline2'
            expect(sanitizeText(text, { allowNewlines: true })).toBe('line1\nline2')
            expect(sanitizeText(text, { allowNewlines: false })).toBe('line1 line2')
        })

        it('should remove control characters', () => {
            expect(sanitizeText('hello\x00world')).toBe('hello world')
        })
    })

    describe('sanitizeName', () => {
        it('should sanitize activity/habit names', () => {
            expect(sanitizeName('  <b>Work</b>  ')).toBe('Work')
            expect(sanitizeName('Test\nName')).toBe('Test Name')
        })

        it('should enforce 100 char limit', () => {
            const long = 'a'.repeat(150)
            expect(sanitizeName(long)).toHaveLength(100)
        })
    })

    describe('sanitizeNote', () => {
        it('should allow newlines in notes', () => {
            expect(sanitizeNote('Line 1\nLine 2')).toBe('Line 1\nLine 2')
        })

        it('should enforce 2000 char limit', () => {
            const long = 'a'.repeat(2500)
            expect(sanitizeNote(long)).toHaveLength(2000)
        })
    })

    describe('sanitizeUrl', () => {
        it('should allow safe URLs', () => {
            expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
            expect(sanitizeUrl('http://localhost:3000')).toBe('http://localhost:3000')
            expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page')
        })

        it('should block javascript: URLs', () => {
            expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
            expect(sanitizeUrl('JAVASCRIPT:void(0)')).toBeNull()
        })

        it('should block data: URLs', () => {
            expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
        })

        it('should handle relative URLs', () => {
            expect(sanitizeUrl('page.html')).toBe('/page.html')
        })
    })

    describe('safeJsonParse', () => {
        it('should parse valid JSON', () => {
            expect(safeJsonParse('{"a": 1}', {})).toEqual({ a: 1 })
            expect(safeJsonParse('[1, 2, 3]', [])).toEqual([1, 2, 3])
        })

        it('should return fallback for invalid JSON', () => {
            expect(safeJsonParse('invalid', { default: true })).toEqual({ default: true })
            expect(safeJsonParse('', [])).toEqual([])
        })

        it('should remove prototype pollution keys', () => {
            const result = safeJsonParse('{"__proto__": {"admin": true}}', {})
            // After deletion, accessing __proto__ returns the default Object prototype
            expect(Object.hasOwn(result, '__proto__')).toBe(false)
        })
    })

    describe('parseUserNumber', () => {
        it('should parse valid numbers', () => {
            expect(parseUserNumber('42')).toBe(42)
            expect(parseUserNumber('3.14')).toBe(3.14)
            expect(parseUserNumber('-10')).toBe(-10)
        })

        it('should handle Turkish comma', () => {
            expect(parseUserNumber('3,14')).toBe(3.14)
        })

        it('should return default for invalid input', () => {
            expect(parseUserNumber('abc', { defaultValue: 0 })).toBe(0)
            expect(parseUserNumber('', { defaultValue: 5 })).toBe(5)
        })

        it('should clamp to min/max', () => {
            expect(parseUserNumber('150', { min: 0, max: 100 })).toBe(100)
            expect(parseUserNumber('-50', { min: 0, max: 100 })).toBe(0)
        })

        it('should handle allowDecimals option', () => {
            expect(parseUserNumber('3.7', { allowDecimals: false })).toBe(3)
        })
    })

    describe('clampNumber', () => {
        it('should clamp values to range', () => {
            expect(clampNumber(50, 0, 100)).toBe(50)
            expect(clampNumber(150, 0, 100)).toBe(100)
            expect(clampNumber(-50, 0, 100)).toBe(0)
        })

        it('should handle NaN', () => {
            expect(clampNumber(NaN, 0, 100)).toBe(0)
        })
    })

    describe('sanitizeId', () => {
        it('should allow valid IDs', () => {
            expect(sanitizeId('abc-123_XYZ')).toBe('abc-123_XYZ')
            expect(sanitizeId('id_001')).toBe('id_001')
        })

        it('should remove invalid characters', () => {
            expect(sanitizeId('id<script>')).toBe('idscript')
            expect(sanitizeId('id with spaces')).toBe('idwithspaces')
        })

        it('should return null for empty or too long', () => {
            expect(sanitizeId('')).toBeNull()
            expect(sanitizeId('a'.repeat(60))).toBeNull()
        })
    })

    describe('sanitizeFormData', () => {
        it('should sanitize form fields based on schema', () => {
            const data = {
                name: '  <b>Test</b>  ',
                description: 'Line 1\nLine 2',
                count: '42',
                enabled: 'true',
            }

            const result = sanitizeFormData(data, {
                name: 'text',
                description: 'note',
                count: 'number',
                enabled: 'boolean',
            })

            expect(result.name).toBe('Test')
            expect(result.description).toBe('Line 1\nLine 2')
            expect(result.count).toBe(42)
            expect(result.enabled).toBe(true)
        })

        it('should skip fields marked as skip', () => {
            const data = { raw: '<script>test</script>' }
            const result = sanitizeFormData(data, { raw: 'skip' })
            expect(result.raw).toBe('<script>test</script>')
        })
    })

    describe('sanitizeFileName', () => {
        it('should remove dangerous characters', () => {
            expect(sanitizeFileName('file<name>.txt')).toBe('filename.txt')
            expect(sanitizeFileName('path/to/file')).toBe('pathtofile')
            expect(sanitizeFileName('file:name')).toBe('filename')
        })

        it('should prevent directory traversal', () => {
            expect(sanitizeFileName('../../../etc/passwd')).toBe('...etcpasswd')
            // Backslash is removed by the sanitizer
            const result = sanitizeFileName('..\\..\\windows')
            expect(result).not.toContain('\\')
        })

        it('should limit length', () => {
            const long = 'a'.repeat(300) + '.txt'
            expect(sanitizeFileName(long).length).toBeLessThanOrEqual(255)
        })
    })
})
