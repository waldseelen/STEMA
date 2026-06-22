/**
 * Backup modülü
 */

// Legacy backup service
export type {
    ExportResult, ExportOptions as LegacyExportOptions,
    ImportResult as LegacyImportResult
} from './backupService';

export {
    downloadBackup, exportAllData as legacyExportAllData, importData as legacyImportData,
    openFileAndImport
} from './backupService';

// New enhanced export service
export type {
    ExportOptions,
    ImportOptions,
    ImportResult
} from './exportService';

export {
    createAutoBackup, downloadBlob, exportAllData, exportHabitData, exportTimeData, getAutoBackupInfo, getBackupFileName, getBackupInfo, importData, pickAndReadFile, restoreFromAutoBackup
} from './exportService';

