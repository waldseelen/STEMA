import { useAuthStore } from '@/modules/auth/store/authStore'

export function getCurrentUserId(): string | null {
    return useAuthStore.getState().user?.id ?? null
}

export function requireCurrentUserId(): string {
    const userId = getCurrentUserId()

    if (!userId) {
        throw new Error('Authenticated user is required for cloud data access.')
    }

    return userId
}
