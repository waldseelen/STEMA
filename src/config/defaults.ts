/**
 * LifeFlow - Varsayılan Veri Tanımları
 *
 * Bu dosya veritabanına seed edilecek varsayılan verileri içerir.
 * İş mantığı veritabanı şemasından ayrı tutulmuştur.
 */

import type { Category, PomodoroConfig, Setting } from '@/db/types'
import { getCurrentLocale } from '@/i18n'
import { DB_CONSTANTS, DEFAULT_POMODORO, DEFAULT_SETTINGS } from './constants'

// ============================================
// Varsayılan Kategoriler
// ============================================

export type DefaultCategory = Omit<Category, 'createdAt' | 'updatedAt'>

const DEFAULT_LANGUAGE = typeof window !== 'undefined'
    ? getCurrentLocale()
    : DEFAULT_SETTINGS.LANGUAGE

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
    {
        id: 'cat-work',
        name: 'İş',
        color: '#06b6d4',
        icon: '💼',
        archived: false,
    },
    {
        id: 'cat-personal',
        name: 'Kişisel',
        color: '#22c55e',
        icon: '🏠',
        archived: false,
    },
    {
        id: 'cat-health',
        name: 'Sağlık',
        color: '#a3e635',
        icon: '❤️',
        archived: false,
    },
    {
        id: 'cat-learning',
        name: 'Öğrenme',
        color: '#f59e0b',
        icon: '📚',
        archived: false,
    },
]

// ============================================
// Varsayılan Ayarlar
// ============================================

export const DEFAULT_SETTINGS_DATA: Setting[] = [
    { key: 'rolloverHour', value: DEFAULT_SETTINGS.ROLLOVER_HOUR },
    { key: 'weekStart', value: DEFAULT_SETTINGS.WEEK_START },
    { key: 'theme', value: DEFAULT_SETTINGS.THEME },
    { key: 'language', value: DEFAULT_LANGUAGE },
    { key: 'multitaskingEnabled', value: DEFAULT_SETTINGS.MULTITASKING_ENABLED },
    { key: 'defaultPomodoroConfigId', value: DB_CONSTANTS.DEFAULT_POMODORO_ID },
    { key: 'pomodoroWorkDuration', value: DEFAULT_POMODORO.WORK_DURATION / 60 },
    { key: 'pomodoroBreakDuration', value: DEFAULT_POMODORO.SHORT_BREAK_DURATION / 60 },
    { key: 'pomodoroLongBreakDuration', value: DEFAULT_POMODORO.LONG_BREAK_DURATION / 60 },
    { key: 'pomodoroSessionsBeforeLongBreak', value: DEFAULT_POMODORO.SESSIONS_BEFORE_LONG_BREAK },
    { key: 'pomodoroAutoStartBreak', value: false },
    { key: 'pomodoroAutoStartWork', value: false },
    { key: 'pomodoroSoundEnabled', value: true },
    { key: 'mergeThresholdMinutes', value: DEFAULT_SETTINGS.MERGE_THRESHOLD_MINUTES },
    { key: 'commandBarPrefixEnabled', value: false },
]

// ============================================
// Varsayılan Pomodoro Yapılandırması
// ============================================

export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
    id: DB_CONSTANTS.DEFAULT_POMODORO_ID,
    name: 'Standart Pomodoro',
    workDuration: DEFAULT_POMODORO.WORK_DURATION,
    shortBreakDuration: DEFAULT_POMODORO.SHORT_BREAK_DURATION,
    longBreakDuration: DEFAULT_POMODORO.LONG_BREAK_DURATION,
    sessionsBeforeLongBreak: DEFAULT_POMODORO.SESSIONS_BEFORE_LONG_BREAK,
    isDefault: true,
}

// ============================================
// Kategori Renk Paleti
// ============================================

export const CATEGORY_COLORS = [
    { name: 'Turkuaz', value: '#06b6d4' },
    { name: 'Yeşil', value: '#22c55e' },
    { name: 'Lime', value: '#a3e635' },
    { name: 'Turuncu', value: '#f59e0b' },
    { name: 'Kırmızı', value: '#ef4444' },
    { name: 'Mor', value: '#8b5cf6' },
    { name: 'Pembe', value: '#ec4899' },
    { name: 'Mavi', value: '#3b82f6' },
    { name: 'İndigo', value: '#6366f1' },
    { name: 'Gri', value: '#64748b' },
] as const

// ============================================
// Kategori İkonları
// ============================================

export const CATEGORY_ICONS = [
    '💼', '🏠', '❤️', '📚', '💻', '🎨', '🎵', '🏃',
    '🧘', '📝', '🎮', '🍽️', '🛒', '🚗', '✈️', '💰',
    '🔧', '📱', '🎬', '📷', '🌱', '🐕', '☕', '🎯',
] as const

export type CategoryIcon = (typeof CATEGORY_ICONS)[number]
