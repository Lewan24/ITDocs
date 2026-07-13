import { useState, useEffect, useRef } from 'react'
import {
  Plus, Search, Filter, ChevronUp, ChevronDown, ChevronsUpDown,
  Edit2, Trash2, Star, X, Globe, AppWindow, ShieldCheck, Package, Boxes,
  AlertTriangle, RefreshCw,
} from 'lucide-react'
import { useApp } from '../context/useApp'
import type { License, LicenseCategory } from '../context/AppContext'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field, inputClass, StarToggle } from '../components/FormField'
import { TagEditor } from '../components/TagEditor'

const CATEGORIES: LicenseCategory[] = ['Domain', 'Office / M365', 'Program', 'Antivirus', 'Other']
const CATEGORY_ICONS: Record<LicenseCategory, React.ReactNode> = {
  'Domain': <Globe size={12} />,
  'Office / M365': <AppWindow size={12} />,
  'Program': <Boxes size={12} />,
  'Antivirus': <ShieldCheck size={12} />,
  'Other': <Package size={12} />,
}

type Urgency = 'expired' | 'soon' | 'ok' | 'none'

/** Whole days between today and the expiry date. null when the license has no expiry. */
function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const expiry = new Date(`${dateStr}T00:00:00`)
  return Math.round((expiry.getTime() - today.getTime()) / 86_400_000)
}

function urgencyOf(days: number | null): Urgency {
  if (days === null) return 'none'
  if (days < 0) return 'expired'
  if (days <= 30) return 'soon'
  return 'ok'
}

const URGENCY_STYLES: Record<Urgency, string> = {
  expired: 'bg-red-500/15 text-red-400 border-red-500/30',
  soon: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  ok: 'bg-green-500/15 text-green-400 border-green-500/30',
  none: 'bg-navy-500/20 text-ink-muted border-edge-default',
}

// Lower sorts first when sorting by expiry ascending: expired, then soon, then ok, then no-expiry.
const URGENCY_WEIGHT: Record<Urgency, number> = { expired: 0, soon: 1, ok: 2, none: 3 }

function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const days = daysUntil(expiryDate)
  const urgency = urgencyOf(days)
  let label: string
  if (urgency === 'none') label = 'No expiry'
  else if (days === 0) label = 'Expires today'
  else if (urgency === 'expired') label = `Expired ${Math.abs(days!)}d ago`
  else label = `${days}d left`

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border ${URGENCY_STYLES[urgency]}`}>
      {(urgency === 'expired' || urgency === 'soon') && <AlertTriangle size={9} />}
      {label}
    </span>
  )
}

// ─── License Form Modal ────────────────────────────────────────────────────────

interface LicenseFormProps { initial?: License; onSave: (d: Omit<License, 'id' | 'updated'>) => void; onClose: () => void }

function LicenseForm({ initial, onSave, onClose }: LicenseFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    category: initial?.category ?? 'Program' as LicenseCategory,
    vendor: initial?.vendor ?? '',
    seats: initial?.seats?.toString() ?? '',
    licenseKey: initial?.licenseKey ?? '',
    purchaseDate: initial?.purchaseDate ?? '',
    expiryDate: initial?.expiryDate ?? '',
    autoRenew: initial?.autoRenew ?? false,
    assignedTo: initial?.assignedTo ?? '',
    cost: initial?.cost?.toString() ?? '',
    tags: initial?.tags ?? [] as string[],
    starred: initial?.starred ?? false,
    notes: initial?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const firstRef = useRef<HTMLInputElement>(null)
  useEffect(() => { firstRef.current?.focus() }, [])

  const set = (k: string, v: unknown) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.vendor.trim()) e.vendor = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSave({
      name: form.name,
      category: form.category,
      vendor: form.vendor,
      seats: form.seats ? Number(form.seats) : undefined,
      licenseKey: form.licenseKey,
      purchaseDate: form.purchaseDate,
      expiryDate: form.expiryDate,
      autoRenew: form.autoRenew,
      assignedTo: form.assignedTo,
      cost: form.cost ? Number(form.cost) : undefined,
      tags: form.tags,
      starred: form.starred,
      notes: form.notes,
    })
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <ModalHeader
        title={initial ? 'Edit License' : 'Add License'}
        subtitle={initial ? `Editing ${initial.name}` : 'Track a domain, subscription, or software license'}
        onClose={onClose}
      />
      <ModalBody>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name *" error={errors.name}>
            <input ref={firstRef} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Microsoft 365 Business Premium" className={inputClass(errors.name)} />
          </Field>
          <Field label="Vendor *" error={errors.vendor}>
            <input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="e.g. Microsoft" className={inputClass(errors.vendor)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass()}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Seats">
            <input type="number" min="0" value={form.seats} onChange={e => set('seats', e.target.value)} placeholder="e.g. 25" className={inputClass()} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Purchase Date">
            <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} className={inputClass()} />
          </Field>
          <Field label="Expiry Date">
            <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} className={inputClass()} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Assigned To">
            <input value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} placeholder="e.g. All staff, or a device name" className={inputClass()} />
          </Field>
          <Field label="Cost (per term)">
            <input type="number" min="0" step="0.01" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="e.g. 5700" className={inputClass()} />
          </Field>
        </div>

        <Field label="License Key">
          <input value={form.licenseKey} onChange={e => set('licenseKey', e.target.value)} placeholder="Optional — product key or subscription ID" className={inputClass() + ' font-mono'} />
        </Field>

        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <div onClick={() => set('autoRenew', !form.autoRenew)} className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${form.autoRenew ? 'bg-blue-500/20 border-blue-500/50' : 'border-edge-strong'}`}>
            {form.autoRenew && <RefreshCw size={9} className="text-blue-400" />}
          </div>
          <span className="text-xs text-ink-secondary">Auto-renews</span>
        </label>

        <Field label="Tags">
          <TagEditor tags={form.tags} onChange={t => set('tags', t)} />
        </Field>

        <Field label="Notes">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any relevant notes…" className={inputClass() + ' resize-none leading-relaxed'} />
        </Field>
      </ModalBody>
      <ModalFooter>
        <StarToggle checked={form.starred} onChange={() => set('starred', !form.starred)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs transition-colors border border-edge-default">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-xs font-medium transition-all" style={{ boxShadow: '0 1px 12px rgba(37,99,235,0.35)' }}>
            {initial ? 'Save Changes' : 'Add License'}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'category' | 'vendor' | 'expiry'
type SortDir = 'asc' | 'desc'

export default function LicenseVault() {
  const { licenses, addLicense, updateLicense, deleteLicense, toggleStarLicense } = useApp()

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'All' | LicenseCategory>('All')
  const [sortKey, setSortKey] = useState<SortKey>('expiry')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [addOpen, setAddOpen] = useState(false)
  const [editLicense, setEditLicense] = useState<License | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<License | null>(null)

  const filtered = licenses
    .filter(l =>
      (categoryFilter === 'All' || l.category === categoryFilter) &&
      (l.name.toLowerCase().includes(query.toLowerCase()) || l.vendor.toLowerCase().includes(query.toLowerCase()) || l.assignedTo.toLowerCase().includes(query.toLowerCase()) || l.tags.some(t => t.includes(query.toLowerCase())))
    )
    .sort((a, b) => {
      if (sortKey === 'expiry') {
        const da = daysUntil(a.expiryDate); const db = daysUntil(b.expiryDate)
        const wa = URGENCY_WEIGHT[urgencyOf(da)]; const wb = URGENCY_WEIGHT[urgencyOf(db)]
        const diff = wa !== wb ? wa - wb : (da ?? 0) - (db ?? 0)
        return sortDir === 'asc' ? diff : -diff
      }
      const av = String(a[sortKey]); const bv = String(b[sortKey])
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })

  const sort = (key: SortKey) => { if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('asc') } }
  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : <ChevronsUpDown size={11} className="opacity-30" />

  const expiringSoonCount = licenses.filter(l => urgencyOf(daysUntil(l.expiryDate)) === 'soon').length
  const expiredCount = licenses.filter(l => urgencyOf(daysUntil(l.expiryDate)) === 'expired').length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Licenses</h1>
          <p className="text-xs text-ink-muted mt-0.5 font-mono">
            {licenses.length} tracked
            {expiredCount > 0 && <> · <span className="text-red-400">{expiredCount} expired</span></>}
            {expiringSoonCount > 0 && <> · <span className="text-orange-400">{expiringSoonCount} expiring within 30d</span></>}
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-sm font-medium transition-all"
          style={{ boxShadow: '0 1px 12px rgba(37,99,235,0.3)' }}
        >
          <Plus size={15} /> Add License
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search name, vendor, assigned to…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-navy-800 border border-edge-default text-ink-primary text-xs placeholder:text-ink-muted focus:border-blue-500 focus:outline-none transition-colors" />
          {query && <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary transition-colors"><X size={12} /></button>}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-ink-muted" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as 'All' | LicenseCategory)}
            className="px-2.5 py-2 rounded-lg bg-navy-800 border border-edge-default text-ink-secondary text-xs focus:outline-none focus:border-blue-500 cursor-pointer">
            <option>All</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-edge-subtle bg-navy-900/50">
                {[
                  { k: 'name' as SortKey, label: 'Name' },
                  { k: 'category' as SortKey, label: 'Category' },
                  { k: 'vendor' as SortKey, label: 'Vendor' },
                ].map(col => (
                  <th key={col.k} onClick={() => sort(col.k)}
                    className="px-4 py-3 text-left font-medium text-ink-muted cursor-pointer hover:text-ink-secondary transition-colors select-none whitespace-nowrap">
                    <span className="flex items-center gap-1">{col.label} <SortIcon k={col.k} /></span>
                  </th>
                ))}
                <th className="px-3 py-3 text-left font-medium text-ink-muted">Seats</th>
                <th onClick={() => sort('expiry')} className="px-3 py-3 text-left font-medium text-ink-muted cursor-pointer hover:text-ink-secondary transition-colors select-none whitespace-nowrap">
                  <span className="flex items-center gap-1">Expiry <SortIcon k="expiry" /></span>
                </th>
                <th className="px-3 py-3 text-left font-medium text-ink-muted">Assigned To</th>
                <th className="px-3 py-3 text-right font-medium text-ink-muted w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-subtle">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center">
                  <ShieldCheck size={28} className="text-ink-muted mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-ink-muted">No licenses match your filter</p>
                  <button onClick={() => { setQuery(''); setCategoryFilter('All') }} className="text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">Clear filters</button>
                </td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className="group hover:bg-navy-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {l.starred && <Star size={11} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                      <span className="font-medium text-ink-primary">{l.name}</span>
                    </div>
                    {l.autoRenew && <p className="text-[10px] text-ink-muted mt-0.5 flex items-center gap-1"><RefreshCw size={9} /> Auto-renews</p>}
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5 text-ink-secondary">
                      <span className="text-ink-muted">{CATEGORY_ICONS[l.category]}</span>{l.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-ink-secondary">{l.vendor}</td>
                  <td className="px-3 py-3 text-ink-muted font-mono">{l.seats ?? '—'}</td>
                  <td className="px-3 py-3"><ExpiryBadge expiryDate={l.expiryDate} /></td>
                  <td className="px-3 py-3 text-ink-secondary truncate max-w-[180px]">{l.assignedTo || '—'}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => toggleStarLicense(l.id)} title={l.starred ? 'Unstar' : 'Star'}
                        className={`p-1.5 rounded-md transition-colors ${l.starred ? 'text-yellow-400' : 'text-ink-muted hover:text-yellow-400'} hover:bg-navy-600`}>
                        <Star size={13} fill={l.starred ? 'currentColor' : 'none'} />
                      </button>
                      <button onClick={() => setEditLicense(l)} title="Edit" className="p-1.5 rounded-md hover:bg-navy-600 text-ink-muted hover:text-ink-primary transition-colors"><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteTarget(l)} title="Delete" className="p-1.5 rounded-md hover:bg-navy-600 text-ink-muted hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {addOpen && <LicenseForm onSave={data => { addLicense(data); setAddOpen(false) }} onClose={() => setAddOpen(false)} />}
      {editLicense && <LicenseForm initial={editLicense} onSave={data => { updateLicense({ ...editLicense, ...data }); setEditLicense(null) }} onClose={() => setEditLicense(null)} />}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete License"
          message={<>Are you sure you want to delete <span className="text-ink-primary font-mono">{deleteTarget.name}</span>? This cannot be undone.</>}
          onConfirm={() => { deleteLicense(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
