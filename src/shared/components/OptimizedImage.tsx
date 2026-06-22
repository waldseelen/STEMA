import { clsx } from 'clsx'
import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react'

/**
 * Optimize Edilmiş Görsel Bileşeni
 *
 * Özellikler:
 * - Lazy loading (native + IntersectionObserver fallback)
 * - WebP format desteği ve fallback
 * - Blur placeholder efekti
 * - Loading skeleton
 * - Hata durumu yönetimi
 * - Responsive srcset desteği
 *
 * Kullanım:
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   webpSrc="/images/hero.webp"
 *   alt="Hero görsel"
 *   width={800}
 *   height={600}
 * />
 */

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
    /** Görsel kaynağı (jpg, png, vb.) */
    src: string
    /** WebP formatındaki kaynak (opsiyonel) */
    webpSrc?: string
    /** Alt metin (erişilebilirlik için zorunlu) */
    alt: string
    /** Görsel genişliği */
    width?: number
    /** Görsel yüksekliği */
    height?: number
    /** Aspect ratio (örn: "16/9", "4/3") */
    aspectRatio?: string
    /** Placeholder rengi veya blur data URL */
    placeholder?: string
    /** Lazy loading devre dışı bırak */
    eager?: boolean
    /** Responsive srcset tanımları */
    srcSet?: string
    /** Responsive sizes tanımları */
    sizes?: string
    /** Object-fit stili */
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
    /** Yükleme callback'i */
    onLoadComplete?: () => void
    /** Hata callback'i */
    onLoadError?: (error: Error) => void
}

export function OptimizedImage({
    src,
    webpSrc,
    alt,
    width,
    height,
    aspectRatio,
    placeholder = 'bg-surface-200 dark:bg-surface-700',
    eager = false,
    srcSet,
    sizes,
    objectFit = 'cover',
    className,
    onLoadComplete,
    onLoadError,
    ...props
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [isInView, setIsInView] = useState(eager)
    const imgRef = useRef<HTMLImageElement>(null)

    // IntersectionObserver ile lazy loading
    useEffect(() => {
        if (eager || isInView) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true)
                        observer.disconnect()
                    }
                })
            },
            {
                rootMargin: '200px', // Viewport'a 200px yaklaşınca yükle
                threshold: 0.01
            }
        )

        if (imgRef.current) {
            observer.observe(imgRef.current)
        }

        return () => observer.disconnect()
    }, [eager, isInView])

    const handleLoad = () => {
        setIsLoaded(true)
        onLoadComplete?.()
    }

    const handleError = () => {
        setHasError(true)
        onLoadError?.(new Error(`Görsel yüklenemedi: ${src}`))
    }

    // Container stilleri
    const containerStyle: React.CSSProperties = {
        aspectRatio: aspectRatio,
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined
    }

    // Hata durumu
    if (hasError) {
        return (
            <div
                className={clsx(
                    'flex items-center justify-center',
                    placeholder,
                    'rounded-xl text-surface-400',
                    className
                )}
                style={containerStyle}
                role="img"
                aria-label={alt}
            >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        )
    }

    return (
        <div
            ref={imgRef}
            className={clsx(
                'relative overflow-hidden rounded-xl',
                !isLoaded && placeholder,
                className
            )}
            style={containerStyle}
        >
            {/* Loading skeleton */}
            {!isLoaded && (
                <div className="absolute inset-0 skeleton animate-pulse" />
            )}

            {/* Görsel - yalnızca viewport'ta ise yükle */}
            {isInView && (
                <picture>
                    {/* WebP format (modern tarayıcılar için) */}
                    {webpSrc && (
                        <source srcSet={webpSrc} type="image/webp" />
                    )}

                    {/* Fallback format */}
                    <img
                        src={src}
                        alt={alt}
                        width={width}
                        height={height}
                        srcSet={srcSet}
                        sizes={sizes}
                        loading={eager ? 'eager' : 'lazy'}
                        decoding="async"
                        onLoad={handleLoad}
                        onError={handleError}
                        className={clsx(
                            'w-full h-full transition-opacity duration-300',
                            objectFit === 'cover' && 'object-cover',
                            objectFit === 'contain' && 'object-contain',
                            objectFit === 'fill' && 'object-fill',
                            objectFit === 'none' && 'object-none',
                            objectFit === 'scale-down' && 'object-scale-down',
                            isLoaded ? 'opacity-100' : 'opacity-0'
                        )}
                        {...props}
                    />
                </picture>
            )}
        </div>
    )
}

/**
 * Basit lazy loading için yardımcı hook
 */
export function useLazyLoad(options?: IntersectionObserverInit) {
    const [isInView, setIsInView] = useState(false)
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true)
                        observer.disconnect()
                    }
                })
            },
            {
                rootMargin: '100px',
                threshold: 0.01,
                ...options
            }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [options])

    return { ref, isInView }
}
