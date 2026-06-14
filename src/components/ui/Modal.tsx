import { ReactNode, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  const [mounted, setMounted] = useState(isOpen)
  const dialogRef = useRef<HTMLDivElement>(null)

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
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const btn = dialogRef.current.querySelector<HTMLElement>('button')
      btn?.focus()
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <div className="modal-overlay" onClick={onClose} style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 0.15s' }}>
      <div
        ref={dialogRef}
        className={`modal-content p-0 ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-text">{title}</h2>
          <Button onClick={onClose} variant="ghost" size="icon" aria-label="Tutup">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
