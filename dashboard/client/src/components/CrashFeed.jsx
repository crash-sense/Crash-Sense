import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { useSocket, getSocket } from '../hooks/useSocket'

// Helper for relative timestamps
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
  
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CrashFeed({ selectedCrash, onSelectCrash }) {
  const [crashes, setCrashes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMethod, setFilterMethod] = useState('ALL')
  const [socketConnected, setSocketConnected] = useState(() => getSocket().connected)
  const [newCrashIds, setNewCrashIds] = useState(new Set()) // For temporary highlight effects

  // Fetch initial crashes
  useEffect(() => {
    async function fetchCrashes() {
      try {
        setLoading(true)
        const response = await apiClient.get('/crashes')
        // Ensure crashes is an array
        setCrashes(Array.isArray(response.data) ? response.data : [])
        setError(null)
      } catch (err) {
        console.error('Error fetching crashes:', err)
        setError('Failed to load crashes. Is the server running?')
      } finally {
        setLoading(false)
      }
    }
    fetchCrashes()
  }, [])

  // Socket setup: listen for connection changes & new crashes
  useSocket('connect', () => setSocketConnected(true))
  useSocket('disconnect', () => setSocketConnected(false))

  // Handle new crash websocket event
  useSocket('new:crash', (newCrash) => {
    console.log('[socket] New crash received:', newCrash)
    
    // Add to crashes list
    setCrashes((prevCrashes) => {
      // Check if crash already exists to prevent duplicate entries
      const exists = prevCrashes.some((c) => c._id === newCrash._id)
      if (exists) {
        // Increment count or update existing crash
        return prevCrashes.map((c) =>
          c._id === newCrash._id
            ? { ...c, occurrenceCount: newCrash.occurrenceCount, updatedAt: newCrash.updatedAt }
            : c
        )
      }
      return [newCrash, ...prevCrashes]
    })

    // Add to highlight effect set
    setNewCrashIds((prev) => {
      const next = new Set(prev)
      next.add(newCrash._id)
      return next
    })

    // Clear highlight after 3 seconds
    setTimeout(() => {
      setNewCrashIds((prev) => {
        const next = new Set(prev)
        next.delete(newCrash._id)
        return next
      })
    }, 3000)
  })

  // Filter crashes based on search and method selection
  const filteredCrashes = crashes.filter((crash) => {
    const matchesSearch =
      crash.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crash.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crash.request?.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crash.projectId?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesMethod =
      filterMethod === 'ALL' ||
      crash.request?.method?.toUpperCase() === filterMethod.toUpperCase()

    return matchesSearch && matchesMethod
  })

  const methods = ['ALL', 'GET', 'POST', 'PUT', 'DELETE']

  return (
    <div className="crash-feed">
      <div className="feed-header">
        <div className="feed-title-area">
          <h3>Live Feed</h3>
          <div className="status-indicator">
            <span className={`status-dot ${socketConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">{socketConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
        <div className="feed-stats">
          Total crashes: <span className="stat-count">{crashes.length}</span>
        </div>
      </div>

      <div className="feed-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search by error, URL, or project..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="method-filters">
          {methods.map((method) => (
            <button
              key={method}
              type="button"
              className={`method-filter-btn btn-${method.toLowerCase()} ${
                filterMethod === method ? 'active' : ''
              }`}
              onClick={() => setFilterMethod(method)}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="feed-state-message loading-state">
          <div className="spinner"></div>
          <p>Fetching crash logs...</p>
        </div>
      ) : error ? (
        <div className="feed-state-message error-state">
          <span className="state-icon">⚠️</span>
          <p>{error}</p>
        </div>
      ) : filteredCrashes.length === 0 ? (
        <div className="feed-state-message empty-state">
          <span className="state-icon">🎉</span>
          <p>{crashes.length === 0 ? 'No crashes reported yet!' : 'No matches found.'}</p>
        </div>
      ) : (
        <div className="crash-list-container">
          <div className="crash-list">
            {filteredCrashes.map((crash) => {
              const isSelected = selectedCrash?._id === crash._id
              const isNew = newCrashIds.has(crash._id)
              const method = crash.request?.method || 'GET'
              const url = crash.request?.url || '/'
              
              return (
                <div
                  key={crash._id}
                  className={`crash-item method-${method.toLowerCase()} ${
                    isSelected ? 'selected' : ''
                  } ${isNew ? 'pulse-new' : ''}`}
                  onClick={() => onSelectCrash(crash)}
                >
                  <div className="crash-item-header">
                    <div className="crash-meta">
                      <span className={`method-badge badge-${method.toLowerCase()}`}>
                        {method}
                      </span>
                      <span className="crash-url" title={url}>{url}</span>
                    </div>
                    <span className="crash-time">
                      {formatRelativeTime(crash.updatedAt || crash.createdAt)}
                    </span>
                  </div>

                  <div className="crash-item-body">
                    <h4 className="crash-error-name">{crash.name}</h4>
                    <p className="crash-error-msg">{crash.message}</p>
                  </div>

                  <div className="crash-item-footer">
                    <span className="project-badge" title="Project ID">
                      {crash.projectId}
                    </span>
                    {crash.occurrenceCount > 1 && (
                      <span className="occurrence-badge">
                        ×{crash.occurrenceCount}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
