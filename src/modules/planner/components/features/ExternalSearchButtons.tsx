/**
 * ExternalSearchButtons Component
 *
 * Görev/Task itemları içinde Google, YouTube, ChatGPT
 * arama butonları için küçük icon button bileşeni.
 *
 * Davranış:
 * - Buton → task başlığı + açıklaması ile arama yapar
 * - Yeni sekmede açılır
 * - UI minimal, icon-only, hover tooltip'li
 */

import { useTranslation } from '@/i18n'
import { Bot, Search, Youtube } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ExternalSearchButtonsProps {
    /** Arama yapılacak ana metin (görev başlığı) */
    title: string
    /** Opsiyonel açıklama (varsa aramaya eklenir) */
    description?: string
    /** Buton boyutu */
    size?: 'sm' | 'md'
    /** Ek CSS class */
    className?: string
}

export function ExternalSearchButtons({
    title,
    description,
    size = 'sm',
    className,
}: ExternalSearchButtonsProps) {
    const t = useTranslation('planner')

    // Arama metnini oluştur
    const getSearchQuery = () => {
        const parts = [title]
        if (description?.trim()) {
            parts.push(description.trim())
        }
        return parts.join(' ')
    }

    const openGoogleSearch = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const query = getSearchQuery()
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    const openYouTubeSearch = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const query = getSearchQuery()
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    const openChatGPTSearch = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const query = getSearchQuery()
        const url = `https://chat.openai.com/?q=${encodeURIComponent(query)}`
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
    const buttonSize = size === 'sm' ? 'p-1.5' : 'p-2'

    const buttonClass = cn(
        'rounded-md transition-all duration-150',
        'hover:scale-110 active:scale-95',
        'opacity-60 hover:opacity-100',
        buttonSize
    )

    return (
        <div className={cn('flex items-center gap-0.5', className)}>
            <button
                type="button"
                onClick={openGoogleSearch}
                className={cn(buttonClass, 'hover:bg-blue-500/20 hover:text-blue-400')}
                title={t('search.searchOnGoogle')}
                aria-label={t('search.searchFor', { title, provider: 'Google' })}
            >
                <Search className={iconSize} />
            </button>

            <button
                type="button"
                onClick={openYouTubeSearch}
                className={cn(buttonClass, 'hover:bg-red-500/20 hover:text-red-400')}
                title={t('search.searchOnYouTube')}
                aria-label={t('search.searchFor', { title, provider: 'YouTube' })}
            >
                <Youtube className={iconSize} />
            </button>

            <button
                type="button"
                onClick={openChatGPTSearch}
                className={cn(buttonClass, 'hover:bg-emerald-500/20 hover:text-emerald-400')}
                title={t('search.askOnChatGPT')}
                aria-label={t('search.askFor', { title })}
            >
                <Bot className={iconSize} />
            </button>
        </div>
    )
}
