import { useState, useEffect, useRef } from 'react'
import {
  Plus, Search, Filter, ChevronUp, ChevronDown, ChevronsUpDown,
  Edit2, Trash2, Eye, Server, Monitor, Router, HardDrive, Wifi,
  ChevronLeft, ChevronRight, Star, X, Printer, Phone,
} from 'lucide-react'
import { useApp } from '../context/useApp'
import type { Asset, AssetType, AssetStatus } from '../context/AuthContext'
import type { View } from '../App'

const TYPE_ICONS: Record<AssetType, React.ReactNode> = {
  Server: <Server size={12} />, Workstation: <Monitor size={12} />,
  Network: <Router size={12} />, Storage: <HardDrive size={12} />,
  AP: <Wifi size={12} />, Printer: <Printer size={12} />, Phone: <Phone size={12} />,
}

const STATUS_STYLES: Record<AssetStatus, string> = {
  online: 'bg-green-500/15 text-green-400 border-green-500/30',
  offline: 'bg-red-500/15 text-red-400 border-red-500/30',
  maintenance: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  unknown: 'bg-navy-500/20 text-ink-muted border-edge-default',
}

const ASSET_TYPES: AssetType[] = ['Server', 'Workstation', 'Network', 'Storage', 'AP', 'Printer', 'Phone']
const ASSET_STATUSES: AssetStatus[] = ['online', 'offline', 'maintenance', 'unknown']

function StatusBadge({ status }: { status: AssetStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border ${STATUS_STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status === 'online' ? 'bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.8)] animate-pulse' : status === 'offline' ? 'bg-red-400' : status === 'maintenance' ? 'bg-orange-400' : 'bg-navy-400'}`} />
      {status}
    </span>
  )
}

// ─── Asset Form Modal ─────────────────────────────────────────────────────────

interface AssetFormProps {
  initial?: Asset
  onSave: (data: Omit<Asset, 'id' | 'updated'>) => void
  onClose: () => void
}

function AssetForm({ initial, onSave, onClose }: AssetFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? 'Server' as AssetType,
    status: initial?.status ?? 'online' as AssetStatus,
    location: initial?.location ?? '',
    owner: initial?.owner ?? '',
    ip: initial?.ip ?? '',
    serial: initial?.serial ?? '',
    notes: initial?.notes ?? '',
    tags: initial?.tags ?? [],
    starred: initial?.starred ?? false,
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => { firstRef.current?.focus() }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const set = (k: string, v: unknown) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t])
    setTagInput('')
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.location.trim()) e.location = 'Required'
    if (!form.owner.trim()) e.owner = 'Required'
    if (form.ip && !/^[\d.]+$/.test(form.ip)) e.ip = 'Invalid IP'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => { if (validate()) onSave(form) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-navy-800 border border-edge-strong rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ animation: 'modalIn 0.18s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge-subtle">
          <div>
            <h2 className="text-sm font-semibold text-ink-primary">{initial ? 'Edit Asset' : 'Add New Asset'}</h2>
            <p className="text-[11px] text-ink-muted mt-0.5">{initial ? `Editing ${initial.name}` : 'Register a new infrastructure asset'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-navy-700 transition-colors"><X size={15} /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Asset Name *" error={errors.name}>
              <input ref={firstRef} value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. SRV-PROD-03" className={input(errors.name)} />
            </Field>
            <Field label="IP Address" error={errors.ip}>
              <input value={form.ip} onChange={e => set('ip', e.target.value)}
                placeholder="e.g. 10.0.1.12" className={input(errors.ip)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select value={form.type} onChange={e => set('type', e.target.value)} className={input()}>
                {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} className={input()}>
                {ASSET_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Location *" error={errors.location}>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="e.g. DC-RACK-A1" className={input(errors.location)} />
            </Field>
            <Field label="Owner *" error={errors.owner}>
              <input value={form.owner} onChange={e => set('owner', e.target.value)}
                placeholder="e.g. John Doe" className={input(errors.owner)} />
            </Field>
          </div>

          <Field label="Serial Number">
            <input value={form.serial} onChange={e => set('serial', e.target.value)}
              placeholder="e.g. BCZK1234567" className={input() + ' font-mono'} />
          </Field>

          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-700 border border-edge-subtle text-[11px] text-ink-secondary font-mono">
                  {t}
                  <button type="button" onClick={() => set('tags', form.tags.filter(x => x !== t))} className="text-ink-muted hover:text-red-400 transition-colors ml-0.5">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Add tag and press Enter" className={input() + ' flex-1'} />
              <button type="button" onClick={addTag} className="px-3 py-2 rounded-lg bg-navy-700 border border-edge-default text-ink-secondary text-xs hover:bg-navy-600 transition-colors">Add</button>
            </div>
          </Field>

          <Field label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Any relevant notes…" rows={3}
              className={input() + ' resize-none leading-relaxed'} />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-edge-subtle bg-navy-900/50">
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => set('starred', !form.starred)} className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${form.starred ? 'bg-yellow-500/20 border-yellow-500/50' : 'border-edge-strong'}`}>
              {form.starred && <Star size={10} className="text-yellow-400 fill-yellow-400" />}
            </div>
            <span className="text-xs text-ink-secondary">Add to favorites</span>
          </label>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs transition-colors border border-edge-default">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-xs font-medium transition-all" style={{ boxShadow: '0 1px 12px rgba(37,99,235,0.35)' }}>
              {initial ? 'Save Changes' : 'Create Asset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Delete confirm dialog ─────────────────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); if (e.key === 'Enter') onConfirm() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onConfirm, onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-navy-800 border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ animation: 'modalIn 0.15s ease-out' }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={18} className="text-red-400" />
        </div>
        <h3 className="text-sm font-semibold text-ink-primary text-center mb-1">Delete Asset</h3>
        <p className="text-xs text-ink-muted text-center mb-5">Are you sure you want to delete <span className="text-ink-primary font-mono">{name}</span>? This cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs transition-colors border border-edge-default">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-medium transition-colors">Delete</button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function input(error?: string) {
  return `w-full px-3 py-2 rounded-lg bg-navy-700 border text-ink-primary text-xs placeholder:text-ink-muted focus:outline-none transition-colors ${error ? 'border-red-500/50 focus:border-red-500' : 'border-edge-default focus:border-blue-500'}`
}

type SortKey = keyof Asset
type SortDir = 'asc' | 'desc'

interface Props { navigate: (v: View, id?: string) => void }

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AssetInventory({ navigate }: Props) {
  const { assets, addAsset, updateAsset, deleteAsset, toggleStarAsset } = useApp()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null)
  const PER_PAGE = 8

  const filtered = assets
    .filter(a =>
      (typeFilter === 'All' || a.type === typeFilter) &&
      (statusFilter === 'All' || a.status === statusFilter) &&
      (a.name.toLowerCase().includes(query.toLowerCase()) || a.ip.includes(query) || a.location.toLowerCase().includes(query.toLowerCase()) || a.owner.toLowerCase().includes(query.toLowerCase()))
    )
    .sort((a, b) => {
      const av = String(a[sortKey]); const bv = String(b[sortKey])
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, pages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const sort = (key: SortKey) => { if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('asc') } }
  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : <ChevronsUpDown size={11} className="opacity-30" />
  const toggleSelect = (id: string) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s) }
  const allSelected = paged.length > 0 && paged.every(a => selected.has(a.id))

  const onlineCount = assets.filter(a => a.status === 'online').length

  return (
    <div className="p-6">
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Asset Inventory</h1>
          <p className="text-xs text-ink-muted mt-0.5 font-mono">{assets.length} assets · <span className="text-green-400">{onlineCount} online</span> · {assets.filter(a => a.status === 'offline').length} offline</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-sm font-medium transition-all"
          style={{ boxShadow: '0 1px 12px rgba(37,99,235,0.3)' }}
        >
          <Plus size={15} /> Add Asset
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search name, IP, location, owner…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-navy-800 border border-edge-default text-ink-primary text-xs placeholder:text-ink-muted focus:border-blue-500 focus:outline-none transition-colors" />
          {query && <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary transition-colors"><X size={12} /></button>}
        </div>

        <div className="flex items-center gap-2">
          <Filter size={13} className="text-ink-muted" />
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
            className="px-2.5 py-2 rounded-lg bg-navy-800 border border-edge-default text-ink-secondary text-xs focus:outline-none focus:border-blue-500 cursor-pointer">
            <option>All</option>
            {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-2.5 py-2 rounded-lg bg-navy-800 border border-edge-default text-ink-secondary text-xs focus:outline-none focus:border-blue-500 cursor-pointer">
            <option>All</option>
            {ASSET_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-ink-muted font-mono">{selected.size} selected</span>
            <button
              onClick={() => { selected.forEach(id => deleteAsset(id)); setSelected(new Set()) }}
              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 border border-red-500/20 transition-colors flex items-center gap-1.5">
              <Trash2 size={12} /> Delete selected
            </button>
          </div>
        )}
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {paged.length === 0 ? (
          <div className="py-12 text-center">
            <Server size={28} className="text-ink-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm text-ink-muted">No assets match your filter</p>
            <button onClick={() => { setQuery(''); setTypeFilter('All'); setStatusFilter('All') }} className="text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">Clear filters</button>
          </div>
        ) : paged.map(asset => (
          <div key={asset.id} className="bg-navy-800 border border-edge-subtle rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => navigate('asset-detail', asset.id)} className="font-mono text-ink-link font-medium text-sm">{asset.name}</button>
                <StatusBadge status={asset.status} />
              </div>
              <p className="text-[10px] font-mono text-ink-muted">{asset.ip} · {asset.location}</p>
              <p className="text-[10px] text-ink-muted mt-0.5">{asset.type} · {asset.owner}</p>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={() => toggleStarAsset(asset.id)}
                className={`p-2 rounded-md transition-colors ${asset.starred ? 'text-yellow-400' : 'text-ink-muted'}`}>
                <Star size={14} fill={asset.starred ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => setEditAsset(asset)} className="p-2 rounded-md text-ink-muted hover:text-ink-primary transition-colors"><Edit2 size={14} /></button>
              <button onClick={() => setDeleteTarget(asset)} className="p-2 rounded-md text-ink-muted hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {/* Mobile pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-mono text-ink-muted">
              {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary disabled:opacity-30"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={safePage >= pages} className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-edge-subtle bg-navy-900/50">
                <th className="pl-4 pr-2 py-3 w-8">
                  <div onClick={() => allSelected ? setSelected(new Set()) : setSelected(new Set(paged.map(a => a.id)))}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${allSelected ? 'bg-blue-500 border-blue-500' : 'border-edge-strong hover:border-blue-500/50'}`}>
                    {allSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                </th>
                {[
                  { k: 'name' as SortKey, label: 'Name' },
                  { k: 'type' as SortKey, label: 'Type' },
                  { k: 'status' as SortKey, label: 'Status' },
                  { k: 'location' as SortKey, label: 'Location' },
                  { k: 'owner' as SortKey, label: 'Owner' },
                  { k: 'updated' as SortKey, label: 'Updated' },
                ].map(col => (
                  <th key={col.k} onClick={() => sort(col.k)}
                    className="px-3 py-3 text-left font-medium text-ink-muted cursor-pointer hover:text-ink-secondary transition-colors select-none whitespace-nowrap">
                    <span className="flex items-center gap-1">{col.label} <SortIcon k={col.k} /></span>
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-medium text-ink-muted w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge-subtle">
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="py-16 text-center">
                  <Server size={28} className="text-ink-muted mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-ink-muted">No assets match your filter</p>
                  <button onClick={() => { setQuery(''); setTypeFilter('All'); setStatusFilter('All') }} className="text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">Clear filters</button>
                </td></tr>
              ) : paged.map(asset => (
                <tr key={asset.id} className={`group hover:bg-navy-700/50 transition-colors ${selected.has(asset.id) ? 'bg-blue-500/5' : ''}`}>
                  <td className="pl-4 pr-2 py-3">
                    <div onClick={() => toggleSelect(asset.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${selected.has(asset.id) ? 'bg-blue-500 border-blue-500' : 'border-edge-strong group-hover:border-blue-500/40'}`}>
                      {selected.has(asset.id) && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => navigate('asset-detail', asset.id)} className="font-mono text-ink-link hover:text-blue-300 font-medium transition-colors">{asset.name}</button>
                    <p className="text-ink-muted font-mono mt-0.5 text-[10px]">{asset.ip}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5 text-ink-secondary">
                      <span className="text-ink-muted">{TYPE_ICONS[asset.type]}</span>{asset.type}
                    </span>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={asset.status} /></td>
                  <td className="px-3 py-3 text-ink-secondary font-mono">{asset.location}</td>
                  <td className="px-3 py-3 text-ink-secondary">{asset.owner}</td>
                  <td className="px-3 py-3 text-ink-muted font-mono">{asset.updated}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button onClick={() => toggleStarAsset(asset.id)} title={asset.starred ? 'Unstar' : 'Star'}
                        className={`p-1.5 rounded-md transition-colors ${asset.starred ? 'text-yellow-400' : 'text-ink-muted hover:text-yellow-400'} hover:bg-navy-600`}>
                        <Star size={13} fill={asset.starred ? 'currentColor' : 'none'} />
                      </button>
                      <button onClick={() => navigate('asset-detail', asset.id)} title="View" className="p-1.5 rounded-md hover:bg-navy-600 text-ink-muted hover:text-blue-400 transition-colors"><Eye size={13} /></button>
                      <button onClick={() => setEditAsset(asset)} title="Edit" className="p-1.5 rounded-md hover:bg-navy-600 text-ink-muted hover:text-ink-primary transition-colors"><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteTarget(asset)} title="Delete" className="p-1.5 rounded-md hover:bg-navy-600 text-ink-muted hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-edge-subtle">
          <span className="text-[11px] font-mono text-ink-muted">
            {filtered.length === 0 ? 'No results' : `${(safePage - 1) * PER_PAGE + 1}–${Math.min(safePage * PER_PAGE, filtered.length)} of ${filtered.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-navy-700 disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-md text-[11px] font-mono transition-colors ${p === safePage ? 'bg-blue-500 text-white' : 'text-ink-muted hover:text-ink-primary hover:bg-navy-700'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={safePage >= pages} className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-navy-700 disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {addOpen && <AssetForm onSave={data => { addAsset(data); setAddOpen(false) }} onClose={() => setAddOpen(false)} />}
      {editAsset && <AssetForm initial={editAsset} onSave={data => { updateAsset({ ...editAsset, ...data }); setEditAsset(null) }} onClose={() => setEditAsset(null)} />}
      {deleteTarget && <DeleteConfirm name={deleteTarget.name} onConfirm={() => { deleteAsset(deleteTarget.id); setDeleteTarget(null) }} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}
