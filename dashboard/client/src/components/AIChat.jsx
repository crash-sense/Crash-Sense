import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import apiClient from '../api/client'
import { Sparkles, Send, Loader2, GitPullRequest, Settings, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react'

function tryParseJSON(str) {
  if (!str) return null
  const trimmed = str.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null
  try {
    return JSON.parse(trimmed)
  } catch (e) {
    return null
  }
}

function renderSuggestedFix(text) {
  if (!text) return null

  if (typeof text === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {text.before && (
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Before:</span>
            <pre style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '10px',
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--error)',
              overflowX: 'auto',
              whiteSpace: 'pre',
            }}>
              <code>{text.before}</code>
            </pre>
          </div>
        )}
        {text.after && (
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>After:</span>
            <pre style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '10px',
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#34d399',
              overflowX: 'auto',
              whiteSpace: 'pre',
            }}>
              <code>{text.after}</code>
            </pre>
          </div>
        )}
      </div>
    )
  }

  if (typeof text === 'string') {
    const codeBlockRegex = /```(?:javascript|js|json|html|css)?([\s\S]*?)```/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <p key={`text-${lastIndex}`} style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: 13, lineHeight: 1.65 }}>
            {text.substring(lastIndex, match.index)}
          </p>
        )
      }
      const code = match[1].trim()
      parts.push(
        <pre key={`code-${match.index}`} style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '12px',
          margin: '0 0 14px 0',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: '#34d399',
          overflowX: 'auto',
          lineHeight: 1.5,
          whiteSpace: 'pre',
        }}>
          <code>{code}</code>
        </pre>
      )
      lastIndex = codeBlockRegex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push(
        <p key={`text-end-${lastIndex}`} style={{ margin: 0, color: 'var(--text-main)', fontSize: 13, lineHeight: 1.65 }}>
          {text.substring(lastIndex)}
        </p>
      )
    }

    return parts.length > 0 ? parts : <p style={{ margin: 0 }}>{text}</p>
  }

  return null
}

function StructuredAnalysisCard({ data, crash, onGeneratePatch, patchStatus }) {
  const { errorType, affectedFile, lineNumber, functionName, rootCause, suggestedFix, prevention } = data

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '18px',
      marginBottom: '18px',
      boxShadow: 'var(--shadow-md)',
      fontFamily: 'var(--font-sans)',
      animation: 'highlight-glow 2s ease-out',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px',
        marginBottom: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg style={{ width: 20, height: 20, color: 'var(--error)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--error)',
              display: 'block',
              letterSpacing: '0.8px',
              marginBottom: '2px',
            }}>
              AI Root Cause Analysis
            </span>
            <span style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--text-main)',
            }}>
              {errorType || 'Runtime Error'}
            </span>
          </div>
        </div>
      </div>

      {/* Code Path Tag */}
      {affectedFile && affectedFile !== 'unknown' && (
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location:</span>
          <code style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--accent)',
            wordBreak: 'break-all',
          }}>
            {affectedFile}{lineNumber && lineNumber !== 'unknown' ? `:${lineNumber}` : ''}{functionName && functionName !== 'unknown' ? ` (in ${functionName})` : ''}
          </code>
        </div>
      )}

      {/* What Happened */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
          What Happened
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.65', margin: 0 }}>
          {rootCause}
        </p>
      </div>

      {/* Suggested Fix */}
      {suggestedFix && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
            Suggested Fix
          </h4>
          <div style={{ marginTop: '8px' }}>
            {renderSuggestedFix(suggestedFix)}
          </div>
        </div>
      )}

      {/* Prevention Tip */}
      {prevention && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.04)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: '6px',
          padding: '14px',
          marginTop: '18px',
          marginBottom: '16px',
        }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <svg style={{ width: 14, height: 14, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Prevention Tip
          </h4>
          <p style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: '1.6', margin: '6px 0 0 0' }}>
            {prevention}
          </p>
        </div>
      )}

      {/* ── Auto-Patch Generator Button & Status ── */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
        {patchStatus?.state === 'idle' && (
          <button
            onClick={onGeneratePatch}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <GitPullRequest style={{ width: 16, height: 16 }} />
            ⚡ Generate Fix & Open PR
          </button>
        )}

        {patchStatus?.state === 'running' && (
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: 'var(--text-main)',
          }}>
            <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', color: '#60a5fa', flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: 'var(--font-mono)' }}>
              {patchStatus.message || 'Starting patch agent...'}
            </span>
          </div>
        )}

        {patchStatus?.state === 'done' && (
          <a
            href={patchStatus.prUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#059669',
              color: '#fff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <CheckCircle style={{ width: 16, height: 16 }} />
            View PR on GitHub
            <ExternalLink style={{ width: 14, height: 14, marginLeft: 'auto' }} />
          </a>
        )}

        {patchStatus?.state === 'error' && (
          <div>
            <div style={{
              background: '#2e0d0d',
              border: '1px solid #500',
              borderRadius: '6px',
              padding: '10px 12px',
              color: '#ff6b6b',
              fontSize: '12px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{patchStatus.error}</span>
            </div>
            <button
              onClick={onGeneratePatch}
              style={{
                width: '100%',
                padding: '8px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-main)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AIChat({ crash }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  // GitHub credentials state (stored in localStorage)
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('cs_gh_token') || '')
  const [githubOwner, setGithubOwner] = useState(() => localStorage.getItem('cs_gh_owner') || '')
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem('cs_gh_repo') || '')

  // Patch Agent progress state
  const [patchStatus, setPatchStatus] = useState({ state: 'idle', message: '', prUrl: '', error: '' })
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!crash) { setMessages([]); setIsStreaming(false); setPatchStatus({ state: 'idle' }); return }
    setPatchStatus({ state: 'idle' })
    if (crash.aiAnalysis) {
      setMessages([{ role: 'assistant', content: crash.aiAnalysis }])
      setIsStreaming(false)
    } else {
      setMessages([])
      setIsStreaming(true)
    }
    apiClient.get(`/chat/${crash._id}`)
      .then(res => { if (res.data.length > 0) setMessages(res.data) })
      .catch(console.error)
  }, [crash?._id])

  // Real-time Socket.io analysis listeners
  useSocket(crash?._id ? `analysis:token:${crash._id}` : null, (token) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant') return [...prev.slice(0, -1), { role: 'assistant', content: last.content + token }]
      return [...prev, { role: 'assistant', content: token }]
    })
  })
  useSocket(crash?._id ? `analysis:done:${crash._id}` : null, () => setIsStreaming(false))

  // Real-time Socket.io chat listeners
  useSocket(crash?._id ? `chat:token:${crash._id}` : null, (token) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant') return [...prev.slice(0, -1), { role: 'assistant', content: last.content + token }]
      return [...prev, { role: 'assistant', content: token }]
    })
  })
  useSocket(crash?._id ? `chat:done:${crash._id}` : null, () => setIsStreaming(false))

  // ── Real-time Socket.io Patch Agent Listeners ──────────────────────────
  useSocket(crash?._id ? `patch:start:${crash._id}` : null, () => {
    setPatchStatus({ state: 'running', message: 'Starting patch pipeline...' })
  })
  useSocket(crash?._id ? `patch:progress:${crash._id}` : null, (message) => {
    setPatchStatus({ state: 'running', message })
  })
  useSocket(crash?._id ? `patch:done:${crash._id}` : null, ({ prUrl }) => {
    setPatchStatus({ state: 'done', prUrl })
  })
  useSocket(crash?._id ? `patch:error:${crash._id}` : null, (error) => {
    setPatchStatus({ state: 'error', error })
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveGithubConfig = (e) => {
    e.preventDefault()
    localStorage.setItem('cs_gh_token', githubToken)
    localStorage.setItem('cs_gh_owner', githubOwner)
    localStorage.setItem('cs_gh_repo', githubRepo)
    setShowConfig(false)
  }

  const handleGeneratePatch = async () => {
    if (!crash) return
    if (!githubToken || !githubOwner || !githubRepo) {
      setShowConfig(true)
      return
    }

    setPatchStatus({ state: 'running', message: 'Initializing patch agent...' })
    try {
      await apiClient.post(`/crashes/${crash._id}/patch`, {
        githubToken,
        githubOwner,
        githubRepo,
      })
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Patch request failed'
      setPatchStatus({ state: 'error', error: msg })
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !crash || isStreaming) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setIsStreaming(true)
    try {
      await apiClient.post('/chat', { crashId: crash._id, message: msg })
    } catch (err) {
      console.error(err)
      setIsStreaming(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0d0d', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles style={{ width: '15px', height: '15px', color: '#888' }} />
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#f5f5f5' }}>AI Debug Assistant</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isStreaming && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#888', background: '#1a1a1a', padding: '3px 10px', borderRadius: '999px', border: '1px solid #2a2a2a' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
              thinking...
            </div>
          )}
          <button
            onClick={() => setShowConfig(!showConfig)}
            title="GitHub Settings for Auto-Patch"
            style={{
              background: 'transparent',
              border: 'none',
              color: (githubToken && githubOwner && githubRepo) ? '#4ade80' : '#888',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Settings style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* GitHub Credentials Modal / Form Banner */}
      {showConfig && (
        <div style={{
          background: '#161616',
          borderBottom: '1px solid #2a2a2a',
          padding: '16px',
          fontSize: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>⚙ GitHub Settings for Auto-Patch</span>
            <button onClick={() => setShowConfig(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>✕</button>
          </div>
          <form onSubmit={saveGithubConfig}>
            <label style={{ display: 'block', color: '#aaa', marginBottom: '4px', fontSize: '11px' }}>GitHub Token (PAT with repo scope)</label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              value={githubToken}
              onChange={e => setGithubToken(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', background: '#0d0d0d', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '12px', marginBottom: '8px', boxSizing: 'border-box' }}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#aaa', marginBottom: '4px', fontSize: '11px' }}>GitHub Username / Owner</label>
                <input
                  type="text"
                  placeholder="crash-sense"
                  value={githubOwner}
                  onChange={e => setGithubOwner(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', background: '#0d0d0d', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#aaa', marginBottom: '4px', fontSize: '11px' }}>Repository Name</label>
                <input
                  type="text"
                  placeholder="Crash-Sense"
                  value={githubRepo}
                  onChange={e => setGithubRepo(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', background: '#0d0d0d', border: '1px solid #333', borderRadius: '4px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }}
                  required
                />
              </div>
            </div>
            <button type="submit" style={{ width: '100%', padding: '8px', background: '#fff', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' }}>
              Save GitHub Settings
            </button>
          </form>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!crash && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ fontSize: '13px', color: '#444', textAlign: 'center', maxWidth: '200px', lineHeight: 1.6 }}>
              Select a crash to start debugging with AI
            </p>
          </div>
        )}

        {crash && messages.length === 0 && isStreaming && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px', color: '#444' }}>
            <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '13px' }}>Analysing with Groq AI...</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const parsedJson = msg.role === 'assistant' ? tryParseJSON(msg.content) : null

          if (parsedJson) {
            return (
              <StructuredAnalysisCard
                key={i}
                data={parsedJson}
                crash={crash}
                onGeneratePatch={handleGeneratePatch}
                patchStatus={patchStatus}
              />
            )
          }

          return (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 14, width: '100%' }}>
              <div style={{
                maxWidth: '90%',
                padding: '10px 13px',
                borderRadius: msg.role === 'user' ? '14px 14px 3px 14px' : '3px 14px 14px 14px',
                background: msg.role === 'user' ? '#f5f5f5' : '#161616',
                color: msg.role === 'user' ? '#0a0a0a' : '#ccc',
                fontSize: '13px',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: msg.role === 'user' ? 'none' : '1px solid #1f1f1f',
              }}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderTop: '1px solid #1f1f1f', flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder={!crash ? 'Select a crash first...' : isStreaming ? 'Waiting for AI...' : 'Ask a follow-up...'}
          disabled={!crash || isStreaming}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: '6px',
            background: '#161616', border: '1px solid #2a2a2a',
            color: '#f5f5f5', fontSize: '13px', outline: 'none',
            cursor: !crash || isStreaming ? 'not-allowed' : 'text',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!crash || isStreaming || !input.trim()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '34px', height: '34px', borderRadius: '6px', border: 'none', flexShrink: 0,
            background: (!crash || isStreaming || !input.trim()) ? '#1a1a1a' : '#f5f5f5',
            color: (!crash || isStreaming || !input.trim()) ? '#444' : '#0a0a0a',
            cursor: (!crash || isStreaming || !input.trim()) ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Send style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
    </div>
  )
}