import { useRef, useEffect, useState, type ReactNode } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string | ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

const VARIANTS = {
  danger:  { icon: AlertTriangle, iconColor: 'text-error', buttonVariant: 'danger' as const, bgColor: 'bg-error-bg' },
  warning: { icon: AlertTriangle, iconColor: 'text-warning', buttonVariant: 'primary' as const, bgColor: 'bg-warning-bg' },
  info:    { icon: AlertTriangle, iconColor: 'text-info', buttonVariant: 'primary' as const, bgColor: 'bg-info-bg' },
}

export default function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Ya, Hapus', cancelLabel = 'Batal',
  variant = 'danger', loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      const timer = setTimeout(() => setMounted(false), 200)
      return () => clearTimeout(timer)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && !loading) onConfirm()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose, onConfirm, loading])

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusable = dialogRef.current.querySelector<HTMLElement>('button')
      focusable?.focus()
    }
  }, [isOpen])

  if (!mounted) return null

  const { icon: Icon, iconColor, buttonVariant, bgColor } = VARIANTS[variant]

  return (
    <div className="modal-overlay" onClick={onClose} style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 0.15s' }}>
      <div
        ref={dialogRef}
        className="modal-content max-w-sm p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 p-5">
          <div className={`shrink-0 w-10 h-10 rounded-full ${bgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-base font-bold text-text">{title}</h3>
            <div className="text-sm text-text-secondary mt-1">{message}</div>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-slate-100 transition-colors" aria-label="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 bg-slate-50 border-t border-border">
          <Button onClick={onClose} variant="ghost" size="sm" disabled={loading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} variant={buttonVariant} size="sm" loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
