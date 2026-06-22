import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    hoverable?: boolean;
}

export function Card({ children, className, style, onClick, hoverable = false }: CardProps) {
    return (
        <div
            className={cn(
                'card rounded-xl p-4',
                'transition-[transform,border-color,box-shadow] duration-200',
                hoverable && 'card-hover cursor-pointer',
                onClick && 'cursor-pointer',
                className
            )}
            style={style}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
    return (
        <div className={cn('flex items-start justify-between mb-4', className)}>
            <div>
                <h3 className="text-lg font-semibold text-primary">{title}</h3>
                {subtitle && (
                    <p className="text-xs font-normal text-secondary mt-1">{subtitle}</p>
                )}
            </div>
            {action}
        </div>
    );
}

interface ProgressBarProps {
    value: number;
    max?: number;
    color?: string | undefined;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

const progressSizeClasses = {
    sm: 'h-1',
    md: 'h-3',
    lg: 'h-4',
};

export function ProgressBar({
    value,
    max = 100,
    color,
    size = 'md',
    showLabel = false,
    className,
}: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div className={cn('w-full', className)}>
            {showLabel && (
                <div className="flex justify-between text-sm text-secondary mb-1">
                    <span>{value} / {max}</span>
                    <span>{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={cn('w-full overflow-hidden rounded-full bg-surface-300', progressSizeClasses[size])}>
                <div
                    className={cn('h-full rounded-full transition-all duration-300', color || 'bg-[var(--color-accent)]')}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

interface ProgressRingProps {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    color?: string | undefined;
    backgroundColor?: string;
    children?: React.ReactNode;
}

export function ProgressRing({
    value,
    max = 100,
    size = 80,
    strokeWidth = 8,
    color = 'var(--color-accent)',
    backgroundColor = 'var(--color-bg-tertiary)',
    children,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500"
                />
            </svg>
            {children && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {children}
                </div>
            )}
        </div>
    );
}

interface BadgeProps {
    children: React.ReactNode;
    color?: string | undefined;
    variant?: 'solid' | 'outline';
    size?: 'sm' | 'md';
    className?: string;
}

const badgeSizeClasses = {
    sm: 'px-2 py-0.5 text-[0.6rem]',
    md: 'px-2.5 py-0.5 text-[0.65rem]',
};

export function Badge({
    children,
    color,
    variant = 'outline',
    size = 'sm',
    className,
}: BadgeProps) {
    const resolvedColor = color || 'var(--status-blue)';

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full font-mono tracking-wide uppercase',
                badgeSizeClasses[size],
                className
            )}
            style={{
                color: variant === 'solid' ? 'white' : resolvedColor,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: `color-mix(in srgb, ${resolvedColor} 30%, transparent)`,
                backgroundColor: variant === 'solid'
                    ? resolvedColor
                    : `color-mix(in srgb, ${resolvedColor} 10%, transparent)`,
            }}
        >
            {children}
        </span>
    );
}

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
            <div className="p-4 rounded-full bg-secondary mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-primary mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-secondary max-w-sm mb-4">{description}</p>
            )}
            {action}
        </div>
    );
}

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={cn('animate-pulse bg-secondary rounded', className)} />
    );
}
