import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  fullPage?: boolean
  message?: string
  className?: string
}

export default function LoadingSpinner({ fullPage = true, message = 'Memuat...', className }: LoadingSpinnerProps) {
  return (
    <div className={cn(
      'flex items-center justify-center',
      fullPage ? 'min-h-screen' : 'py-16',
      className,
    )}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        {message && <p className="text-sm text-text-muted">{message}</p>}
      </div>
    </div>
  )
}
