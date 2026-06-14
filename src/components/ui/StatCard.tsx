import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}

const COLOR_ACCENTS = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-dark' },
  success: { bg: 'bg-success-bg', text: 'text-success-text' },
  warning: { bg: 'bg-warning-bg', text: 'text-warning-text' },
  error:   { bg: 'bg-error-bg', text: 'text-error-text' },
  info:    { bg: 'bg-info-bg', text: 'text-info-text' },
}

export default function StatCard({ label, value, icon, color = 'primary', className }: StatCardProps) {
  const accent = COLOR_ACCENTS[color]

  return (
    <div className={cn('card flex items-center gap-4 animate-in', className)}>
      {icon && (
        <div className={cn('shrink-0 w-11 h-11 rounded-xl flex items-center justify-center', accent.bg)}>
          <span className={cn(accent.text)}>{icon}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted truncate">{label}</p>
        <p className="text-2xl font-bold text-text leading-tight mt-0.5 tabular-nums">{value}</p>
      </div>
    </div>
  )
}
