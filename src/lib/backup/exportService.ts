/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
export interface ExportOptions {
    includeCategories?: boolean
    includeActivities?: boolean
    includeTimeSessions?: boolean
    includeHabits?: boolean
    includeHabitLogs?: boolean
    includeRules?: boolean
    includeSettings?: boolean
    includeAll?: boolean
}

export interface ImportOptions {
    clearExisting?: boolean
    conflictStrategy?: 'skip' | 'overwrite' | 'merge'
    strictMode?: boolean
}

export interface ImportResult {
    success: boolean
    imported: {
        categories: number
        activities: number
        timeSessions: number
        habits: number
        habitLogs: number
        rules: number
    }
    skipped: number
    errors: string[]
}

export async function exportAllData(options: ExportOptions = { includeAll: true }): Promise<Blob> {
    return new Blob(['{}'], { type: 'application/json' })
}

export async function exportTimeData(): Promise<Blob> {
    return new Blob(['{}'], { type: 'application/json' })
}

export async function exportHabitData(): Promise<Blob> {
    return new Blob(['{}'], { type: 'application/json' })
}

export async function importData(jsonString: string, options: ImportOptions = {}): Promise<ImportResult> {
    return {
        success: true,
        imported: { categories: 0, activities: 0, timeSessions: 0, habits: 0, habitLogs: 0, rules: 0 },
        skipped: 0,
        errors: [],
    }
}

export function downloadBlob(blob: Blob, filename: string): void {}
export function getBackupFileName(prefix = 'lifeflow-backup'): string { return '' }
export function pickAndReadFile(): Promise<string | null> { return Promise.resolve(null) }

export function getBackupInfo(jsonString: string): any {
    return { valid: true, counts: { categories: 0, activities: 0, timeSessions: 0, habits: 0, habitLogs: 0, rules: 0 } }
}

export async function createAutoBackup(): Promise<void> {}
export function getAutoBackupInfo(): { timestamp: Date; size: number } | null { return null }
export async function restoreFromAutoBackup(): Promise<ImportResult | null> { return null }
