import type { ReactNode } from 'react'

export function MigrationProvider({ children }: { children: ReactNode }) {
    // Migrations are handled by Firestore now
    return <>{children}</>
}
