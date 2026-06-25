import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { useSocket, getSocket } from '../hooks/useSocket'

const formatRelativeTime = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  if (isNaN(date.getTime())) return 'Unknown'
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 5) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const METHOD_COLOR = {
  GET:    { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  POST:   { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  PUT:    { bg: 'rgba(234,179,8,0.15)',   color: '#facc15', border: 'rgba(234,179,8,0.3)' },
  DELETE: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' },
}

const METHODS = ['ALL', 'GET', 'POST', 'PUT', 'DELETE']

export default function CrashFeed({ selectedCrash, onSelectCrash }) {
  const [crashes, setCrashes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMethod, setFilterMethod] = useState('ALL')
  const [socketConnected, setSocketConnected] = useState(() => getSocket().connected)
  const [newCrashIds, setNewCrashIds] = useState(new Set())

  useEffect(() => {
    apiClient.get('/crashes')
      .then(res => { setCrashes(Array.isArray(res.data) ? res.data : []); setError(null) })
      .catch(() => setError('Failed to load crashes. Is the server running?'))
      .finally(() => setLoading(false))
  }, [])

  useSocket('connect', () => setSocketConnected(true))
  useSocket('disconnect', () => setSocketConnected(false))
  useSocket('new:crash', (newCrash) => {
    setCrashes(prev => {
      const exists = prev.some(c => c._id === newCrash._id)
      if (exists) return prev.map(c => c._id === newCrash._id ? { ...c, occurrenceCount: newCrash.occurrenceCount, updatedAt: newCrash.updatedAt } : c)
      return [newCrash, ...prev]
    })
    setNewCrashIds(prev => { const n = new Set(prev); n.add(newCrash._id); return n })
    setTimeout(() => setNewCrashIds(prev => { const n = new Set(prev); n.delete(newCrash._id); return n }), 3000)
  })

  const filtered = crashes.filter(crash => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || crash.message?.toLowerCase().includes(q) || crash.name?.toLowerCase().includes(q) || crash.request?.url?.toLowerCase().includes(q)
    const matchMethod = filterMethod === 'ALL' || crash.request?.method?.toUpperCase() === filterMethod
    return matchSearch && matchMethod
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Live status + count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666' }}>Live Feed</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: socketConnected ? '#4ade80' : '#f87171', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#666' }}>{socketConnected ? 'Live' : 'Offline'} · {crashes.length}</span>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
        <input
          placeholder="Search errors, URLs..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '7px 10px',
            background: '#161616', border: '1px solid #2a2a2a', borderRadius: '6px',
            color: '#f5f5f5', fontSize: '12px', outline: 'none',
          }}
        />
      </div>

      {/* Method filter pills */}
      <div style={{ display: 'flex', gap: '4px', padding: '8px 14px', borderBottom: '1px solid #1f1f1f', flexShrink: 0, flexWrap: 'wrap' }}>
        {METHODS.map(m => (
          <button key={m} onClick={() => setFilterMethod(m)} style={{
            padding: '3px 9px', borderRadius: '4px', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            background: filterMethod === m ? '#f5f5f5' : '#1f1f1f',
            color: filterMethod === m ? '#0a0a0a' : '#888',
            transition: 'all 0.15s',
          }}>{m}</button>
        ))}
      </div>

      {/* Crash list */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {loading && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '13px' }}>Loading...</div>
        )}
        {error && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#f87171', fontSize: '13px' }}>{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
            {crashes.length === 0 ? 'No crashes reported yet.' : 'No matches found.'}
          </div>
        )}
        {filtered.map(crash => {
          const isSelected = selectedCrash?._id === crash._id
          const method = crash.request?.method || 'GET'
          const mc = METHOD_COLOR[method] || METHOD_COLOR.GET

          return (
            <div
              key={crash._id}
              onClick={() => onSelectCrash(crash)}
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid #1a1a1a',
                cursor: 'pointer',
                background: isSelected ? '#1a1a1a' : 'transparent',
                borderLeft: isSelected ? '2px solid #f5f5f5' : '2px solid transparent',
                transition: 'all 0.12s',
              }}
            >
              {/* Row 1: method + url + time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: mc.bg, color: mc.color, border: `1px solid ${mc.border}`, flexShrink: 0 }}>
                  {method}
                </span>
                <span style={{ fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {crash.request?.url || '/'}
                </span>
                <span style={{ fontSize: '10px', color: '#444', flexShrink: 0 }}>
                  {formatRelativeTime(crash.updatedAt || crash.createdAt)}
                </span>
              </div>

              {/* Row 2: error name */}
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f87171', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                {crash.name}
              </div>

              {/* Row 3: error message */}
              <div style={{ fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {crash.message}
              </div>

              {/* Row 4: project + occurrences */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '10px', color: '#444', background: '#161616', padding: '1px 6px', borderRadius: '3px', border: '1px solid #2a2a2a' }}>
                  {crash.projectId}
                </span>
                {crash.occurrenceCount > 1 && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#facc15' }}>×{crash.occurrenceCount}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
