import { db, isFirebaseConfigured } from '@/config/firebase'
import {
    collection,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    DocumentData
} from 'firebase/firestore'
import { requireCurrentUserId } from './currentUser'

interface Filter {
    column: string
    value: any
}

interface ListOptions {
    filters?: Filter[]
    orderBy?: string
    ascending?: boolean
}

// ── Local Storage Fallback Helpers ───────────────────────────────────────────
function getLocalTable(tableName: string): any[] {
    try {
        const val = localStorage.getItem(`planex-local-firestore-${tableName}`)
        return val ? JSON.parse(val) : []
    } catch {
        return []
    }
}

function setLocalTable(tableName: string, data: any[]): void {
    try {
        localStorage.setItem(`planex-local-firestore-${tableName}`, JSON.stringify(data))
    } catch (err) {
        console.error(`Failed to write to localStorage for table ${tableName}:`, err)
    }
}

export async function listOwnedRows(
    tableName: string,
    options: ListOptions = {}
): Promise<any[]> {
    const userId = requireCurrentUserId()

    if (!isFirebaseConfigured) {
        const localData = getLocalTable(tableName)
        let data = localData.filter((row: any) => row.user_id === userId)

        if (options.filters) {
            for (const filter of options.filters) {
                data = data.filter((row: any) => row[filter.column] === filter.value)
            }
        }

        if (options.orderBy) {
            const col = options.orderBy
            const asc = options.ascending ?? true
            data.sort((a: any, b: any) => {
                const valA = a[col]
                const valB = b[col]
                if (valA === valB) return 0
                if (valA === undefined || valA === null) return 1
                if (valB === undefined || valB === null) return -1
                if (valA < valB) return asc ? -1 : 1
                return asc ? 1 : -1
            })
        }

        return data
    }

    const colRef = collection(db, tableName)
    let q = query(colRef, where('user_id', '==', userId))

    if (options.filters) {
        for (const filter of options.filters) {
            q = query(q, where(filter.column, '==', filter.value))
        }
    }

    if (options.orderBy) {
        q = query(q, orderBy(options.orderBy, options.ascending ?? true ? 'asc' : 'desc'))
    }

    const snap = await getDocs(q)
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function upsertOwnedRow(
    tableName: string,
    row: Record<string, any>,
    options?: any
): Promise<any> {
    const userId = requireCurrentUserId()
    const docId = row.id || crypto.randomUUID()
    const payload = {
        ...row,
        id: docId,
        user_id: userId,
        updated_at: new Date().toISOString()
    }

    if (!isFirebaseConfigured) {
        const localData = getLocalTable(tableName)
        const idx = localData.findIndex((r: any) => r.id === docId)
        if (idx >= 0) {
            localData[idx] = { ...localData[idx], ...payload }
        } else {
            localData.push(payload)
        }
        setLocalTable(tableName, localData)
        return payload
    }

    const docRef = doc(db, tableName, docId)
    await setDoc(docRef, payload, { merge: true })
    return payload
}

export async function upsertOwnedRows(
    tableName: string,
    rows: Array<Record<string, any>>,
    options?: any
): Promise<any[]> {
    if (rows.length === 0) return []

    const userId = requireCurrentUserId()

    if (!isFirebaseConfigured) {
        const localData = getLocalTable(tableName)
        const results: any[] = []
        for (const row of rows) {
            const docId = row.id || crypto.randomUUID()
            const payload = {
                ...row,
                id: docId,
                user_id: userId,
                updated_at: new Date().toISOString()
            }
            const idx = localData.findIndex((r: any) => r.id === docId)
            if (idx >= 0) {
                localData[idx] = { ...localData[idx], ...payload }
            } else {
                localData.push(payload)
            }
            results.push(payload)
        }
        setLocalTable(tableName, localData)
        return results
    }

    const batch = writeBatch(db)
    const results: any[] = []

    for (const row of rows) {
        const docId = row.id || crypto.randomUUID()
        const payload = {
            ...row,
            id: docId,
            user_id: userId,
            updated_at: new Date().toISOString()
        }
        const docRef = doc(db, tableName, docId)
        batch.set(docRef, payload, { merge: true })
        results.push(payload)
    }

    await batch.commit()
    return results
}

export async function updateOwnedRows(
    tableName: string,
    patch: Record<string, any>,
    filters: Filter[] = []
): Promise<any[]> {
    const userId = requireCurrentUserId()
    const updatedPatch = {
        ...patch,
        updated_at: new Date().toISOString()
    }

    if (!isFirebaseConfigured) {
        const localData = getLocalTable(tableName)
        const updatedRows: any[] = []
        for (let i = 0; i < localData.length; i++) {
            const row = localData[i]
            if (row.user_id !== userId) continue
            let matches = true
            for (const filter of filters) {
                if (row[filter.column] !== filter.value) {
                    matches = false
                    break
                }
            }
            if (matches) {
                localData[i] = { ...row, ...updatedPatch }
                updatedRows.push(localData[i])
            }
        }
        if (updatedRows.length > 0) {
            setLocalTable(tableName, localData)
        }
        return updatedRows
    }

    const colRef = collection(db, tableName)
    let q = query(colRef, where('user_id', '==', userId))

    for (const filter of filters) {
        q = query(q, where(filter.column, '==', filter.value))
    }

    const snap = await getDocs(q)
    if (snap.empty) return []

    const batch = writeBatch(db)
    const updatedRows: any[] = []

    snap.docs.forEach(doc => {
        batch.update(doc.ref, updatedPatch)
        updatedRows.push({ id: doc.id, ...doc.data(), ...updatedPatch })
    })

    await batch.commit()
    return updatedRows
}

export async function deleteOwnedRows(
    tableName: string,
    filters: Filter[] = []
): Promise<void> {
    const userId = requireCurrentUserId()

    if (!isFirebaseConfigured) {
        const localData = getLocalTable(tableName)
        const keptRows = localData.filter((row: any) => {
            if (row.user_id !== userId) return true
            let matches = true
            for (const filter of filters) {
                if (row[filter.column] !== filter.value) {
                    matches = false
                    break
                }
            }
            return !matches
        })
        setLocalTable(tableName, keptRows)
        return
    }

    const colRef = collection(db, tableName)
    let q = query(colRef, where('user_id', '==', userId))

    for (const filter of filters) {
        q = query(q, where(filter.column, '==', filter.value))
    }

    const snap = await getDocs(q)
    if (snap.empty) return

    const batch = writeBatch(db)
    snap.docs.forEach(doc => {
        batch.delete(doc.ref)
    })

    await batch.commit()
}
