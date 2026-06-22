import { useTheme } from '@/app/providers/ThemeProvider'
import { useTranslation } from '@/i18n'
import { AuthStatusNotice } from '@/modules/auth/components/AuthStatusNotice'
import type { StudentStatus } from '@/modules/auth/store/authStore'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BriefcaseBusiness, CalendarDays, Flag, GraduationCap, LayoutGrid, ListChecks, Sparkles, Target, X } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

type ModuleChoice = 'planner' | 'tracker' | 'habits'

interface SelectCard {
    id: string
    title: string
    description: string
}

export interface OnboardingCoachmarkStep {
    id: string
    route: string
    title: string
    description: string
    kind: 'welcome' | 'modules' | 'coachmark' | 'usage'
    target?: string
    primaryLabel: string
    moduleCards?: Array<SelectCard & { id: ModuleChoice }>
    usageCards?: Array<SelectCard & { id: Exclude<StudentStatus, 'other'> }>
}

interface OnboardingCoachmarkProps {
    isOpen: boolean
    step: OnboardingCoachmarkStep
    currentStep: number
    totalSteps: number
    direction: 1 | -1
    targetRect: DOMRect | null
    stepState: 'locating' | 'ready' | 'fallback'
    isSaving: boolean
    saveError: string | null
    selectedModules: ModuleChoice[]
    usageChoice: StudentStatus
    onToggleModule: (moduleId: ModuleChoice) => void
    onUsageChange: (choice: Exclude<StudentStatus, 'other'>) => void
    onPrevious: () => void
    onNext: () => void
    onSkip: () => void
    onClose: () => void
}

function stepIcon(stepId: string) {
    switch (stepId) {
        case 'welcome':
            return Sparkles
        case 'modules':
            return LayoutGrid
        case 'planner':
            return ListChecks
        case 'tracker':
            return Target
        case 'habits':
            return Flag
        case 'calendar':
            return CalendarDays
        case 'goals':
            return BriefcaseBusiness
        case 'usage':
            return GraduationCap
        default:
            return Sparkles
    }
}

export function OnboardingCoachmark({
    isOpen,
    step,
    currentStep,
    totalSteps,
    direction,
    targetRect,
    stepState,
    isSaving,
    saveError,
    selectedModules,
    usageChoice,
    onToggleModule,
    onUsageChange,
    onPrevious,
    onNext,
    onSkip,
    onClose,
}: OnboardingCoachmarkProps) {
    const tCommon = useTranslation('common')
    const tOnboarding = useTranslation('onboarding')
    const { resolvedTheme } = useTheme()
    const shouldReduceMotion = useReducedMotion()
    const panelRef = useRef<HTMLDivElement | null>(null)
    const primaryActionRef = useRef<HTMLButtonElement | null>(null)
    const previousFocusedElementRef = useRef<HTMLElement | null>(null)
    const descriptionId = `onboarding-description-${currentStep}`
    const StepIcon = stepIcon(step.id)

    const spotlight = useMemo(() => {
        if (!targetRect) {
            return null
        }

        return {
            top: Math.max(targetRect.top - 12, 8),
            left: Math.max(targetRect.left - 12, 8),
            width: targetRect.width + 24,
            height: targetRect.height + 24,
        }
    }, [targetRect])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        const previousOverflow = document.body.style.overflow
        previousFocusedElementRef.current = document.activeElement as HTMLElement | null
        document.body.style.overflow = 'hidden'

        const frame = window.requestAnimationFrame(() => {
            primaryActionRef.current?.focus()
        })

        return () => {
            window.cancelAnimationFrame(frame)
            document.body.style.overflow = previousOverflow
            previousFocusedElementRef.current?.focus()
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        const getFocusableElements = () => {
            if (!panelRef.current) {
                return []
            }

            return Array.from(
                panelRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ),
            ).filter(element => !element.hasAttribute('hidden'))
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (isSaving && (event.key === 'Escape' || event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
                event.preventDefault()
                return
            }

            if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
                return
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault()
                onNext()
                return
            }

            if (event.key === 'ArrowLeft' && currentStep > 1) {
                event.preventDefault()
                onPrevious()
                return
            }

            if (event.key === 'Tab') {
                const focusableElements = getFocusableElements()
                if (focusableElements.length === 0) {
                    return
                }

                const firstElement = focusableElements[0]
                const lastElement = focusableElements[focusableElements.length - 1]
                const activeElement = document.activeElement

                if (event.shiftKey && activeElement === firstElement) {
                    event.preventDefault()
                    lastElement.focus()
                    return
                }

                if (!event.shiftKey && activeElement === lastElement) {
                    event.preventDefault()
                    firstElement.focus()
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [currentStep, isOpen, isSaving, onClose, onNext, onPrevious])

    if (!isOpen) {
        return null
    }

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="fixed inset-0 z-[90]"
                role="dialog"
                aria-modal="true"
                aria-label={step.title}
                aria-describedby={descriptionId}
                aria-busy={isSaving}
            >
                <div
                    className="absolute inset-0 backdrop-blur-[4px]"
                    style={{
                        backgroundColor: resolvedTheme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)',
                    }}
                />

                {spotlight && (
                    <div
                        className="pointer-events-none fixed rounded-xl border border-[rgb(var(--color-accent-rgb)/0.35)] shadow-[0_0_0_1px_rgba(37,99,235,0.08)]"
                        style={{
                            top: spotlight.top,
                            left: spotlight.left,
                            width: spotlight.width,
                            height: spotlight.height,
                        }}
                    />
                )}

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <div
                        ref={panelRef}
                        className="w-full max-w-[600px] rounded-[1.25rem] border border-[var(--border-subtle)] bg-surface-100"
                        tabIndex={-1}
                    >
                        <div className="flex items-start justify-between gap-4 px-6 py-5">
                            <div className="min-w-0">
                                <div className="mb-4 flex items-center gap-2">
                                    {Array.from({ length: totalSteps }).map((_, index) => (
                                        <span
                                            key={index}
                                            className="block rounded-full transition-all duration-180"
                                            style={{
                                                width: index + 1 === currentStep ? 14 : 6,
                                                height: 6,
                                                backgroundColor: index + 1 === currentStep
                                                    ? 'var(--color-accent)'
                                                    : 'var(--border-medium)',
                                            }}
                                            aria-hidden
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-surface-200 text-text-secondary">
                                        <StepIcon className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-2xs uppercase tracking-[0.12em] text-text-muted">
                                            {tOnboarding('onboarding.progress', { current: currentStep, total: totalSteps })}
                                        </p>
                                        <h2 className="mt-1 text-display-lg text-text-primary">{step.title}</h2>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button type="button" onClick={onSkip} className="btn-ghost text-xs">
                                    {tOnboarding('onboarding.skip')}
                                </button>
                                <button type="button" onClick={onClose} className="btn-icon" aria-label={tCommon('common.close')}>
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-[var(--border-subtle)] px-6 py-6">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={step.id}
                                    initial={shouldReduceMotion ? false : { opacity: 0, x: direction > 0 ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -20 : 20 }}
                                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
                                >
                                    <p id={descriptionId} className="text-base leading-relaxed text-text-secondary">
                                        {step.description}
                                    </p>

                                    {step.kind === 'modules' && step.moduleCards && (
                                        <div className="mt-6 grid gap-3 md:grid-cols-3">
                                            {step.moduleCards.map(card => (
                                                <button
                                                    key={card.id}
                                                    type="button"
                                                    onClick={() => onToggleModule(card.id)}
                                                    className={`rounded-xl border p-4 text-left transition-colors ${selectedModules.includes(card.id)
                                                            ? 'border-[var(--border-strong)] bg-surface-200'
                                                            : 'border-[var(--border-subtle)] bg-primary hover:bg-surface-200'
                                                        }`}
                                                >
                                                    <p className="text-sm font-semibold text-text-primary">{card.title}</p>
                                                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">{card.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {step.kind === 'usage' && step.usageCards && (
                                        <div className="mt-6 grid gap-3">
                                            {step.usageCards.map(card => (
                                                <button
                                                    key={card.id}
                                                    type="button"
                                                    onClick={() => onUsageChange(card.id)}
                                                    className={`rounded-xl border p-4 text-left transition-colors ${usageChoice === card.id
                                                            ? 'border-[var(--border-strong)] bg-surface-200'
                                                            : 'border-[var(--border-subtle)] bg-primary hover:bg-surface-200'
                                                        }`}
                                                >
                                                    <p className="text-sm font-semibold text-text-primary">{card.title}</p>
                                                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">{card.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {stepState === 'locating' && step.target && (
                                        <AuthStatusNotice
                                            tone="loading"
                                            title={tOnboarding('onboarding.locatingTitle')}
                                            description={tOnboarding('onboarding.locatingDescription')}
                                            className="mt-5"
                                        />
                                    )}

                                    {stepState === 'fallback' && (
                                        <AuthStatusNotice
                                            tone="warning"
                                            title={tOnboarding('onboarding.fallbackTitle')}
                                            description={tOnboarding('onboarding.fallbackDescription')}
                                            className="mt-5"
                                        />
                                    )}

                                    {saveError && (
                                        <AuthStatusNotice
                                            tone="error"
                                            title={tOnboarding('onboarding.saveErrorTitle')}
                                            description={saveError}
                                            className="mt-5"
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div className="mt-6 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={onPrevious}
                                    disabled={currentStep === 1 || isSaving}
                                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {tCommon('common.previous')}
                                </button>

                                <button
                                    type="button"
                                    ref={primaryActionRef}
                                    onClick={onNext}
                                    disabled={isSaving}
                                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving ? tOnboarding('onboarding.saving') : step.primaryLabel}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body,
    )
}
