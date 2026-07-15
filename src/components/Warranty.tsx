import { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, X, Edit2, Trash2, Star, ArrowLeft, Copy, Eye,
  Paperclip, FileText, Shield, Calendar, Phone, Mail, Building2,
  CheckCircle2, AlertTriangle, Clock, Upload, ChevronDown,
} from 'lucide-react'
import { useApp } from '../context/useApp'
import type { WarrantyItem, WarrantyType, WarrantyDocument } from '../context/AppContext'

const WARRANTY_TYPES: WarrantyType[] = ['Standard', 'Extended', 'On-Site NBD', 'Carry-In', 'Mail-In', 'Other']
const STATUS_FILTERS = ['All', 'Active', 'Expiring', 'Expired'] as const

const STATUS_STYLES = {
  active: { badge: 'text-green-400 bg-green-500/10 border-green-500/25', icon: CheckCircle2, label: 'Active' },
  expiring: { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/25', icon: AlertTriangle, label: 'Expiring' },
  expired: { badge: 'text-red-400 bg-red-500/10 border-red-500/25', icon: Clock, label: 'Expired' },
}

function daysUntil(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.ceil(bytes / 1024)} KB`
}

function formatDate(d: string): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return d }
}

function inp(error?: string) {
  return `w-full px-3 py-2 rounded-lg bg-navy-700 border text-ink-primary text-xs placeholder:text-ink-muted focus:outline-none transition-colors ${error ? 'border-red-500/50 focus:border-red-500' : 'border-edge-default focus:border-blue-500'}`
}

// ─── Document Uploader (shared) ────────────────────────────────────────────────

function DocUploader({ doc, onChange }: { doc?: WarrantyDocument; onChange: (d: WarrantyDocument | undefined) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [warning, setWarning] = useState('')

  const handleFile = (file: File) => {
    setWarning('')
    if (file.size > 5 * 1024 * 1024) {
      setWarning(`File is large (${formatSize(file.size)}). Large files may affect performance.`)
    }
    const reader = new FileReader()
    reader.onload = () => {
      onChange({
        name: file.name,
        mimeType: file.type,
        size: file.size,
        data: reader.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  const viewDoc = () => {
    if (!doc) return
    const byteStr = atob(doc.data.split(',')[1])
    const ab = new Uint8Array(byteStr.length)
    for (let i = 0; i < byteStr.length; i++) ab[i] = byteStr.charCodeAt(i)
    const blob = new Blob([ab], { type: doc.mimeType })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const isPdf = doc?.mimeType === 'application/pdf'

  return (
    <div>
      <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      {doc ? (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-navy-700 border border-edge-default">
          <div className="w-7 h-7 rounded-md bg-navy-600 border border-edge-subtle flex items-center justify-center flex-shrink-0">
            <FileText size={13} className={isPdf ? 'text-red-400' : 'text-blue-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink-primary truncate font-mono">{doc.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${isPdf ? 'text-red-400 bg-red-500/10 border-red-500/25' : 'text-blue-400 bg-blue-500/10 border-blue-500/25'}`}>{isPdf ? 'PDF' : 'Image'}</span>
              <span className="text-[10px] text-ink-muted">{formatSize(doc.size)}</span>
            </div>
          </div>
          <button onClick={viewDoc} className="p-1.5 rounded-md bg-navy-600 border border-edge-subtle text-ink-muted hover:text-blue-400 transition-colors" title="View"><Eye size={12} /></button>
          <button onClick={() => onChange(undefined)} className="p-1.5 rounded-md bg-navy-600 border border-edge-subtle text-ink-muted hover:text-red-400 transition-colors" title="Remove"><X size={12} /></button>
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-700 border border-edge-default text-ink-secondary text-xs hover:bg-navy-600 hover:border-edge-strong transition-colors w-full">
          <Paperclip size={12} /> Attach PDF / Image
        </button>
      )}
      {warning && <p className="text-[10px] text-orange-400 mt-1.5 flex items-center gap-1"><AlertTriangle size={10} /> {warning}</p>}
    </div>
  )
}

// ─── Warranty Form Modal ───────────────────────────────────────────────────────

interface FormProps { initial?: WarrantyItem; onSave: (d: Omit<WarrantyItem, 'id' | 'starred' | 'status'>) => void; onClose: () => void }

function WarrantyForm({ initial, onSave, onClose }: FormProps) {
  const { assets } = useApp()
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    vendor: initial?.vendor ?? '',
    serialNumber: initial?.serialNumber ?? '',
    assetId: initial?.assetId ?? '',
    purchaseDate: initial?.purchaseDate ?? '',
    warrantyEndDate: initial?.warrantyEndDate ?? '',
    warrantyType: (initial?.warrantyType ?? 'Standard') as WarrantyType,
    contactName: initial?.contactName ?? '',
    contactPhone: initial?.contactPhone ?? '',
    contactEmail: initial?.contactEmail ?? '',
    notes: initial?.notes ?? '',
    document: initial?.document as WarrantyDocument | undefined,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => { firstRef.current?.focus() }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const set = (k: string, v: unknown) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.warrantyEndDate) e.warrantyEndDate = 'Required'
    setErrors(e); return Object.keys(e).length === 0
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-navy-800 border border-edge-strong rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ animation: 'modalIn 0.18s ease-out' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge-subtle">
          <div>
            <h2 className="text-sm font-semibold text-ink-primary">{initial ? 'Edit Warranty' : 'Add Warranty'}</h2>
            <p className="text-[11px] text-ink-muted mt-0.5">{initial ? `Editing ${initial.name}` : 'Track a new warranty record'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-navy-700 transition-colors"><X size={15} /></button>
        </div>

        <div className="px-5 py-4 space-y-3.5 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Item Name *</label>
            <input ref={firstRef} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Dell PowerEdge R750"
              className={inp(errors.name)} />
            {errors.name && <p className="text-[10px] text-red-400 mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Vendor</label>
              <input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="e.g. Dell Technologies" className={inp()} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Serial Number</label>
              <input value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="SN-XXXXX" className={inp() + ' font-mono'} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Linked Asset (optional)</label>
            <div className="relative">
              <select value={form.assetId} onChange={e => set('assetId', e.target.value)} className={inp() + ' appearance-none pr-8'}>
                <option value="">— None —</option>
                {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} className={inp()} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Warranty Expires *</label>
              <input type="date" value={form.warrantyEndDate} onChange={e => set('warrantyEndDate', e.target.value)} className={inp(errors.warrantyEndDate)} />
              {errors.warrantyEndDate && <p className="text-[10px] text-red-400 mt-1">{errors.warrantyEndDate}</p>}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Warranty Type</label>
            <div className="relative">
              <select value={form.warrantyType} onChange={e => set('warrantyType', e.target.value as WarrantyType)} className={inp() + ' appearance-none pr-8'}>
                {WARRANTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Contact Name</label>
              <input value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Name" className={inp()} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Contact Phone</label>
              <input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+1-800…" className={inp()} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Contact Email</label>
              <input value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="support@…" className={inp()} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any notes…"
              className={inp() + ' resize-none leading-relaxed'} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Document</label>
            <DocUploader doc={form.document} onChange={d => set('document', d)} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-edge-subtle bg-navy-900/50">
          <button onClick={onClose} className="px-3.5 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs transition-colors border border-edge-default">Cancel</button>
          <button onClick={() => { if (validate()) onSave(form) }} className="px-3.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-xs font-medium transition-all" style={{ boxShadow: '0 1px 12px rgba(37,99,235,0.35)' }}>
            {initial ? 'Save Changes' : 'Add Warranty'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────

function WarrantyDetail({ item, onBack, onEdit, onDelete }: {
  item: WarrantyItem
  onBack?: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { assets, toggleStarWarranty, updateWarranty } = useApp()
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const days = daysUntil(item.warrantyEndDate)
  const statusInfo = STATUS_STYLES[item.status]
  const StatusIcon = statusInfo.icon
  const linkedAsset = assets.find(a => a.id === item.assetId)

  const copy = (text: string, field: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1800)
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-primary transition-colors mb-4">
          <ArrowLeft size={13} /> Back to list
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-navy-700 border border-edge-default flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-ink-primary truncate">{item.name}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 ${statusInfo.badge}`}>
                <StatusIcon size={9} />{statusInfo.label}
              </span>
              {linkedAsset && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-edge-default bg-navy-700 text-ink-muted">
                  {linkedAsset.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => toggleStarWarranty(item.id)}
            className={`p-2 rounded-lg border transition-all ${item.starred ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-navy-800 border-edge-default text-ink-muted hover:text-yellow-400'}`}>
            <Star size={13} fill={item.starred ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onEdit} className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-navy-800 border border-edge-default text-ink-secondary text-xs hover:border-edge-strong transition-colors">
            <Edit2 size={12} /><span className="hidden sm:inline">Edit</span>
          </button>
          <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg bg-navy-800 border border-edge-default text-ink-muted hover:text-red-400 hover:border-red-500/30 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div className="bg-navy-800 border border-edge-subtle rounded-xl p-4 sm:p-5 mb-4">
        <h3 className="text-xs font-semibold text-ink-primary mb-4 flex items-center gap-2"><Calendar size={13} className="text-blue-400" /> Warranty Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1">Vendor</p>
            <p className="text-xs text-ink-primary flex items-center gap-1.5"><Building2 size={11} className="text-ink-muted" />{item.vendor || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1">Serial Number</p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-ink-primary font-mono">{item.serialNumber || '—'}</p>
              {item.serialNumber && (
                <button onClick={() => copy(item.serialNumber, 'serial')} className={`p-1 rounded transition-colors ${copiedField === 'serial' ? 'text-green-400' : 'text-ink-muted hover:text-blue-400'}`}><Copy size={11} /></button>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1">Purchase Date</p>
            <p className="text-xs text-ink-primary">{item.purchaseDate ? formatDate(item.purchaseDate) : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1">Warranty Expires</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-ink-primary">{formatDate(item.warrantyEndDate)}</p>
              {item.warrantyEndDate && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  days > 30 ? 'text-green-400 bg-green-500/10 border-green-500/25'
                  : days > 0 ? 'text-orange-400 bg-orange-500/10 border-orange-500/25'
                  : 'text-red-400 bg-red-500/10 border-red-500/25'
                }`}>
                  {days > 0 ? `${days}d remaining` : `${Math.abs(days)}d ago`}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1">Warranty Type</p>
            <p className="text-xs text-ink-primary">{item.warrantyType}</p>
          </div>
        </div>
      </div>

      {/* Support Contact */}
      {(item.contactName || item.contactPhone || item.contactEmail) && (
        <div className="bg-navy-800 border border-edge-subtle rounded-xl p-4 sm:p-5 mb-4">
          <h3 className="text-xs font-semibold text-ink-primary mb-4 flex items-center gap-2"><Phone size={13} className="text-green-400" /> Support Contact</h3>
          <div className="space-y-2.5">
            {item.contactName && (
              <div className="flex items-center gap-2">
                <Building2 size={12} className="text-ink-muted flex-shrink-0" />
                <span className="text-xs text-ink-secondary">{item.contactName}</span>
              </div>
            )}
            {item.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-ink-muted flex-shrink-0" />
                <span className="text-xs text-ink-secondary font-mono">{item.contactPhone}</span>
                <button onClick={() => copy(item.contactPhone, 'phone')} className={`p-1 rounded transition-colors ${copiedField === 'phone' ? 'text-green-400' : 'text-ink-muted hover:text-blue-400'}`}><Copy size={11} /></button>
              </div>
            )}
            {item.contactEmail && (
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-ink-muted flex-shrink-0" />
                <span className="text-xs text-ink-secondary font-mono">{item.contactEmail}</span>
                <button onClick={() => copy(item.contactEmail, 'email')} className={`p-1 rounded transition-colors ${copiedField === 'email' ? 'text-green-400' : 'text-ink-muted hover:text-blue-400'}`}><Copy size={11} /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div className="bg-navy-800 border border-edge-subtle rounded-xl p-4 sm:p-5 mb-4">
          <h3 className="text-xs font-semibold text-ink-primary mb-2">Notes</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">{item.notes}</p>
        </div>
      )}

      {/* Document */}
      <div className="bg-navy-800 border border-edge-subtle rounded-xl p-4 sm:p-5">
        <h3 className="text-xs font-semibold text-ink-primary mb-3 flex items-center gap-2"><Upload size={13} className="text-purple-400" /> Document</h3>
        <DocUploader doc={item.document} onChange={d => updateWarranty({ ...item, document: d })} />
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-navy-800 border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ animation: 'modalIn 0.15s ease-out' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4"><Trash2 size={18} className="text-red-400" /></div>
            <h3 className="text-sm font-semibold text-ink-primary text-center mb-1">Delete Warranty</h3>
            <p className="text-xs text-ink-muted text-center mb-5">Delete <span className="text-ink-primary font-mono">{item.name}</span>? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs transition-colors border border-edge-default">Cancel</button>
              <button onClick={onDelete} className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Warranty() {
  const { warrantyItems, addWarranty, updateWarranty, deleteWarranty, toggleStarWarranty, toast } = useApp()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [selectedId, setSelectedId] = useState<string>(warrantyItems[0]?.id ?? '')
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<WarrantyItem | null>(null)

  const filtered = warrantyItems.filter(w =>
    (statusFilter === 'All' || w.status === statusFilter.toLowerCase()) &&
    (w.name.toLowerCase().includes(query.toLowerCase()) ||
      w.vendor.toLowerCase().includes(query.toLowerCase()) ||
      w.serialNumber.toLowerCase().includes(query.toLowerCase()))
  )

  const selected = warrantyItems.find(w => w.id === selectedId) ?? filtered[0] ?? null

  const selectItem = (id: string) => {
    setSelectedId(id)
    setMobileDetailOpen(true)
  }

  const handleDelete = () => {
    if (!selected) return
    deleteWarranty(selected.id)
    toast('Warranty deleted')
    setMobileDetailOpen(false)
    setSelectedId(filtered.find(w => w.id !== selected.id)?.id ?? '')
  }

  const computeStatus = (endDate: string): WarrantyItem['status'] => {
    const d = daysUntil(endDate)
    if (d <= 0) return 'expired'
    if (d <= 30) return 'expiring'
    return 'active'
  }

  return (
    <div className="flex h-full">
      {/* List Panel */}
      <div className={`flex flex-col border-r border-edge-subtle bg-navy-900 flex-shrink-0 w-full md:w-72 ${mobileDetailOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 pt-4 pb-3 border-b border-edge-subtle flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-ink-primary">Warranty Tracker</h2>
              <p className="text-[10px] text-ink-muted mt-0.5 font-mono">{warrantyItems.length} items</p>
            </div>
            <button onClick={() => setAddOpen(true)} className="p-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white transition-all" title="Add warranty">
              <Plus size={14} />
            </button>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search warranties…"
              className="w-full pl-7 pr-7 py-2 rounded-lg bg-navy-800 border border-edge-default text-ink-primary text-xs placeholder:text-ink-muted focus:border-blue-500 focus:outline-none transition-colors" />
            {query && <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary transition-colors"><X size={11} /></button>}
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="px-3 py-2 border-b border-edge-subtle flex-shrink-0 flex gap-1">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${statusFilter === s ? 'bg-blue-500 text-white' : 'bg-navy-800 text-ink-muted hover:text-ink-secondary border border-edge-subtle'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-edge-subtle">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Shield size={22} className="text-ink-muted opacity-40" />
              <p className="text-xs text-ink-muted">No warranties found</p>
              <button onClick={() => setAddOpen(true)} className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">+ Add warranty</button>
            </div>
          )}
          {filtered.map(w => {
            const days = daysUntil(w.warrantyEndDate)
            const s = STATUS_STYLES[w.status]
            return (
              <div key={w.id} onClick={() => selectItem(w.id)}
                className={`w-full px-4 py-3 text-left transition-all hover:bg-navy-800/80 cursor-pointer ${selectedId === w.id ? 'bg-navy-800 md:border-r-2 md:border-blue-500' : ''}`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-ink-primary truncate">{w.name}</span>
                  <button onClick={e => { e.stopPropagation(); toggleStarWarranty(w.id) }}
                    className={`flex-shrink-0 transition-colors ${w.starred ? 'text-yellow-400' : 'text-ink-muted hover:text-yellow-400'}`}>
                    <Star size={10} fill={w.starred ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <p className="text-[10px] text-ink-muted mb-1.5">{w.vendor}</p>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono text-ink-muted truncate">{w.serialNumber || '—'}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${s.badge}`}>{s.label}</span>
                    {w.warrantyEndDate && (
                      <span className={`text-[9px] font-mono ${days > 0 ? 'text-ink-muted' : 'text-red-400'}`}>
                        {days > 0 ? `${days}d` : `${Math.abs(days)}d ago`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail Panel */}
      <div className={`flex-1 overflow-y-auto ${mobileDetailOpen ? 'block' : 'hidden md:block'}`}>
        {selected ? (
          <WarrantyDetail
            item={selected}
            onBack={() => setMobileDetailOpen(false)}
            onEdit={() => setEditItem(selected)}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-edge-subtle flex items-center justify-center"><Shield size={24} className="text-ink-muted" /></div>
            <p className="text-sm text-ink-secondary font-medium">No warranties tracked</p>
            <p className="text-xs text-ink-muted">or <button onClick={() => setAddOpen(true)} className="text-blue-400 hover:text-blue-300 transition-colors">add a new warranty</button></p>
          </div>
        )}
      </div>

      {/* Modals */}
      {addOpen && (
        <WarrantyForm
          onSave={d => {
            addWarranty({ ...d, starred: false })
            setAddOpen(false)
            toast('Warranty added')
          }}
          onClose={() => setAddOpen(false)}
        />
      )}
      {editItem && (
        <WarrantyForm
          initial={editItem}
          onSave={d => {
            updateWarranty({ ...editItem, ...d, status: computeStatus(d.warrantyEndDate) })
            setEditItem(null)
            toast('Warranty updated')
          }}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  )
}
