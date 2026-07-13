import { useState, useEffect, useRef } from 'react'
import {
  Plus, Search, ChevronDown, ChevronRight, Edit2, Trash2, Network as NetworkIcon,
  Router, Link2, X, CircleDot,
} from 'lucide-react'
import { useApp } from '../context/useApp'
import type { Subnet, IPEntry, IPStatus } from '../context/AppContext'
import type { View } from '../App'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field, inputClass } from '../components/FormField'

const IP_STATUS_STYLES: Record<IPStatus, string> = {
  used: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  free: 'bg-green-500/15 text-green-400 border-green-500/30',
  reserved: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}
const IP_STATUSES: IPStatus[] = ['used', 'free', 'reserved']

function IPStatusBadge({ status }: { status: IPStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border ${IP_STATUS_STYLES[status]}`}>
      <CircleDot size={8} />{status}
    </span>
  )
}

// ─── Subnet Form Modal ─────────────────────────────────────────────────────────

interface SubnetFormProps { initial?: Subnet; onSave: (d: Omit<Subnet, 'id' | 'ips'>) => void; onClose: () => void }

function SubnetForm({ initial, onSave, onClose }: SubnetFormProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    cidr: initial?.cidr ?? '',
    vlan: initial?.vlan ?? '',
    gateway: initial?.gateway ?? '',
    description: initial?.description ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const firstRef = useRef<HTMLInputElement>(null)
  useEffect(() => { firstRef.current?.focus() }, [])

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!/^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(form.cidr.trim())) e.cidr = 'Use CIDR notation, e.g. 10.0.1.0/24'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <ModalHeader
        title={initial ? 'Edit Subnet' : 'Add Subnet'}
        subtitle={initial ? `Editing ${initial.name}` : 'Register a new IP range to track'}
        onClose={onClose}
      />
      <ModalBody>
        <Field label="Name *" error={errors.name}>
          <input ref={firstRef} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Production Servers" className={inputClass(errors.name)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="CIDR *" error={errors.cidr}>
            <input value={form.cidr} onChange={e => set('cidr', e.target.value)} placeholder="e.g. 10.0.1.0/24" className={inputClass(errors.cidr) + ' font-mono'} />
          </Field>
          <Field label="VLAN">
            <input value={form.vlan} onChange={e => set('vlan', e.target.value)} placeholder="e.g. 20" className={inputClass() + ' font-mono'} />
          </Field>
        </div>
        <Field label="Gateway">
          <input value={form.gateway} onChange={e => set('gateway', e.target.value)} placeholder="e.g. 10.0.1.1" className={inputClass() + ' font-mono'} />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="What lives on this subnet…" className={inputClass() + ' resize-none leading-relaxed'} />
        </Field>
      </ModalBody>
      <ModalFooter>
        <span />
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs transition-colors border border-edge-default">Cancel</button>
          <button onClick={() => { if (validate()) onSave(form) }} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-xs font-medium transition-all" style={{ boxShadow: '0 1px 12px rgba(37,99,235,0.35)' }}>
            {initial ? 'Save Changes' : 'Create Subnet'}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

// ─── IP Entry Form Modal ───────────────────────────────────────────────────────

interface IPFormProps { initial?: IPEntry; onSave: (d: Omit<IPEntry, 'id'>) => void; onClose: () => void }

function IPForm({ initial, onSave, onClose }: IPFormProps) {
  const { assets } = useApp()
  const [form, setForm] = useState({
    address: initial?.address ?? '',
    status: initial?.status ?? 'used' as IPStatus,
    assetId: initial?.assetId ?? '',
    device: initial?.device ?? '',
    notes: initial?.notes ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const firstRef = useRef<HTMLInputElement>(null)
  useEffect(() => { firstRef.current?.focus() }, [])

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!/^[\d.]+$/.test(form.address.trim())) e.address = 'Invalid IP address'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSave({
      address: form.address.trim(),
      status: form.status,
      assetId: form.assetId || undefined,
      device: form.assetId ? undefined : form.device,
      notes: form.notes,
    })
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <ModalHeader
        title={initial ? 'Edit IP Entry' : 'Add IP Entry'}
        subtitle={initial ? `Editing ${initial.address}` : 'Track a specific address in this subnet'}
        onClose={onClose}
      />
      <ModalBody>
        <div className="grid grid-cols-2 gap-4">
          <Field label="IP Address *" error={errors.address}>
            <input ref={firstRef} value={form.address} onChange={e => set('address', e.target.value)} placeholder="e.g. 10.0.1.14" className={inputClass(errors.address) + ' font-mono'} />
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass()}>
              {IP_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Linked Asset">
          <select value={form.assetId} onChange={e => set('assetId', e.target.value)} className={inputClass()}>
            <option value="">— Not linked, use free text below —</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
          </select>
        </Field>

        {!form.assetId && (
          <Field label="Device / Owner">
            <input value={form.device} onChange={e => set('device', e.target.value)} placeholder="e.g. Reserved for guest wifi, or a printer name" className={inputClass()} />
          </Field>
        )}

        <Field label="Notes">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Any relevant notes…" className={inputClass() + ' resize-none leading-relaxed'} />
        </Field>
      </ModalBody>
      <ModalFooter>
        <span />
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs transition-colors border border-edge-default">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-xs font-medium transition-all" style={{ boxShadow: '0 1px 12px rgba(37,99,235,0.35)' }}>
            {initial ? 'Save Changes' : 'Add IP'}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

// ─── Subnet Card ────────────────────────────────────────────────────────────────

function SubnetCard({ subnet, navigate, query }: { subnet: Subnet; navigate: (v: View, id?: string) => void; query: string }) {
  const { assets, addIP, updateIP, deleteIP, deleteSubnet, updateSubnet } = useApp()
  const [open, setOpen] = useState(!!query)
  const [ipFormOpen, setIpFormOpen] = useState(false)
  const [editIp, setEditIp] = useState<IPEntry | null>(null)
  const [deleteIpTarget, setDeleteIpTarget] = useState<IPEntry | null>(null)
  const [editSubnetOpen, setEditSubnetOpen] = useState(false)
  const [deleteSubnetOpen, setDeleteSubnetOpen] = useState(false)

  const ips = subnet.ips.filter(ip =>
    !query ||
    ip.address.includes(query) ||
    (ip.device ?? '').toLowerCase().includes(query.toLowerCase()) ||
    assets.find(a => a.id === ip.assetId)?.name.toLowerCase().includes(query.toLowerCase())
  )

  const usedCount = subnet.ips.filter(ip => ip.status === 'used').length
  const freeCount = subnet.ips.filter(ip => ip.status === 'free').length
  const reservedCount = subnet.ips.filter(ip => ip.status === 'reserved').length

  return (
    <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-navy-700/40 transition-colors">
        {open ? <ChevronDown size={14} className="text-ink-muted flex-shrink-0" /> : <ChevronRight size={14} className="text-ink-muted flex-shrink-0" />}
        <div className="w-8 h-8 rounded-lg bg-navy-700 border border-edge-default flex items-center justify-center flex-shrink-0">
          <NetworkIcon size={14} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink-primary truncate">{subnet.name}</span>
            <span className="text-[10px] font-mono text-ink-muted bg-navy-900/60 border border-edge-subtle px-1.5 py-0.5 rounded">{subnet.cidr}</span>
            {subnet.vlan && <span className="text-[10px] font-mono text-ink-muted">VLAN {subnet.vlan}</span>}
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5 truncate">{subnet.description || 'No description'}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono flex-shrink-0 mr-2">
          <span className="text-blue-400">{usedCount} used</span>
          <span className="text-green-400">{freeCount} free</span>
          {reservedCount > 0 && <span className="text-orange-400">{reservedCount} held</span>}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditSubnetOpen(true)} title="Edit subnet" className="p-1.5 rounded-md hover:bg-navy-600 text-ink-muted hover:text-ink-primary transition-colors"><Edit2 size={13} /></button>
          <button onClick={() => setDeleteSubnetOpen(true)} title="Delete subnet" className="p-1.5 rounded-md hover:bg-navy-600 text-ink-muted hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
        </div>
      </button>

      {open && (
        <div className="border-t border-edge-subtle">
          {ips.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-ink-muted">{subnet.ips.length === 0 ? 'No IPs tracked in this subnet yet' : 'No IPs match your search'}</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-edge-subtle bg-navy-900/40 text-ink-muted">
                  <th className="text-left font-medium px-4 py-2">Address</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                  <th className="text-left font-medium px-3 py-2">Assigned to</th>
                  <th className="text-left font-medium px-3 py-2">Notes</th>
                  <th className="text-right font-medium px-3 py-2 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-subtle">
                {ips.map(ip => {
                  const linkedAsset = assets.find(a => a.id === ip.assetId)
                  return (
                    <tr key={ip.id} className="group hover:bg-navy-700/40 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-ink-primary">{ip.address}</td>
                      <td className="px-3 py-2.5"><IPStatusBadge status={ip.status} /></td>
                      <td className="px-3 py-2.5">
                        {linkedAsset ? (
                          <button onClick={() => navigate('asset-detail', linkedAsset.id)} className="flex items-center gap-1.5 text-ink-link hover:text-blue-300 transition-colors">
                            <Link2 size={11} />{linkedAsset.name}
                          </button>
                        ) : ip.device ? (
                          <span className="text-ink-secondary">{ip.device}</span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-ink-muted truncate max-w-[220px]">{ip.notes || '—'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setEditIp(ip)} title="Edit" className="p-1.5 rounded-md hover:bg-navy-600 text-ink-muted hover:text-ink-primary transition-colors"><Edit2 size={12} /></button>
                          <button onClick={() => setDeleteIpTarget(ip)} title="Delete" className="p-1.5 rounded-md hover:bg-navy-600 text-ink-muted hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <div className="px-4 py-2.5 border-t border-edge-subtle">
            <button onClick={() => setIpFormOpen(true)} className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
              <Plus size={12} /> Add IP to this subnet
            </button>
          </div>
        </div>
      )}

      {/* Modals scoped to this subnet */}
      {ipFormOpen && <IPForm onSave={d => { addIP(subnet.id, d); setIpFormOpen(false) }} onClose={() => setIpFormOpen(false)} />}
      {editIp && <IPForm initial={editIp} onSave={d => { updateIP(subnet.id, { ...editIp, ...d }); setEditIp(null) }} onClose={() => setEditIp(null)} />}
      {deleteIpTarget && (
        <ConfirmDialog
          title="Delete IP Entry"
          message={<>Remove <span className="text-ink-primary font-mono">{deleteIpTarget.address}</span> from tracking? This cannot be undone.</>}
          onConfirm={() => { deleteIP(subnet.id, deleteIpTarget.id); setDeleteIpTarget(null) }}
          onCancel={() => setDeleteIpTarget(null)}
        />
      )}
      {editSubnetOpen && <SubnetForm initial={subnet} onSave={d => { updateSubnet({ id: subnet.id, ...d }); setEditSubnetOpen(false) }} onClose={() => setEditSubnetOpen(false)} />}
      {deleteSubnetOpen && (
        <ConfirmDialog
          title="Delete Subnet"
          message={<>Delete <span className="text-ink-primary font-mono">{subnet.name}</span> and all {subnet.ips.length} tracked IPs? This cannot be undone.</>}
          onConfirm={() => { deleteSubnet(subnet.id); setDeleteSubnetOpen(false) }}
          onCancel={() => setDeleteSubnetOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props { navigate: (v: View, id?: string) => void }

export default function NetworkManager({ navigate }: Props) {
  const { subnets, addSubnet } = useApp()
  const [query, setQuery] = useState('')
  const [addSubnetOpen, setAddSubnetOpen] = useState(false)

  const totalIps = subnets.reduce((sum, s) => sum + s.ips.length, 0)
  const totalFree = subnets.reduce((sum, s) => sum + s.ips.filter(ip => ip.status === 'free').length, 0)
  const totalUsed = subnets.reduce((sum, s) => sum + s.ips.filter(ip => ip.status === 'used').length, 0)

  const filteredSubnets = subnets.filter(s =>
    !query ||
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.cidr.includes(query) ||
    s.ips.some(ip => ip.address.includes(query))
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Network</h1>
          <p className="text-xs text-ink-muted mt-0.5 font-mono">
            {subnets.length} subnets · {totalIps} IPs tracked · <span className="text-blue-400">{totalUsed} used</span> · <span className="text-green-400">{totalFree} free</span>
          </p>
        </div>
        <button
          onClick={() => setAddSubnetOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-sm font-medium transition-all"
          style={{ boxShadow: '0 1px 12px rgba(37,99,235,0.3)' }}
        >
          <Plus size={15} /> Add Subnet
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search IP, subnet, or assigned device…"
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-navy-800 border border-edge-default text-ink-primary text-xs placeholder:text-ink-muted focus:border-blue-500 focus:outline-none transition-colors" />
        {query && <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary transition-colors"><X size={12} /></button>}
      </div>

      {/* Subnet list */}
      {filteredSubnets.length === 0 ? (
        <div className="bg-navy-800 border border-edge-subtle rounded-xl py-16 text-center">
          <Router size={28} className="text-ink-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-ink-muted">{subnets.length === 0 ? 'No subnets yet — add one to start tracking IPs' : 'No subnets match your search'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubnets.map(s => <SubnetCard key={s.id} subnet={s} navigate={navigate} query={query} />)}
        </div>
      )}

      {addSubnetOpen && <SubnetForm onSave={d => { addSubnet(d); setAddSubnetOpen(false) }} onClose={() => setAddSubnetOpen(false)} />}
    </div>
  )
}
