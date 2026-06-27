import { useState, useEffect } from 'react'
import { Bug, FileCode, MonitorPlay, Server, Loader2, AlertCircle } from 'lucide-react'
import apiClient from '../api/client'
import Editor from '@monaco-editor/react'

export default function CodeViewer({ crash }) {
  const [activeTab, setActiveTab] = useState('stack')
  const [sourceCode, setSourceCode] = useState(null)
  const [loadingSource, setLoadingSource] = useState(false)
  const [sourceError, setSourceError] = useState(null)

  const topFrame = crash?.frames?.[0]
  const startLine = crash?.sourceSnippet?.startLine || 1
  const editorErrorLine = topFrame?.line 
    ? (crash?.sourceSnippet ? topFrame.line - startLine + 1 : topFrame.line)
    : null

  useEffect(() => {
    if (crash?.sourceSnippet?.content) {
      setSourceCode(crash.sourceSnippet.content)
      setLoadingSource(false)
      setSourceError(null)
      return
    }

    if (!topFrame || !topFrame.file || topFrame.file === 'unknown') { setSourceCode(null); return }
    setLoadingSource(true); setSourceError(null)
    apiClient.get('/crashes/source', { params: { filePath: topFrame.file } })
      .then(res => setSourceCode(res.data.content))
      .catch(() => setSourceError('Source code unavailable.'))
      .finally(() => setLoadingSource(false))
  }, [crash, topFrame])

  const tabBtn = (id, label, Icon) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '10px 16px', fontSize: '13px', fontWeight: 600,
        background: 'none', border: 'none', cursor: 'pointer',
        color: activeTab === id ? '#f5f5f5' : '#555',
        borderBottom: activeTab === id ? '2px solid #f5f5f5' : '2px solid transparent',
        marginBottom: '-1px', transition: 'color 0.15s', whiteSpace: 'nowrap',
      }}
    >
      <Icon style={{ width: '13px', height: '13px' }} />
      {label}
    </button>
  )

  if (!crash) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px', background: '#0a0a0a' }}>
        <Bug style={{ width: '36px', height: '36px', color: '#333', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', color: '#f5f5f5' }}>Select a crash to inspect</h2>
        <p style={{ fontSize: '13px', color: '#555', maxWidth: '300px', lineHeight: 1.6 }}>
          Click any crash from the feed on the left to view its details here.
        </p>
      </div>
    )
  }

  const rowStyle = { display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px 16px', alignItems: 'start', padding: '14px 0', borderBottom: '1px solid #1a1a1a' }
  const labelStyle = { fontSize: '12px', fontWeight: 500, color: '#555' }
  const valueStyle = { fontSize: '13px', fontFamily: 'monospace', color: '#f5f5f5', wordBreak: 'break-all' }
  const preStyle = { padding: '10px 14px', borderRadius: '6px', background: '#111', fontFamily: 'monospace', fontSize: '12px', overflowX: 'auto', border: '1px solid #1f1f1f', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#ccc', margin: '6px 0 0 0' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, fontFamily: 'monospace', background: '#1a1a1a', padding: '2px 8px', borderRadius: '4px', color: '#666', border: '1px solid #2a2a2a' }}>
            {crash.projectId}
          </span>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#f87171', margin: 0 }}>{crash.name}</h1>
          {crash.occurrenceCount > 1 && (
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: '4px', color: '#f87171' }}>
              ×{crash.occurrenceCount}
            </span>
          )}
        </div>
        <div style={{ padding: '7px 10px', borderRadius: '5px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {crash.message}
        </div>
        {topFrame && (
          <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#555', background: '#141414', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1f1f1f' }}>
            <span style={{ fontWeight: 700, color: '#ccc' }}>{topFrame.functionName}</span>
            <span style={{ color: '#333' }}>→</span>
            <span>{topFrame.file}:{topFrame.line}:{topFrame.column}</span>
          </div>
        )}
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', padding: '0 18px', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
        {tabBtn('stack', 'Stack Trace', FileCode)}
        {tabBtn('request', 'Request', MonitorPlay)}
        {tabBtn('environment', 'Environment', Server)}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'stack' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* Source editor */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {loadingSource && (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 style={{ width: '22px', height: '22px', color: '#444' }} />
              </div>
            )}
            {!loadingSource && sourceError && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                <AlertCircle style={{ width: '28px', height: '28px', marginBottom: '10px', color: '#444' }} />
                <p style={{ fontSize: '13px', color: '#555' }}>{sourceError}</p>
              </div>
            )}
            {!loadingSource && !sourceError && sourceCode && (
              <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={sourceCode}
                options={{ 
                  readOnly: true, 
                  minimap: { enabled: false }, 
                  scrollBeyondLastLine: false, 
                  lineNumbers: (num) => String(num + startLine - 1), 
                  wordWrap: 'on', 
                  fontSize: 13 
                }}
                onMount={(editor) => {
                  if (editorErrorLine) setTimeout(() => {
                    editor.revealLineInCenter(editorErrorLine)
                    editor.setPosition({ lineNumber: editorErrorLine, column: topFrame.column || 1 })
                  }, 100)
                }}
              />
            )}
            {!loadingSource && !sourceError && !sourceCode && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                <FileCode style={{ width: '28px', height: '28px', marginBottom: '10px', color: '#333' }} />
                <p style={{ fontSize: '13px', color: '#555' }}>Source code not available.</p>
              </div>
            )}
          </div>

          {/* Call stack strip at bottom */}
          <div style={{ flexShrink: 0, borderTop: '1px solid #1f1f1f', background: '#0d0d0d', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', minWidth: 'max-content' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#444', marginRight: '4px', flexShrink: 0 }}>
                Call Stack
              </span>
              {crash.frames?.slice(0, 15).map((frame, i) => (
                <div key={i} style={{
                  padding: '5px 10px', borderRadius: '5px', flexShrink: 0,
                  border: `1px solid ${i === 0 ? '#3f3f3f' : '#1f1f1f'}`,
                  background: i === 0 ? '#1a1a1a' : 'transparent',
                  fontFamily: 'monospace', fontSize: '11px',
                  opacity: frame.isNative ? 0.45 : 1,
                }}>
                  <div style={{ fontWeight: 700, color: '#ccc', whiteSpace: 'nowrap' }}>{frame.functionName}</div>
                  <div style={{ color: '#444', whiteSpace: 'nowrap' }}>{frame.file.split(/[/\\]/).pop()}:{frame.line}</div>
                </div>
              ))}
              {(!crash.frames || crash.frames.length === 0) && (
                <span style={{ fontSize: '12px', color: '#444' }}>No frames available.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'request' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 18px' }}>
          <div style={{ maxWidth: '600px' }}>
            <div style={rowStyle}>
              <span style={labelStyle}>Endpoint</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', background: '#1a1a1a', padding: '2px 8px', borderRadius: '4px', color: '#ccc', border: '1px solid #2a2a2a' }}>
                  {crash.request?.method || 'UNKNOWN'}
                </span>
                <span style={valueStyle}>{crash.request?.url || '/'}</span>
              </div>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>IP Address</span>
              <span style={valueStyle}>{crash.request?.ip || 'unknown'}</span>
            </div>
            <div style={{ padding: '14px 0', borderBottom: '1px solid #1a1a1a' }}>
              <span style={labelStyle}>Request Body</span>
              <pre style={preStyle}>{JSON.stringify(crash.request?.body || {}, null, 2)}</pre>
            </div>
            <div style={{ padding: '14px 0' }}>
              <span style={labelStyle}>Query Parameters</span>
              <pre style={preStyle}>{JSON.stringify(crash.request?.query || {}, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'environment' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 18px' }}>
          <div style={{ maxWidth: '600px' }}>
            {[
              { label: 'Node.js Version', value: crash.environment?.nodeVersion || 'unknown' },
              { label: 'Platform / Arch', value: `${crash.environment?.platform || 'unknown'} / ${crash.environment?.arch || 'unknown'}` },
              { label: 'Heap Used', value: `${crash.environment?.memoryUsage?.heapUsedMB ?? 'unknown'} MB` },
              { label: 'Server Uptime', value: `${crash.environment?.uptime ?? 'unknown'}s` },
            ].map(({ label, value }) => (
              <div key={label} style={rowStyle}>
                <span style={labelStyle}>{label}</span>
                <span style={valueStyle}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}