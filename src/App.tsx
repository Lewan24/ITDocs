import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import Login from './components/Login'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import AssetInventory from './components/AssetInventory'
import AssetDetails from './components/AssetDetails'
import DocEditor from './components/DocEditor'
import PasswordVault from './components/PasswordVault'
import ToastContainer from './components/ui/Toast'

export type View = 'dashboard' | 'assets' | 'asset-detail' | 'passwords' | 'docs' | 'doc-editor' | 'networks' | 'licenses' | 'settings'

function AppInner() {
  const [authed, setAuthed] = useState(false)
  const [view, setView] = useState<View>('dashboard')
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)

  if (!authed) return <Login onLogin={() => setAuthed(true)} />

  const navigate = (v: View, id?: string) => {
    setView(v)
    if (id !== undefined) setSelectedAssetId(id)
  }

  const content = (() => {
    switch (view) {
      case 'dashboard': return <Dashboard navigate={navigate} />
      case 'assets': return <AssetInventory navigate={navigate} />
      case 'asset-detail': return <AssetDetails assetId={selectedAssetId} navigate={navigate} />
      case 'passwords': return <PasswordVault />
      case 'docs':
      case 'doc-editor': return <DocEditor />
      default: return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div className="w-12 h-12 rounded-xl bg-navy-800 border border-edge-subtle flex items-center justify-center">
            <span className="text-2xl">🔧</span>
          </div>
          <p className="text-sm font-medium text-ink-primary capitalize">{view}</p>
          <p className="text-xs text-ink-muted">This module is coming soon</p>
        </div>
      )
    }
  })()

  return (
    <>
      <Layout currentView={view} navigate={navigate}>{content}</Layout>
      <ToastContainer />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
