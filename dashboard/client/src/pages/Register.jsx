import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const styles = {
  page: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' },
  card: { background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '400px' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' },
  logoIcon: { width: '24px', height: '24px', color: '#fff' },
  logoText: { color: '#fff', fontSize: '18px', fontWeight: '700' },
  title: { color: '#fff', fontSize: '24px', fontWeight: '600', margin: '0 0 8px' },
  subtitle: { color: '#666', fontSize: '14px', margin: '0 0 28px' },
  label: { display: 'block', color: '#aaa', fontSize: '13px', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' },
  btn: { width: '100%', padding: '11px', background: '#fff', color: '#000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' },
  error: { background: '#1a0000', border: '1px solid #500', borderRadius: '8px', color: '#ff6b6b', fontSize: '13px', padding: '10px 12px', marginBottom: '16px' },
  link: { color: '#888', fontSize: '13px', textAlign: 'center', marginTop: '20px' },
  linkA: { color: '#fff', cursor: 'pointer', textDecoration: 'underline' },
}

export default function Register({ onSwitchToLogin }) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await register(name, email, password)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.logoIcon}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span style={styles.logoText}>CrashSense</span>
        </div>

        <h1 style={styles.title}>Create an account</h1>
        <p style={styles.subtitle}>Start monitoring your Express apps</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Full Name</label>
          <input style={styles.input} type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.link}>
          Already have an account?{' '}
          <span style={styles.linkA} onClick={onSwitchToLogin}>Sign in</span>
        </p>
      </div>
    </div>
  )
}
