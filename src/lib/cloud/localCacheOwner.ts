const LOCAL_CACHE_OWNER_KEY = 'planex-local-cache-owner'

function canUseLocalStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readLocalCacheOwner(): string | null {
    if (!canUseLocalStorage()) {
        return null
    }

    try {
        return window.localStorage.getItem(LOCAL_CACHE_OWNER_KEY)
    } catch {
        return null
    }
}

export function writeLocalCacheOwner(userId: string): void {
    if (!canUseLocalStorage()) {
        return
    }

    try {
        window.localStorage.setItem(LOCAL_CACHE_OWNER_KEY, userId)
    } catch {
        // Ignore localStorage write failures.
    }
}

export function clearLocalCacheOwner(): void {
    if (!canUseLocalStorage()) {
        return
    }

    try {
        window.localStorage.removeItem(LOCAL_CACHE_OWNER_KEY)
    } catch {
        // Ignore localStorage cleanup failures.
    }
}
