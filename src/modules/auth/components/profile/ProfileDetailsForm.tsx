import { useTranslation } from '@/i18n'
import { AuthStatusNotice } from '@/modules/auth/components/AuthStatusNotice'
import type { StudentStatus } from '@/modules/auth/store/authStore'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

export interface ProfileFormValues {
    fullName: string
    occupation: string
    studentStatus: StudentStatus | ''
    school: string
    department: string
    grade: string
}

export interface ProfileSubmitValues {
    fullName: string
    occupation: string
    studentStatus: StudentStatus
    school?: string
    department?: string
    grade?: string
}

interface ProfileDetailsFormProps {
    initialValues: ProfileFormValues
    isSubmitting: boolean
    submitLabel: string
    submittingLabel: string
    submitAlignment?: 'full' | 'end'
    systemError?: string | null
    onSubmit: (values: ProfileSubmitValues) => Promise<void>
    onInteraction?: () => void
}

type ProfileField = keyof Pick<ProfileFormValues, 'fullName' | 'occupation' | 'studentStatus' | 'school' | 'department'>

function joinDescribedBy(...ids: Array<string | undefined>) {
    const filteredIds = ids.filter(Boolean)
    return filteredIds.length > 0 ? filteredIds.join(' ') : undefined
}

export function ProfileDetailsForm({
    initialValues,
    isSubmitting,
    submitLabel,
    submittingLabel,
    submitAlignment = 'full',
    systemError,
    onSubmit,
    onInteraction,
}: ProfileDetailsFormProps) {
    const t = useTranslation('auth')
    const tCommon = useTranslation('common')
    const shouldReduceMotion = useReducedMotion()
    const statusRefs = useRef<Record<StudentStatus, HTMLButtonElement | null>>({
        student: null,
        working: null,
        both: null,
        other: null,
    })
    const [values, setValues] = useState<ProfileFormValues>(initialValues)
    const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({})
    const [showValidationSummary, setShowValidationSummary] = useState(false)

    useEffect(() => {
        setValues(initialValues)
        setErrors({})
        setShowValidationSummary(false)
    }, [initialValues])

    const statusOptions = useMemo(
        () => [
            { value: 'student' as const, label: t('auth.profileSetup.fields.statusStudent') },
            { value: 'working' as const, label: t('auth.profileSetup.fields.statusWorking') },
            { value: 'both' as const, label: t('auth.profileSetup.fields.statusBoth') },
            { value: 'other' as const, label: t('auth.profileSetup.fields.statusOther') },
        ],
        [t]
    )

    const errorIds = {
        fullName: 'profile-form-full-name-error',
        occupation: 'profile-form-occupation-error',
        studentStatus: 'profile-form-student-status-error',
        school: 'profile-form-school-error',
        department: 'profile-form-department-error',
    } as const

    const helperIds = {
        fullName: 'profile-form-full-name-hint',
        occupation: 'profile-form-occupation-hint',
        studentStatus: 'profile-form-student-status-hint',
        school: 'profile-form-school-hint',
        department: 'profile-form-department-hint',
        grade: 'profile-form-grade-hint',
    } as const

    const isStudent = values.studentStatus === 'student' || values.studentStatus === 'both'
    const inputClassName = 'input'

    const setFieldValue = <T extends keyof ProfileFormValues>(field: T, nextValue: ProfileFormValues[T]) => {
        onInteraction?.()
        setValues(previousValues => ({ ...previousValues, [field]: nextValue }))
        setShowValidationSummary(false)
    }

    const setFieldError = (field: ProfileField, message: string | null) => {
        setErrors(previousErrors => {
            if (!message) {
                if (!(field in previousErrors)) {
                    return previousErrors
                }

                const nextErrors = { ...previousErrors }
                delete nextErrors[field]
                return nextErrors
            }

            if (previousErrors[field] === message) {
                return previousErrors
            }

            return { ...previousErrors, [field]: message }
        })
    }

    const validateField = (field: ProfileField, nextValues = values) => {
        let message: string | null = null

        if (field === 'fullName' && !nextValues.fullName.trim()) {
            message = t('auth.profileSetup.validation.fullNameRequired')
        }
        if (field === 'occupation' && !nextValues.occupation.trim()) {
            message = t('auth.profileSetup.validation.occupationRequired')
        }
        if (field === 'studentStatus' && !nextValues.studentStatus) {
            message = t('auth.profileSetup.validation.statusRequired')
        }
        if (field === 'school' && (nextValues.studentStatus === 'student' || nextValues.studentStatus === 'both') && !nextValues.school.trim()) {
            message = t('auth.profileSetup.validation.schoolRequired')
        }
        if (field === 'department' && (nextValues.studentStatus === 'student' || nextValues.studentStatus === 'both') && !nextValues.department.trim()) {
            message = t('auth.profileSetup.validation.departmentRequired')
        }

        setFieldError(field, message)
        return !message
    }

    const validateForm = () => {
        const nextErrors: Partial<Record<ProfileField, string>> = {}

        if (!values.fullName.trim()) {
            nextErrors.fullName = t('auth.profileSetup.validation.fullNameRequired')
        }
        if (!values.occupation.trim()) {
            nextErrors.occupation = t('auth.profileSetup.validation.occupationRequired')
        }
        if (!values.studentStatus) {
            nextErrors.studentStatus = t('auth.profileSetup.validation.statusRequired')
        }
        if (isStudent && !values.school.trim()) {
            nextErrors.school = t('auth.profileSetup.validation.schoolRequired')
        }
        if (isStudent && !values.department.trim()) {
            nextErrors.department = t('auth.profileSetup.validation.departmentRequired')
        }

        setErrors(nextErrors)
        setShowValidationSummary(Object.keys(nextErrors).length > 0)
        return Object.keys(nextErrors).length === 0
    }

    const handleStudentStatusChange = (nextStatus: StudentStatus) => {
        onInteraction?.()

        const nextValues: ProfileFormValues =
            nextStatus === 'student' || nextStatus === 'both'
                ? { ...values, studentStatus: nextStatus }
                : {
                    ...values,
                    studentStatus: nextStatus,
                    school: '',
                    department: '',
                    grade: '',
                }

        setValues(nextValues)
        setShowValidationSummary(false)
        validateField('studentStatus', nextValues)

        if (nextStatus !== 'student' && nextStatus !== 'both') {
            setFieldError('school', null)
            setFieldError('department', null)
        }
    }

    const handleStudentStatusKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const currentIndex = statusOptions.findIndex(option => option.value === values.studentStatus)
        const fallbackIndex = currentIndex >= 0 ? currentIndex : 0
        const moveFocus = (nextIndex: number) => {
            const nextOption = statusOptions[nextIndex]
            handleStudentStatusChange(nextOption.value)
            statusRefs.current[nextOption.value]?.focus()
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault()
            moveFocus((fallbackIndex + 1) % statusOptions.length)
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault()
            moveFocus((fallbackIndex - 1 + statusOptions.length) % statusOptions.length)
        }
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!validateForm() || !values.studentStatus) {
            return
        }

        await onSubmit({
            fullName: values.fullName.trim(),
            occupation: values.occupation.trim(),
            studentStatus: values.studentStatus,
            school: values.school.trim() || undefined,
            department: values.department.trim() || undefined,
            grade: values.grade.trim() || undefined,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <span className="badge-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t('auth.profileSetup.quickSetupBadge')}
                </span>
                <span>{t('auth.profileSetup.requiredHint')}</span>
            </div>

            {showValidationSummary && (
                <AuthStatusNotice
                    tone="warning"
                    title={t('auth.profileSetup.validation.reviewTitle')}
                    description={t('auth.profileSetup.validation.reviewDescription')}
                />
            )}

            {systemError && (
                <AuthStatusNotice
                    tone="error"
                    title={t('auth.profileSetup.systemErrorTitle')}
                    description={systemError}
                />
            )}

            <div className="space-y-1.5">
                <label htmlFor="profile-full-name" className="form-label">
                    <span>{t('auth.profileSetup.fields.fullName')}</span>
                    <span className="badge-primary">{tCommon('common.required')}</span>
                </label>
                <p id={helperIds.fullName} className="text-xs leading-relaxed text-text-muted">
                    {t('auth.profileSetup.fields.fullNameHint')}
                </p>
                <input
                    id="profile-full-name"
                    type="text"
                    value={values.fullName}
                    onChange={event => {
                        setFieldValue('fullName', event.target.value)
                        if (event.target.value.trim()) {
                            setFieldError('fullName', null)
                        }
                    }}
                    onBlur={() => {
                        void validateField('fullName')
                    }}
                    placeholder={t('auth.profileSetup.fields.fullNamePlaceholder')}
                    className={inputClassName}
                    maxLength={100}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={joinDescribedBy(helperIds.fullName, errors.fullName ? errorIds.fullName : undefined)}
                    aria-required="true"
                    disabled={isSubmitting}
                />
                {errors.fullName && (
                    <p id={errorIds.fullName} className="text-xs text-status-red">
                        {errors.fullName}
                    </p>
                )}
            </div>

            <div className="space-y-1.5">
                <label htmlFor="profile-occupation" className="form-label">
                    <span>{t('auth.profileSetup.fields.occupation')}</span>
                    <span className="badge-primary">{tCommon('common.required')}</span>
                </label>
                <p id={helperIds.occupation} className="text-xs leading-relaxed text-text-muted">
                    {t('auth.profileSetup.fields.occupationHint')}
                </p>
                <input
                    id="profile-occupation"
                    type="text"
                    value={values.occupation}
                    onChange={event => {
                        setFieldValue('occupation', event.target.value)
                        if (event.target.value.trim()) {
                            setFieldError('occupation', null)
                        }
                    }}
                    onBlur={() => {
                        void validateField('occupation')
                    }}
                    placeholder={t('auth.profileSetup.fields.occupationPlaceholder')}
                    className={inputClassName}
                    maxLength={100}
                    aria-invalid={Boolean(errors.occupation)}
                    aria-describedby={joinDescribedBy(helperIds.occupation, errors.occupation ? errorIds.occupation : undefined)}
                    aria-required="true"
                    disabled={isSubmitting}
                />
                {errors.occupation && (
                    <p id={errorIds.occupation} className="text-xs text-status-red">
                        {errors.occupation}
                    </p>
                )}
            </div>

            <fieldset className="space-y-2">
                <legend className="form-label">
                    <span>{t('auth.profileSetup.fields.status')}</span>
                    <span className="badge-primary">{tCommon('common.required')}</span>
                </legend>
                <p id={helperIds.studentStatus} className="text-xs leading-relaxed text-text-muted">
                    {t('auth.profileSetup.fields.statusHint')}
                </p>
                <div
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                    role="radiogroup"
                    aria-describedby={joinDescribedBy(helperIds.studentStatus, errors.studentStatus ? errorIds.studentStatus : undefined)}
                    aria-invalid={Boolean(errors.studentStatus)}
                    onKeyDown={handleStudentStatusKeyDown}
                >
                    {statusOptions.map((option, index) => (
                        <button
                            key={option.value}
                            ref={element => {
                                statusRefs.current[option.value] = element
                            }}
                            type="button"
                            role="radio"
                            aria-checked={values.studentStatus === option.value}
                            tabIndex={values.studentStatus === option.value || (!values.studentStatus && index === 0) ? 0 : -1}
                            onClick={() => handleStudentStatusChange(option.value)}
                            disabled={isSubmitting}
                            className={`min-h-[48px] rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                                values.studentStatus === option.value
                                    ? 'border-[var(--color-accent)] bg-[rgb(var(--color-accent-rgb)/0.08)] text-text-primary'
                                    : 'border-[var(--border-subtle)] bg-surface-200 text-text-secondary hover:border-[var(--border-medium)] hover:bg-surface-100'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                {errors.studentStatus && (
                    <p id={errorIds.studentStatus} className="text-xs text-status-red">
                        {errors.studentStatus}
                    </p>
                )}
            </fieldset>

            <AnimatePresence initial={false}>
                {isStudent && (
                    <motion.div
                        key="student-fields"
                        initial={shouldReduceMotion ? false : { opacity: 0, height: 0, y: 8 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -6 }}
                        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22 }}
                        className="space-y-4 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-surface-100 p-4"
                    >
                        <p className="text-xs leading-relaxed text-text-muted">
                            {t('auth.profileSetup.studentFieldsHint')}
                        </p>

                        <div className="space-y-1.5">
                                <label htmlFor="profile-school" className="form-label">
                                    <span>{t('auth.profileSetup.fields.school')}</span>
                                    <span className="badge-primary">{tCommon('common.required')}</span>
                                </label>
                            <p id={helperIds.school} className="text-xs leading-relaxed text-text-muted">
                                {t('auth.profileSetup.fields.schoolHint')}
                            </p>
                            <input
                                id="profile-school"
                                type="text"
                                value={values.school}
                                onChange={event => {
                                    setFieldValue('school', event.target.value)
                                    if (event.target.value.trim()) {
                                        setFieldError('school', null)
                                    }
                                }}
                                onBlur={() => {
                                    void validateField('school')
                                }}
                                placeholder={t('auth.profileSetup.fields.schoolPlaceholder')}
                                className={inputClassName}
                                maxLength={150}
                                aria-invalid={Boolean(errors.school)}
                                aria-describedby={joinDescribedBy(helperIds.school, errors.school ? errorIds.school : undefined)}
                                aria-required="true"
                                disabled={isSubmitting}
                            />
                            {errors.school && (
                                <p id={errorIds.school} className="text-xs text-status-red">
                                    {errors.school}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label htmlFor="profile-department" className="form-label">
                                    <span>{t('auth.profileSetup.fields.department')}</span>
                                    <span className="badge-primary">{tCommon('common.required')}</span>
                                </label>
                                <p id={helperIds.department} className="text-xs leading-relaxed text-text-muted">
                                    {t('auth.profileSetup.fields.departmentHint')}
                                </p>
                                <input
                                    id="profile-department"
                                    type="text"
                                    value={values.department}
                                    onChange={event => {
                                        setFieldValue('department', event.target.value)
                                        if (event.target.value.trim()) {
                                            setFieldError('department', null)
                                        }
                                    }}
                                    onBlur={() => {
                                        void validateField('department')
                                    }}
                                    placeholder={t('auth.profileSetup.fields.departmentPlaceholder')}
                                    className={inputClassName}
                                    maxLength={150}
                                    aria-invalid={Boolean(errors.department)}
                                    aria-describedby={joinDescribedBy(helperIds.department, errors.department ? errorIds.department : undefined)}
                                    aria-required="true"
                                    disabled={isSubmitting}
                                />
                                {errors.department && (
                                    <p id={errorIds.department} className="text-xs text-status-red">
                                        {errors.department}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="profile-grade" className="form-label">
                                    {t('auth.profileSetup.fields.grade')}
                                </label>
                                <p id={helperIds.grade} className="text-xs leading-relaxed text-text-muted">
                                    {t('auth.profileSetup.fields.gradeHint')}
                                </p>
                                <input
                                    id="profile-grade"
                                    type="text"
                                    value={values.grade}
                                    onChange={event => setFieldValue('grade', event.target.value)}
                                    placeholder={t('auth.profileSetup.fields.gradePlaceholder')}
                                    className={inputClassName}
                                    maxLength={20}
                                    aria-describedby={helperIds.grade}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={submitAlignment === 'end' ? 'flex justify-end' : ''}>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn-primary min-h-[52px] gap-2 ${submitAlignment === 'full' ? 'w-full' : 'w-full sm:w-auto sm:min-w-[220px]'}`}
                >
                    {isSubmitting ? (
                        <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span>{submittingLabel}</span>
                        </>
                    ) : (
                        <>
                            <span>{submitLabel}</span>
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
