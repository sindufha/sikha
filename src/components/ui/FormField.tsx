import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  helperText?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export default function FormField({ label, error, helperText, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="label">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-error font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-text-muted">{helperText}</p>}
    </div>
  )
}
