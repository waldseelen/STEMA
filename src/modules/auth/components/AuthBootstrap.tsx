import { initAuthListener } from '@/modules/auth/store/authStore'
import { useEffect, type ReactNode } from 'react'

interface AuthBootstrapProps {
    children: ReactNode
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
    useEffect(() => {
        return initAuthListener()
    }, [])

    return <>{children}</>
}
