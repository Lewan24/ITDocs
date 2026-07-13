import type { ReactNode } from 'react'
import { Star } from 'lucide-react'

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

/** Shared text input / select / textarea styling, with an error-state border. */
export function inputClass(error?: string, extra = '') {
  return `w-full px-3 py-2 rounded-lg bg-navy-700 border text-ink-primary text-xs placeholder:text-ink-muted focus:outline-none transition-colors ${error ? 'border-red-500/50 focus:border-red-500' : 'border-edge-default focus:border-blue-500'} ${extra}`
}

export function StarToggle({ checked, onChange, label = 'Add to favorites' }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div onClick={onChange} className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${checked ? 'bg-yellow-500/20 border-yellow-500/50' : 'border-edge-strong'}`}>
        {checked && <Star size={10} className="text-yellow-400 fill-yellow-400" />}
      </div>
      <span className="text-xs text-ink-secondary">{label}</span>
    </label>
  )
}
