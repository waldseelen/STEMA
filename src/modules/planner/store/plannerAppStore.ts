/**
 * Planner App Store - Zustand
 *
 * Toast ve modal yönetimi için.
 * AppContext yerine Zustand store kullanılıyor.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppSettings, DEFAULT_APP_SETTINGS, Toast } from '../types'

// ================== HELPERS ==================

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ================== TYPES ==================

interface PlannerAppState {
    // Settings (planner-specific)
    settings: AppSettings

    // UI State
    toasts: Toast[]
    isSearchOpen: boolean
    isSettingsOpen: boolean

    // Backup
    backupWarning: boolean
}

interface PlannerAppActions {
    // Settings
    updateSettings: (updates: Partial<AppSettings>) => void

    // Theme
    toggleTheme: () => void
    getIsDarkMode: () => boolean

    // Toasts
    addToast: (type: Toast['type'], message: string, duration?: number) => void
    removeToast: (id: string) => void

    // Modals
    setIsSearchOpen: (open: boolean) => void
    setIsSettingsOpen: (open: boolean) => void

    // Backup
    setBackupWarning: (warning: boolean) => void
    checkBackupWarning: () => void
}

type PlannerAppStore = PlannerAppState & PlannerAppActions

const initialState: PlannerAppState = {
    settings: DEFAULT_APP_SETTINGS,
    toasts: [],
    isSearchOpen: false,
    isSettingsOpen: false,
    backupWarning: false,
}

export const usePlannerAppStore = create<PlannerAppStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            updateSettings: (updates) => {
                set(state => ({
                    settings: { ...state.settings, ...updates },
                }))
            },

            toggleTheme: () => {
                const { settings } = get()
                const isDark = settings.theme === 'dark' ||
                    (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                const newTheme = isDark ? 'light' : 'dark'
                set(state => ({
                    settings: { ...state.settings, theme: newTheme },
                }))
            },

            getIsDarkMode: () => {
                const { settings } = get()
                if (settings.theme === 'system') {
                    return window.matchMedia('(prefers-color-scheme: dark)').matches
                }
                return settings.theme === 'dark'
            },

            addToast: (type, message, duration = 4000) => {
                const toast: Toast = {
                    id: generateId(),
                    type,
                    message,
                    duration,
                }

                set(state => ({
                    toasts: [...state.toasts, toast],
                }))

                if (duration > 0) {
                    setTimeout(() => {
                        set(state => ({
                            toasts: state.toasts.filter(t => t.id !== toast.id),
                        }))
                    }, duration)
                }
            },

            removeToast: (id) => {
                set(state => ({
                    toasts: state.toasts.filter(t => t.id !== id),
                }))
            },

            setIsSearchOpen: (open) => {
                set({ isSearchOpen: open })
            },

            setIsSettingsOpen: (open) => {
                set({ isSettingsOpen: open })
            },

            setBackupWarning: (warning) => {
                set({ backupWarning: warning })
            },

            checkBackupWarning: () => {
                const { settings } = get()
                const now = Date.now()
                const lastWarningTime = settings.lastBackupWarningISO
                    ? new Date(settings.lastBackupWarningISO).getTime()
                    : 0
                const isWarningCooldownOver = !lastWarningTime ||
                    Number.isNaN(lastWarningTime) ||
                    (now - lastWarningTime) >= (1000 * 60 * 60 * 24)
                let needsBackupWarning = false
                if (settings.lastBackupISO) {
                    const lastBackup = new Date(settings.lastBackupISO)
                    const daysSinceBackup = Math.floor(
                        (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24)
                    )
                    needsBackupWarning = daysSinceBackup >= 7
                } else {
                    needsBackupWarning = true
                }
                set({ backupWarning: needsBackupWarning && isWarningCooldownOver })
            },
        }),
        {
            name: 'lifeflow-planner-app',
            version: 1,
            partialize: (state) => ({
                settings: state.settings,
            }),
        }
    )
)

// ================== HOOKS ==================

export function usePlannerApp() {
    const store = usePlannerAppStore()
    const isDarkMode = store.getIsDarkMode()
    return { ...store, isDarkMode }
}
