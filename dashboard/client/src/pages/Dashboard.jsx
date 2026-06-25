import { useState } from 'react'
import CrashFeed from '../components/CrashFeed'
import CodeViewer from '../components/CodeViewer'
import AIChat from '../components/AIChat'

export default function Dashboard() {
  const [selectedCrash, setSelectedCrash] = useState(null)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100%',
      background: '#0a0a0a',
      color: '#f5f5f5',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* ── Col 1: Crash Feed ── */}
      <aside style={{
        width: '280px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1f1f1f',
        background: '#0d0d0d',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1f1f1f', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px' }}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.01em' }}>CrashSense</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CrashFeed selectedCrash={selectedCrash} onSelectCrash={setSelectedCrash} />
        </div>
      </aside>

      {/* ── Col 2: Inspector (Stack / Request / Env) ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1f1f1f',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        <CodeViewer crash={selectedCrash} />
      </div>

      {/* ── Col 3: AI Chat ── */}
      <aside style={{
        width: '340px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#0d0d0d',
        overflow: 'hidden',
      }}>
        <AIChat crash={selectedCrash} />
      </aside>

    </div>
  )
}