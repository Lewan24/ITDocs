import { useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: React.ReactNode
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  // Enter-to-confirm is specific to this dialog (a form modal shouldn't submit on Enter
  // from an arbitrary field), so it's wired here rather than in the shared Modal.
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Enter') onConfirm() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onConfirm])

  return (
    <Modal onClose={onCancel} maxWidth="max-w-sm">
      <div className="p-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={18} className="text-red-400" />
        </div>
        <h3 className="text-sm font-semibold text-ink-primary text-center mb-1">{title}</h3>
        <p className="text-xs text-ink-muted text-center mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs transition-colors border border-edge-default">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-medium transition-colors">{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  )
}
