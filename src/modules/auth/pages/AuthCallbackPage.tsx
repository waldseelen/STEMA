/**
 * AuthCallbackPage
 *
 * OAuth callback handler.
 * Supabase detectSessionInUrl=true otomatik session'ı işler.
 * Bu sayfa sadece yükleniyor durumunu gösterir ve auth state'ini bekler.
 */

import { useTranslation } from '@/i18n'
import { AuthStateScreen } from '@/modules/auth/components/AuthStateScreen'
import { resolveAuthState } from '@/modules/auth/lib/profile'
import {
    AUTHENTICATED_HOME_ROUTE,
    LEGACY_PROFILE_COMPLETION_ROUTE,
    PUBLIC_LANDING_ROUTE,
} from '@/modules/auth/lib/routes'
import { captureSecureMessage } from '@/modules/auth/lib/telemetry'
import { useAuthStore } from '@/modules/auth/store/authStore'
import { useAccessiblePage } from '@/shared/hooks/useAccessiblePage'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function AuthCallbackPage() {
    const t = useTranslation('auth')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const authInitialized = useAuthStore(state => state.authInitialized)
    const dataBootstrapReady = useAuthStore(state => state.dataBootstrapReady)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const isLoading = useAuthStore(state => state.isLoading)
    const profile = useAuthStore(state => state.profile)
    const session = useAuthStore(state => state.session)
    const user = useAuthStore(state => state.user)
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
    const [timedOut, setTimedOut] = useState(false)
    const [isRetrying] = useState(false)
    const [retryError] = useState<string | null>(null)
    const authEnabled = true
    const hasRetryTarget = false
    const resolution = resolveAuthState(snapshot)

    const callbackError = useMemo(
        () => {
            const rawError = searchParams.get('error_description') ?? searchParams.get('error')
            if (!rawError) {
                return null
            }

            try {
                return decodeURIComponent(rawError.replace(/\+/g, ' '))
            } catch {
                return rawError
            }
        },
        [searchParams]
    )

    const effectiveError = retryError ?? callbackError

    useAccessiblePage(t('auth.callback.pageTitle'), {
        announceMessage: effectiveError
            ? t('auth.callback.errorTitle')
            : t('auth.callback.processingAnnouncement'),
    })

    useEffect(() => {
        if (!callbackError) {
            return
        }

        captureSecureMessage('OAuth callback returned an error', {
            context: 'AuthCallbackPage.callbackError',
            category: 'network',
            level: 'warning',
            metadata: {
                errorCode: searchParams.get('error'),
                hasRetryTarget,
            },
            userId: useAuthStore.getState().user?.id ?? undefined,
        })
    }, [callbackError, hasRetryTarget, searchParams])

    useEffect(() => {
        if (!authEnabled || effectiveError || resolution !== 'redirectPending') {
            return
        }

        const timeout = window.setTimeout(() => {
            setTimedOut(true)
        }, 10000)

        return () => {
            window.clearTimeout(timeout)
        }
    }, [authEnabled, effectiveError, resolution])

    useEffect(() => {
        if (!authEnabled || effectiveError || timedOut) {
            return
        }

        if (resolution === 'requiresProfileCompletion') {
            navigate(LEGACY_PROFILE_COMPLETION_ROUTE, { replace: true })
            return
        }

        if (resolution === 'authenticated') {
            navigate(AUTHENTICATED_HOME_ROUTE, { replace: true })
        }
    }, [authEnabled, effectiveError, navigate, resolution, timedOut])

    const handleRetry = async () => {
        navigate(PUBLIC_LANDING_ROUTE, { replace: true })
    }

    if (isRetrying) {
        return (
            <AuthStateScreen
                title={t('auth.callback.retryingTitle')}
                description={t('auth.callback.retryingDescription')}
            />
        )
    }

    if (!authEnabled || effectiveError || resolution === 'unauthenticated' || timedOut) {
        return (
            <AuthStateScreen
                tone="error"
                title={t('auth.callback.errorTitle')}
                description={!authEnabled ? t('auth.callback.disabled') : effectiveError ?? t('auth.callback.errorDescription')}
                actionLabel={hasRetryTarget ? t('auth.callback.retry') : undefined}
                onAction={hasRetryTarget ? () => void handleRetry() : undefined}
                secondaryActionLabel={t('auth.callback.backToLanding')}
                onSecondaryAction={() => navigate(PUBLIC_LANDING_ROUTE, { replace: true })}
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

    return (
        <AuthStateScreen
            title={t('auth.callback.processingTitle')}
            description={t('auth.callback.processingDescription')}
        />
    )
}
