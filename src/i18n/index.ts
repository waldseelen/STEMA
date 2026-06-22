/**
 * i18n Module Index
 */

// Configuration
export {
    DEFAULT_LOCALE, LOCALE_NAMES, NAMESPACES, SUPPORTED_LOCALES, createT,
    getBrowserLocale, getCurrentLocale, getStoredLocale, getTranslation, setStoredLocale, translateCurrentLocale, translations, type Locale,
    type Namespace
} from './config'

// React Integration
export {
    I18nProvider, useDateFormatter, useI18n,
    useLocale, useNumberFormatter, useTranslation,
    useTranslations
} from './I18nProvider'

