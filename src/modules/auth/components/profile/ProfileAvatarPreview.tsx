import { sanitizeRemoteImageUrl } from '@/modules/auth/lib/security'
import { UserCircle2 } from 'lucide-react'
import { useMemo } from 'react'

interface ProfileAvatarPreviewProps {
    avatarUrl?: string | null
    displayName?: string
    email?: string
    hint?: string
    size?: 'md' | 'lg'
}

export function ProfileAvatarPreview({
    avatarUrl,
    displayName,
    email,
    hint,
    size = 'md',
}: ProfileAvatarPreviewProps) {
    const safeAvatarUrl = sanitizeRemoteImageUrl(avatarUrl)
    const initials = useMemo(
        () =>
            (displayName || email || 'P')
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map(part => part[0]?.toUpperCase() ?? '')
                .join(''),
        [displayName, email]
    )

    const avatarSizeClass = size === 'lg' ? 'h-12 w-12 rounded-full text-sm' : 'h-10 w-10 rounded-full text-sm'

    return (
        <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center overflow-hidden border border-[var(--border-subtle)] bg-surface-200 font-semibold text-text-primary ${avatarSizeClass}`}>
                {safeAvatarUrl ? (
                    <img
                        src={safeAvatarUrl}
                        alt={displayName || email || 'Profile avatar'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                    />
                ) : initials ? (
                    initials
                ) : (
                    <UserCircle2 className="h-8 w-8 text-text-muted" aria-hidden />
                )}
            </div>

            <div className="min-w-0">
                {displayName && (
                    <p className="truncate text-sm font-semibold text-text-primary">
                        {displayName}
                    </p>
                )}
                {email && (
                    <p className="truncate text-sm text-text-secondary">
                        {email}
                    </p>
                )}
                {hint && (
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                        {hint}
                    </p>
                )}
            </div>
        </div>
    )
}
