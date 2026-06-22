export const ProgressBarDark = ({ percentage, colorClass }: { percentage: number; colorClass?: string }) => (
    <div className="w-full bg-[#0f0d15] rounded-full h-2 mt-2">
        <div
            className={`h-2 rounded-full transition-all duration-1000 ease-out ${colorClass || 'bg-gradient-to-r from-[#00aeef] via-[#29c6cd] to-[#ffd200]'}`}
            style={{ width: `${percentage}%` }}
        />
    </div>
)
