import { useTranslation } from '@/i18n'
import { captureSecureException } from '@/modules/auth/lib/telemetry'
import { useAuthStore, type StudentStatus } from '@/modules/auth/store/authStore'
import { useToast } from '@/shared/components'
import { announce } from '@/shared/utils/a11y'
import { useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { OnboardingCoachmark, type OnboardingCoachmarkStep } from './OnboardingCoachmark'

function getTargetElement(target?: string) {
    if (!target) {
        return null
    }

    return document.querySelector<HTMLElement>(`[data-onboarding-target="${target}"]`)
}

const MODULE_DEFAULTS = ['planner'] as const
type ModuleChoice = 'planner' | 'tracker' | 'habits'

export function OnboardingOrchestrator() {
    const t = useTranslation('onboarding')
    const tCommon = useTranslation('common')
    const location = useLocation()
    const { showToast } = useToast()
    const shouldReduceMotion = useReducedMotion()
    const completeOnboarding = useAuthStore(state => state.completeOnboarding)
    const updateProfile = useAuthStore(state => state.updateProfile)
    const shouldStartOnboarding = useAuthStore(state => state.shouldStartOnboarding)
    const profile = useAuthStore(state => state.profile)
    const [isOpen, setIsOpen] = useState(false)
    const [stepIndex, setStepIndex] = useState(0)
    const [direction, setDirection] = useState<1 | -1>(1)
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
    const [stepState, setStepState] = useState<'locating' | 'ready' | 'fallback'>('ready')
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [selectedModules, setSelectedModules] = useState<ModuleChoice[]>([...MODULE_DEFAULTS])
    const [usageChoice, setUsageChoice] = useState<StudentStatus>(profile?.studentStatus ?? 'other')
    const previousPathnameRef = useRef(location.pathname)

    const steps = useMemo<OnboardingCoachmarkStep[]>(
        () => [
            {
                id: 'welcome',
                route: '/planner',
                kind: 'welcome',
                title: t('onboarding.steps.welcome.title'),
                description: t('onboarding.steps.welcome.description'),
                primaryLabel: t('onboarding.begin'),
            },
            {
                id: 'modules',
                route: '/planner',
                kind: 'modules',
                title: t('onboarding.steps.modules.title'),
                description: t('onboarding.steps.modules.description'),
                primaryLabel: tCommon('common.next'),
                moduleCards: [
                    {
                        id: 'planner',
                        title: t('onboarding.moduleCards.planner.title'),
                        description: t('onboarding.moduleCards.planner.description'),
                    },
                    {
                        id: 'tracker',
                        title: t('onboarding.moduleCards.tracker.title'),
                        description: t('onboarding.moduleCards.tracker.description'),
                    },
                    {
                        id: 'habits',
                        title: t('onboarding.moduleCards.habits.title'),
                        description: t('onboarding.moduleCards.habits.description'),
                    },
                ],
            },
            {
                id: 'planner',
                route: '/planner',
                target: 'dashboard-hero',
                kind: 'coachmark',
                title: t('onboarding.steps.planner.title'),
                description: t('onboarding.steps.planner.description'),
                primaryLabel: t('onboarding.gotIt'),
            },
            {
                id: 'tracker',
                route: '/planner',
                target: 'nav-tracker',
                kind: 'coachmark',
                title: t('onboarding.steps.tracker.title'),
                description: t('onboarding.steps.tracker.description'),
                primaryLabel: t('onboarding.gotIt'),
            },
            {
                id: 'habits',
                route: '/planner',
                target: 'dashboard-section-habits',
                kind: 'coachmark',
                title: t('onboarding.steps.habits.title'),
                description: t('onboarding.steps.habits.description'),
                primaryLabel: t('onboarding.gotIt'),
            },
            {
                id: 'calendar',
                route: '/planner',
                target: 'nav-calendar',
                kind: 'coachmark',
                title: t('onboarding.steps.calendar.title'),
                description: t('onboarding.steps.calendar.description'),
                primaryLabel: t('onboarding.gotIt'),
            },
            {
                id: 'goals',
                route: '/planner',
                target: 'quick-actions',
                kind: 'coachmark',
                title: t('onboarding.steps.goals.title'),
                description: t('onboarding.steps.goals.description'),
                primaryLabel: t('onboarding.gotIt'),
            },
            {
                id: 'usage',
                route: '/planner',
                kind: 'usage',
                title: t('onboarding.steps.usage.title'),
                description: t('onboarding.steps.usage.description'),
                primaryLabel: t('onboarding.start'),
                usageCards: [
                    {
                        id: 'student',
                        title: t('onboarding.usageOptions.student.title'),
                        description: t('onboarding.usageOptions.student.description'),
                    },
                    {
                        id: 'working',
                        title: t('onboarding.usageOptions.working.title'),
                        description: t('onboarding.usageOptions.working.description'),
                    },
                    {
                        id: 'both',
                        title: t('onboarding.usageOptions.both.title'),
                        description: t('onboarding.usageOptions.both.description'),
                    },
                ],
            },
        ],
        [t, tCommon],
    )

    const currentStep = steps[stepIndex]
    const canAutoStart = location.pathname === '/planner' && shouldStartOnboarding()

    useEffect(() => {
        setUsageChoice(profile?.studentStatus ?? 'other')
    }, [profile?.studentStatus])

    useEffect(() => {
        if (!canAutoStart) {
            setIsOpen(false)
            setStepIndex(0)
            setTargetRect(null)
            setSaveError(null)
            setIsSaving(false)
            return
        }

        setIsOpen(true)
    }, [canAutoStart])

    useEffect(() => {
        if (!isOpen || !currentStep) {
            previousPathnameRef.current = location.pathname
            return
        }

        if (previousPathnameRef.current !== location.pathname && location.pathname !== currentStep.route) {
            setIsOpen(false)
            setStepIndex(0)
            setTargetRect(null)
            setSaveError(null)
            showToast(t('onboarding.routeChangedToast'), { variant: 'default' })
            announce(t('onboarding.routeChangedAnnouncement'))
        }

        previousPathnameRef.current = location.pathname
    }, [currentStep, isOpen, location.pathname, showToast, t])

    useEffect(() => {
        if (!isOpen || !currentStep) {
            return
        }

        setSaveError(null)
        announce(
            t('onboarding.stepAnnouncement', {
                current: stepIndex + 1,
                total: steps.length,
                title: currentStep.title,
            }),
        )
    }, [currentStep, isOpen, stepIndex, steps.length, t])

    useEffect(() => {
        if (!isOpen || !currentStep) {
            return
        }

        if (!currentStep.target) {
            setTargetRect(null)
            setStepState('ready')
            return
        }

        let frame = 0
        let timeoutId: number | null = null
        let cancelled = false
        let attempts = 0
        const maxAttempts = 6

        setTargetRect(null)
        setStepState('locating')

        const syncTarget = () => {
            if (cancelled) {
                return
            }

            const element = getTargetElement(currentStep.target)
            if (element) {
                setTargetRect(element.getBoundingClientRect())
                setStepState('ready')
                return
            }

            setTargetRect(null)
        }

        const resolveTarget = () => {
            if (cancelled) {
                return
            }

            const element = getTargetElement(currentStep.target)
            if (element) {
                element.scrollIntoView({
                    block: 'center',
                    inline: 'nearest',
                    behavior: shouldReduceMotion ? 'auto' : 'smooth',
                })
                setTargetRect(element.getBoundingClientRect())
                setStepState('ready')
                return
            }

            if (attempts < maxAttempts) {
                attempts += 1
                timeoutId = window.setTimeout(() => {
                    frame = window.requestAnimationFrame(resolveTarget)
                }, 120)
                return
            }

            setTargetRect(null)
            setStepState('fallback')
        }

        frame = window.requestAnimationFrame(resolveTarget)
        window.addEventListener('resize', syncTarget)
        window.addEventListener('scroll', syncTarget, true)

        return () => {
            cancelled = true
            window.cancelAnimationFrame(frame)
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId)
            }
            window.removeEventListener('resize', syncTarget)
            window.removeEventListener('scroll', syncTarget, true)
        }
    }, [currentStep, isOpen, shouldReduceMotion])

    const finishOnboarding = async (toastKey: 'onboarding.toastCompleted' | 'onboarding.toastSkipped', shouldPersistUsage: boolean) => {
        setIsSaving(true)
        setSaveError(null)

        try {
            if (shouldPersistUsage && usageChoice !== 'other') {
                await updateProfile({ studentStatus: usageChoice })
            }

            await completeOnboarding()
            setIsOpen(false)
            setStepIndex(0)
            showToast(t(toastKey), { variant: 'success' })
        } catch (error) {
            captureSecureException(error, {
                context: 'OnboardingOrchestrator.finishOnboarding',
                category: 'database',
            })
            setSaveError(t('onboarding.saveErrorInline'))
            showToast(t('onboarding.toastError'), { variant: 'error' })
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen || !currentStep) {
        return null
    }

    return (
        <OnboardingCoachmark
            isOpen={isOpen}
            step={currentStep}
            currentStep={stepIndex + 1}
            totalSteps={steps.length}
            direction={direction}
            targetRect={targetRect}
            stepState={stepState}
            isSaving={isSaving}
            saveError={saveError}
            selectedModules={selectedModules}
            usageChoice={usageChoice}
            onToggleModule={moduleId => {
                setSelectedModules(current => (
                    current.includes(moduleId)
                        ? current.filter(item => item !== moduleId)
                        : [...current, moduleId]
                ))
            }}
            onUsageChange={choice => setUsageChoice(choice)}
            onPrevious={() => {
                setDirection(-1)
                setStepIndex(index => Math.max(index - 1, 0))
            }}
            onNext={() => {
                setSaveError(null)
                setDirection(1)
                if (stepIndex === steps.length - 1) {
                    void finishOnboarding('onboarding.toastCompleted', true)
                    return
                }

                setStepIndex(index => Math.min(index + 1, steps.length - 1))
            }}
            onSkip={() => {
                void finishOnboarding('onboarding.toastSkipped', false)
            }}
            onClose={() => {
                void finishOnboarding('onboarding.toastSkipped', false)
            }}
        />
    )
}
