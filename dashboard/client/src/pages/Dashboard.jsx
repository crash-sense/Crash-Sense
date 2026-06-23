import { useState } from 'react'
import { useSocket } from '../hooks/useSocket'
import CrashFeed from '../components/CrashFeed'
import CodeViewer from '../components/CodeViewer'
import AIChat from '../components/AIChat'

export default function Dashboard() {
  const [selectedCrash, setSelectedCrash] = useState(null)

  return (
    <div className="dashboard-layout">

      {/* ── Left Sidebar ── */}
      <div className="sidebar-panel">
        <div className="brand">
          {/* Bug / lightning bolt icon */}
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <h2>CrashSense</h2>
        </div>

        <CrashFeed
          selectedCrash={selectedCrash}
          onSelectCrash={setSelectedCrash}
        />
      </div>

      {/* ── Main Content (Inspector + AI) ── */}
      <div className="main-content">
        <CodeViewer crash={selectedCrash} />
        <AIChat crash={selectedCrash} />
      </div>

    </div>
  )
}