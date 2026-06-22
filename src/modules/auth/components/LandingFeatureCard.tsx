import { clsx } from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface LandingFeatureCardProps {
    icon: LucideIcon
    title: string
    description: string
    badge?: string
    eyebrow?: string
    subtle?: boolean
}

export function LandingFeatureCard({
    icon: Icon,
    title,
    description,
    badge,
    eyebrow,
    subtle = false,
}: LandingFeatureCardProps) {
    return (
        <article
            className={clsx(
                subtle ? 'card h-full p-5' : 'card-feature h-full p-6'
            )}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[1rem] bg-surface-200 text-text-secondary">
                    <Icon className="h-4.5 w-4.5" />
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        {eyebrow && (
                            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-text-muted">
                                {eyebrow}
                            </span>
                        )}
                        {badge && (
                            <span className="rounded-full border border-status-amber/20 bg-status-amber-soft px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-status-amber">
                                {badge}
                            </span>
                        )}
                    </div>

                    <h3 className="mt-2 text-base font-semibold text-text-primary">
                        {title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                        {description}
                    </p>
                </div>
            </div>
        </article>
    )
}
