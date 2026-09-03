import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const s = {
  page: { flex: 1, background: '#0a0a0a', padding: '28px', overflowY: 'auto', fontFamily: 'system-ui, sans-serif' },
  title: { color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 6px' },
  subtitle: { color: '#555', fontSize: '13px', margin: '0 0 28px' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '32px' },
  card: { background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px' },
  cardLabel: { color: '#666', fontSize: '12px', margin: '0 0 8px' },
  cardValue: { color: '#fff', fontSize: '28px', fontWeight: '700', margin: '0' },
  section: { marginBottom: '32px' },
  sectionTitle: { color: '#aaa', fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' },
  crashItem: { background: '#111', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '14px 16px', marginBottom: '8px', cursor: 'pointer' },
  crashName: { color: '#ff6b6b', fontSize: '13px', fontWeight: '600', margin: '0 0 4px' },
  crashMsg: { color: '#666', fontSize: '12px', margin: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  crashTime: { color: '#444', fontSize: '11px', marginTop: '6px' },
  apiKeyBox: { background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px' },
  apiKeyLabel: { color: '#aaa', fontSize: '12px', margin: '0 0 10px' },
  apiKeyCode: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '10px 14px', color: '#7dd3fc', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all', margin: '0 0 12px' },
  copyBtn: { padding: '7px 14px', background: 'transparent', border: '1px solid #333', borderRadius: '6px', color: '#aaa', fontSize: '12px', cursor: 'pointer' },
  empty: { color: '#444', fontSize: '13px', textAlign: 'center', padding: '24px' },
}

export default function DashboardHome({ onNavigate }) {
  const { user } = useAuth()
  const [crashes, setCrashes] = useState([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/crashes?limit=5').then(r => {
      setCrashes(r.data)
    }).finally(() => setLoading(false))
  }, [])

  const copyApiKey = () => {
    navigator.clipboard.writeText(user?.apiKey || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalCrashes = crashes.length
  const projects = [...new Set(crashes.map(c => c.projectId))].length

  return (
    <div style={s.page}>
      <h1 style={s.title}>Good to see you, {user?.name?.split(' ')[0]}!</h1>
      <p style={s.subtitle}>Here's a snapshot of your dashboard.</p>

      {/* Stats */}
      <div style={s.cards}>
        <div style={s.card}>
          <p style={s.cardLabel}>Recent Crashes</p>
          <p style={s.cardValue}>{loading ? '…' : totalCrashes}</p>
        </div>
        <div style={s.card}>
          <p style={s.cardLabel}>Projects</p>
          <p style={s.cardValue}>{loading ? '…' : projects}</p>
        </div>
      </div>

      {/* Recent Crashes */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Recent Crashes</p>
        {loading ? (
          <p style={s.empty}>Loading...</p>
        ) : crashes.length === 0 ? (
          <p style={s.empty}>No crashes yet. Set up the npm package to start monitoring.</p>
        ) : (
          crashes.map(c => (
            <div key={c._id} style={s.crashItem} onClick={() => onNavigate('crashes')}>
              <p style={s.crashName}>{c.name}</p>
              <p style={s.crashMsg}>{c.message}</p>
              <p style={s.crashTime}>{new Date(c.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>

      {/* API Key */}
      <div style={s.section}>
        <p style={s.sectionTitle}>Your API Key (for npm package)</p>
        <div style={s.apiKeyBox}>
          <p style={s.apiKeyLabel}>Use this key in your Express app:</p>
          <p style={s.apiKeyCode}>{user?.apiKey}</p>
          <button style={s.copyBtn} onClick={copyApiKey}>
            {copied ? '✓ Copied!' : 'Copy Key'}
          </button>
        </div>
      </div>
    </div>
  )
}
