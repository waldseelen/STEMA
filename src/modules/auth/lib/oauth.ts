import { OAUTH_CALLBACK_PATH, OAUTH_PROVIDERS, getOAuthRedirectUrl } from './security'

export { OAUTH_PROVIDERS }
export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number]['id']

const LAST_OAUTH_PROVIDER_STORAGE_KEY = 'planex:last-oauth-provider'

function canUseSessionStorage() {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function isOAuthProviderId(value: string | null): value is OAuthProviderId {
    return OAUTH_PROVIDERS.some(provider => provider.id === value)
}

export function getAuthCallbackUrl() {
    return getOAuthRedirectUrl() ?? OAUTH_CALLBACK_PATH
}

export function rememberLastOAuthProvider(provider: OAuthProviderId) {
    if (!canUseSessionStorage()) {
        return
    }

    try {
        window.sessionStorage.setItem(LAST_OAUTH_PROVIDER_STORAGE_KEY, provider)
    } catch {
        // Ignore sessionStorage write failures and let the flow continue.
    }
}

export function getLastOAuthProvider(): OAuthProviderId | null {
    if (!canUseSessionStorage()) {
        return null
    }

    try {
        const provider = window.sessionStorage.getItem(LAST_OAUTH_PROVIDER_STORAGE_KEY)
        return isOAuthProviderId(provider) ? provider : null
    } catch {
        return null
    }
}

export function clearLastOAuthProvider() {
    if (!canUseSessionStorage()) {
        return
    }

    try {
        window.sessionStorage.removeItem(LAST_OAUTH_PROVIDER_STORAGE_KEY)
    } catch {
        // Ignore sessionStorage cleanup failures.
    }
}
