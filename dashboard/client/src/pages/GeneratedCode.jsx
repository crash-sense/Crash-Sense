import { useState, useEffect } from 'react'
import apiClient from '../api/client'

const s = {
  page: { flex: 1, background: '#0a0a0a', padding: '28px', overflowY: 'auto', fontFamily: 'system-ui, sans-serif' },
  title: { color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 6px' },
  subtitle: { color: '#555', fontSize: '13px', margin: '0 0 28px' },
  form: { background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px', marginBottom: '28px' },
  label: { display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '6px' },
  textarea: { width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px', minHeight: '100px', resize: 'vertical', fontFamily: 'system-ui, sans-serif' },
  btn: { padding: '9px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  sectionTitle: { color: '#aaa', fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' },
  codeCard: { background: '#111', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '16px', marginBottom: '10px' },
  prompt: { color: '#aaa', fontSize: '12px', margin: '0 0 8px', fontStyle: 'italic' },
  badge: (status) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', marginBottom: '10px',
    background: status === 'completed' ? '#0d2e1a' : status === 'failed' ? '#2e0d0d' : '#1a1a2e',
    color: status === 'completed' ? '#4ade80' : status === 'failed' ? '#ff6b6b' : '#818cf8',
  }),
  codeBlock: { background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '12px', color: '#7dd3fc', fontSize: '12px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', overflowX: 'auto' },
  copyBtn: { padding: '5px 12px', background: 'transparent', border: '1px solid #333', borderRadius: '5px', color: '#888', fontSize: '11px', cursor: 'pointer', marginTop: '8px' },
  empty: { color: '#444', fontSize: '13px', textAlign: 'center', padding: '24px' },
  error: { background: '#1a0000', border: '1px solid #500', borderRadius: '6px', color: '#ff6b6b', fontSize: '12px', padding: '8px 12px', marginBottom: '12px' },
  success: { background: '#001a0d', border: '1px solid #0a4d2a', borderRadius: '6px', color: '#4ade80', fontSize: '12px', padding: '8px 12px', marginBottom: '12px' },
}

export default function GeneratedCode() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [copied, setCopied] = useState(null)

  const fetchCodes = () => {
    apiClient.get('/code').then(r => setCodes(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchCodes() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFeedback(null)
    setSubmitting(true)
    try {
      await apiClient.post('/code', { prompt })
      setFeedback({ type: 'success', message: 'Request submitted! AI is generating code, it will appear below shortly.' })
      setPrompt('')
      setTimeout(fetchCodes, 4000)
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Request failed.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Generated Code</h1>
      <p style={s.subtitle}>Describe what you need and get AI-generated Node.js / React code instantly.</p>

      <div style={s.form}>
        <form onSubmit={handleSubmit}>
          {feedback && <div style={feedback.type === 'success' ? s.success : s.error}>{feedback.message}</div>}
          <label style={s.label}>What do you need? *</label>
          <textarea
            style={s.textarea}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Write an Express.js route that validates a JWT token and returns user profile data..."
            required
          />
          <button style={s.btn} type="submit" disabled={submitting}>
            {submitting ? 'Generating...' : 'Generate Code'}
          </button>
        </form>
      </div>

      <p style={s.sectionTitle}>Previous Generations ({codes.length})</p>

      {loading ? (
        <p style={s.empty}>Loading...</p>
      ) : codes.length === 0 ? (
        <p style={s.empty}>No code generated yet. Use the form above to get started.</p>
      ) : (
        codes.map(c => (
          <div key={c._id} style={s.codeCard}>
            <p style={s.prompt}>"{c.prompt}"</p>
            <span style={s.badge(c.status)}>{c.status}</span>
            {c.generatedContent && (
              <>
                <div style={s.codeBlock}>{c.generatedContent}</div>
                <button style={s.copyBtn} onClick={() => handleCopy(c._id, c.generatedContent)}>
                  {copied === c._id ? '✓ Copied!' : 'Copy Code'}
                </button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  )
}
