import { beforeEach, describe, expect, it } from 'vitest'
import {
    clearLastOAuthProvider,
    getLastOAuthProvider,
    rememberLastOAuthProvider,
} from '../../src/modules/auth/lib/oauth'

describe('oauth retry storage', () => {
    beforeEach(() => {
        window.sessionStorage.clear()
    })

    it('stores the last supported oauth provider for callback retry', () => {
        rememberLastOAuthProvider('google')

        expect(getLastOAuthProvider()).toBe('google')
    })

    it('clears the last provider after cleanup', () => {
        rememberLastOAuthProvider('github')
        clearLastOAuthProvider()

        expect(getLastOAuthProvider()).toBeNull()
    })

    it('ignores unsupported provider values from storage', () => {
        window.sessionStorage.setItem('planex:last-oauth-provider', 'apple')

        expect(getLastOAuthProvider()).toBeNull()
    })
})
