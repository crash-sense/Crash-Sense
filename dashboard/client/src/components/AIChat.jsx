import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import apiClient from '../api/client'

// ── Sparkles SVG icon ────────────────────────────────────────────────────────
function SparklesIcon() {
  return (
    <svg className="sparkles-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export default function AIChat({ crash }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef(null)

  // ── Load analysis / chat history when selected crash changes ────────────────
  useEffect(() => {
    if (!crash) {
      setMessages([])
      setIsStreaming(false)
      return
    }

    if (crash.aiAnalysis) {
      // Crash already has a cached AI analysis — show it immediately
      setMessages([{ role: 'assistant', content: crash.aiAnalysis }])
      setIsStreaming(false)
    } else {
      // No cached analysis — show loading, stream will fill it in
      setMessages([])
      setIsStreaming(true)
    }

    // Always fetch chat history on top of analysis
    apiClient
      .get(`/chat/${crash._id}`)
      .then((res) => {
        if (res.data.length > 0) setMessages(res.data)
      })
      .catch(console.error)
  }, [crash?._id])

  // ── Socket listeners for streaming AI analysis ───────────────────────────
  useSocket(
    crash?._id ? `analysis:token:${crash._id}` : null,
    (token) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { role: 'assistant', content: last.content + token }]
        }
        return [...prev, { role: 'assistant', content: token }]
      })
    }
  )

  useSocket(crash?._id ? `analysis:done:${crash._id}` : null, () => setIsStreaming(false))

  // ── Socket listeners for streaming chat replies ──────────────────────────
  useSocket(
    crash?._id ? `chat:token:${crash._id}` : null,
    (token) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { role: 'assistant', content: last.content + token }]
        }
        return [...prev, { role: 'assistant', content: token }]
      })
    }
  )

  useSocket(crash?._id ? `chat:done:${crash._id}` : null, () => setIsStreaming(false))

  // ── Auto scroll to latest message ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send a chat message ───────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || !crash || isStreaming) return
    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsStreaming(true)

    try {
      await apiClient.post('/chat', { crashId: crash._id, message: userMessage })
    } catch (err) {
      console.error('Failed to send message:', err)
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Empty state (no crash selected) ─────────────────────────────────────
  if (!crash) {
    return (
      <div className="ai-panel">
        <div className="ai-header">
          <div className="ai-header-title">
            <SparklesIcon />
            <h3>AI Debug Assistant</h3>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 240 }}>
            Select a crash from the live feed to start debugging with Groq AI
          </p>
        </div>

        <div className="chat-input-placeholder">
          <input className="disabled-chat-input" disabled placeholder="Select a crash first..." />
          <button className="disabled-chat-submit" disabled>Send</button>
        </div>
      </div>
    )
  }

  // ── Active state (crash selected) ────────────────────────────────────────
  return (
    <div className="ai-panel">

      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-title">
          <SparklesIcon />
          <h3>AI Debug Assistant</h3>
        </div>
        {isStreaming && <span className="streaming-indicator">● thinking...</span>}
      </div>

      {/* Messages */}
      <div className="ai-content-scroll">

        {/* Loading state — waiting for first analysis token */}
        {messages.length === 0 && isStreaming && (
          <div className="ai-thinking-state">
            <div className="ai-pulse-circles">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Analysing crash with Groq AI...</p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                maxWidth: '92%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user'
                  ? '12px 12px 2px 12px'
                  : '2px 12px 12px 12px',
                background: msg.role === 'user'
                  ? 'var(--accent)'
                  : 'var(--bg-tertiary)',
                border: msg.role === 'user'
                  ? 'none'
                  : '1px solid var(--border-color)',
                fontSize: 13,
                lineHeight: 1.65,
                color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div className="chat-input-placeholder">
        <input
          className="disabled-chat-input"
          style={{
            cursor: isStreaming ? 'not-allowed' : 'text',
            color: 'var(--text-main)',
            opacity: 1,
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Waiting for AI...' : 'Ask a follow-up question...'}
          disabled={isStreaming}
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming || !input.trim()}
          style={{
            background: isStreaming || !input.trim() ? 'var(--border-color)' : 'var(--accent)',
            color: isStreaming || !input.trim() ? 'var(--text-muted)' : '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            padding: '0 18px',
            borderRadius: 6,
            cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}