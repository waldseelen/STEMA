/**
 * TimerControls — Duraklatma / Devam / Durdurma Düğmeleri
 *
 * RunningTimerBar içinde her aktif timer için kullanılır.
 */

import { useTranslation } from '@/i18n'
import type { RunningTimer } from '@/db/time-tracking/types'
import { clsx } from 'clsx'
import { Pause, Play, Square } from 'lucide-react'
import { useState } from 'react'
import { pauseTimer, resumeTimer, stopTimer } from '../../lib/timerService'

interface TimerControlsProps {
    timer: RunningTimer
    /** Küçük boyut (ActivityCard içi kullanım) */
    compact?: boolean
}

export function TimerControls({ timer, compact = false }: TimerControlsProps) {
    const t = useTranslation('tracker')
    const isPaused = timer.pausedAt != null
    const [busy, setBusy] = useState(false)

    const iconSize = compact ? 14 : 16

    async function handlePauseResume(e: React.MouseEvent) {
        e.stopPropagation()
        if (busy) return
        setBusy(true)
        try {
            if (isPaused) {
                await resumeTimer(timer.id)
            } else {
                await pauseTimer(timer.id)
            }
        } finally {
            setBusy(false)
        }
    }

    async function handleStop(e: React.MouseEvent) {
        e.stopPropagation()
        if (busy) return
        setBusy(true)
        try {
            await stopTimer(timer.id)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className={clsx('flex items-center', compact ? 'gap-1' : 'gap-2')}>
            {/* Duraklatma / Devam */}
            <button
                onClick={handlePauseResume}
                disabled={busy}
                className={clsx(
                    'rounded-lg transition-all flex items-center justify-center',
                    'disabled:opacity-40',
                    compact
                        ? 'w-7 h-7 bg-surface-200 hover:bg-surface-200'
                        : 'w-8 h-8 bg-surface-200 hover:bg-surface-200',
                )}
                aria-label={isPaused ? t('timer.resume') : t('timer.pause')}
            >
                {isPaused ? (
                    <Play size={iconSize} className="text-status-green" />
                ) : (
                    <Pause size={iconSize} className="text-amber-400" />
                )}
            </button>

            {/* Durdur */}
            <button
                onClick={handleStop}
                disabled={busy}
                className={clsx(
                    'rounded-lg transition-all flex items-center justify-center',
                    'disabled:opacity-40',
                    compact
                        ? 'w-7 h-7 bg-surface-200 hover:bg-status-red-soft'
                        : 'w-8 h-8 bg-surface-200 hover:bg-status-red-soft',
                )}
                aria-label={t('timer.stop')}
            >
                <Square size={iconSize} className="text-status-red" fill="currentColor" />
            </button>
        </div>
    )
}
