 
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../src/i18n'
import { CloudDataBootstrap } from '../../src/app/providers/CloudDataBootstrap'
import { AuthGuard } from '../../src/modules/auth/components/AuthGuard'
import { useAuthStore, type UserProfile } from '../../src/modules/auth/store/authStore'
import { ToastProvider } from '../../src/shared/components'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const domainSyncMocks = vi.hoisted(() => ({
    clearLocalDomainCaches: vi.fn(),
    getDomainSyncSummary: vi.fn(),
    hydrateLocalCacheFromCloud: vi.fn(),
    migrateLocalDataToCloud: vi.fn(),
}))

const remoteDefaultsMocks = vi.hoisted(() => ({
    ensureRemoteUserDefaults: vi.fn(),
}))

vi.mock('@/config/firebase', () => ({
    isFirebaseEnabled: vi.fn(() => true),
    db: {} as Record<string, unknown>,
}))

vi.mock('@/lib/cloud/domainSync', () => domainSyncMocks)
vi.mock('@/lib/cloud/remoteDefaults', () => remoteDefaultsMocks)

const baseProfile: UserProfile = {
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'Test User',
    occupation: 'Developer',
    studentStatus: 'working',
    plan: 'free',
    profileCompleted: true,
    onboardingCompleted: true,
    preferredLocale: 'en',
    preferredTheme: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
}

function renderBootstrap() {
    return render(
        <I18nProvider initialLocale="en">
            <ToastProvider>
                <CloudDataBootstrap />
            </ToastProvider>
        </I18nProvider>,
    )
}

describe('CloudDataBootstrap', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            session: null,
            dataBootstrapReady: true,
            user: { id: 'user-1', email: 'user@example.com' } as never,
            profile: baseProfile,
        })

        domainSyncMocks.clearLocalDomainCaches.mockResolvedValue(undefined)
        domainSyncMocks.hydrateLocalCacheFromCloud.mockResolvedValue(undefined)
        domainSyncMocks.migrateLocalDataToCloud.mockResolvedValue(undefined)
        remoteDefaultsMocks.ensureRemoteUserDefaults.mockResolvedValue(undefined)
        domainSyncMocks.getDomainSyncSummary.mockResolvedValue({
            cloudCounts: {
                courses: 0,
                units: 0,
                tasks: 0,
                events: 0,
                personalTasks: 0,
                habits: 0,
                habitLogs: 0,
                categories: 0,
                tags: 0,
                activities: 0,
                timeSessions: 0,
                goals: 0,
                runningTimers: 0,
            },
            cloudTotals: { planner: 0, tracker: 0, overall: 0 },
            hasCloudData: false,
            hasLocalData: true,
            localCounts: {
                courses: 1,
                units: 1,
                tasks: 2,
                events: 1,
                personalTasks: 1,
                habits: 1,
                habitLogs: 2,
                categories: 1,
                tags: 0,
                activities: 2,
                timeSessions: 3,
                goals: 1,
                runningTimers: 0,
            },
            localTotals: { planner: 8, tracker: 6, overall: 14 },
            ownerMismatch: false,
            skippedTables: [],
        })
    })

    it('opens the migration prompt when local data exists', async () => {
        renderBootstrap()

        expect(await screen.findByText(/Move local data to the cloud/i)).toBeInTheDocument()
        expect(screen.getByText(/Planner records/i)).toBeInTheDocument()
    })

    it('migrates local data after confirmation', async () => {
        renderBootstrap()

        fireEvent.click(await screen.findByRole('button', { name: /Move to cloud/i }))

        await waitFor(() => {
            expect(domainSyncMocks.migrateLocalDataToCloud).toHaveBeenCalledTimes(1)
        })
    })

    it('hydrates cloud data immediately when conflict is detected', async () => {
        domainSyncMocks.getDomainSyncSummary.mockResolvedValue({
            cloudCounts: {
                courses: 2,
                units: 2,
                tasks: 4,
                events: 1,
                personalTasks: 1,
                habits: 1,
                habitLogs: 2,
                categories: 1,
                tags: 1,
                activities: 2,
                timeSessions: 3,
                goals: 1,
                runningTimers: 0,
            },
            cloudTotals: { planner: 13, tracker: 7, overall: 20 },
            hasCloudData: true,
            hasLocalData: true,
            localCounts: {
                courses: 1,
                units: 1,
                tasks: 2,
                events: 1,
                personalTasks: 1,
                habits: 1,
                habitLogs: 2,
                categories: 1,
                tags: 0,
                activities: 2,
                timeSessions: 3,
                goals: 1,
                runningTimers: 0,
            },
            localTotals: { planner: 8, tracker: 6, overall: 14 },
            ownerMismatch: false,
            skippedTables: [],
        })

        renderBootstrap()

        await waitFor(() => {
            expect(domainSyncMocks.hydrateLocalCacheFromCloud).toHaveBeenCalledTimes(1)
        })
        expect(screen.queryByText(/Move local data to the cloud/i)).not.toBeInTheDocument()
    })

    it('can finish bootstrap while AuthGuard is showing the bootstrap loading state', async () => {
        useAuthStore.setState({
            authInitialized: true,
            isAuthenticated: true,
            isLoading: false,
            session: null,
            dataBootstrapReady: false,
            user: { id: 'user-1', email: 'user@example.com' } as never,
            profile: baseProfile,
        })

        domainSyncMocks.getDomainSyncSummary.mockResolvedValue({
            cloudCounts: {
                courses: 0,
                units: 0,
                tasks: 0,
                events: 0,
                personalTasks: 0,
                habits: 0,
                habitLogs: 0,
                categories: 0,
                tags: 0,
                activities: 0,
                timeSessions: 0,
                goals: 0,
                runningTimers: 0,
            },
            cloudTotals: { planner: 0, tracker: 0, overall: 0 },
            hasCloudData: false,
            hasLocalData: false,
            localCounts: {
                courses: 0,
                units: 0,
                tasks: 0,
                events: 0,
                personalTasks: 0,
                habits: 0,
                habitLogs: 0,
                categories: 0,
                tags: 0,
                activities: 0,
                timeSessions: 0,
                goals: 0,
                runningTimers: 0,
            },
            localTotals: { planner: 0, tracker: 0, overall: 0 },
            ownerMismatch: false,
            skippedTables: [],
        })

        render(
            <I18nProvider initialLocale="en">
                <ToastProvider>
                    <CloudDataBootstrap />
                    <MemoryRouter initialEntries={['/planner']}>
                        <Routes>
                            <Route
                                path="/planner"
                                element={(
                                    <AuthGuard>
                                        <div>Protected Shell</div>
                                    </AuthGuard>
                                )}
                            />
                        </Routes>
                    </MemoryRouter>
                </ToastProvider>
            </I18nProvider>,
        )

        await waitFor(() => {
            expect(useAuthStore.getState().dataBootstrapReady).toBe(true)
        })
        expect(await screen.findByText('Protected Shell')).toBeInTheDocument()
        expect(remoteDefaultsMocks.ensureRemoteUserDefaults).toHaveBeenCalledTimes(1)
        expect(domainSyncMocks.hydrateLocalCacheFromCloud).toHaveBeenCalledTimes(1)
    })
})
