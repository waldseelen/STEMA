/**
 * Query Invalidation — Supabase-first sorgular için reaktif güncelleme mekanizması.
 *
 * useLiveQuery (Dexie) yerine geçen hafif bir pub/sub sistemi.
 * Mutasyon fonksiyonları ilgili tablo adını invalidate eder;
 * useSupabaseQuery hook'ları bu sinyali alınca yeniden fetch yapar.
 */

type TableKey = string
type Listener = () => void

const listeners = new Map<TableKey, Set<Listener>>()

/** Belirli tablolar invalidate edildiğinde dinleyicileri tetikler */
export function invalidateTables(tables: TableKey[]): void {
    for (const table of tables) {
        const bucket = listeners.get(table)
        if (bucket) {
            for (const fn of bucket) {
                fn()
            }
        }
    }
}

/** Belirtilen tabloya dinleyici ekler; unmount için unsubscribe döner */
export function subscribeToTable(table: TableKey, fn: Listener): () => void {
    let bucket = listeners.get(table)
    if (!bucket) {
        bucket = new Set()
        listeners.set(table, bucket)
    }
    bucket.add(fn)

    return () => {
        bucket!.delete(fn)
    }
}
