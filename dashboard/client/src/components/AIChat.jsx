import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../hooks/useSocket'
import apiClient from '../api/client'
import { Sparkles, Send, Loader2 } from 'lucide-react'

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

  // If text is an object (like { before: "...", after: "..." }), format it nicely
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

  // If text is a string, check if it contains markdown code blocks
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

export default function AIChat({ crash }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!crash) { setMessages([]); setIsStreaming(false); return }
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

  useSocket(crash?._id ? `analysis:token:${crash._id}` : null, (token) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant') return [...prev.slice(0, -1), { role: 'assistant', content: last.content + token }]
      return [...prev, { role: 'assistant', content: token }]
    })
  })
  useSocket(crash?._id ? `analysis:done:${crash._id}` : null, () => setIsStreaming(false))

  useSocket(crash?._id ? `chat:token:${crash._id}` : null, (token) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant') return [...prev.slice(0, -1), { role: 'assistant', content: last.content + token }]
      return [...prev, { role: 'assistant', content: token }]
    })
  })
  useSocket(crash?._id ? `chat:done:${crash._id}` : null, () => setIsStreaming(false))

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        {isStreaming && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#888', background: '#1a1a1a', padding: '3px 10px', borderRadius: '999px', border: '1px solid #2a2a2a' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }} />
            thinking...
          </div>
        )}
      </div>

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

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
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
        ))}
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