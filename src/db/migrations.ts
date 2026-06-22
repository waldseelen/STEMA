export interface MigrationInfo {
    fromVersion: number
    toVersion: number
    description: string
    executedAt?: number
    success?: boolean
}

export interface MigrationResult {
    success: boolean
    migrationsRun: MigrationInfo[]
    errors: string[]
}

export function getCurrentVersion(): number { return 1 }
export async function runMigrations(): Promise<MigrationResult> { return { success: true, migrationsRun: [], errors: [] } }
export async function rollbackLastMigration(): Promise<boolean> { return false }
export function getLatestVersion(): number { return 1 }
export function getMigrationLog(): MigrationInfo[] { return [] }
export function hasPendingMigrations(): boolean { return false }
export function clearMigrationHistory(): void {}
export async function checkDataIntegrity(): Promise<{ valid: boolean; issues: string[] }> { return { valid: true, issues: [] } }
export async function cleanupOrphanRecords(): Promise<number> { return 0 }
