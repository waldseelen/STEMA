import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface EmptyStateProps {
    icon?: ReactNode
    title: string
    description?: string
    action?: ReactNode
    className?: string
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div className={clsx('card p-8 text-center', className)}>
            {icon && (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-400">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-surface-900 dark:text-white mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-surface-500 dark:text-surface-300 mb-6 max-w-sm mx-auto">
                    {description}
                </p>
            )}
            {action}
        </div>
    )
}
