/**
 * Plan.Ex - Input Sanitization
 *
 * XSS ve injection saldırılarını önlemek için
 * kullanıcı girdilerini temizler.
 */

// ============================================
// HTML Sanitization
// ============================================

/**
 * HTML etiketlerini kaldır
 * Basit ve hızlı - complex HTML parsing gerektirmeyen durumlar için
 */
export function stripHtml(input: string): string {
    return input
        .replace(/<[^>]*>/g, '') // HTML etiketlerini kaldır
        .replace(/&nbsp;/g, ' ') // Non-breaking space'i normal space'e çevir
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .trim()
}

/**
 * HTML özel karakterlerini escape et
 * Güvenli render için
 */
export function escapeHtml(input: string): string {
    const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;',
    }

    return input.replace(/[&<>"'`=/]/g, char => escapeMap[char] || char)
}

// ============================================
// Text Sanitization
// ============================================

/**
 * Kullanıcı girdisini sanitize et
 * Activity/Habit isimleri, notlar vb. için kullan
 *
 * @example
 * const name = sanitizeText(userInput, { maxLength: 100 })
 */
export function sanitizeText(
    input: string,
    options: {
        maxLength?: number
        allowNewlines?: boolean
        trim?: boolean
    } = {}
): string {
    const { maxLength = 500, allowNewlines = false, trim = true } = options

    let result = input

    // HTML etiketlerini kaldır
    result = stripHtml(result)

    // Kontrol karakterlerini kaldır (newline hariç)
    if (allowNewlines) {
        // Sadece \n ve \r\n bırak, diğer kontrol karakterlerini kaldır
        // eslint-disable-next-line no-control-regex
        result = result.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
    } else {
        // Tüm kontrol karakterlerini kaldır
        // eslint-disable-next-line no-control-regex
        result = result.replace(/[\x00-\x1F\x7F]/g, ' ')
    }

    // Çoklu boşlukları tekle indir
    if (allowNewlines) {
        result = result.replace(/\s+/g, (match: string) => {
            // Newline varsa koru, diğer whitespace'leri tekle indir
            return match.includes('\n') ? '\n' : ' '
        })
    } else {
        result = result.replace(/\s+/g, ' ')
    }

    // Trim
    if (trim) {
        result = result.trim()
    }

    // Max length
    if (result.length > maxLength) {
        result = result.substring(0, maxLength)
    }

    return result
}

/**
 * Activity/Habit ismi için sanitize
 */
export function sanitizeName(input: string): string {
    return sanitizeText(input, {
        maxLength: 100,
        allowNewlines: false,
        trim: true,
    })
}

/**
 * Not/açıklama için sanitize
 */
export function sanitizeNote(input: string): string {
    return sanitizeText(input, {
        maxLength: 2000,
        allowNewlines: true,
        trim: true,
    })
}

// ============================================
// URL Sanitization
// ============================================

/**
 * URL'i güvenli hale getir
 * javascript: ve data: scheme'lerini engelle
 */
export function sanitizeUrl(url: string): string | null {
    const trimmed = url.trim().toLowerCase()

    // Tehlikeli scheme'leri engelle
    const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:']
    for (const scheme of dangerousSchemes) {
        if (trimmed.startsWith(scheme)) {
            return null
        }
    }

    // Sadece http/https/mailto izin ver
    const allowedSchemes = ['http://', 'https://', 'mailto:', '//', '/']
    const isAllowed = allowedSchemes.some(scheme => trimmed.startsWith(scheme))

    if (!isAllowed && !trimmed.startsWith('#')) {
        // Relative URL olabilir, başına / ekle
        return url.startsWith('/') ? url : `/${url}`
    }

    return url
}

// ============================================
// JSON Sanitization
// ============================================

/**
 * JSON parse ederken güvenli hale getir
 * Prototype pollution'ı önle
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        const parsed = JSON.parse(json)

        // Prototype pollution kontrolü
        if (typeof parsed === 'object' && parsed !== null) {
            const dangerous = ['__proto__', 'constructor', 'prototype']
            for (const key of dangerous) {
                if (key in parsed) {
                    delete parsed[key]
                }
            }
        }

        return parsed as T
    } catch {
        return fallback
    }
}

// ============================================
// Number Sanitization
// ============================================

/**
 * Sayısal değeri güvenli aralığa zorla
 */
export function clampNumber(
    value: number,
    min: number,
    max: number
): number {
    if (Number.isNaN(value)) return min
    return Math.max(min, Math.min(max, value))
}

/**
 * Kullanıcı girdisinden sayı parse et
 */
export function parseUserNumber(
    input: string,
    options: {
        min?: number
        max?: number
        defaultValue?: number
        allowDecimals?: boolean
    } = {}
): number {
    const {
        min = Number.MIN_SAFE_INTEGER,
        max = Number.MAX_SAFE_INTEGER,
        defaultValue = 0,
        allowDecimals = true,
    } = options

    // Sadece sayı ve nokta/virgül bırak
    let cleaned = input.replace(/[^\d.,-]/g, '')

    // Türkçe virgülü noktaya çevir
    cleaned = cleaned.replace(',', '.')

    // Parse
    const parsed = allowDecimals ? parseFloat(cleaned) : parseInt(cleaned, 10)

    if (Number.isNaN(parsed)) {
        return defaultValue
    }

    return clampNumber(parsed, min, max)
}

// ============================================
// ID Sanitization
// ============================================

/**
 * ID formatını doğrula ve temizle
 */
export function sanitizeId(input: string): string | null {
    // ID formatı: sadece alfanumerik, tire ve alt çizgi
    const cleaned = input.replace(/[^a-zA-Z0-9_-]/g, '')

    if (cleaned.length === 0 || cleaned.length > 50) {
        return null
    }

    return cleaned
}

// ============================================
// Form Data Sanitization
// ============================================

type SanitizeValue = string | number | boolean | null | undefined

/**
 * Form verilerini toplu sanitize et
 *
 * @example
 * const clean = sanitizeFormData(formData, {
 *   name: 'text',
 *   description: 'note',
 *   targetValue: 'number',
 *   enabled: 'boolean'
 * })
 */
export function sanitizeFormData<T extends Record<string, SanitizeValue>>(
    data: T,
    schema: Record<keyof T, 'text' | 'note' | 'number' | 'boolean' | 'id' | 'skip'>
): T {
    const result = { ...data }

    for (const [key, type] of Object.entries(schema)) {
        const value = result[key as keyof T]

        switch (type) {
            case 'text':
                if (typeof value === 'string') {
                    result[key as keyof T] = sanitizeName(value) as T[keyof T]
                }
                break

            case 'note':
                if (typeof value === 'string') {
                    result[key as keyof T] = sanitizeNote(value) as T[keyof T]
                }
                break

            case 'number':
                if (typeof value === 'string') {
                    result[key as keyof T] = parseUserNumber(value) as T[keyof T]
                } else if (typeof value === 'number') {
                    result[key as keyof T] = clampNumber(value, -999999, 999999) as T[keyof T]
                }
                break

            case 'boolean':
                result[key as keyof T] = Boolean(value) as T[keyof T]
                break

            case 'id':
                if (typeof value === 'string') {
                    result[key as keyof T] = (sanitizeId(value) || '') as T[keyof T]
                }
                break

            case 'skip':
                // Değiştirme
                break
        }
    }

    return result
}

// ============================================
// File Name Sanitization
// ============================================

/**
 * Dosya adını güvenli hale getir
 */
export function sanitizeFileName(name: string): string {
    // Tehlikeli karakterleri kaldır
    return name
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
        .replace(/\.\./g, '.')
        .trim()
        .substring(0, 255)
}
