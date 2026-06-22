import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function Input({
    label,
    error,
    leftIcon,
    rightIcon,
    className,
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="form-label mb-1.5 block">
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
                        {leftIcon}
                    </div>
                )}
                <input
                    className={cn(
                        'input',
                        leftIcon && 'pl-10',
                        rightIcon && 'pr-10',
                        error && 'input-error',
                        className
                    )}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-status-red">{error}</p>
            )}
        </div>
    );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export function Textarea({
    label,
    error,
    className,
    ...props
}: TextareaProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="form-label mb-1.5 block">
                    {label}
                </label>
            )}
            <textarea
                className={cn(
                    'input min-h-[120px] resize-none',
                    error && 'input-error',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-sm text-status-red">{error}</p>
            )}
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export function Select({
    label,
    error,
    options,
    className,
    ...props
}: SelectProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="form-label mb-1.5 block">
                    {label}
                </label>
            )}
            <select
                className={cn(
                    'input',
                    error && 'input-error',
                    className
                )}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-1.5 text-sm text-status-red">{error}</p>
            )}
        </div>
    );
}
