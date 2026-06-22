import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const variantClasses = {
    primary: 'bg-text-primary text-[var(--bg-primary)] hover:-translate-y-px hover:opacity-90 active:translate-y-0 active:scale-[0.985]',
    secondary: 'border border-[var(--border-medium)] bg-transparent text-text-primary hover:-translate-y-px hover:bg-surface-200 active:translate-y-0 active:scale-[0.985]',
    ghost: 'border border-transparent bg-transparent text-text-secondary hover:-translate-y-px hover:bg-surface-200 hover:text-text-primary active:translate-y-0 active:scale-[0.985]',
    danger: 'border border-status-red/25 bg-status-red-soft text-status-red hover:bg-status-red/20 active:translate-y-0 active:scale-[0.985]',
};

const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
};

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
            ) : (
                leftIcon
            )}
            {children}
            {rightIcon}
        </button>
    );
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

const iconSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
};

export function IconButton({
    variant = 'ghost',
    size = 'md',
    className,
    children,
    ...props
}: IconButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-md transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantClasses[variant],
                iconSizeClasses[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
