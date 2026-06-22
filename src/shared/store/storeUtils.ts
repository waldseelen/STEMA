/**
 * Plan.Ex - Zustand Store Utilities
 *
 * Selector optimizasyonları, memoization,
 * ve store composition yardımcıları.
 */

import { useCallback, useMemo, useRef } from 'react'
import { shallow } from 'zustand/shallow'

// ============================================
// Types
// ============================================

type EqualityFn<T> = (a: T, b: T) => boolean

// ============================================
// Shallow Equality
// ============================================

/**
 * Shallow comparison - Zustand ile kullanım için re-export
 *
 * @example
 * const { runningTimers, isLoading } = useTimerStore(
 *   state => ({ runningTimers: state.runningTimers, isLoading: state.isLoading }),
 *   shallow
 * )
 */
export { shallow }

// ============================================
// Custom Equality Functions
// ============================================

/**
 * Array length değişikliğini kontrol et
 * Sadece length değişirse re-render
 */
export function lengthEqual<T>(a: T[], b: T[]): boolean {
    return a.length === b.length
}

/**
 * Array IDs değişikliğini kontrol et
 * Sadece ID'ler değişirse re-render
 */
export function idsEqual<T extends { id: string }>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false
    return a.every((item, i) => {
        const bItem = b[i]
        return bItem !== undefined && item.id === bItem.id
    })
}

/**
 * Belirli alanları karşılaştır
 *
 * @example
 * const timer = useTimerStore(
 *   state => state.runningTimers[0],
 *   pickEqual(['id', 'activityId', 'pausedAt'])
 * )
 */
export function pickEqual<T>(keys: (keyof T)[]): EqualityFn<T> {
    return (a: T, b: T) => {
        if (a === b) return true
        if (!a || !b) return false
        return keys.every(key => a[key] === b[key])
    }
}

// ============================================
// Selector Factories
// ============================================

/**
 * Memoized selector factory
 * Aynı input için aynı referansı döner
 *
 * @example
 * // Store içinde
 * const selectActiveTimers = createSelector(
 *   (state: TimerState) => state.runningTimers,
 *   timers => timers.filter(t => !t.pausedAt)
 * )
 *
 * // Component'te
 * const activeTimers = useTimerStore(selectActiveTimers)
 */
export function createSelector<State, Selected, Result>(
    selector: (state: State) => Selected,
    transform: (selected: Selected) => Result
): (state: State) => Result {
    let lastSelected: Selected | undefined
    let lastResult: Result | undefined

    return (state: State) => {
        const selected = selector(state)

        // Shallow compare
        if (lastSelected !== undefined && shallow(selected as object, lastSelected as object)) {
            return lastResult as Result
        }

        lastSelected = selected
        lastResult = transform(selected)
        return lastResult
    }
}

/**
 * Multiple selector combiner
 *
 * @example
 * const selectDashboardData = combineSelectors({
 *   timers: state => state.runningTimers,
 *   isLoading: state => state.isLoading,
 * })
 */
export function combineSelectors<State, Selectors extends Record<string, (state: State) => unknown>>(
    selectors: Selectors
): (state: State) => { [K in keyof Selectors]: ReturnType<Selectors[K]> } {
    return (state: State) => {
        const result = {} as { [K in keyof Selectors]: ReturnType<Selectors[K]> }

        for (const key in selectors) {
            const selector = selectors[key]
            if (selector) {
                result[key] = selector(state) as ReturnType<Selectors[typeof key]>
            }
        }

        return result
    }
}

// ============================================
// Hooks for Optimized Selection
// ============================================

/**
 * Sadece belirli bir timer'ı izle
 *
 * @example
 * const timer = useTimerById('timer_123')
 */
export function useStableCallback<T extends (...args: never[]) => unknown>(
    callback: T
): T {
    const callbackRef = useRef(callback)
    callbackRef.current = callback

    return useCallback(
        ((...args) => callbackRef.current(...args)) as T,
        []
    )
}

/**
 * Derived state için memoization
 *
 * @example
 * const totalDuration = useDerivedState(
 *   sessions,
 *   s => s.reduce((acc, session) => acc + session.durationSec, 0)
 * )
 */
export function useDerivedState<T, R>(
    input: T,
    derive: (input: T) => R,
    deps: unknown[] = []
): R {
    return useMemo(
        () => derive(input),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [input, ...deps]
    )
}

// ============================================
// Store Slice Patterns
// ============================================

/**
 * Store slice oluştur
 * Büyük store'ları bölmek için kullan
 *
 * @example
 * // timerSlice.ts
 * export const createTimerSlice: StateCreator<TimerSlice> = (set, get) => ({
 *   runningTimers: [],
 *   startTimer: async () => { ... }
 * })
 *
 * // store.ts
 * const useStore = create<TimerSlice & HabitSlice>((...a) => ({
 *   ...createTimerSlice(...a),
 *   ...createHabitSlice(...a),
 * }))
 */
export type SliceCreator<T, S = T> = (
    set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
    get: () => T,
    api: { setState: (partial: Partial<S>) => void; getState: () => S }
) => T

// ============================================
// Performance Monitoring
// ============================================

/**
 * Store subscription sayısını izle (development)
 */
export function createSubscriptionTracker(storeName: string) {
    let subscriptionCount = 0

    return {
        onSubscribe: () => {
            subscriptionCount++
            if (import.meta.env.DEV) {
                console.log(`[${storeName}] Subscriptions: ${subscriptionCount}`)
            }
        },
        onUnsubscribe: () => {
            subscriptionCount--
            if (import.meta.env.DEV && subscriptionCount === 0) {
                console.log(`[${storeName}] All subscriptions removed`)
            }
        },
        getCount: () => subscriptionCount,
    }
}

/**
 * Selector re-render sayısını izle (development)
 */
export function useRenderCount(componentName: string): void {
    const countRef = useRef(0)

    if (import.meta.env.DEV) {
        countRef.current++
        // Her 10 render'da bir uyar
        if (countRef.current % 10 === 0) {
            console.log(`[${componentName}] Render count: ${countRef.current}`)
        }
    }
}

// ============================================
// Batched Updates
// ============================================

/**
 * Birden fazla state güncellemesini batch'le
 * React 18+ için genellikle gereksiz ama complex async işlemler için faydalı
 *
 * @example
 * await batchUpdates(async () => {
 *   await updateTimer()
 *   await updateSession()
 *   await updateStats()
 * })
 */
export async function batchUpdates<T>(fn: () => Promise<T>): Promise<T> {
    // React 18+ automatic batching kullandığından,
    // bu fonksiyon sadece clarity için wrapper
    return await fn()
}

// ============================================
// Persist Middleware Helpers
// ============================================

/**
 * Persist için storage versiyonu yönetimi
 */
export interface MigrationConfig<T> {
    version: number
    migrate: (persisted: unknown, version: number) => T
}

/**
 * Migration helper
 *
 * @example
 * const storage = createMigratedStorage<TimerState>({
 *   version: 2,
 *   migrate: (persisted, version) => {
 *     if (version === 1) {
 *       return { ...persisted, newField: 'default' }
 *     }
 *     return persisted
 *   }
 * })
 */
export function createMigrationConfig<T>(config: MigrationConfig<T>): MigrationConfig<T> {
    return config
}

// ============================================
// Action Creators
// ============================================

/**
 * Async action creator with loading state
 *
 * @example
 * const loadData = createAsyncAction(
 *   async (get, set) => {
 *     set({ isLoading: true })
 *     const data = await fetchData()
 *     set({ data, isLoading: false })
 *   }
 * )
 */
export function createAsyncAction<State, Args extends unknown[]>(
    action: (
        get: () => State,
        set: (partial: Partial<State>) => void,
        ...args: Args
    ) => Promise<void>
): (get: () => State, set: (partial: Partial<State>) => void) => (...args: Args) => Promise<void> {
    return (get, set) => async (...args) => {
        await action(get, set, ...args)
    }
}

// ============================================
// Common Selectors
// ============================================

/**
 * Loading state selector factory
 */
export function createLoadingSelector<T extends { isLoading: boolean }>() {
    return (state: T) => state.isLoading
}

/**
 * Error state selector factory
 */
export function createErrorSelector<T extends { error: string | null }>() {
    return (state: T) => state.error
}

/**
 * Items by ID selector factory
 */
export function createByIdSelector<T extends { id: string }, State extends { items: T[] }>() {
    const cache = new Map<string, T | undefined>()

    return (id: string) => (state: State): T | undefined => {
        // Cache hit
        const cached = cache.get(id)
        const found = state.items.find(item => item.id === id)

        if (cached === found) {
            return cached
        }

        cache.set(id, found)
        return found
    }
}
