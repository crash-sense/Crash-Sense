import { useState, useEffect } from 'react'
import apiClient from '../api/client'

const s = {
  page: { flex: 1, background: '#0a0a0a', padding: '28px', overflowY: 'auto', fontFamily: 'system-ui, sans-serif' },
  title: { color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 6px' },
  subtitle: { color: '#555', fontSize: '13px', margin: '0 0 28px' },
  form: { background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px', marginBottom: '28px' },
  label: { display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' },
  textarea: { width: '100%', padding: '9px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#fff', fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', marginBottom: '12px', minHeight: '120px', resize: 'vertical' },
  btn: { padding: '9px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  sectionTitle: { color: '#aaa', fontSize: '12px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' },
  pkgCard: { background: '#111', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '16px', marginBottom: '10px' },
  pkgName: { color: '#fff', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' },
  pkgVersion: { color: '#555', fontSize: '11px', margin: '0 0 8px' },
  badge: (status) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
    background: status === 'completed' ? '#0d2e1a' : status === 'failed' ? '#2e0d0d' : '#1a1a2e',
    color: status === 'completed' ? '#4ade80' : status === 'failed' ? '#ff6b6b' : '#818cf8',
  }),
  analysis: { background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '12px', marginTop: '10px', color: '#aaa', fontSize: '12px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' },
  empty: { color: '#444', fontSize: '13px', textAlign: 'center', padding: '24px' },
  error: { background: '#1a0000', border: '1px solid #500', borderRadius: '6px', color: '#ff6b6b', fontSize: '12px', padding: '8px 12px', marginBottom: '12px' },
  success: { background: '#001a0d', border: '1px solid #0a4d2a', borderRadius: '6px', color: '#4ade80', fontSize: '12px', padding: '8px 12px', marginBottom: '12px' },
}

export default function Packages() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState(null)

  const fetchPackages = () => {
    apiClient.get('/packages').then(r => setPackages(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchPackages() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFeedback(null)
    setSubmitting(true)
    try {
      await apiClient.post('/packages', { name, version, description, content })
      setFeedback({ type: 'success', message: 'Package imported! AI analysis is running in the background.' })
      setName(''); setVersion(''); setDescription(''); setContent('')
      setTimeout(fetchPackages, 3000)
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error || 'Import failed.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Packages</h1>
      <p style={s.subtitle}>Import a package.json or code snippet to get an AI security &amp; quality analysis.</p>

      <div style={s.form}>
        <form onSubmit={handleSubmit}>
          {feedback && <div style={feedback.type === 'success' ? s.success : s.error}>{feedback.message}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={s.label}>Package Name *</label>
              <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="express" required />
            </div>
            <div>
              <label style={s.label}>Version</label>
              <input style={s.input} value={version} onChange={e => setVersion(e.target.value)} placeholder="4.18.2" />
            </div>
          </div>
          <label style={s.label}>Description</label>
          <input style={s.input} value={description} onChange={e => setDescription(e.target.value)} placeholder="A short description of this package" />
          <label style={s.label}>Package Content / package.json *</label>
          <textarea style={s.textarea} value={content} onChange={e => setContent(e.target.value)} placeholder='Paste your package.json content or code snippet here...' required />
          <button style={s.btn} type="submit" disabled={submitting}>
            {submitting ? 'Importing...' : 'Import & Analyze'}
          </button>
        </form>
      </div>

      <p style={s.sectionTitle}>Imported Packages ({packages.length})</p>

      {loading ? (
        <p style={s.empty}>Loading...</p>
      ) : packages.length === 0 ? (
        <p style={s.empty}>No packages imported yet. Use the form above to get started.</p>
      ) : (
        packages.map(pkg => (
          <div key={pkg._id} style={s.pkgCard}>
            <p style={s.pkgName}>{pkg.name}</p>
            <p style={s.pkgVersion}>{pkg.version || 'No version'}</p>
            <span style={s.badge(pkg.status)}>{pkg.status}</span>
            {pkg.analysis && <div style={s.analysis}>{pkg.analysis}</div>}
          </div>
        ))
      )}
    </div>
  )
}
