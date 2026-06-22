// Vitest setup file
import '@testing-library/jest-dom'
import { afterEach, beforeEach, vi } from 'vitest'

// Mock IndexedDB for tests
import 'fake-indexeddb/auto'

function ensureLocalStorage() {
    const storage = globalThis.localStorage as Storage & {
        _store?: Record<string, string>
        getItem?: (key: string) => string | null
        setItem?: (key: string, value: string) => void
        removeItem?: (key: string) => void
        clear?: () => void
        key?: (index: number) => string | null
        length?: number
    }

    if (typeof storage.getItem === 'function' &&
        typeof storage.setItem === 'function' &&
        typeof storage.removeItem === 'function' &&
        typeof storage.clear === 'function') {
        return storage
    }

    const fallbackStore: Record<string, string> = {}
    const fallback: Storage = {
        getItem: (key: string) => fallbackStore[key] ?? null,
        setItem: (key: string, value: string) => { fallbackStore[key] = value },
        removeItem: (key: string) => { delete fallbackStore[key] },
        clear: () => {
            Object.keys(fallbackStore).forEach((key) => delete fallbackStore[key])
        },
        key: (index: number) => Object.keys(fallbackStore)[index] ?? null,
        get length() {
            return Object.keys(fallbackStore).length
        },
    }

    vi.stubGlobal('localStorage', fallback)

    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: fallback,
    })

    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            value: fallback,
        })
    }

    return fallback
}

ensureLocalStorage()

function ensureMatchMedia() {
    const matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }))

    vi.stubGlobal('matchMedia', matchMedia)

    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: matchMedia,
        })
    }
}

ensureMatchMedia()

function ensureIntersectionObserver() {
    class MockIntersectionObserver implements IntersectionObserver {
        readonly root = null
        readonly rootMargin = ''
        readonly thresholds = []

        disconnect() {}

        observe() {}

        takeRecords(): IntersectionObserverEntry[] {
            return []
        }

        unobserve() {}
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'IntersectionObserver', {
            configurable: true,
            value: MockIntersectionObserver,
        })
    }
}

ensureIntersectionObserver()

beforeEach(() => {
    ensureLocalStorage().setItem('planex-locale', 'tr')
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('tr-TR')
    ensureMatchMedia()
    ensureIntersectionObserver()
})

afterEach(() => {
    vi.restoreAllMocks()
    ensureLocalStorage().clear()
})
