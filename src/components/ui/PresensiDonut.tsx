import { cn } from '@/lib/utils'

interface Segment {
  label: string
  value: number
  color: string          // stroke color
  bgColor?: string       // background tint
  iconBg?: string        // icon background
}

interface PresensiDonutProps {
  segments: Segment[]
  total: number
  size?: number
  className?: string
}

export default function PresensiDonut({ segments, total, size = 180, className }: PresensiDonutProps) {
  const radius = 38
  const circumference = 2 * Math.PI * radius // ~238.76

  // Urutkan largest first untuk visual stacking
  const sorted = [...segments].sort((a, b) => b.value - a.value)
  let accumulated = 0

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          {/* Background circle */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />

          {/* Segments */}
          {sorted.map((seg) => {
            if (seg.value === 0) return null
            const pct = seg.value / total
            const offset = circumference * (1 - accumulated - pct)
            const dashLength = circumference * pct
            accumulated += pct
            return (
              <circle
                key={seg.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="10"
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            )
          })}

          {/* Inner circle (white) */}
          <circle cx="50" cy="50" r={radius - 8} fill="white" />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-text tabular-nums">{total}</span>
          <span className="text-[10px] text-text-muted font-medium">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-text-secondary">{seg.label}</span>
            <span className="font-semibold text-text tabular-nums">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
