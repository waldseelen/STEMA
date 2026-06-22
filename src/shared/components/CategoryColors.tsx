import { clsx } from 'clsx'
import type { ReactNode } from 'react'

// ============================================
// Category Color Utils
// ============================================

/**
 * Önceden tanımlı kategori renkleri
 */
export const categoryColors = {
    red: {
        name: 'Kırmızı',
        bg: 'bg-red-500',
        bgLight: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-300 dark:border-red-700',
        dot: 'bg-red-500',
        ring: 'ring-red-500',
    },
    blue: {
        name: 'Mavi',
        bg: 'bg-blue-500',
        bgLight: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-300 dark:border-blue-700',
        dot: 'bg-blue-500',
        ring: 'ring-blue-500',
    },
    green: {
        name: 'Yeşil',
        bg: 'bg-green-500',
        bgLight: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-300 dark:border-green-700',
        dot: 'bg-green-500',
        ring: 'ring-green-500',
    },
    orange: {
        name: 'Turuncu',
        bg: 'bg-orange-500',
        bgLight: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-300 dark:border-orange-700',
        dot: 'bg-orange-500',
        ring: 'ring-orange-500',
    },
    amber: {
        name: 'Amber',
        bg: 'bg-amber-500',
        bgLight: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-300 dark:border-amber-700',
        dot: 'bg-amber-500',
        ring: 'ring-amber-500',
    },
    yellow: {
        name: 'Sarı',
        bg: 'bg-yellow-500',
        bgLight: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-300 dark:border-yellow-700',
        dot: 'bg-yellow-500',
        ring: 'ring-yellow-500',
    },
    lime: {
        name: 'Lime',
        bg: 'bg-lime-500',
        bgLight: 'bg-lime-100 dark:bg-lime-900/30',
        text: 'text-lime-600 dark:text-lime-400',
        border: 'border-lime-300 dark:border-lime-700',
        dot: 'bg-lime-500',
        ring: 'ring-lime-500',
    },
    purple: {
        name: 'Mor',
        bg: 'bg-purple-500',
        bgLight: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-300 dark:border-purple-700',
        dot: 'bg-purple-500',
        ring: 'ring-purple-500',
    },
    pink: {
        name: 'Pembe',
        bg: 'bg-pink-500',
        bgLight: 'bg-pink-100 dark:bg-pink-900/30',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-300 dark:border-pink-700',
        dot: 'bg-pink-500',
        ring: 'ring-pink-500',
    },
    cyan: {
        name: 'Cyan',
        bg: 'bg-cyan-500',
        bgLight: 'bg-cyan-100 dark:bg-cyan-900/30',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-300 dark:border-cyan-700',
        dot: 'bg-cyan-500',
        ring: 'ring-cyan-500',
    },
    teal: {
        name: 'Teal',
        bg: 'bg-teal-500',
        bgLight: 'bg-teal-100 dark:bg-teal-900/30',
        text: 'text-teal-600 dark:text-teal-400',
        border: 'border-teal-300 dark:border-teal-700',
        dot: 'bg-teal-500',
        ring: 'ring-teal-500',
    },
    emerald: {
        name: 'Zümrüt',
        bg: 'bg-emerald-500',
        bgLight: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-300 dark:border-emerald-700',
        dot: 'bg-emerald-500',
        ring: 'ring-emerald-500',
    },
    sky: {
        name: 'Sky',
        bg: 'bg-sky-500',
        bgLight: 'bg-sky-100 dark:bg-sky-900/30',
        text: 'text-sky-600 dark:text-sky-400',
        border: 'border-sky-300 dark:border-sky-700',
        dot: 'bg-sky-500',
        ring: 'ring-sky-500',
    },
    indigo: {
        name: 'İndigo',
        bg: 'bg-indigo-500',
        bgLight: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-300 dark:border-indigo-700',
        dot: 'bg-indigo-500',
        ring: 'ring-indigo-500',
    },
    violet: {
        name: 'Viyole',
        bg: 'bg-violet-500',
        bgLight: 'bg-violet-100 dark:bg-violet-900/30',
        text: 'text-violet-600 dark:text-violet-400',
        border: 'border-violet-300 dark:border-violet-700',
        dot: 'bg-violet-500',
        ring: 'ring-violet-500',
    },
    fuchsia: {
        name: 'Fuşya',
        bg: 'bg-fuchsia-500',
        bgLight: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
        text: 'text-fuchsia-600 dark:text-fuchsia-400',
        border: 'border-fuchsia-300 dark:border-fuchsia-700',
        dot: 'bg-fuchsia-500',
        ring: 'ring-fuchsia-500',
    },
    rose: {
        name: 'Gül',
        bg: 'bg-rose-500',
        bgLight: 'bg-rose-100 dark:bg-rose-900/30',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-300 dark:border-rose-700',
        dot: 'bg-rose-500',
        ring: 'ring-rose-500',
    },
    stone: {
        name: 'Taş',
        bg: 'bg-stone-500',
        bgLight: 'bg-stone-100 dark:bg-stone-900/30',
        text: 'text-stone-600 dark:text-stone-400',
        border: 'border-stone-300 dark:border-stone-700',
        dot: 'bg-stone-500',
        ring: 'ring-stone-500',
    },
    slate: {
        name: 'Kayrak',
        bg: 'bg-slate-500',
        bgLight: 'bg-slate-100 dark:bg-slate-900/30',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-300 dark:border-slate-700',
        dot: 'bg-slate-500',
        ring: 'ring-slate-500',
    },
    neutral: {
        name: 'Nötr',
        bg: 'bg-neutral-500',
        bgLight: 'bg-neutral-100 dark:bg-neutral-900/30',
        text: 'text-neutral-600 dark:text-neutral-400',
        border: 'border-neutral-300 dark:border-neutral-700',
        dot: 'bg-neutral-500',
        ring: 'ring-neutral-500',
    },
    gray: {
        name: 'Gri',
        bg: 'bg-surface-500',
        bgLight: 'bg-surface-100 dark:bg-surface-900/40',
        text: 'text-surface-600 dark:text-surface-400',
        border: 'border-surface-300 dark:border-surface-700',
        dot: 'bg-surface-500',
        ring: 'ring-surface-500',
    },
} as const

export type CategoryColorKey = keyof typeof categoryColors

/**
 * Renk koduna göre stil döndürür
 */
export function getCategoryColorStyles(colorKey: CategoryColorKey | string) {
    return categoryColors[colorKey as CategoryColorKey] || categoryColors.gray
}

// ============================================
// Category Dot
// ============================================

interface CategoryDotProps {
    color: CategoryColorKey | string
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

/**
 * Kategori renk noktası
 * Liste öğelerinin solunda gösterilir
 */
export function CategoryDot({ color, size = 'md', className }: CategoryDotProps) {
    const styles = getCategoryColorStyles(color)
    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    }

    return (
        <span
            className={clsx(
                'rounded-full flex-shrink-0',
                styles.dot,
                sizeClasses[size],
                className
            )}
        />
    )
}

// ============================================
// Category Border
// ============================================

interface CategoryBorderProps {
    color: CategoryColorKey | string
    children: ReactNode
    position?: 'left' | 'top' | 'right' | 'bottom'
    className?: string
}

/**
 * Kategori renk bordürü
 * Kartların veya liste öğelerinin kenarında gösterilir
 */
export function CategoryBorder({
    color,
    children,
    position = 'left',
    className,
}: CategoryBorderProps) {
    const styles = getCategoryColorStyles(color)
    const borderClasses = {
        left: 'border-l-4',
        top: 'border-t-4',
        right: 'border-r-4',
        bottom: 'border-b-4',
    }

    return (
        <div
            className={clsx(
                borderClasses[position],
                styles.border,
                className
            )}
        >
            {children}
        </div>
    )
}

// ============================================
// Category Badge
// ============================================

interface CategoryBadgeProps {
    color: CategoryColorKey | string
    label: string
    size?: 'sm' | 'md'
    className?: string
}

/**
 * Kategori etiketi (badge)
 * Kompakt kategori gösterimi için
 */
export function CategoryBadge({ color, label, size = 'sm', className }: CategoryBadgeProps) {
    const styles = getCategoryColorStyles(color)
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
    }

    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1.5 rounded-full font-medium',
                styles.bgLight,
                styles.text,
                sizeClasses[size],
                className
            )}
        >
            <CategoryDot color={color} size="sm" />
            {label}
        </span>
    )
}

// ============================================
// Category Color Picker
// ============================================

interface CategoryColorPickerProps {
    value: CategoryColorKey
    onChange: (color: CategoryColorKey) => void
    className?: string
}

/**
 * Kategori renk seçici
 * Kategori oluşturma/düzenleme modalında kullanılır
 */
export function CategoryColorPicker({ value, onChange, className }: CategoryColorPickerProps) {
    const pickerOrder: CategoryColorKey[] = [
        'red',
        'orange',
        'amber',
        'yellow',
        'lime',
        'green',
        'emerald',
        'teal',
        'cyan',
        'sky',
        'blue',
        'indigo',
        'violet',
        'purple',
        'fuchsia',
        'pink',
        'rose',
        'stone',
        'slate',
        'neutral',
    ]

    return (
        <div className={clsx('grid grid-cols-5 sm:grid-cols-10 gap-2.5', className)}>
            {pickerOrder.map(key => {
                const colorStyles = categoryColors[key]
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onChange(key as CategoryColorKey)}
                        className={clsx(
                            'w-9 h-9 rounded-full transition-all duration-200 border border-white/10 shadow-sm',
                            colorStyles.bg,
                            value === key
                                ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-[#0f1117] scale-110'
                                : 'hover:scale-105',
                            value === key && colorStyles.ring,
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
                        )}
                        title={colorStyles.name}
                    />
                )
            })}
        </div>
    )
}
