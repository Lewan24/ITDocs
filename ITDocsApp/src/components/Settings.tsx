import { useState } from 'react'
import {
  User, Building2, Bell, Shield, Info, Plus, Edit2,
  Check, X, LogOut, Key, Monitor, Globe, Moon, Sun, ChevronRight,
  AlertTriangle, CheckCircle2, Loader2,
} from 'lucide-react'
import { useApp } from '../context/useApp'
import { useAuth } from '../context/useAuth'
import { toggleTheme, getTheme } from '../lib/theme'
import { ApiError } from '../api/http'
import type { Organization, OrganizationSummary } from '../api/types'
import type { View } from '../App'

type Section = 'profile' | 'organizations' | 'appearance' | 'security' | 'notifications' | 'about'

const SECTIONS: { id: Section; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'profile',       label: 'Profile',        icon: <User size={16} />,       desc: 'Your account information' },
  { id: 'organizations', label: 'Organizations',   icon: <Building2 size={16} />,  desc: 'Manage your organizations' },
  { id: 'appearance',    label: 'Appearance',      icon: <Monitor size={16} />,    desc: 'Theme and display preferences' },
  { id: 'security',      label: 'Security',        icon: <Shield size={16} />,     desc: 'Password and access settings' },
  { id: 'notifications', label: 'Notifications',   icon: <Bell size={16} />,       desc: 'Alert preferences' },
  { id: 'about',         label: 'About',           icon: <Info size={16} />,       desc: 'Version and changelog' },
]

const ACCENT_COLORS = [
  { name: 'Blue',    value: '#2563eb' },
  { name: 'Violet',  value: '#7c3aed' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Rose',    value: '#e11d48' },
  { name: 'Amber',   value: '#d97706' },
  { name: 'Cyan',    value: '#0891b2' },
]

function inp(err?: string) {
  return `w-full px-3 py-2 rounded-lg bg-navy-700 border text-ink-primary text-sm placeholder:text-ink-muted focus:outline-none transition-colors disabled:opacity-50 ${err ? 'border-red-500/50' : 'border-edge-default focus:border-blue-500'}`
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">{children}</div>
}

function SectionHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-edge-subtle">
      <div>
        <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
        {desc && <p className="text-[11px] text-ink-muted mt-0.5">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

function Row({ label, sub, children }: { label: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-edge-subtle last:border-0">
      <div>
        <p className="text-xs font-medium text-ink-secondary">{label}</p>
        {sub && <p className="text-[11px] text-ink-muted mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative inline-flex w-10 h-5 rounded-full border transition-all ${value ? 'bg-blue-500 border-blue-600' : 'bg-navy-600 border-edge-default'}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}

// ─── Org edit modal ──────────────────────────────────────────────────────────

function OrgEditModal({ org, onClose, onSave }: {
  org: OrganizationSummary & Partial<Organization>
  onClose: () => void
  onSave: (data: Omit<Organization, 'id'>) => Promise<void>
}) {
  const [name, setName] = useState(org.name)
  const [desc, setDesc] = useState(org.description ?? '')
  const [color, setColor] = useState(org.color ?? '#2563eb')
  const [submitting, setSubmitting] = useState(false)
  const COLORS = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2', '#be185d', '#374151']

  const submit = async () => {
    if (!name.trim() || submitting) return
    const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    setSubmitting(true)
    try {
      await onSave({ name: name.trim(), description: desc, color, initials })
      onClose()
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !submitting && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-navy-800 border border-edge-strong rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" style={{ animation: 'modalIn 0.18s ease-out' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge-subtle">
          <h2 className="text-sm font-semibold text-ink-primary">Edit Organization</h2>
          <button onClick={() => !submitting && onClose()} disabled={submitting} className="p-1 rounded-md text-ink-muted hover:text-ink-primary hover:bg-navy-700 transition-colors disabled:opacity-40"><X size={14} /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inp()} autoFocus disabled={submitting} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className={inp()} disabled={submitting} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => !submitting && setColor(c)} className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                  style={{ backgroundColor: c, borderColor: color === c ? '#fff' : 'transparent' }}>
                  {color === c && <Check size={10} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-edge-subtle bg-navy-900/40">
          <button onClick={() => !submitting && onClose()} disabled={submitting} className="px-3.5 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs border border-edge-default transition-colors disabled:opacity-40">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-3.5 py-1.5 rounded-lg text-white text-xs font-medium active:scale-95 transition-all disabled:opacity-60 flex items-center gap-1.5" style={{ backgroundColor: color }}>
            {submitting && <Loader2 size={11} className="animate-spin" />}
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, updateProfile } = useAuth()
  const { currentOrg } = useApp()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = (user?.displayName ?? '?').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const save = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await updateProfile(name.trim())
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader title="Account Information" desc="Your personal profile details" action={
          editing ? (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setName(user?.displayName ?? '') }} disabled={saving} className="px-3 py-1.5 rounded-lg bg-navy-700 text-ink-secondary text-xs border border-edge-default hover:bg-navy-600 transition-colors disabled:opacity-40">Cancel</button>
              <button onClick={save} disabled={saving} className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium transition-all disabled:opacity-60 flex items-center gap-1.5" style={{ boxShadow: '0 1px 8px rgba(37,99,235,0.3)' }}>
                {saving && <Loader2 size={11} className="animate-spin" />} Save
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-700 text-ink-secondary text-xs border border-edge-default hover:bg-navy-600 transition-colors">
              <Edit2 size={11} /> Edit
            </button>
          )
        } />
        <div className="px-5 py-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-semibold text-white flex-shrink-0">{initials}</div>
            <div>
              <p className="text-sm font-semibold text-ink-primary">{user?.displayName}</p>
              <p className="text-xs text-ink-muted">{user?.email}</p>
              {currentOrg && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25 mt-1">{currentOrg.role} · {currentOrg.name}</span>
              )}
            </div>
            {saved && <span className="flex items-center gap-1 text-xs text-green-400 ml-auto"><CheckCircle2 size={13} /> Saved</span>}
          </div>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className={inp()} disabled={saving} />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <p className="text-[11px] text-ink-muted">Email can't be changed here — contact your administrator if it needs to be updated.</p>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {[['Full Name', user?.displayName ?? '—'], ['Email', user?.email ?? '—']].map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 py-1.5 border-b border-edge-subtle last:border-0">
                  <span className="text-ink-muted w-28 flex-shrink-0">{k}</span>
                  <span className="text-ink-secondary">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

function OrganizationsSection({ navigate }: { navigate: (v: View) => void }) {
  const { orgs, currentOrg, switchOrg, addOrg, updateOrg, toast } = useApp()
  const [editTarget, setEditTarget] = useState<OrganizationSummary | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColor, setNewColor] = useState('#2563eb')
  const [creating, setCreating] = useState(false)
  const COLORS = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2', '#be185d']

  const submitNew = async () => {
    if (!newName.trim() || creating) return
    const initials = newName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    setCreating(true)
    try {
      await addOrg({ name: newName.trim(), description: newDesc, color: newColor, initials })
      setNewName(''); setNewDesc(''); setAddOpen(false)
    } catch {
      // error toast already fired by AppProvider
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader title="Organizations" desc={`${orgs.length} organization${orgs.length !== 1 ? 's' : ''} configured`} action={
          <button onClick={() => setAddOpen(!addOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium transition-all" style={{ boxShadow: '0 1px 8px rgba(37,99,235,0.3)' }}>
            <Plus size={11} /> Add
          </button>
        } />

        {addOpen && (
          <div className="px-5 py-4 border-b border-edge-subtle bg-navy-900/30 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Remote Office" className={inp()} autoFocus disabled={creating} />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Description</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional" className={inp()} disabled={creating} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => !creating && setNewColor(c)} className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{ backgroundColor: c, borderColor: newColor === c ? '#fff' : 'transparent' }}>
                    {newColor === c && <Check size={9} className="text-white" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAddOpen(false)} disabled={creating} className="px-3 py-1.5 rounded-lg bg-navy-700 text-ink-secondary text-xs border border-edge-default hover:bg-navy-600 transition-colors disabled:opacity-40">Cancel</button>
                <button onClick={submitNew} disabled={creating} className="px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-all disabled:opacity-60 flex items-center gap-1.5" style={{ backgroundColor: newColor }}>
                  {creating && <Loader2 size={11} className="animate-spin" />} Create
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-edge-subtle">
          {orgs.map(org => (
            <div key={org.id} className={`flex items-center gap-3 px-5 py-4 ${currentOrg?.id === org.id ? 'bg-blue-500/5' : ''}`}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: org.color }}>{org.initials}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink-primary">{org.name}</p>
                  {currentOrg?.id === org.id && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">active</span>}
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-navy-700 text-ink-muted border border-edge-subtle">{org.role}</span>
                </div>
                {org.description && <p className="text-xs text-ink-muted mt-0.5">{org.description}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {currentOrg?.id !== org.id && (
                  <button onClick={() => { switchOrg(org.id); navigate('dashboard'); toast(`Switched to ${org.name}`, 'info') }}
                    className="px-2.5 py-1.5 rounded-lg bg-navy-700 text-ink-secondary text-xs border border-edge-default hover:bg-navy-600 transition-colors">
                    Switch
                  </button>
                )}
                <button onClick={() => setEditTarget(org)} className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-navy-700 transition-colors"><Edit2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {editTarget && (
        <OrgEditModal
          org={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={data => updateOrg(editTarget.id, data)}
        />
      )}
    </div>
  )
}

// Theme is synced with the same lib/theme functions Layout.tsx uses — toggling
// here and toggling in the topbar reflect the same global state.
function AppearanceSection() {
  const [theme, setTheme] = useState(getTheme)
  const [accent, setAccent] = useState('#2563eb')
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [monoFont, setMonoFont] = useState(true)

  return (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader title="Theme" desc="Visual appearance settings" />
        <Row label="Color scheme" sub="Switch between light and dark mode">
          <button
            onClick={() => setTheme(toggleTheme())}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-700 border border-edge-default text-xs text-ink-secondary hover:border-edge-strong transition-colors"
          >
            {theme === 'dark' ? <Moon size={12} className="text-blue-400" /> : <Sun size={12} className="text-orange-400" />}
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </Row>
        {/* Accent color, density, and monospace toggle below are display
            preferences held only in this session — there's no backend endpoint
            for per-user UI preferences yet, so they reset on reload. */}
        <Row label="Accent color" sub="Used for active states and buttons (this session only)">
          <div className="flex gap-2">
            {ACCENT_COLORS.map(c => (
              <button key={c.value} onClick={() => setAccent(c.value)} title={c.name}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                style={{ backgroundColor: c.value, borderColor: accent === c.value ? '#fff' : 'transparent' }}>
                {accent === c.value && <Check size={10} className="text-white" />}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Density" sub="Controls spacing of lists and tables (this session only)">
          <div className="flex rounded-lg overflow-hidden border border-edge-default">
            {(['comfortable', 'compact'] as const).map(d => (
              <button key={d} onClick={() => setDensity(d)}
                className={`px-3 py-1.5 text-xs transition-colors capitalize ${density === d ? 'bg-blue-500 text-white' : 'bg-navy-700 text-ink-secondary hover:bg-navy-600'}`}>
                {d}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Monospace font for data" sub="IP addresses, serial numbers, keys (this session only)">
          <Toggle value={monoFont} onChange={setMonoFont} />
        </Row>
      </SectionCard>

      <SectionCard>
        <SectionHeader title="Language & Region" desc="Not yet configurable — shown for reference" />
        <Row label="Language"><span className="text-xs text-ink-muted">English (US)</span></Row>
        <Row label="Date format"><span className="text-xs text-ink-muted">YYYY-MM-DD</span></Row>
        <Row label="Timezone">
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Globe size={12} /> Browser default
          </div>
        </Row>
      </SectionCard>
    </div>
  )
}

function SecuritySection() {
  const { changePassword } = useAuth()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [pwChanged, setPwChanged] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitPasswordChange = async () => {
    if (!currentPw || newPw.length < 8 || saving) return
    setSaving(true)
    setError(null)
    try {
      await changePassword(currentPw, newPw)
      setCurrentPw('')
      setNewPw('')
      setPwChanged(true)
      setTimeout(() => setPwChanged(false), 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader title="Password" />
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Current Password</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" className={inp()} disabled={saving} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 8 characters" className={inp()} disabled={saving} minLength={8} />
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center justify-between">
            {pwChanged && <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 size={12} /> Password updated</span>}
            <button onClick={submitPasswordChange} disabled={saving || !currentPw || newPw.length < 8}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium transition-all disabled:opacity-50">
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Key size={11} />}
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* The controls below (2FA, session timeout, audit log, IP allowlist, API
          tokens) describe features the backend doesn't implement yet. Rather
          than fabricate persisted state or fake tokens, they're shown as
          disabled/informational so nothing here misrepresents itself as saved. */}
      <SectionCard>
        <SectionHeader title="Additional Security" desc="Not yet available in this deployment" />
        <Row label="Two-factor authentication" sub="Not yet supported">
          <span className="text-[10px] font-mono text-ink-muted px-2 py-1 rounded bg-navy-700 border border-edge-subtle">Coming soon</span>
        </Row>
        <Row label="Activity audit log" sub="Not yet supported">
          <span className="text-[10px] font-mono text-ink-muted px-2 py-1 rounded bg-navy-700 border border-edge-subtle">Coming soon</span>
        </Row>
        <Row label="IP allowlist" sub="Not yet supported">
          <span className="text-[10px] font-mono text-ink-muted px-2 py-1 rounded bg-navy-700 border border-edge-subtle">Coming soon</span>
        </Row>
      </SectionCard>
    </div>
  )
}

// No backend endpoint stores per-user notification preferences yet — these
// toggles are local-only for now and reset on reload, same caveat as the
// cosmetic appearance settings above.
function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    licenseExpiry: true, assetOffline: true, passwordAudit: false,
    docUpdates: false, loginAlerts: true, weeklyReport: false,
  })
  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }))

  const rows: { key: keyof typeof prefs; label: string; sub: string }[] = [
    { key: 'licenseExpiry', label: 'License expiry alerts', sub: 'Notify 60, 30 and 7 days before' },
    { key: 'assetOffline',  label: 'Asset goes offline',    sub: 'When a monitored asset changes to offline' },
    { key: 'passwordAudit', label: 'Password audit reminders', sub: 'Monthly reminder to rotate old passwords' },
    { key: 'docUpdates',    label: 'Documentation updates', sub: 'When a document is created or edited' },
    { key: 'loginAlerts',   label: 'New login alerts',      sub: 'Email on sign-in from a new device' },
    { key: 'weeklyReport',  label: 'Weekly digest',         sub: 'Summary of activity every Monday' },
  ]

  return (
    <SectionCard>
      <SectionHeader title="Notification Preferences" desc="Choose what you want to be notified about (not yet persisted)" />
      {rows.map(r => (
        <Row key={r.key} label={r.label} sub={r.sub}>
          <Toggle value={prefs[r.key]} onChange={() => toggle(r.key)} />
        </Row>
      ))}
    </SectionCard>
  )
}

function AboutSection() {
  return (
    <div className="space-y-4">
      <SectionCard>
        <SectionHeader title="Application" />
        <div className="px-5 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 20px rgba(37,99,235,0.4)' }}>
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-primary">ITDocs</p>
            <p className="text-xs text-ink-muted">IT Documentation Platform</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader title="Danger Zone" />
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-orange-500/25 bg-orange-500/5">
            <div>
              <p className="text-xs font-medium text-orange-400 flex items-center gap-1.5"><AlertTriangle size={12} /> Export Data</p>
              <p className="text-[11px] text-ink-muted mt-0.5">Not yet available in this deployment</p>
            </div>
            <button disabled className="px-3 py-1.5 rounded-lg border border-orange-500/30 text-orange-400/50 text-xs cursor-not-allowed">Export</button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/25 bg-red-500/5">
            <div>
              <p className="text-xs font-medium text-red-400 flex items-center gap-1.5"><LogOut size={12} /> Sign Out Everywhere</p>
              <p className="text-[11px] text-ink-muted mt-0.5">Not yet available in this deployment</p>
            </div>
            <button disabled className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400/50 text-xs cursor-not-allowed">Sign out</button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export default function Settings({ navigate }: { navigate: (v: View) => void }) {
  const [active, setActive] = useState<Section>('profile')
  const [mobileSection, setMobileSection] = useState(false)

  const activeSection = SECTIONS.find(s => s.id === active)!

  const content = () => {
    switch (active) {
      case 'profile':       return <ProfileSection />
      case 'organizations': return <OrganizationsSection navigate={navigate} />
      case 'appearance':    return <AppearanceSection />
      case 'security':      return <SecuritySection />
      case 'notifications': return <NotificationsSection />
      case 'about':         return <AboutSection />
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-[900px]">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-ink-primary">Settings</h1>
        <p className="text-xs text-ink-muted mt-0.5">Manage your account, organizations and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className={`md:w-52 flex-shrink-0 ${mobileSection ? 'hidden' : ''} md:block`}>
          <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
            {SECTIONS.map(s => (
              <button key={s.id}
                onClick={() => { setActive(s.id); setMobileSection(true) }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm border-b border-edge-subtle last:border-0 transition-colors text-left group
                  ${active === s.id ? 'bg-blue-500/10 text-blue-300' : 'text-ink-secondary hover:text-ink-primary hover:bg-navy-700'}`}>
                <div className="flex items-center gap-3">
                  <span className={active === s.id ? 'text-blue-400' : 'text-ink-muted group-hover:text-ink-secondary'}>{s.icon}</span>
                  <span>{s.label}</span>
                </div>
                <ChevronRight size={13} className={`transition-transform ${active === s.id ? 'text-blue-400 rotate-90 md:rotate-0' : 'text-ink-muted opacity-0 group-hover:opacity-100'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className={`flex-1 min-w-0 ${!mobileSection ? 'hidden' : ''} md:block`}>
          <button onClick={() => setMobileSection(false)} className="md:hidden flex items-center gap-2 text-xs text-blue-400 mb-3 hover:text-blue-300 transition-colors">
            ← Back to settings
          </button>

          <div className="md:hidden mb-4">
            <h2 className="text-base font-semibold text-ink-primary flex items-center gap-2">
              <span className="text-blue-400">{activeSection.icon}</span> {activeSection.label}
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">{activeSection.desc}</p>
          </div>

          {content()}
        </div>
      </div>
    </div>
  )
}