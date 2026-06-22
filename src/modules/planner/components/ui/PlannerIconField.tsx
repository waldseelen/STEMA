import { useTranslations } from '@/i18n'
import { IconPicker } from '@/shared/components/IconPicker'
import * as LucideIcons from 'lucide-react'
import { ChevronDown, type LucideProps } from 'lucide-react'
import { useMemo, useState, type ComponentType } from 'react'
import { cn } from '../../lib/utils'

const lucideIconMap =
    LucideIcons as unknown as Record<string, ComponentType<LucideProps>>

export const PLANNER_DEFAULT_ICONS = {
    course: 'BookOpen',
    personalTask: 'ListTodo',
    courseTask: 'CheckSquare',
    habit: 'Flame',
} as const

interface PlannerEntityIconProps extends LucideProps {
    icon?: string
    fallbackIcon: string
    color?: string
}

interface PlannerIconFieldProps {
    value?: string
    onChange: (icon: string) => void
    fallbackIcon: string
    label?: string
    previewColor?: string
    className?: string
}

function resolveIconName(icon: string | undefined, fallbackIcon: string) {
    return icon && lucideIconMap[icon] ? icon : fallbackIcon
}

export function PlannerEntityIcon({
    icon,
    fallbackIcon,
    color,
    className,
    strokeWidth = 2,
    ...props
}: PlannerEntityIconProps) {
    const iconName = resolveIconName(icon, fallbackIcon)
    const Icon = lucideIconMap[iconName]

    if (!Icon) {
        return null
    }

    return (
        <Icon
            {...props}
            className={className}
            strokeWidth={strokeWidth}
            style={color ? { color } : undefined}
        />
    )
}

export function PlannerIconField({
    value,
    onChange,
    fallbackIcon,
    label,
    previewColor,
    className,
}: PlannerIconFieldProps) {
    const t = useTranslations(['tracker'])
    const [isOpen, setIsOpen] = useState(false)

    const activeIcon = useMemo(
        () => resolveIconName(value, fallbackIcon),
        [fallbackIcon, value],
    )

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between gap-3">
                <label className="form-label m-0 block">
                    {label ?? t('tracker', 'activity.icon')}
                </label>
                <button
                    type="button"
                    onClick={() => setIsOpen(current => !current)}
                    aria-expanded={isOpen}
                    className="inline-flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-surface-100 px-3 py-2 text-sm text-text-primary transition-colors hover:bg-surface-200"
                >
                    <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-primary"
                        style={previewColor ? { color: previewColor } : undefined}
                    >
                        <PlannerEntityIcon
                            icon={activeIcon}
                            fallbackIcon={fallbackIcon}
                            size={16}
                            color={previewColor}
                        />
                    </span>
                    <span className="min-w-0 truncate text-left">{activeIcon}</span>
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 text-text-muted transition-transform',
                            isOpen && 'rotate-180',
                        )}
                    />
                </button>
            </div>

            {isOpen && (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-surface-100 p-3">
                    <IconPicker
                        value={activeIcon}
                        onSelect={(iconName) => {
                            onChange(iconName)
                            setIsOpen(false)
                        }}
                    />
                </div>
            )}
        </div>
    )
}
