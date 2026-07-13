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

// ─── Reducer ──────────────────────────────────────────────────────────────────

interface State { assets: Asset[]; passwords: PasswordEntry[]; toasts: Toast[] }

type Action =
  | { type: 'ADD_ASSET'; asset: Asset }
  | { type: 'UPDATE_ASSET'; asset: Asset }
  | { type: 'DELETE_ASSET'; id: string }
  | { type: 'TOGGLE_STAR_ASSET'; id: string }
  | { type: 'ADD_PASSWORD'; password: PasswordEntry }
  | { type: 'UPDATE_PASSWORD'; password: PasswordEntry }
  | { type: 'DELETE_PASSWORD'; id: string }
  | { type: 'TOGGLE_STAR_PASSWORD'; id: string }
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
  toasts: Toast[]
  dismissToast: (id: string) => void
  addAsset: (a: Omit<Asset, 'id' | 'updated'>) => void
  updateAsset: (a: Asset) => void
  deleteAsset: (id: string) => void
  toggleStarAsset: (id: string) => void
  addPassword: (p: Omit<PasswordEntry, 'id' | 'updated' | 'strength'>) => void
  updatePassword: (p: PasswordEntry) => void
  deletePassword: (id: string) => void
  toggleStarPassword: (id: string) => void
  toast: (message: string, type?: Toast['type']) => void
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

  return (
    <AppContext.Provider value={{ assets: state.assets, passwords: state.passwords, toasts: state.toasts, dismissToast, addAsset, updateAsset, deleteAsset, toggleStarAsset, addPassword, updatePassword, deletePassword, toggleStarPassword, toast }}>
      {children}
    </AppContext.Provider>
  )
}
