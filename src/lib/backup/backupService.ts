/* eslint-disable @typescript-eslint/no-unused-vars */
export interface ExportOptions {
    includeActivities?: boolean | undefined
    includeSessions?: boolean | undefined
    includeHabits?: boolean | undefined
    includeHabitLogs?: boolean | undefined
    includeRules?: boolean | undefined
    includeSettings?: boolean | undefined
    includeCategories?: boolean | undefined
}

export interface ImportResult {
    success: boolean
    error?: string | undefined
    stats?: {
        activities: number
        sessions: number
        habits: number
        habitLogs: number
        rules: number
        categories: number
    } | undefined
}

export interface ExportResult {
    success: boolean
    data?: string | undefined
    filename?: string | undefined
    error?: string | undefined
}

export async function exportAllData(options: ExportOptions = {}): Promise<ExportResult> {
    return { success: true, data: '{}', filename: 'backup.json' }
}

export function downloadBackup(data: string, filename: string): void {}

export async function importData(jsonString: string, merge = false): Promise<ImportResult> {
    return { success: true, stats: { activities: 0, sessions: 0, habits: 0, habitLogs: 0, rules: 0, categories: 0 } }
}

export function openFileAndImport(onComplete: (result: ImportResult) => void, merge = false): void {}
