import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-primary text-white shadow-sm hover:bg-primary-dark focus-visible:ring-2 focus-visible:ring-primary/30',
  secondary: 'bg-primary-50 text-primary-dark border border-primary-100 hover:bg-primary-100 focus-visible:ring-2 focus-visible:ring-primary/20',
  outline:   'bg-white text-text-secondary border border-border hover:bg-slate-50 hover:text-text focus-visible:ring-2 focus-visible:ring-border',
  ghost:     'bg-transparent text-text-secondary hover:bg-slate-100 hover:text-text focus-visible:ring-2 focus-visible:ring-border',
  danger:    'bg-error text-white shadow-sm hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-error/30',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm:   'h-9 px-3.5 text-xs rounded-lg gap-1.5',
  md:   'h-10 px-4 text-sm rounded-lg gap-2',
  icon: 'h-9 w-9 rounded-lg p-0',
}

export const buttonClassName = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  className?: string
}) => cn(
  'inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer',
  'focus-visible:outline-none focus-visible:ring-offset-2',
  'disabled:pointer-events-none disabled:opacity-50',
  'active:scale-[0.97]',
  variantClasses[variant],
  sizeClasses[size],
  fullWidth && 'w-full',
  loading && 'cursor-wait',
  className,
)

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    fullWidth = false,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClassName({ variant, size, fullWidth, loading, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" /> : null}
      <span className="inline-flex items-center gap-inherit leading-none">{children}</span>
    </button>
  )
})

export default Button
