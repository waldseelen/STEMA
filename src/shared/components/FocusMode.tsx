import { clsx } from 'clsx'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

// ============================================
// Focus Mode Context
// ============================================

interface FocusModeContextValue {
    isFocusMode: boolean
    enableFocusMode: () => void
    disableFocusMode: () => void
    toggleFocusMode: () => void
}

const FocusModeContext = createContext<FocusModeContextValue | null>(null)

export function useFocusMode() {
    const context = useContext(FocusModeContext)
    if (!context) {
        throw new Error('useFocusMode must be used within a FocusModeProvider')
    }
    return context
}

// ============================================
// Provider
// ============================================

interface FocusModeProviderProps {
    children: ReactNode
}

export function FocusModeProvider({ children }: FocusModeProviderProps) {
    const [isFocusMode, setIsFocusMode] = useState(false)

    const enableFocusMode = useCallback(() => {
        setIsFocusMode(true)
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50)
        }
    }, [])

    const disableFocusMode = useCallback(() => {
        setIsFocusMode(false)
    }, [])

    const toggleFocusMode = useCallback(() => {
        setIsFocusMode(prev => !prev)
        if (navigator.vibrate) {
            navigator.vibrate(50)
        }
    }, [])

    return (
        <FocusModeContext.Provider
            value={{
                isFocusMode,
                enableFocusMode,
                disableFocusMode,
                toggleFocusMode,
            }}
        >
            {children}
        </FocusModeContext.Provider>
    )
}

// ============================================
// Focus Mode Overlay
// ============================================

interface FocusModeOverlayProps {
    /** Timer içeriği */
    children: ReactNode
    /** Timer çalışıyor mu */
    isActive?: boolean
    /** Aktivite adı */
    activityName?: string
    /** Geçen süre (saniye) */
    elapsedSeconds?: number
    /** Çıkış handler'ı */
    onExit?: () => void
    className?: string
}

/**
 * Pomodoro Odak Modu
 * Timer başladığında diğer öğeleri bulanıklaştırır, sadece sayaca odaklanır
 */
export function FocusModeOverlay({
    children,
    isActive = false,
    activityName,
    elapsedSeconds: _elapsedSeconds = 0,
    onExit,
    className,
}: FocusModeOverlayProps) {
    // _elapsedSeconds is available for future use (e.g., displaying elapsed time)
    void _elapsedSeconds
    const { isFocusMode, disableFocusMode } = useFocusMode()

    if (!isFocusMode || !isActive) {
        return <>{children}</>
    }

    const handleExit = () => {
        disableFocusMode()
        onExit?.()
    }

    return (
        <div
            className={clsx(
                'fixed inset-0 z-50',
                'bg-gradient-to-br from-surface-900/95 via-surface-950/98 to-black/95',
                'flex flex-col items-center justify-center',
                'animate-fade-in',
                className
            )}
        >
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-timer-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-1000" />
            </div>

            {/* Close button */}
            <button
                onClick={handleExit}
                className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Main content */}
            <div className="relative z-10 text-center">
                {/* Activity name */}
                {activityName && (
                    <p className="text-lg text-white/60 mb-4 font-medium">
                        {activityName}
                    </p>
                )}

                {/* Timer display */}
                <div className="mb-8">
                    {children}
                </div>

                {/* Motivational text */}
                <p className="text-white/40 text-sm max-w-xs mx-auto">
                    Odaklan, başarabilirsin. Her dakika seni hedefe yaklaştırıyor.
                </p>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-sm">
                <kbd className="px-2 py-1 rounded bg-white/10 font-mono text-xs">Esc</kbd>
                <span className="ml-2">ile çık</span>
            </div>
        </div>
    )
}

// ============================================
// Focus Mode Timer Display
// ============================================

interface FocusTimerDisplayProps {
    seconds: number
    isPomodoro?: boolean
    pomodoroTarget?: number // dakika
    className?: string
}

export function FocusTimerDisplay({
    seconds,
    isPomodoro = false,
    pomodoroTarget = 25,
    className,
}: FocusTimerDisplayProps) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const progress = isPomodoro ? Math.min((seconds / 60 / pomodoroTarget) * 100, 100) : 0

    return (
        <div className={clsx('relative', className)}>
            {/* Progress ring for Pomodoro */}
            {isPomodoro && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        className="fill-none stroke-white/10"
                        strokeWidth="4"
                    />
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        className="fill-none stroke-timer-500"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={565.48} // 2 * PI * 90
                        strokeDashoffset={565.48 * (1 - progress / 100)}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                </svg>
            )}

            {/* Time display */}
            <div className="relative z-10 py-8 px-12">
                <div className="font-mono text-7xl md:text-8xl lg:text-9xl font-light text-white tracking-tight">
                    {hours > 0 && (
                        <>
                            <span>{hours}</span>
                            <span className="text-white/30">:</span>
                        </>
                    )}
                    <span>{minutes.toString().padStart(2, '0')}</span>
                    <span className="text-white/30">:</span>
                    <span>{secs.toString().padStart(2, '0')}</span>
                </div>
            </div>
        </div>
    )
}

// ============================================
// Blurred Background Wrapper
// ============================================

interface FocusBlurWrapperProps {
    children: ReactNode
    blur?: boolean
    className?: string
}

/**
 * Odak modunda içeriği bulanıklaştıran wrapper
 * Timer dışındaki öğeler için kullanılır
 */
export function FocusBlurWrapper({ children, blur = true, className }: FocusBlurWrapperProps) {
    const { isFocusMode } = useFocusMode()

    return (
        <div
            className={clsx(
                'transition-all duration-500',
                isFocusMode && blur && 'blur-sm opacity-50 pointer-events-none',
                className
            )}
        >
            {children}
        </div>
    )
}

// ============================================
// Focus Mode Toggle Button
// ============================================

interface FocusModeToggleProps {
    className?: string
}

export function FocusModeToggle({ className }: FocusModeToggleProps) {
    const { isFocusMode, toggleFocusMode } = useFocusMode()

    return (
        <button
            onClick={toggleFocusMode}
            className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200',
                isFocusMode
                    ? 'bg-timer-500 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700',
                className
            )}
            title={isFocusMode ? 'Odak Modu: Açık' : 'Odak Modu: Kapalı'}
        >
            <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
            </svg>
            <span className="text-sm font-medium">Odak</span>
        </button>
    )
}
