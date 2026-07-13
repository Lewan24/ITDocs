import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

// Single source of the modal-in keyframe — was previously duplicated as an
// inline <style> tag in every page that opened a modal.
let injected = false
function injectAnimation() {
  if (injected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = `@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }`
  document.head.appendChild(style)
  injected = true
}

interface ModalProps {
  onClose: () => void
  children: ReactNode
  maxWidth?: string
  /** Set false for dialogs (delete confirm) where Enter shouldn't submit a form */
  closeOnEscape?: boolean
}

export function Modal({ onClose, children, maxWidth = 'max-w-lg', closeOnEscape = true }: ModalProps) {
  useEffect(() => {
    injectAnimation()
    if (!closeOnEscape) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, closeOnEscape])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative bg-navy-800 border border-edge-strong rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden`}
        style={{ animation: 'modalIn 0.18s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-edge-subtle">
      <div>
        <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>
        {subtitle && <p className="text-[11px] text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-navy-700 transition-colors">
        <X size={15} />
      </button>
    </div>
  )
}

export function ModalBody({ children }: { children: ReactNode }) {
  return <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">{children}</div>
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between px-6 py-4 border-t border-edge-subtle bg-navy-900/50">{children}</div>
}
