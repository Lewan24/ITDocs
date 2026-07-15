import { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, Eye, EyeOff, Copy, Tag, KeyRound, Clock,
  Edit2, Star, X, Trash2, RefreshCw, Shield, ChevronDown, ArrowLeft,
} from 'lucide-react'
import { useApp } from '../context/useApp'
import type { PasswordEntry } from '../context/AuthContext'

const CATEGORIES = ['All', 'Cloud', 'Hypervisor', 'Network', 'Active Directory', 'Storage', 'Database', 'Application', 'Other']
const CATEGORY_LIST = CATEGORIES.slice(1)

const STRENGTH_STYLES = {
  strong: 'text-green-400 bg-green-500/10 border-green-500/25',
  medium: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
  weak: 'text-red-400 bg-red-500/10 border-red-500/25',
}
const STRENGTH_BAR = { strong: 'w-full bg-green-500', medium: 'w-2/3 bg-orange-500', weak: 'w-1/3 bg-red-500' }

function generatePassword(len = 20): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|'
  return Array.from(crypto.getRandomValues(new Uint8Array(len))).map(b => chars[b % chars.length]).join('')
}

// ─── Password Form Modal ───────────────────────────────────────────────────────

interface PwFormProps { initial?: PasswordEntry; onSave: (d: Omit<PasswordEntry, 'id' | 'updated' | 'strength'>) => void; onClose: () => void }

function PasswordForm({ initial, onSave, onClose }: PwFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    username: initial?.username ?? '',
    password: initial?.password ?? '',
    category: initial?.category ?? 'Other',
    tags: initial?.tags ?? [],
    starred: initial?.starred ?? false,
    notes: initial?.notes ?? '',
  })
  const [showPw, setShowPw] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => { firstRef.current?.focus() }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const set = (k: string, v: unknown) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }
  const addTag = () => { const t = tagInput.trim().toLowerCase(); if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]); setTagInput('') }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.username.trim()) e.username = 'Required'
    if (!form.password) e.password = 'Required'
    setErrors(e); return Object.keys(e).length === 0
  }

  const calcStrength = (pw: string) => pw.length >= 16 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw) ? 'strong' : pw.length >= 10 ? 'medium' : 'weak'
  const strength = form.password ? calcStrength(form.password) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-navy-800 border border-edge-strong rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: 'modalIn 0.18s ease-out' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge-subtle">
          <div>
            <h2 className="text-sm font-semibold text-ink-primary">{initial ? 'Edit Password' : 'Add Password Entry'}</h2>
            <p className="text-[11px] text-ink-muted mt-0.5">{initial ? `Editing ${initial.name}` : 'Store a new credential securely'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-navy-700 transition-colors"><X size={15} /></button>
        </div>

        <div className="px-5 py-4 space-y-3.5 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Name *</label>
            <input ref={firstRef} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. AWS Root Account"
              className={inp(errors.name)} />
            {errors.name && <p className="text-[10px] text-red-400 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Username *</label>
            <input value={form.username} onChange={e => set('username', e.target.value)} placeholder="e.g. admin@corp.com"
              className={inp(errors.username) + ' font-mono'} />
            {errors.username && <p className="text-[10px] text-red-400 mt-1">{errors.username}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-ink-secondary">Password *</label>
              <button type="button" onClick={() => set('password', generatePassword())}
                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                <RefreshCw size={10} /> Generate
              </button>
            </div>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="Enter or generate a password"
                className={inp(errors.password) + ' font-mono pr-10'} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary transition-colors">
                {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {form.password && strength && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-navy-600 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${STRENGTH_BAR[strength]}`} />
                </div>
                <span className={`text-[10px] font-mono ${strength === 'strong' ? 'text-green-400' : strength === 'medium' ? 'text-orange-400' : 'text-red-400'}`}>{strength}</span>
              </div>
            )}
            {errors.password && <p className="text-[10px] text-red-400 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Category</label>
            <div className="relative">
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inp() + ' appearance-none pr-8'}>
                {CATEGORY_LIST.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-700 border border-edge-subtle text-[11px] text-ink-secondary font-mono">
                  {t}<button type="button" onClick={() => set('tags', form.tags.filter(x => x !== t))} className="text-ink-muted hover:text-red-400 transition-colors ml-0.5">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Add tag…" className={inp() + ' flex-1'} />
              <button type="button" onClick={addTag} className="px-3 py-2 rounded-lg bg-navy-700 border border-edge-default text-ink-secondary text-xs hover:bg-navy-600 transition-colors"><Tag size={11} /></button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any notes…"
              className={inp() + ' resize-none leading-relaxed'} />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-edge-subtle bg-navy-900/50">
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => set('starred', !form.starred)} className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${form.starred ? 'bg-yellow-500/20 border-yellow-500/50' : 'border-edge-strong'}`}>
              {form.starred && <Star size={10} className="text-yellow-400 fill-yellow-400" />}
            </div>
            <span className="text-xs text-ink-secondary">Add to favorites</span>
          </label>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3.5 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs transition-colors border border-edge-default">Cancel</button>
            <button onClick={() => { if (validate()) onSave(form) }} className="px-3.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-xs font-medium transition-all" style={{ boxShadow: '0 1px 12px rgba(37,99,235,0.35)' }}>
              {initial ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function inp(error?: string) {
  return `w-full px-3 py-2 rounded-lg bg-navy-700 border text-ink-primary text-xs placeholder:text-ink-muted focus:outline-none transition-colors ${error ? 'border-red-500/50 focus:border-red-500' : 'border-edge-default focus:border-blue-500'}`
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function PasswordDetail({ selected, onBack, onEdit, onDelete }: {
  selected: PasswordEntry
  onBack?: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { toggleStarPassword } = useApp()
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState<'user' | 'pass' | null>(null)

  const copy = (text: string, which: 'user' | 'pass') => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(which)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      {/* Mobile back button */}
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-primary transition-colors mb-4">
          <ArrowLeft size={13} /> Back to list
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-navy-700 border border-edge-default flex items-center justify-center flex-shrink-0">
            <KeyRound size={16} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-ink-primary truncate">{selected.name}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] font-mono bg-navy-700 text-ink-muted px-1.5 py-0.5 rounded border border-edge-subtle">{selected.category}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${STRENGTH_STYLES[selected.strength]}`}>{selected.strength}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => toggleStarPassword(selected.id)}
            className={`p-2 rounded-lg border transition-all ${selected.starred ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-navy-800 border-edge-default text-ink-muted hover:text-yellow-400'}`}>
            <Star size={13} fill={selected.starred ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onEdit} className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-navy-800 border border-edge-default text-ink-secondary text-xs hover:border-edge-strong transition-colors">
            <Edit2 size={12} /><span className="hidden sm:inline">Edit</span>
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg bg-navy-800 border border-edge-default text-ink-muted hover:text-red-400 hover:border-red-500/30 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Credentials card */}
      <div className="bg-navy-800 border border-edge-subtle rounded-xl p-4 sm:p-5 mb-4 space-y-4">
        <h3 className="text-xs font-semibold text-ink-primary flex items-center gap-2"><Shield size={13} className="text-blue-400" /> Credentials</h3>

        <div>
          <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Username / Email</label>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-navy-700 border border-edge-default font-mono text-xs sm:text-sm text-ink-primary truncate">{selected.username}</div>
            <button onClick={() => copy(selected.username, 'user')} title="Copy username"
              className={`p-2.5 rounded-lg border flex-shrink-0 transition-all ${copied === 'user' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-navy-700 border-edge-default text-ink-muted hover:text-blue-400 hover:border-blue-500/30'}`}>
              <Copy size={13} />
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Password</label>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-navy-700 border border-edge-default font-mono text-xs sm:text-sm text-ink-primary tracking-widest truncate">
              {revealed ? selected.password : '•'.repeat(Math.min(selected.password.length, 20))}
            </div>
            <button onClick={() => setRevealed(!revealed)} title={revealed ? 'Hide' : 'Reveal'}
              className={`p-2.5 rounded-lg border flex-shrink-0 transition-all ${revealed ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-navy-700 border-edge-default text-ink-muted hover:text-ink-primary'}`}>
              {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button onClick={() => copy(selected.password, 'pass')} title="Copy password"
              className={`p-2.5 rounded-lg border flex-shrink-0 transition-all ${copied === 'pass' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-navy-700 border-edge-default text-ink-muted hover:text-blue-400 hover:border-blue-500/30'}`}>
              <Copy size={13} />
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full bg-navy-600 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${STRENGTH_BAR[selected.strength]}`} />
            </div>
            <span className={`text-[10px] font-mono ${selected.strength === 'strong' ? 'text-green-400' : selected.strength === 'medium' ? 'text-orange-400' : 'text-red-400'}`}>
              {selected.strength}
            </span>
          </div>
          {copied === 'pass' && <p className="text-[10px] text-green-400 mt-1.5 font-mono">✓ Copied to clipboard</p>}
        </div>
      </div>

      {selected.notes && (
        <div className="bg-navy-800 border border-edge-subtle rounded-xl p-4 sm:p-5 mb-4">
          <h3 className="text-xs font-semibold text-ink-primary mb-2">Notes</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">{selected.notes}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-navy-800 border border-edge-subtle rounded-xl p-4">
          <h3 className="text-xs font-semibold text-ink-primary mb-3 flex items-center gap-2"><Tag size={12} className="text-purple-500" /> Tags</h3>
          {selected.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selected.tags.map(t => <span key={t} className="px-2 py-0.5 rounded-md bg-navy-700 text-[11px] text-ink-secondary font-mono border border-edge-subtle">{t}</span>)}
            </div>
          ) : <p className="text-xs text-ink-muted">No tags</p>}
        </div>

        <div className="bg-navy-800 border border-edge-subtle rounded-xl p-4">
          <h3 className="text-xs font-semibold text-ink-primary mb-3 flex items-center gap-2"><Clock size={12} className="text-cyan-400" /> Metadata</h3>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-ink-muted">Last updated</span><span className="text-ink-secondary font-mono">{selected.updated}</span></div>
            <div className="flex justify-between"><span className="text-ink-muted">Strength</span><span className={`font-mono ${selected.strength === 'strong' ? 'text-green-400' : selected.strength === 'medium' ? 'text-orange-400' : 'text-red-400'}`}>{selected.strength}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PasswordVault() {
  const { passwords, addPassword, updatePassword, deletePassword } = useApp()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [selectedId, setSelectedId] = useState<string>(passwords[0]?.id ?? '')
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<PasswordEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PasswordEntry | null>(null)

  const filtered = passwords.filter(p =>
    (category === 'All' || p.category === category) &&
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.username.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()) || p.tags.some(t => t.includes(query.toLowerCase())))
  )

  const selected = passwords.find(p => p.id === selectedId) ?? filtered[0] ?? null

  const selectEntry = (id: string) => {
    setSelectedId(id)
    setMobileDetailOpen(true)
  }

  return (
    <div className="flex h-full">

      {/* List panel — full width on mobile, fixed width on desktop */}
      <div className={`
        flex flex-col border-r border-edge-subtle bg-navy-900 flex-shrink-0 w-full
        md:w-72
        ${mobileDetailOpen ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="px-4 pt-4 pb-3 border-b border-edge-subtle flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-ink-primary">Password Vault</h2>
              <p className="text-[10px] text-ink-muted mt-0.5 font-mono">{passwords.length} entries</p>
            </div>
            <button onClick={() => setAddOpen(true)} className="p-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white transition-all" title="Add entry">
              <Plus size={14} />
            </button>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…"
              className="w-full pl-7 pr-7 py-2 rounded-lg bg-navy-800 border border-edge-default text-ink-primary text-xs placeholder:text-ink-muted focus:border-blue-500 focus:outline-none transition-colors" />
            {query && <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary transition-colors"><X size={11} /></button>}
          </div>
        </div>

        <div className="px-3 py-2 border-b border-edge-subtle flex-shrink-0 flex flex-wrap gap-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${category === c ? 'bg-blue-500 text-white' : 'bg-navy-800 text-ink-muted hover:text-ink-secondary border border-edge-subtle'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-edge-subtle">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <KeyRound size={20} className="text-ink-muted opacity-40" />
              <p className="text-xs text-ink-muted">No entries found</p>
            </div>
          )}
          {filtered.map(p => (
            <button key={p.id} onClick={() => selectEntry(p.id)}
              className={`w-full px-4 py-3 text-left transition-all hover:bg-navy-800/80 ${selectedId === p.id ? 'bg-navy-800 md:border-r-2 md:border-blue-500' : ''}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-ink-primary truncate">{p.name}</span>
                {p.starred && <Star size={10} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-ink-muted font-mono truncate">{p.username}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${STRENGTH_STYLES[p.strength]}`}>{p.strength}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                <span className="text-[9px] text-ink-muted font-mono bg-navy-700 px-1.5 py-0.5 rounded border border-edge-subtle">{p.category}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className={`flex-1 overflow-y-auto ${mobileDetailOpen ? 'block' : 'hidden md:block'}`}>
        {selected ? (
          <PasswordDetail
            selected={selected}
            onBack={() => setMobileDetailOpen(false)}
            onEdit={() => setEditEntry(selected)}
            onDelete={() => setDeleteTarget(selected)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-edge-subtle flex items-center justify-center"><KeyRound size={24} className="text-ink-muted" /></div>
            <p className="text-sm text-ink-secondary font-medium">Select an entry</p>
            <p className="text-xs text-ink-muted">or <button onClick={() => setAddOpen(true)} className="text-blue-400 hover:text-blue-300 transition-colors">add a new password</button></p>
          </div>
        )}
      </div>

      {/* Modals */}
      {addOpen && <PasswordForm onSave={d => { addPassword(d); setAddOpen(false) }} onClose={() => setAddOpen(false)} />}
      {editEntry && <PasswordForm initial={editEntry} onSave={d => { updatePassword({ ...editEntry, ...d }); setEditEntry(null) }} onClose={() => setEditEntry(null)} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-navy-800 border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ animation: 'modalIn 0.15s ease-out' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4"><Trash2 size={18} className="text-red-400" /></div>
            <h3 className="text-sm font-semibold text-ink-primary text-center mb-1">Delete Password Entry</h3>
            <p className="text-xs text-ink-muted text-center mb-5">Delete <span className="text-ink-primary font-mono">{deleteTarget.name}</span>? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs transition-colors border border-edge-default">Cancel</button>
              <button onClick={() => {
                deletePassword(deleteTarget.id)
                setDeleteTarget(null)
                setMobileDetailOpen(false)
                if (selectedId === deleteTarget.id) setSelectedId(passwords[0]?.id ?? '')
              }} className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
