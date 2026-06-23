import { useState } from 'react'

export default function CodeViewer({ crash }) {
  const [activeTab, setActiveTab] = useState('stack')

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!crash) {
    return (
      <div className="inspector-panel">
        <div className="dashboard-empty-state">
          <div className="empty-graphic">
            <svg className="graphic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h2>Select a crash to inspect</h2>
          <p>Click any crash from the live feed to view its stack trace, request context, environment details, and real-time AI explanation.</p>
          <span className="listening-pulse">
            <span className="pulse-dot"></span>
            Listening for crashes...
          </span>
        </div>
      </div>
    )
  }

  const topFrame = crash.frames?.[0]

  return (
    <div className="inspector-panel">

      {/* ── Header ── */}
      <div className="inspector-header">
        <div className="crash-title-wrapper">
          <span className="project-tag">{crash.projectId}</span>
          <h1 className="crash-name-large">{crash.name}</h1>
        </div>
        {crash.occurrenceCount > 1 && (
          <span className="occurrence-badge-large">×{crash.occurrenceCount} occurrences</span>
        )}
      </div>

      {/* ── Error Message Banner ── */}
      <div className="crash-banner-error">
        <p className="crash-msg-text">{crash.message}</p>
      </div>

      {/* ── Crash Origin ── */}
      {topFrame && (
        <div className="error-origin-box">
          <p className="origin-title">Crash Origin</p>
          <div className="origin-details">
            <span className="origin-fn">{topFrame.functionName}</span>
            <span className="origin-path">
              {topFrame.file}:{topFrame.line}:{topFrame.column}
            </span>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="tabs-header">
        {['stack', 'request', 'environment'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Stack Trace Tab ── */}
      {activeTab === 'stack' && (
        <div className="tab-content">
          <div className="stack-trace-section">
            <div className="stack-trace-container">
              <div className="stack-frames">
                {crash.frames?.slice(0, 8).map((frame, i) => (
                  <div key={i} className={`stack-frame-item ${frame.isNative ? 'native-frame' : ''}`}>
                    <span className="frame-index">{i + 1}</span>
                    <span className="frame-fn">{frame.functionName}</span>
                    <span className="frame-loc">{frame.file}:{frame.line}:{frame.column}</span>
                    {frame.isConstructor && <span className="frame-badge">new</span>}
                  </div>
                ))}
                {(!crash.frames || crash.frames.length === 0) && (
                  <div className="stack-frame-item">
                    <span className="frame-loc">No structured frames available.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Raw stack string as fallback */}
          {crash.stack && (
            <div className="stack-trace-container" style={{ marginTop: 12 }}>
              <pre className="raw-stack-trace">{crash.stack}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── Request Tab ── */}
      {activeTab === 'request' && (
        <div className="tab-content">
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Method &amp; URL</span>
              <div className="info-value">
                <span className={`method-badge badge-${(crash.request?.method || 'get').toLowerCase()}`}>
                  {crash.request?.method || 'UNKNOWN'}
                </span>
                <span className="endpoint-url">{crash.request?.url || '/'}</span>
              </div>
            </div>
            <div className="info-row">
              <span className="info-label">IP Address</span>
              <span className="text-mono">{crash.request?.ip || 'unknown'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Request Body</span>
              <pre className="code-block-inspect font-sm">
                {JSON.stringify(crash.request?.body || {}, null, 2)}
              </pre>
            </div>
            <div className="info-row">
              <span className="info-label">Query Params</span>
              <pre className="code-block-inspect font-sm">
                {JSON.stringify(crash.request?.query || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Environment Tab ── */}
      {activeTab === 'environment' && (
        <div className="tab-content">
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Node.js Version</span>
              <span className="text-mono">{crash.environment?.nodeVersion || 'unknown'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Platform / Arch</span>
              <span className="text-mono">
                {crash.environment?.platform || 'unknown'} / {crash.environment?.arch || 'unknown'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Heap Used</span>
              <span className="text-mono">{crash.environment?.memoryUsage?.heapUsedMB ?? 'unknown'} MB</span>
            </div>
            <div className="info-row">
              <span className="info-label">Server Uptime</span>
              <span className="text-mono">{crash.environment?.uptime ?? 'unknown'}s</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}