import { useCallback, useEffect } from 'react'

interface ShortcutConfig {
    key: string
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    action: () => void
    description: string
    /** Input alanlarında da çalışsın mı */
    allowInInput?: boolean
}

interface UseKeyboardShortcutsOptions {
    shortcuts: ShortcutConfig[]
    enabled?: boolean
}

/**
 * Klavye kısayolları hook'u
 * Masaüstü kullanıcıları için Space (Timer), N (Yeni), Esc (Kapat) gibi kısayollar
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return

            // Input, textarea veya contenteditable içindeyse varsayılan olarak atla
            const target = event.target as HTMLElement
            const isInputField =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable

            for (const shortcut of shortcuts) {
                // Input alanlarında çalışmasını istemiyorsak atla
                if (isInputField && !shortcut.allowInInput) continue

                const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
                const ctrlMatches = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
                const altMatches = shortcut.alt ? event.altKey : !event.altKey
                const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey

                if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
                    event.preventDefault()
                    shortcut.action()
                    break
                }
            }
        },
        [shortcuts, enabled]
    )

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}

/**
 * Varsayılan uygulama kısayolları
 */
export const defaultShortcuts = {
    TOGGLE_TIMER: { key: ' ', description: 'Timer Başlat/Durdur' },
    NEW_RECORD: { key: 'n', description: 'Yeni Kayıt' },
    CLOSE_MODAL: { key: 'Escape', description: 'Modalı Kapat', allowInInput: true },
    SEARCH: { key: 'k', ctrl: true, description: 'Ara' },
    SETTINGS: { key: ',', ctrl: true, description: 'Ayarlar' },
    UNDO: { key: 'z', ctrl: true, description: 'Geri Al', allowInInput: true },
    REDO: { key: 'y', ctrl: true, description: 'Yinele', allowInInput: true },
} as const

/**
 * Kısayol tuşunu görüntülenebilir forma çevirir
 */
export function formatShortcutKey(shortcut: ShortcutConfig): string {
    const parts: string[] = []

    if (shortcut.ctrl) parts.push('Ctrl')
    if (shortcut.alt) parts.push('Alt')
    if (shortcut.shift) parts.push('Shift')

    // Özel tuşları güzelleştir
    let key = shortcut.key
    switch (key) {
        case ' ':
            key = 'Space'
            break
        case 'Escape':
            key = 'Esc'
            break
        case 'ArrowUp':
            key = '↑'
            break
        case 'ArrowDown':
            key = '↓'
            break
        case 'ArrowLeft':
            key = '←'
            break
        case 'ArrowRight':
            key = '→'
            break
        default:
            key = key.toUpperCase()
    }

    parts.push(key)
    return parts.join(' + ')
}
