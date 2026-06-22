import { useState, useEffect, useRef } from 'react'
import apiClient from '../api/client'

// AIChat receives two props:
// crash  → the currently selected crash object
// socket → the Socket.io instance from useSocket hook (passed down from Dashboard)
export default function AIChat({ crash, socket }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef(null)

  // ── Load chat history when a crash is selected ──────────────────────────
  useEffect(() => {
    // If no crash selected, clear everything
    if (!crash) {
      setMessages([])
      return
    }

    // If crash already has a cached AI analysis, show it immediately
    // This means Groq already ran for this crash — no need to wait
    if (crash.aiAnalysis) {
      setMessages([{ role: 'assistant', content: crash.aiAnalysis }])
    } else {
      // Analysis not cached yet — it is currently streaming
      setMessages([])
      setIsStreaming(true)
    }

    // Also fetch full chat history from MongoDB
    // So previous conversations are not lost when you reopen a crash
    apiClient
      .get(`/chat/${crash._id}`)
      .then((res) => {
        if (res.data.length > 0) setMessages(res.data)
      })
      .catch(console.error)
  }, [crash?._id])

  // ── Listen for streaming tokens from Socket.io ───────────────────────────
  useEffect(() => {
    if (!socket || !crash) return

    // Event names include crashId so tokens from different crashes never mix
    const analysisTokenEvent = `analysis:token:${crash._id}`
    const analysisDoneEvent = `analysis:done:${crash._id}`
    const chatTokenEvent = `chat:token:${crash._id}`
    const chatDoneEvent = `chat:done:${crash._id}`

    // Called for every single token that arrives
    // Appends token to the last assistant message
    // This creates the word-by-word typing effect
    const handleToken = (token) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant') {
          // Add token to existing assistant message
          return [
            ...prev.slice(0, -1),
            { role: 'assistant', content: last.content + token },
          ]
        }
        // Start a brand new assistant message
        return [...prev, { role: 'assistant', content: token }]
      })
    }

    const handleDone = () => setIsStreaming(false)

    // Register all four event listeners
    socket.on(analysisTokenEvent, handleToken)
    socket.on(analysisDoneEvent, handleDone)
    socket.on(chatTokenEvent, handleToken)
    socket.on(chatDoneEvent, handleDone)

    // Cleanup — remove listeners when crash changes or component unmounts
    // Without this, old listeners pile up and cause bugs
    return () => {
      socket.off(analysisTokenEvent, handleToken)
      socket.off(analysisDoneEvent, handleDone)
      socket.off(chatTokenEvent, handleToken)
      socket.off(chatDoneEvent, handleDone)
    }
  }, [socket, crash?._id])

  // ── Auto scroll to bottom when new tokens arrive ─────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send a message ────────────────────────────────────────────────────────
  const sendMessage = async () => {
    // Prevent sending while AI is still typing or input is empty
    if (!input.trim() || !crash || isStreaming) return

    const userMessage = input.trim()
    setInput('')

    // Show user message immediately — don't wait for server
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsStreaming(true)

    try {
      // POST to /api/chat — server calls Groq and streams reply via Socket.io
      await apiClient.post('/chat', {
        crashId: crash._id,
        message: userMessage,
      })
    } catch (err) {
      console.error('Failed to send message:', err)
      setIsStreaming(false)
    }
  }

  // ── Handle Enter key ──────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!crash) {
    return (
      <div style={styles.empty}>
        Select a crash to start debugging with AI
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>AI Debug Assistant</span>
        {isStreaming && (
          <span style={styles.streamingBadge}>thinking...</span>
        )}
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.waiting}>
            Analysing crash...
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.bubble,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? '#534AB7' : '#f0f0f0',
              color: msg.role === 'user' ? '#fff' : '#1a1a1a',
            }}
          >
            {msg.content}
          </div>
        ))}

        {/* Invisible div at bottom — we scroll to this */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this crash..."
          disabled={isStreaming}
        />
        <button
          style={{
            ...styles.button,
            opacity: isStreaming || !input.trim() ? 0.5 : 1,
            cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
          }}
          onClick={sendMessage}
          disabled={isStreaming || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    fontFamily: 'sans-serif',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1a1a',
  },
  streamingBadge: {
    fontSize: 12,
    color: '#888',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  bubble: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  waiting: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 40,
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: 13,
    color: '#aaa',
    padding: 24,
    textAlign: 'center',
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    padding: 12,
    borderTop: '1px solid #e0e0e0',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 13,
    outline: 'none',
  },
  button: {
    padding: '8px 18px',
    background: '#534AB7',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
  },
}