 
export interface PDFBlob {
    id: string
    courseId: string
    fileName: string
    mimeType: string
    fileSize: number
    uploadedAt: string
    storagePath?: string
}

export interface UploadProgress {
    loaded: number
    total: number
    percentage: number
}

export type UploadProgressCallback = (progress: UploadProgress) => void

export async function uploadPDF(
    file: File,
    _courseId: string,
    _onProgress?: UploadProgressCallback
): Promise<{ id: string; fileName: string; fileSize: number }> {
    return { id: 'dummy', fileName: file.name, fileSize: file.size }
}

export async function getPDFBlob(_id: string): Promise<PDFBlob | undefined> {
    return undefined
}

export async function getCoursePDFs(_courseId: string): Promise<PDFBlob[]> {
    return []
}

export async function openPDFInNewTab(_id: string): Promise<void> {}

export async function downloadPDF(_id: string): Promise<void> {}

export async function deletePDF(_id: string): Promise<void> {}

export async function deleteCoursePDFs(_courseId: string): Promise<void> {}

export async function getTotalStorageUsed(): Promise<number> {
    return 0
}

export async function getLastUploadedPDF(_courseId: string): Promise<PDFBlob | undefined> {
    return undefined
}

export async function cleanupOrphanPDFs(_activeCourseIds: string[]): Promise<number> {
    return 0
}
