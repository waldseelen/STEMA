/**
 * useSupabaseQuery — Supabase-first sorgular için reactive React hook.
 *
 * useLiveQuery (Dexie) davranışını modeller:
 * - İlk render'da fetch yapar
 * - dep değişince yeniden fetch yapar
 * - subscribed olan tablo invalidate edilince yeniden fetch yapar
 * - loading/error state'leri barındırır
 */

import { subscribeToTable } from '@/lib/cloud/queryInvalidation'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface SupabaseQueryResult<T> {
    data: T
    loading: boolean
    error: Error | null
    refetch: () => void
}

/**
 * Async bir Supabase sorgusunu reaktif biçimde çalıştırır.
 *
 * @param fetchFn - veri dönen async fonksiyon
 * @param defaultValue - yüklenene kadar dönen başlangıç değeri
 * @param watchTables - invalidate edilince yeniden fetch yapılacak tablo adları
 * @param deps - ek React bağımlılıkları (örn. filtre parametreleri)
 */
export function useSupabaseQuery<T>(
    fetchFn: () => Promise<T>,
    defaultValue: T,
    watchTables: string[] = [],
    deps: unknown[] = [],
): SupabaseQueryResult<T> {
    const [data, setData] = useState<T>(defaultValue)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const versionRef = useRef(0)

    const run = useCallback(async () => {
        const version = ++versionRef.current
        setLoading(true)
        try {
            const result = await fetchFn()
            if (versionRef.current === version) {
                setData(result)
                setError(null)
            }
        } catch (err) {
            if (versionRef.current === version) {
                setError(err instanceof Error ? err : new Error(String(err)))
            }
        } finally {
            if (versionRef.current === version) {
                setLoading(false)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    useEffect(() => {
        run()
    }, [run])

    useEffect(() => {
        if (watchTables.length === 0) return
        const unsubscribers = watchTables.map(table => subscribeToTable(table, run))
        return () => unsubscribers.forEach(fn => fn())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, watchTables)

    return { data, loading, error, refetch: run }
}
