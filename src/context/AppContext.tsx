import { useReducer, useCallback, type ReactNode } from 'react'
import { AppContext } from './useApp'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssetType = 'Server' | 'Workstation' | 'Network' | 'Storage' | 'AP' | 'Printer' | 'Phone'
export type AssetStatus = 'online' | 'offline' | 'maintenance' | 'unknown'
export type PasswordStrength = 'strong' | 'medium' | 'weak'

export interface Asset {
  id: string
  name: string
  type: AssetType
  status: AssetStatus
  location: string
  owner: string
  ip: string
  updated: string
  starred: boolean
  tags: string[]
  notes: string
  serial?: string
}

export interface PasswordEntry {
  id: string
  name: string
  username: string
  password: string
  category: string
  tags: string[]
  updated: string
  strength: PasswordStrength
  starred: boolean
  notes: string
}

export type IPStatus = 'used' | 'free' | 'reserved'

export interface IPEntry {
  id: string
  address: string
  status: IPStatus
  /** Linked Asset this IP is assigned to. Takes precedence over the free-text device field. */
  assetId?: string
  /** Free-text device/description when not linked to an Asset (e.g. a printer or third-party box). */
  device?: string
  notes: string
}

export interface Subnet {
  id: string
  name: string
  cidr: string
  vlan?: string
  gateway?: string
  description: string
  ips: IPEntry[]
}

export type LicenseCategory = 'Domain' | 'Office / M365' | 'Program' | 'Antivirus' | 'Other'

export interface License {
  id: string
  name: string
  category: LicenseCategory
  vendor: string
  seats?: number
  licenseKey?: string
  purchaseDate: string
  /** ISO date, or '' for a license that never expires (perpetual / lifetime). */
  expiryDate: string
  autoRenew: boolean
  assignedTo: string
  cost?: number
  tags: string[]
  starred: boolean
  notes: string
  updated: string
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

// ─── Initial data ─────────────────────────────────────────────────────────────

const INITIAL_ASSETS: Asset[] = [
  { id: '1', name: 'SRV-PROD-01', type: 'Server', status: 'online', location: 'DC-RACK-A1', owner: 'John Doe', ip: '10.0.1.10', updated: '2h ago', starred: true, tags: ['production', 'vmware', 'critical'], notes: 'Primary production hypervisor. Hosts 14 VMs.', serial: 'BCZK1234567' },
  { id: '2', name: 'SRV-PROD-02', type: 'Server', status: 'online', location: 'DC-RACK-A1', owner: 'John Doe', ip: '10.0.1.11', updated: '2h ago', starred: false, tags: ['production', 'vmware'], notes: 'Secondary production hypervisor.', serial: 'BCZK1234568' },
  { id: '3', name: 'SRV-DEV-01', type: 'Server', status: 'maintenance', location: 'DC-RACK-B2', owner: 'Sarah K.', ip: '10.0.2.10', updated: '1d ago', starred: false, tags: ['dev', 'docker'], notes: 'Dev environment. Scheduled RAM upgrade Q3 2026.' },
  { id: '4', name: 'WS-ADMIN-01', type: 'Workstation', status: 'online', location: 'Office 3F', owner: 'John Doe', ip: '10.1.0.50', updated: '3h ago', starred: false, tags: ['admin', 'workstation'], notes: '' },
  { id: '5', name: 'WS-DEV-42', type: 'Workstation', status: 'online', location: 'Office 2F', owner: 'Mike T.', ip: '10.1.0.91', updated: '5h ago', starred: false, tags: ['dev'], notes: '' },
  { id: '6', name: 'FW-EDGE-01', type: 'Network', status: 'online', location: 'DC-RACK-A0', owner: 'John Doe', ip: '10.0.0.1', updated: '4h ago', starred: true, tags: ['network', 'firewall', 'critical'], notes: 'Perimeter FortiGate 100F.' },
  { id: '7', name: 'SW-CORE-01', type: 'Network', status: 'maintenance', location: 'DC-RACK-A0', owner: 'Sarah K.', ip: '10.0.0.2', updated: '2d ago', starred: true, tags: ['network', 'core'], notes: 'Core L3 switch. Port 48 down for investigation.' },
  { id: '8', name: 'NAS-BACKUP', type: 'Storage', status: 'online', location: 'DC-RACK-C1', owner: 'Mike T.', ip: '10.0.3.5', updated: '1d ago', starred: true, tags: ['storage', 'backup'], notes: 'QNAP TS-1264U. 96TB raw.' },
  { id: '9', name: 'AP-3F-MAIN', type: 'AP', status: 'online', location: 'Office 3F', owner: 'Sarah K.', ip: '192.168.10.5', updated: '6h ago', starred: false, tags: ['wifi', 'wireless'], notes: '' },
  { id: '10', name: 'SRV-BACKUP', type: 'Server', status: 'offline', location: 'DC-RACK-B1', owner: 'John Doe', ip: '10.0.1.20', updated: '5d ago', starred: false, tags: ['backup'], notes: 'Decommissioning in progress.' },
]

const INITIAL_PASSWORDS: PasswordEntry[] = [
  { id: '1', name: 'AWS Root Account', username: 'root@corp.com', password: 'Tr0ub4dor&3#Xk9!', category: 'Cloud', tags: ['aws', 'cloud', 'critical'], updated: '2026-06-01', strength: 'strong', starred: true, notes: 'Root account for AWS organization. MFA enforced.' },
  { id: '2', name: 'ESXi SRV-PROD-01', username: 'root', password: 'vMw@reR00t!2025', category: 'Hypervisor', tags: ['vmware', 'esxi', 'production'], updated: '2026-05-20', strength: 'strong', starred: true, notes: 'ESXi root access for primary hypervisor.' },
  { id: '3', name: 'FortiGate Admin', username: 'admin', password: 'F0rt1G@te!Edge01', category: 'Network', tags: ['fortinet', 'firewall'], updated: '2026-04-15', strength: 'strong', starred: false, notes: 'Web admin UI for perimeter firewall.' },
  { id: '4', name: 'Domain Admin (corp.local)', username: 'CORP\\Administrator', password: 'D0m@inAdm!n2025', category: 'Active Directory', tags: ['ad', 'domain', 'critical'], updated: '2026-03-01', strength: 'strong', starred: true, notes: 'Rotate every 90 days per policy.' },
  { id: '5', name: 'Azure Portal EA Admin', username: 'ea-admin@corp.onmicrosoft.com', password: 'Az@reEA2025!', category: 'Cloud', tags: ['azure', 'cloud', 'ms365'], updated: '2026-02-10', strength: 'medium', starred: false, notes: 'Enterprise Agreement portal admin.' },
  { id: '6', name: 'NAS QNAP Admin', username: 'admin', password: 'Qnap@NAS!2024', category: 'Storage', tags: ['nas', 'qnap', 'backup'], updated: '2026-01-20', strength: 'medium', starred: false, notes: 'NAS-BACKUP administrative access.' },
  { id: '7', name: 'VMware vCenter', username: 'administrator@vsphere.local', password: 'vSph3re!Admin25', category: 'Hypervisor', tags: ['vmware', 'vcenter'], updated: '2026-06-15', strength: 'strong', starred: false, notes: 'vCenter SSO admin.' },
]

function buildIps(prefix: string, entries: Array<Partial<IPEntry> & { last: number }>): IPEntry[] {
  return entries.map(e => ({
    id: `${prefix}-${e.last}`,
    address: `${prefix}.${e.last}`,
    status: e.status ?? 'used',
    assetId: e.assetId,
    device: e.device,
    notes: e.notes ?? '',
  }))
}

const INITIAL_SUBNETS: Subnet[] = [
  {
    id: 'sub-1', name: 'Datacenter Core', cidr: '10.0.0.0/24', vlan: '10', gateway: '10.0.0.1',
    description: 'Firewalls, core switching and the hypervisor management network.',
    ips: buildIps('10.0.0', [
      { last: 1, status: 'used', assetId: '6', notes: 'Perimeter firewall mgmt' },
      { last: 2, status: 'used', assetId: '7', notes: 'Core switch mgmt' },
      { last: 3, status: 'reserved', device: 'Reserved for SW-CORE-02', notes: 'Held for planned redundant switch' },
      { last: 4, status: 'free', notes: '' },
      { last: 5, status: 'free', notes: '' },
    ]),
  },
  {
    id: 'sub-2', name: 'Production Servers', cidr: '10.0.1.0/24', vlan: '20', gateway: '10.0.1.1',
    description: 'Primary production hypervisors and VM hosts.',
    ips: buildIps('10.0.1', [
      { last: 10, status: 'used', assetId: '1', notes: '' },
      { last: 11, status: 'used', assetId: '2', notes: '' },
      { last: 20, status: 'used', assetId: '10', notes: 'Being decommissioned, IP not yet reclaimed' },
      { last: 12, status: 'free', notes: '' },
      { last: 13, status: 'free', notes: '' },
    ]),
  },
  {
    id: 'sub-3', name: 'Office LAN', cidr: '10.1.0.0/24', vlan: '30', gateway: '10.1.0.1',
    description: 'Workstations and printers across both office floors.',
    ips: buildIps('10.1.0', [
      { last: 50, status: 'used', assetId: '4', notes: '' },
      { last: 91, status: 'used', assetId: '5', notes: '' },
      { last: 100, status: 'reserved', device: 'DHCP pool start', notes: 'Everything from .100 up is DHCP-assigned' },
      { last: 51, status: 'free', notes: '' },
    ]),
  },
]

const INITIAL_LICENSES: License[] = [
  { id: 'lic-1', name: 'Windows Server 2025 Datacenter', category: 'Program', vendor: 'Microsoft', seats: 2, licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', purchaseDate: '2025-01-15', expiryDate: '', autoRenew: false, assignedTo: 'SRV-PROD-01, SRV-PROD-02', cost: 6199, tags: ['microsoft', 'server'], starred: true, notes: 'Perpetual license, covers both hypervisor hosts.', updated: '2025-01-15' },
  { id: 'lic-2', name: 'Microsoft 365 Business Premium', category: 'Office / M365', vendor: 'Microsoft', seats: 25, licenseKey: '', purchaseDate: '2025-08-01', expiryDate: '2026-08-01', autoRenew: true, assignedTo: 'All staff', cost: 5700, tags: ['microsoft', 'ms365', 'email'], starred: true, notes: 'Annual subscription, auto-renews via CSP partner.', updated: '2026-01-05' },
  { id: 'lic-3', name: 'corp-company.com', category: 'Domain', vendor: 'Cloudflare Registrar', seats: undefined, licenseKey: '', purchaseDate: '2019-03-12', expiryDate: '2027-03-12', autoRenew: true, assignedTo: 'IT', cost: 12, tags: ['domain', 'dns'], starred: false, notes: 'Primary company domain. DNS also hosted on Cloudflare.', updated: '2026-03-12' },
  { id: 'lic-4', name: 'ESET PROTECT Entry', category: 'Antivirus', vendor: 'ESET', seats: 40, licenseKey: 'ESET-XXXX-XXXX-XXXX', purchaseDate: '2025-07-20', expiryDate: '2026-07-20', autoRenew: false, assignedTo: 'All endpoints', cost: 1240, tags: ['eset', 'endpoint-security'], starred: true, notes: 'Renewal quote requested from vendor.', updated: '2025-07-20' },
  { id: 'lic-5', name: 'Adobe Creative Cloud', category: 'Program', vendor: 'Adobe', seats: 3, licenseKey: '', purchaseDate: '2025-09-10', expiryDate: '2026-09-10', autoRenew: true, assignedTo: 'Marketing team', cost: 1890, tags: ['adobe', 'design'], starred: false, notes: '', updated: '2025-09-10' },
  { id: 'lic-6', name: 'corp-company.net', category: 'Domain', vendor: 'Cloudflare Registrar', seats: undefined, licenseKey: '', purchaseDate: '2020-06-01', expiryDate: '2026-08-05', autoRenew: false, assignedTo: 'IT', cost: 14, tags: ['domain', 'defensive-registration'], starred: false, notes: 'Defensive registration, not in active use.', updated: '2025-08-05' },
]

// ─── Reducer ──────────────────────────────────────────────────────────────────

interface State {
  assets: Asset[]
  passwords: PasswordEntry[]
  subnets: Subnet[]
  licenses: License[]
  toasts: Toast[]
}

type Action =
  | { type: 'ADD_ASSET'; asset: Asset }
  | { type: 'UPDATE_ASSET'; asset: Asset }
  | { type: 'DELETE_ASSET'; id: string }
  | { type: 'TOGGLE_STAR_ASSET'; id: string }
  | { type: 'ADD_PASSWORD'; password: PasswordEntry }
  | { type: 'UPDATE_PASSWORD'; password: PasswordEntry }
  | { type: 'DELETE_PASSWORD'; id: string }
  | { type: 'TOGGLE_STAR_PASSWORD'; id: string }
  | { type: 'ADD_SUBNET'; subnet: Subnet }
  | { type: 'UPDATE_SUBNET'; subnet: Subnet }
  | { type: 'DELETE_SUBNET'; id: string }
  | { type: 'ADD_IP'; subnetId: string; ip: IPEntry }
  | { type: 'UPDATE_IP'; subnetId: string; ip: IPEntry }
  | { type: 'DELETE_IP'; subnetId: string; ipId: string }
  | { type: 'ADD_LICENSE'; license: License }
  | { type: 'UPDATE_LICENSE'; license: License }
  | { type: 'DELETE_LICENSE'; id: string }
  | { type: 'TOGGLE_STAR_LICENSE'; id: string }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_ASSET':
      return { ...state, assets: [action.asset, ...state.assets] }
    case 'UPDATE_ASSET':
      return { ...state, assets: state.assets.map(a => a.id === action.asset.id ? action.asset : a) }
    case 'DELETE_ASSET':
      return { ...state, assets: state.assets.filter(a => a.id !== action.id) }
    case 'TOGGLE_STAR_ASSET':
      return { ...state, assets: state.assets.map(a => a.id === action.id ? { ...a, starred: !a.starred } : a) }

    case 'ADD_PASSWORD':
      return { ...state, passwords: [action.password, ...state.passwords] }
    case 'UPDATE_PASSWORD':
      return { ...state, passwords: state.passwords.map(p => p.id === action.password.id ? action.password : p) }
    case 'DELETE_PASSWORD':
      return { ...state, passwords: state.passwords.filter(p => p.id !== action.id) }
    case 'TOGGLE_STAR_PASSWORD':
      return { ...state, passwords: state.passwords.map(p => p.id === action.id ? { ...p, starred: !p.starred } : p) }

    case 'ADD_SUBNET':
      return { ...state, subnets: [action.subnet, ...state.subnets] }
    case 'UPDATE_SUBNET':
      return { ...state, subnets: state.subnets.map(s => s.id === action.subnet.id ? { ...action.subnet, ips: s.ips } : s) }
    case 'DELETE_SUBNET':
      return { ...state, subnets: state.subnets.filter(s => s.id !== action.id) }
    case 'ADD_IP':
      return { ...state, subnets: state.subnets.map(s => s.id === action.subnetId ? { ...s, ips: [...s.ips, action.ip] } : s) }
    case 'UPDATE_IP':
      return { ...state, subnets: state.subnets.map(s => s.id === action.subnetId ? { ...s, ips: s.ips.map(ip => ip.id === action.ip.id ? action.ip : ip) } : s) }
    case 'DELETE_IP':
      return { ...state, subnets: state.subnets.map(s => s.id === action.subnetId ? { ...s, ips: s.ips.filter(ip => ip.id !== action.ipId) } : s) }

    case 'ADD_LICENSE':
      return { ...state, licenses: [action.license, ...state.licenses] }
    case 'UPDATE_LICENSE':
      return { ...state, licenses: state.licenses.map(l => l.id === action.license.id ? action.license : l) }
    case 'DELETE_LICENSE':
      return { ...state, licenses: state.licenses.filter(l => l.id !== action.id) }
    case 'TOGGLE_STAR_LICENSE':
      return { ...state, licenses: state.licenses.map(l => l.id === action.id ? { ...l, starred: !l.starred } : l) }

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) }
    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface AppContextValue {
  assets: Asset[]
  passwords: PasswordEntry[]
  subnets: Subnet[]
  licenses: License[]
  toasts: Toast[]
  dismissToast: (id: string) => void
  toast: (message: string, type?: Toast['type']) => void

  addAsset: (a: Omit<Asset, 'id' | 'updated'>) => void
  updateAsset: (a: Asset) => void
  deleteAsset: (id: string) => void
  toggleStarAsset: (id: string) => void

  addPassword: (p: Omit<PasswordEntry, 'id' | 'updated' | 'strength'>) => void
  updatePassword: (p: PasswordEntry) => void
  deletePassword: (id: string) => void
  toggleStarPassword: (id: string) => void

  addSubnet: (s: Omit<Subnet, 'id' | 'ips'>) => void
  updateSubnet: (s: Omit<Subnet, 'ips'>) => void
  deleteSubnet: (id: string) => void
  addIP: (subnetId: string, ip: Omit<IPEntry, 'id'>) => void
  updateIP: (subnetId: string, ip: IPEntry) => void
  deleteIP: (subnetId: string, ipId: string) => void

  addLicense: (l: Omit<License, 'id' | 'updated'>) => void
  updateLicense: (l: License) => void
  deleteLicense: (id: string) => void
  toggleStarLicense: (id: string) => void
}

function calcStrength(pw: string): PasswordStrength {
  if (pw.length >= 16 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) return 'strong'
  if (pw.length >= 10) return 'medium'
  return 'weak'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    assets: INITIAL_ASSETS,
    passwords: INITIAL_PASSWORDS,
    subnets: INITIAL_SUBNETS,
    licenses: INITIAL_LICENSES,
    toasts: [],
  })

  const dismissToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id })
  }, [])

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    if (!message) return
    const id = crypto.randomUUID()
    dispatch({ type: 'ADD_TOAST', toast: { id, message, type } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 3200)
  }, [])

  // ── Assets ──
  const addAsset = useCallback((a: Omit<Asset, 'id' | 'updated'>) => {
    dispatch({ type: 'ADD_ASSET', asset: { ...a, id: crypto.randomUUID(), updated: 'just now' } })
    toast(`Asset "${a.name}" created`)
  }, [toast])

  const updateAsset = useCallback((a: Asset) => {
    dispatch({ type: 'UPDATE_ASSET', asset: { ...a, updated: 'just now' } })
    toast(`Asset "${a.name}" updated`)
  }, [toast])

  const deleteAsset = useCallback((id: string) => {
    const name = state.assets.find(a => a.id === id)?.name
    dispatch({ type: 'DELETE_ASSET', id })
    toast(`Asset "${name}" deleted`, 'info')
  }, [state.assets, toast])

  const toggleStarAsset = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_STAR_ASSET', id })
  }, [])

  // ── Passwords ──
  const addPassword = useCallback((p: Omit<PasswordEntry, 'id' | 'updated' | 'strength'>) => {
    dispatch({ type: 'ADD_PASSWORD', password: { ...p, id: crypto.randomUUID(), updated: new Date().toISOString().slice(0, 10), strength: calcStrength(p.password) } })
    toast(`Password "${p.name}" saved`)
  }, [toast])

  const updatePassword = useCallback((p: PasswordEntry) => {
    dispatch({ type: 'UPDATE_PASSWORD', password: { ...p, updated: new Date().toISOString().slice(0, 10), strength: calcStrength(p.password) } })
    toast(`Password "${p.name}" updated`)
  }, [toast])

  const deletePassword = useCallback((id: string) => {
    const name = state.passwords.find(p => p.id === id)?.name
    dispatch({ type: 'DELETE_PASSWORD', id })
    toast(`Password "${name}" deleted`, 'info')
  }, [state.passwords, toast])

  const toggleStarPassword = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_STAR_PASSWORD', id })
  }, [])

  // ── Network (subnets + IPs) ──
  const addSubnet = useCallback((s: Omit<Subnet, 'id' | 'ips'>) => {
    dispatch({ type: 'ADD_SUBNET', subnet: { ...s, id: crypto.randomUUID(), ips: [] } })
    toast(`Subnet "${s.name}" created`)
  }, [toast])

  const updateSubnet = useCallback((s: Omit<Subnet, 'ips'>) => {
    dispatch({ type: 'UPDATE_SUBNET', subnet: { ...s, ips: [] } })
    toast(`Subnet "${s.name}" updated`)
  }, [toast])

  const deleteSubnet = useCallback((id: string) => {
    const name = state.subnets.find(s => s.id === id)?.name
    dispatch({ type: 'DELETE_SUBNET', id })
    toast(`Subnet "${name}" deleted`, 'info')
  }, [state.subnets, toast])

  const addIP = useCallback((subnetId: string, ip: Omit<IPEntry, 'id'>) => {
    dispatch({ type: 'ADD_IP', subnetId, ip: { ...ip, id: crypto.randomUUID() } })
    toast(`${ip.address} added`)
  }, [toast])

  const updateIP = useCallback((subnetId: string, ip: IPEntry) => {
    dispatch({ type: 'UPDATE_IP', subnetId, ip })
    toast(`${ip.address} updated`)
  }, [toast])

  const deleteIP = useCallback((subnetId: string, ipId: string) => {
    dispatch({ type: 'DELETE_IP', subnetId, ipId })
    toast('IP entry removed', 'info')
  }, [toast])

  // ── Licenses ──
  const addLicense = useCallback((l: Omit<License, 'id' | 'updated'>) => {
    dispatch({ type: 'ADD_LICENSE', license: { ...l, id: crypto.randomUUID(), updated: new Date().toISOString().slice(0, 10) } })
    toast(`License "${l.name}" added`)
  }, [toast])

  const updateLicense = useCallback((l: License) => {
    dispatch({ type: 'UPDATE_LICENSE', license: { ...l, updated: new Date().toISOString().slice(0, 10) } })
    toast(`License "${l.name}" updated`)
  }, [toast])

  const deleteLicense = useCallback((id: string) => {
    const name = state.licenses.find(l => l.id === id)?.name
    dispatch({ type: 'DELETE_LICENSE', id })
    toast(`License "${name}" deleted`, 'info')
  }, [state.licenses, toast])

  const toggleStarLicense = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_STAR_LICENSE', id })
  }, [])

  return (
    <AppContext.Provider value={{
      assets: state.assets, passwords: state.passwords, subnets: state.subnets, licenses: state.licenses, toasts: state.toasts,
      dismissToast, toast,
      addAsset, updateAsset, deleteAsset, toggleStarAsset,
      addPassword, updatePassword, deletePassword, toggleStarPassword,
      addSubnet, updateSubnet, deleteSubnet, addIP, updateIP, deleteIP,
      addLicense, updateLicense, deleteLicense, toggleStarLicense,
    }}>
      {children}
    </AppContext.Provider>
  )
}
