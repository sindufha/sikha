import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-success" />,
  error:   <AlertCircle className="w-5 h-5 text-error" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
  info:    <Info className="w-5 h-5 text-info" />,
}

const BG_CLASSES: Record<ToastType, string> = {
  success: 'bg-white border-l-4 border-success shadow-dropdown',
  error:   'bg-white border-l-4 border-error shadow-dropdown',
  warning: 'bg-white border-l-4 border-warning shadow-dropdown',
  info:    'bg-white border-l-4 border-info shadow-dropdown',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [exiting, setExiting] = useState<Set<string>>(new Set())

  const removeToast = useCallback((id: string) => {
    setExiting((prev) => new Set(prev).add(id))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      setExiting((prev) => { const next = new Set(prev); next.delete(id); return next })
    }, 300)
  }, [])

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => removeToast(id), 4500)
  }, [removeToast])

  const toast = useCallback((type: ToastType, title: string, message?: string) => addToast(type, title, message), [addToast])
  const success = useCallback((title: string, message?: string) => addToast('success', title, message), [addToast])
  const error = useCallback((title: string, message?: string) => addToast('error', title, message), [addToast])
  const warning = useCallback((title: string, message?: string) => addToast('warning', title, message), [addToast])
  const info = useCallback((title: string, message?: string) => addToast('info', title, message), [addToast])

  const contextValue = useMemo(
    () => ({ toast, success, error, warning, info }),
    [toast, success, error, warning, info],
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto rounded-xl p-4 flex items-start gap-3',
              BG_CLASSES[t.type],
              exiting.has(t.id) ? 'animate-[toastSlideOut_0.3s_ease-in_forwards]' : 'animate-[toastSlideIn_0.35s_ease-out]',
            )}
            role="alert"
          >
            <span className="shrink-0 mt-0.5">{ICONS[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">{t.title}</p>
              {t.message && <p className="text-xs text-text-secondary mt-0.5">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-lg p-1 text-text-muted hover:bg-slate-100 hover:text-text transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
