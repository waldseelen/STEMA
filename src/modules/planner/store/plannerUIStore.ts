/**
 * Planner UI Store
 *
 * Sadece UI state'i tutar. Entity CRUD işlemleri Dexie üzerinden yapılır.
 *
 * Bu store şunları yönetir:
 * - Selection state (selectedCourseId, selectedUnitId, etc.)
 * - Modal state (hangi modal açık, modal payload)
 * - Calendar view state (currentMonth, selectedDay)
 * - UI filters & sort preferences
 * - Undo stack (session-only, persist yok)
 */

import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'

// ============================================
// Types
// ============================================

export type ModalType =
    | 'course-create'
    | 'course-edit'
    | 'unit-create'
    | 'unit-edit'
    | 'task-create'
    | 'task-edit'
    | 'event-create'
    | 'event-edit'
    | 'personal-task-create'
    | 'personal-task-edit'
    | 'habit-create'
    | 'habit-edit'
    | 'confirm-delete'
    | 'quick-action'
    | null

export interface ModalPayload {
    /** Entity ID for edit modals */
    entityId?: string
    /** Parent IDs for nested entities */
    courseId?: string
    unitId?: string
    /** Pre-filled data */
    defaultValues?: Record<string, unknown>
    /** Confirmation message for delete modals */
    confirmMessage?: string
    /** Callback after confirm */
    onConfirm?: () => void | Promise<void>
}

export type TaskFilterStatus = 'all' | 'todo' | 'in-progress' | 'done'
export type TaskSortBy = 'order' | 'dueDate' | 'priority' | 'status'
export type TaskSortOrder = 'asc' | 'desc'

export interface TaskFilters {
    status: TaskFilterStatus
    hasDueDate: 'all' | 'yes' | 'no'
    isPriority: 'all' | 'yes' | 'no'
}

export interface TaskSort {
    by: TaskSortBy
    order: TaskSortOrder
}

export interface CalendarViewState {
    /** Current month being viewed */
    currentMonth: Date
    /** Selected day (for showing day details) */
    selectedDay: string | null
    /** View mode */
    viewMode: 'month' | 'week'
}

export interface UndoAction {
    type: 'task-complete' | 'task-delete' | 'event-delete' | 'habit-log'
    timestamp: number
    payload: Record<string, unknown>
    /** Undo function */
    undo: () => Promise<void>
}

// ============================================
// State Interface
// ============================================

interface PlannerUIState {
    // Selection
    selectedCourseId: string | null
    selectedUnitId: string | null
    selectedTaskId: string | null
    selectedEventId: string | null
    selectedHabitId: string | null

    // Modal
    activeModal: ModalType
    modalPayload: ModalPayload | null

    // Calendar
    calendarView: CalendarViewState

    // Filters & Sort
    taskFilters: TaskFilters
    taskSort: TaskSort

    // Undo (session-only)
    undoStack: UndoAction[]

    // UI State
    sidebarCollapsed: boolean
    rightPanelOpen: boolean
    isInitialized: boolean
}

interface PlannerUIActions {
    // Initialize
    initialize: () => void

    // Selection
    selectCourse: (id: string | null) => void
    selectUnit: (id: string | null) => void
    selectTask: (id: string | null) => void
    selectEvent: (id: string | null) => void
    selectHabit: (id: string | null) => void
    clearSelection: () => void

    // Modal
    openModal: (type: ModalType, payload?: ModalPayload) => void
    closeModal: () => void

    // Calendar
    setCalendarMonth: (date: Date) => void
    selectCalendarDay: (dateISO: string | null) => void
    setCalendarViewMode: (mode: 'month' | 'week') => void
    goToPreviousMonth: () => void
    goToNextMonth: () => void
    goToToday: () => void

    // Filters & Sort
    setTaskFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void
    setTaskSort: (sort: Partial<TaskSort>) => void
    resetFilters: () => void

    // Undo
    pushUndo: (action: Omit<UndoAction, 'timestamp'>) => void
    popUndo: () => UndoAction | undefined
    executeUndo: () => Promise<boolean>
    clearUndoStack: () => void

    // UI
    toggleSidebar: () => void
    setSidebarCollapsed: (collapsed: boolean) => void
    toggleRightPanel: () => void
    setRightPanelOpen: (open: boolean) => void
}

type PlannerUIStore = PlannerUIState & PlannerUIActions

// ============================================
// Default Values
// ============================================

const defaultCalendarView: CalendarViewState = {
    currentMonth: new Date(),
    selectedDay: null,
    viewMode: 'month',
}

const defaultTaskFilters: TaskFilters = {
    status: 'all',
    hasDueDate: 'all',
    isPriority: 'all',
}

const defaultTaskSort: TaskSort = {
    by: 'order',
    order: 'asc',
}

const initialState: PlannerUIState = {
    selectedCourseId: null,
    selectedUnitId: null,
    selectedTaskId: null,
    selectedEventId: null,
    selectedHabitId: null,
    activeModal: null,
    modalPayload: null,
    calendarView: defaultCalendarView,
    taskFilters: defaultTaskFilters,
    taskSort: defaultTaskSort,
    undoStack: [],
    sidebarCollapsed: false,
    rightPanelOpen: false,
    isInitialized: false,
}

// ============================================
// Store
// ============================================

const MAX_UNDO_STACK = 20

export const usePlannerUIStore = create<PlannerUIStore>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                ...initialState,

                // ================== Initialize ==================
                initialize: () => {
                    set({ isInitialized: true })
                },

                // ================== Selection ==================
                selectCourse: (id) => {
                    set({
                        selectedCourseId: id,
                        selectedUnitId: null,
                        selectedTaskId: null,
                    })
                },

                selectUnit: (id) => {
                    set({
                        selectedUnitId: id,
                        selectedTaskId: null,
                    })
                },

                selectTask: (id) => {
                    set({ selectedTaskId: id })
                },

                selectEvent: (id) => {
                    set({ selectedEventId: id })
                },

                selectHabit: (id) => {
                    set({ selectedHabitId: id })
                },

                clearSelection: () => {
                    set({
                        selectedCourseId: null,
                        selectedUnitId: null,
                        selectedTaskId: null,
                        selectedEventId: null,
                        selectedHabitId: null,
                    })
                },

                // ================== Modal ==================
                openModal: (type, payload = undefined) => {
                    set({ activeModal: type, modalPayload: payload })
                },

                closeModal: () => {
                    set({ activeModal: null, modalPayload: null })
                },

                // ================== Calendar ==================
                setCalendarMonth: (date) => {
                    set(state => ({
                        calendarView: {
                            ...state.calendarView,
                            currentMonth: date,
                        },
                    }))
                },

                selectCalendarDay: (dateISO) => {
                    set(state => ({
                        calendarView: {
                            ...state.calendarView,
                            selectedDay: dateISO,
                        },
                    }))
                },

                setCalendarViewMode: (mode) => {
                    set(state => ({
                        calendarView: {
                            ...state.calendarView,
                            viewMode: mode,
                        },
                    }))
                },

                goToPreviousMonth: () => {
                    set(state => {
                        const current = state.calendarView.currentMonth
                        const prev = new Date(current.getFullYear(), current.getMonth() - 1, 1)
                        return {
                            calendarView: {
                                ...state.calendarView,
                                currentMonth: prev,
                            },
                        }
                    })
                },

                goToNextMonth: () => {
                    set(state => {
                        const current = state.calendarView.currentMonth
                        const next = new Date(current.getFullYear(), current.getMonth() + 1, 1)
                        return {
                            calendarView: {
                                ...state.calendarView,
                                currentMonth: next,
                            },
                        }
                    })
                },

                goToToday: () => {
                    const today = new Date()
                    set(state => ({
                        calendarView: {
                            ...state.calendarView,
                            currentMonth: today,
                            selectedDay: today.toISOString().split('T')[0],
                        },
                    }))
                },

                // ================== Filters & Sort ==================
                setTaskFilter: (key, value) => {
                    set(state => ({
                        taskFilters: {
                            ...state.taskFilters,
                            [key]: value,
                        },
                    }))
                },

                setTaskSort: (sort) => {
                    set(state => ({
                        taskSort: {
                            ...state.taskSort,
                            ...sort,
                        },
                    }))
                },

                resetFilters: () => {
                    set({
                        taskFilters: defaultTaskFilters,
                        taskSort: defaultTaskSort,
                    })
                },

                // ================== Undo ==================
                pushUndo: (action) => {
                    set(state => ({
                        undoStack: [
                            ...state.undoStack.slice(-MAX_UNDO_STACK + 1),
                            { ...action, timestamp: Date.now() },
                        ],
                    }))
                },

                popUndo: () => {
                    const state = get()
                    if (state.undoStack.length === 0) return undefined

                    const action = state.undoStack[state.undoStack.length - 1]
                    set({ undoStack: state.undoStack.slice(0, -1) })
                    return action
                },

                executeUndo: async () => {
                    const action = get().popUndo()
                    if (!action) return false

                    try {
                        await action.undo()
                        return true
                    } catch (error) {
                        console.error('[PlannerUI] Undo failed:', error)
                        return false
                    }
                },

                clearUndoStack: () => {
                    set({ undoStack: [] })
                },

                // ================== UI ==================
                toggleSidebar: () => {
                    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }))
                },

                setSidebarCollapsed: (collapsed) => {
                    set({ sidebarCollapsed: collapsed })
                },

                toggleRightPanel: () => {
                    set(state => ({ rightPanelOpen: !state.rightPanelOpen }))
                },

                setRightPanelOpen: (open) => {
                    set({ rightPanelOpen: open })
                },
            }),
            {
                name: 'planex-ui',
                version: 1,
                partialize: (state) => ({
                    // Only persist UI preferences, not transient state
                    sidebarCollapsed: state.sidebarCollapsed,
                    taskFilters: state.taskFilters,
                    taskSort: state.taskSort,
                    // Don't persist: selections, modals, undo stack, calendar view
                }),
            }
        )
    )
)

// ============================================
// Selector Hooks
// ============================================

/**
 * Get selected course ID
 */
export function useSelectedCourseId(): string | null {
    return usePlannerUIStore(state => state.selectedCourseId)
}

/**
 * Get active modal type
 */
export function useActiveModal(): ModalType {
    return usePlannerUIStore(state => state.activeModal)
}

/**
 * Get modal payload
 */
export function useModalPayload(): ModalPayload | null {
    return usePlannerUIStore(state => state.modalPayload)
}

/**
 * Get calendar view state
 */
export function useCalendarView(): CalendarViewState {
    return usePlannerUIStore(state => state.calendarView)
}

/**
 * Check if undo is available
 */
export function useCanUndo(): boolean {
    return usePlannerUIStore(state => state.undoStack.length > 0)
}
