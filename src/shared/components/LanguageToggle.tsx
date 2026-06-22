import { useSettingsStore } from '@/modules/settings/store/settingsStore'
import { useI18n, useTranslation } from '@/i18n'
import { clsx } from 'clsx'
import { Languages } from 'lucide-react'
import { useCallback } from 'react'

interface LanguageToggleProps {
    showLabel?: boolean
}

export function LanguageToggle({ showLabel = true }: LanguageToggleProps) {
    const { locale, setLocale } = useI18n()
    const t = useTranslation('common')
    const updateSetting = useSettingsStore(state => state.updateSetting)

    const handleToggle = useCallback(() => {
        const nextLocale = locale === 'tr' ? 'en' : 'tr'
        setLocale(nextLocale)
        void updateSetting('language', nextLocale)
    }, [locale, setLocale, updateSetting])

    return (
        <button
            type="button"
            onClick={handleToggle}
            data-onboarding-target="language-toggle"
            className={clsx(
                'btn-icon rounded-full border border-[var(--border-subtle)] bg-surface-100',
                showLabel ? 'min-w-[44px] gap-2 px-3 sm:min-w-[72px]' : 'h-10 w-10 px-0',
            )}
            aria-label={locale === 'tr' ? t('a11y.switchToEnglish') : t('a11y.switchToTurkish')}
            title={t('a11y.languageToggleTitle', { current: locale.toUpperCase() })}
        >
            <Languages size={16} />
            {showLabel && (
                <span className="hidden text-xs font-semibold tracking-[0.18em] sm:inline">
                    {locale.toUpperCase()}
                </span>
            )}
        </button>
    )
}
