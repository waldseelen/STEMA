import { AuthGuard } from './AuthGuard'
import { type ReactNode } from 'react'

interface ProtectedRouteProps {
    children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    return <AuthGuard>{children}</AuthGuard>
}
