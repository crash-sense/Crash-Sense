import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'crashes', label: 'Crashes', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { id: 'packages', label: 'Packages', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { id: 'code', label: 'Generated Code', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { id: 'docs', label: 'Documentation', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

export default function Sidebar({ activePage, onNavigate }) {
  const { user, logout } = useAuth()

  return (
    <div style={{
      width: '200px',
      flexShrink: 0,
      background: '#0d0d0d',
      borderRight: '1px solid #1f1f1f',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px', fontFamily: 'system-ui, sans-serif' }}>CrashSense</span>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 16px',
                background: isActive ? '#1a1a1a' : 'transparent',
                border: 'none',
                borderLeft: isActive ? '2px solid #fff' : '2px solid transparent',
                color: isActive ? '#fff' : '#666',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'system-ui, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', flexShrink: 0 }}>
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User Section */}
      <div style={{ borderTop: '1px solid #1f1f1f', padding: '12px 16px' }}>
        <div style={{ marginBottom: '10px' }}>
          <p style={{ color: '#fff', fontSize: '13px', margin: '0 0 2px', fontWeight: '500', fontFamily: 'system-ui, sans-serif' }}>{user?.name}</p>
          <p style={{ color: '#555', fontSize: '11px', margin: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'system-ui, sans-serif' }}>{user?.email}</p>
        </div>
        <button onClick={logout} style={{ width: '100%', padding: '7px', background: 'transparent', border: '1px solid #333', borderRadius: '6px', color: '#666', fontSize: '12px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
