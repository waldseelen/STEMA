/**
 * AuthGuard
 *
 * Korumalı route'ları sarmalar.
 * - Yükleniyor → spinner
 * - Giriş yapılmamış → /auth/login
 * - Profil tamamlanmamış → /auth/profile-setup
 * - Her şey tamam → çocukları render et
 */

import { useTranslation } from '@/i18n'
import { AuthStateScreen } from '@/modules/auth/components/AuthStateScreen'
import { resolveAuthState } from '@/modules/auth/lib/profile'
import {
    LEGACY_PROFILE_COMPLETION_ROUTE,
    PUBLIC_LANDING_ROUTE,
} from '@/modules/auth/lib/routes'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { type ReactNode, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface AuthGuardProps {
    children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
    const t = useTranslation('auth')
    const authInitialized = useAuthStore(state => state.authInitialized)
    const dataBootstrapReady = useAuthStore(state => state.dataBootstrapReady)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const isLoading = useAuthStore(state => state.isLoading)
    const profile = useAuthStore(state => state.profile)
    const session = useAuthStore(state => state.session)
    const user = useAuthStore(state => state.user)
    const location = useLocation()
    const snapshot = useMemo(
        () => ({
            authInitialized,
            dataBootstrapReady,
            isAuthenticated,
            isLoading,
            profile,
            session,
            user,
        }),
        [authInitialized, dataBootstrapReady, isAuthenticated, isLoading, profile, session, user],
    )
    const resolution = resolveAuthState(snapshot)

    if (resolution === 'initializing') {
        return (
            <AuthStateScreen
                title={t('auth.guard.initialLoadingTitle')}
                description={t('auth.guard.initialLoadingDescription')}
            />
        )
    }

    if (resolution === 'redirectPending') {
        return (
            <AuthStateScreen
                title={t('auth.guard.redirectPendingTitle')}
                description={t('auth.guard.redirectPendingDescription')}
            />
        )
    }

    if (resolution === 'profileLoading') {
        return (
            <AuthStateScreen
                title={t('auth.guard.profileLoadingTitle')}
                description={t('auth.guard.profileLoadingDescription')}
            />
        )
    }

    if (resolution === 'bootstrapLoading') {
        return (
            <AuthStateScreen
                title={t('auth.guard.bootstrapLoadingTitle')}
                description={t('auth.guard.bootstrapLoadingDescription')}
            />
        )
    }

    if (resolution === 'unauthenticated') {
        return <Navigate to={PUBLIC_LANDING_ROUTE} state={{ from: location }} replace />
    }

    if (resolution === 'requiresProfileCompletion') {
        return <Navigate to={LEGACY_PROFILE_COMPLETION_ROUTE} replace />
    }

    return <>{children}</>
}
