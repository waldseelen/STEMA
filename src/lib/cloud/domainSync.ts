
export type SyncTableKey = 'courses' | 'units'
export interface DomainSyncSummary {
    cloudCounts: Record<string, number>
    cloudTotals: Record<string, number>
    hasCloudData: boolean
    hasLocalData: boolean
    localCounts: Record<string, number>
    localTotals: Record<string, number>
    ownerMismatch: boolean
    skippedTables: string[]
}
export async function getDomainSyncSummary(): Promise<DomainSyncSummary> {
    return {
        cloudCounts: {}, cloudTotals: {}, hasCloudData: false, hasLocalData: false,
        localCounts: {}, localTotals: {}, ownerMismatch: false, skippedTables: []
    } as unknown as DomainSyncSummary
}
export async function clearLocalDomainCaches(): Promise<void> {}
export async function hydrateLocalCacheFromCloud(): Promise<void> {}
export async function migrateLocalDataToCloud(): Promise<void> {}
