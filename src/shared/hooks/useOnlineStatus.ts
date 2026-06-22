import { useState, useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
    window.addEventListener('online', callback)
    window.addEventListener('offline', callback)
    return () => {
        window.removeEventListener('online', callback)
        window.removeEventListener('offline', callback)
    }
}

function getSnapshot() {
    return navigator.onLine
}

function getServerSnapshot() {
    return true
}

/**
 * Çevrimiçi/çevrimdışı durumunu takip eden hook
 * Offline-first PWA için önemli
 */
export function useOnlineStatus() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Son veri senkronizasyon zamanını takip eden hook
 */
export function useLastSyncTime() {
    const [lastSync, setLastSync] = useState<Date | null>(() => {
        const stored = localStorage.getItem('lifeflow_last_sync')
        return stored ? new Date(stored) : null
    })

    const updateLastSync = () => {
        const now = new Date()
        localStorage.setItem('lifeflow_last_sync', now.toISOString())
        setLastSync(now)
    }

    return { lastSync, updateLastSync }
}

/**
 * Veri kaydetme durumunu takip eden hook
 * "Kaydediliyor...", "Kaydedildi" gibi durumlar için
 */
export function useSaveStatus() {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    const setSaving = () => setStatus('saving')

    const setSaved = () => {
        setStatus('saved')
        setLastSaved(new Date())
        // 2 saniye sonra idle'a dön
        setTimeout(() => setStatus('idle'), 2000)
    }

    const setError = () => {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
    }

    return { status, lastSaved, setSaving, setSaved, setError }
}
