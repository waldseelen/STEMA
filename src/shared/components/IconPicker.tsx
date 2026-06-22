import { ICON_CATALOG, ICON_CATEGORY_LABEL_KEYS } from '@/config/icons'
import { useTranslations } from '@/i18n'
import { clsx } from 'clsx'
import * as LucideIcons from 'lucide-react'
import { Search as SearchIcon, type LucideProps } from 'lucide-react'
import {
    useDeferredValue,
    useId,
    useMemo,
    useState,
    type ChangeEvent,
    type ComponentType,
    type MouseEvent,
} from 'react'

interface IconPickerProps {
    value: string
    onSelect: (icon: string) => void
}

type DynamicIconProps = LucideProps & {
    name: string
}

const lucideIconMap =
    LucideIcons as unknown as Record<string, ComponentType<LucideProps>>

function DynamicIcon({ name, ...props }: DynamicIconProps) {
    const Icon = lucideIconMap[name]

    if (!Icon) {
        return <span className="text-[10px] text-text-muted">{name}</span>
    }

    return <Icon {...props} />
}

export function IconPicker({ value, onSelect }: IconPickerProps) {
    const t = useTranslations(['tracker'])
    const [query, setQuery] = useState('')
    const deferredQuery = useDeferredValue(query.trim().toLowerCase())
    const searchInputId = useId()

    const filteredCatalog = useMemo(() => {
        return Object.entries(ICON_CATALOG).reduce<Array<[string, string[]]>>((sections, [category, icons]) => {
            const filteredIcons = deferredQuery
                ? icons.filter(iconName => iconName.toLowerCase().includes(deferredQuery))
                : icons

            if (filteredIcons.length > 0) {
                sections.push([category, filteredIcons])
            }

            return sections
        }, [])
    }, [deferredQuery])

    const hasResults = filteredCatalog.length > 0

    function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
        setQuery(event.target.value)
    }

    function handleIconClick(event: MouseEvent<HTMLButtonElement>) {
        const iconName = event.currentTarget.dataset.iconName

        if (!iconName) {
            return
        }

        onSelect(iconName)
    }

    function getCategoryLabel(category: string) {
        const translationKey = ICON_CATEGORY_LABEL_KEYS[category]
        return translationKey ? t('tracker', translationKey) : category
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <SearchIcon
                    size={16}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
                    aria-hidden="true"
                />
                <input
                    id={searchInputId}
                    type="search"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder={t('tracker', 'activity.iconSearchPlaceholder')}
                    aria-label={t('tracker', 'activity.iconSearchPlaceholder')}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-surface-100 py-2.5 pr-3 pl-10 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-[var(--border-medium)] focus:bg-surface-200"
                    autoComplete="off"
                    spellCheck={false}
                />
            </div>

            {hasResults ? (
                <div className="flex max-h-[26rem] flex-col gap-4 overflow-y-auto pr-1">
                    {filteredCatalog.map(([category, icons]) => {
                        const headingId = `${searchInputId}-${category
                            .toLowerCase()
                            .replaceAll(' ', '-')
                            .replaceAll('&', 've')}`

                        return (
                            <section key={category} aria-labelledby={headingId} className="flex flex-col gap-2">
                                <h3
                                    id={headingId}
                                    className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted"
                                >
                                    {getCategoryLabel(category)}
                                </h3>
                                <div className="grid grid-flow-col auto-cols-max grid-rows-2 gap-2 overflow-x-auto pb-1">
                                    {icons.map(iconName => {
                                        const isSelected = value === iconName

                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                data-icon-name={iconName}
                                                data-selected={isSelected}
                                                onClick={handleIconClick}
                                                className={clsx(
                                                    'flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-surface-100 text-text-secondary transition-colors',
                                                    'hover:bg-surface-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-medium)]',
                                                    'data-[selected=true]:border-[rgb(var(--color-accent-rgb)/0.32)] data-[selected=true]:bg-surface-200 data-[selected=true]:text-[var(--color-accent)]',
                                                )}
                                                title={iconName}
                                                aria-label={iconName}
                                                aria-pressed={isSelected}
                                            >
                                                <DynamicIcon name={iconName} size={18} strokeWidth={2} />
                                            </button>
                                        )
                                    })}
                                </div>
                            </section>
                        )
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-surface-100 px-3 py-6 text-center text-sm text-text-muted">
                    {t('tracker', 'activity.iconEmpty')}
                </div>
            )}
        </div>
    )
}
