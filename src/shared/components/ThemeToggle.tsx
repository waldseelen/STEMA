import { useTheme } from '@/app/providers/ThemeProvider'
import { useTranslation } from '@/i18n'
import { useSettingsStore } from '@/modules/settings/store/settingsStore'
import { MoonStar, SunMedium } from 'lucide-react'
import { useCallback } from 'react'

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme()
    const t = useTranslation('common')
    const updateSetting = useSettingsStore(state => state.updateSetting)
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

    const handleToggle = useCallback(() => {
        setTheme(nextTheme)
        void updateSetting('theme', nextTheme)
    }, [nextTheme, setTheme, updateSetting])

    const icon = resolvedTheme === 'dark'
        ? <MoonStar size={16} />
        : <SunMedium size={16} />
    const label = resolvedTheme === 'dark'
        ? t('a11y.switchToLightTheme')
        : t('a11y.switchToDarkTheme')

    return (
        <button
            type="button"
            onClick={handleToggle}
            data-onboarding-target="theme-toggle"
            className="btn-icon rounded-full border border-[var(--border-subtle)] bg-surface-100"
            aria-label={label}
            title={label}
            aria-pressed={resolvedTheme === 'dark'}
        >
            {icon}
        </button>
    )
}
