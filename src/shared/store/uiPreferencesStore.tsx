import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================
// UI Preferences Store
// ============================================

type ViewMode = 'compact' | 'detailed'
type DashboardWidget = 'runningTimers' | 'todayHabits' | 'quickStats' | 'recentSessions' | 'heatmap'

interface UIPreferencesState {
    // View modes
    habitsViewMode: ViewMode
    activitiesViewMode: ViewMode
    sessionsViewMode: ViewMode

    // Dashboard layout
    dashboardWidgetOrder: DashboardWidget[]
    hiddenDashboardWidgets: DashboardWidget[]

    // Actions
    setHabitsViewMode: (mode: ViewMode) => void
    setActivitiesViewMode: (mode: ViewMode) => void
    setSessionsViewMode: (mode: ViewMode) => void
    setDashboardWidgetOrder: (order: DashboardWidget[]) => void
    toggleDashboardWidget: (widget: DashboardWidget) => void
    resetToDefaults: () => void
}

const defaultWidgetOrder: DashboardWidget[] = [
    'runningTimers',
    'todayHabits',
    'quickStats',
    'recentSessions',
    'heatmap',
]

export const useUIPreferencesStore = create<UIPreferencesState>()(
    persist(
        (set) => ({
            // Initial states
            habitsViewMode: 'detailed',
            activitiesViewMode: 'detailed',
            sessionsViewMode: 'compact',
            dashboardWidgetOrder: defaultWidgetOrder,
            hiddenDashboardWidgets: [],

            // Actions
            setHabitsViewMode: (mode) => set({ habitsViewMode: mode }),
            setActivitiesViewMode: (mode) => set({ activitiesViewMode: mode }),
            setSessionsViewMode: (mode) => set({ sessionsViewMode: mode }),

            setDashboardWidgetOrder: (order) => set({ dashboardWidgetOrder: order }),

            toggleDashboardWidget: (widget) =>
                set((state) => {
                    const isHidden = state.hiddenDashboardWidgets.includes(widget)
                    return {
                        hiddenDashboardWidgets: isHidden
                            ? state.hiddenDashboardWidgets.filter((w) => w !== widget)
                            : [...state.hiddenDashboardWidgets, widget],
                    }
                }),

            resetToDefaults: () =>
                set({
                    habitsViewMode: 'detailed',
                    activitiesViewMode: 'detailed',
                    sessionsViewMode: 'compact',
                    dashboardWidgetOrder: defaultWidgetOrder,
                    hiddenDashboardWidgets: [],
                }),
        }),
        {
            name: 'lifeflow-ui-preferences',
        }
    )
)

// ============================================
// View Mode Toggle Component
// ============================================

import { clsx } from 'clsx'
import { ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline'

interface ViewModeToggleProps {
    value: ViewMode
    onChange: (mode: ViewMode) => void
    className?: string
}

export function ViewModeToggle({ value, onChange, className }: ViewModeToggleProps) {
    return (
        <div className={clsx('flex items-center gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-800', className)}>
            <button
                onClick={() => onChange('compact')}
                className={clsx(
                    'p-2 rounded-lg transition-all duration-200',
                    value === 'compact'
                        ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400'
                        : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                )}
                title="Kompakt Görünüm"
            >
                <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
                onClick={() => onChange('detailed')}
                className={clsx(
                    'p-2 rounded-lg transition-all duration-200',
                    value === 'detailed'
                        ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600 dark:text-primary-400'
                        : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                )}
                title="Detaylı Görünüm"
            >
                <Squares2X2Icon className="w-4 h-4" />
            </button>
        </div>
    )
}
