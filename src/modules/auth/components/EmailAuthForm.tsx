import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { useCallback, useState } from 'react'

interface EmailAuthFormProps {
    onSubmit: (email: string, pass: string, isLogin: boolean) => Promise<void>
    error: string | null
    isLoading: boolean
    t: (key: string) => string
}

export function EmailAuthForm({
    onSubmit,
    error,
    isLoading,
    t,
}: EmailAuthFormProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLogin, setIsLogin] = useState(true)
    const [localError, setLocalError] = useState<string | null>(null)

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            setLocalError(null)

            if (!email) {
                setLocalError(t('auth.email.emailRequired'))
                return
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                setLocalError(t('auth.email.invalidEmail'))
                return
            }

            if (!password || password.length < 6) {
                setLocalError(t('auth.email.invalidPassword') || 'Password must be at least 6 characters')
                return
            }

            try {
                await onSubmit(email, password, isLogin)
            } catch (err) {
                setLocalError(
                    err instanceof Error ? err.message : t('auth.email.authError')
                )
            }
        },
        [email, password, isLogin, onSubmit, t]
    )

    const displayError = localError || error



    return (
        <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
        >
            {/* Email Input */}
            <div className="relative">
                <label
                    htmlFor="email"
                    className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                    {t('auth.email.emailLabel')}
                </label>
                <div className="relative flex items-center">
                    <Mail className="absolute left-3 h-4 w-4 text-text-muted pointer-events-none" />
                    <input
                        id="email"
                        type="email"
                        placeholder={t('auth.email.emailPlaceholder')}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-surface-100 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] disabled:opacity-50 transition-colors"
                    />
                </div>
            </div>

            {/* Password Input */}
            <div className="relative mt-3">
                <label
                    htmlFor="password"
                    className="block text-xs font-medium text-text-secondary mb-1.5"
                >
                    Password
                </label>
                <div className="relative flex items-center">
                    <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-surface-100 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] disabled:opacity-50 transition-colors"
                    />
                </div>
            </div>

            {/* Error Message */}
            {displayError && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-status-red bg-status-red/10 border border-status-red/20 rounded-lg px-3 py-2"
                >
                    {displayError}
                </motion.div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full mt-4 py-2.5 rounded-lg bg-[var(--accent-color)] text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
                {isLoading
                    ? (isLogin ? 'Signing In...' : 'Signing Up...')
                    : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>

            {/* Toggle Login/Signup */}
            <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                disabled={isLoading}
                className="w-full mt-2 py-2 text-xs text-[var(--accent-color)] hover:underline font-medium"
            >
                {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            </button>
        </motion.form>
    )
}

