/**
 * trackerUIStore — Zustand UI State
 *
 * SADECE filtre ve modal durumları burada tutulur.
 * DB state → useLiveQuery (Dexie)
 * UI state → bu store (Zustand)
 *
 * (Roadmap Kritik Not #2'ye birebir uyar)
 */

import { create } from 'zustand';

export interface TrackerUIState {
    // Aktivite grid filtresi
    selectedCategoryId: string | null

    // Tarih aralığı (Records + Stats sayfaları)
    dateRange: { start: string; end: string }

    // Session düzenleme modal
    isEditModalOpen: boolean
    editingSessionId: string | null

    // Yeni aktivite modal
    isNewActivityModalOpen: boolean

    // Aktif timer üzerindeki bağlam menü
    activeContextTimerId: string | null

    // Actions
    setSelectedCategoryId: (id: string | null) => void
    setDateRange: (start: string, end: string) => void
    openEditModal: (sessionId: string) => void
    closeEditModal: () => void
    openNewActivityModal: () => void
    closeNewActivityModal: () => void
    setActiveContextTimer: (timerId: string | null) => void
}

function todayISO(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const useTrackerUIStore = create<TrackerUIState>((set) => ({
    selectedCategoryId: null,
    dateRange: { start: todayISO(), end: todayISO() },
    isEditModalOpen: false,
    editingSessionId: null,
    isNewActivityModalOpen: false,
    activeContextTimerId: null,

    setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

    setDateRange: (start, end) => set({ dateRange: { start, end } }),

    openEditModal: (sessionId) =>
        set({ isEditModalOpen: true, editingSessionId: sessionId }),

    closeEditModal: () =>
        set({ isEditModalOpen: false, editingSessionId: null }),

    openNewActivityModal: () => set({ isNewActivityModalOpen: true }),

    closeNewActivityModal: () => set({ isNewActivityModalOpen: false }),

    setActiveContextTimer: (timerId) => set({ activeContextTimerId: timerId }),
}))
