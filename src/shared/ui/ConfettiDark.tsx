import { CSSProperties, useEffect, useState } from 'react'

interface ConfettiProps {
    active: boolean
    onComplete?: () => void
}

interface Particle {
    id: number
    x: number
    y: number
    color: string
    rotation: number
    scale: number
    vx: number
    vy: number
}

const COLORS = ['#00aeef', '#29c6cd', '#ffd200', '#f4e04d', '#10b981', '#6366f1']

export const ConfettiDark = ({ active, onComplete }: ConfettiProps) => {
    const [particles, setParticles] = useState<Particle[]>([])

    useEffect(() => {
        if (!active) {
            setParticles([])
            return
        }

        // Konfeti parçacıkları oluştur
        const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: 50 + (Math.random() - 0.5) * 20,
            y: 50,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            rotation: Math.random() * 360,
            scale: 0.5 + Math.random() * 0.5,
            vx: (Math.random() - 0.5) * 15,
            vy: -10 - Math.random() * 10,
        }))

        setParticles(newParticles)

        // Animasyonu bitir
        const timer = setTimeout(() => {
            setParticles([])
            onComplete?.()
        }, 2000)

        return () => clearTimeout(timer)
    }, [active, onComplete])

    if (!active || particles.length === 0) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="absolute w-3 h-3 animate-confetti"
                    style={
                        {
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            backgroundColor: particle.color,
                            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
                            '--vx': particle.vx,
                            '--vy': particle.vy,
                        } as CSSProperties
                    }
                />
            ))}
        </div>
    )
}
