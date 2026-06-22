import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
    theme: Theme
    resolvedTheme: 'light' | 'dark'
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

interface ThemeProviderProps {
    children: ReactNode
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const getCookie = (name: string) => {
            if (typeof document === 'undefined') return null
            const value = `; ${document.cookie}`
            const parts = value.split(`; ${name}=`)
            if (parts.length === 2) return parts.pop()?.split(';').shift()
            return null
        }
        const cookieTheme = getCookie('lifeflow-theme')
        if (cookieTheme === 'light' || cookieTheme === 'dark' || cookieTheme === 'system') {
            return cookieTheme as Theme
        }
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('lifeflow-theme')
            if (stored === 'light' || stored === 'dark' || stored === 'system') {
                return stored
            }
        }
        return 'system'
    })

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        const root = document.documentElement

        const updateResolvedTheme = () => {
            let resolved: 'light' | 'dark'

            if (theme === 'system') {
                resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light'
            } else {
                resolved = theme
            }

            setResolvedTheme(resolved)

            if (resolved === 'dark') {
                root.classList.add('dark')
            } else {
                root.classList.remove('dark')
            }
        }

        updateResolvedTheme()

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        mediaQuery.addEventListener('change', updateResolvedTheme)

        return () => {
            mediaQuery.removeEventListener('change', updateResolvedTheme)
        }
    }, [theme])

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme)
        localStorage.setItem('lifeflow-theme', newTheme)
        if (typeof document !== 'undefined') {
            document.cookie = `lifeflow-theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`
        }
    }, [])

    // Memoize context value to prevent unnecessary re-renders of consumers
    const contextValue = useMemo<ThemeContextValue>(
        () => ({ theme, resolvedTheme, setTheme }),
        [theme, resolvedTheme, setTheme]
    )

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    )
}
