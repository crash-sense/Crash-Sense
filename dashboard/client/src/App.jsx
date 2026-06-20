import { useState, useEffect } from 'react'
import CrashFeed from './components/CrashFeed'
import { useSocket } from './hooks/useSocket'
import apiClient from './api/client'
import './App.css'

export default function App() {
  const [selectedCrash, setSelectedCrash] = useState(null)
  const [aiResponse, setAiResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [activeTab, setActiveTab] = useState('request') // 'request' | 'headers' | 'environment'

  // Fetch full crash details when selected (specifically to get the raw stack trace)
  useEffect(() => {
    if (!selectedCrash?._id) return

    let isMounted = true
    async function fetchCrashDetails() {
      try {
        const res = await apiClient.get(`/crashes/${selectedCrash._id}`)
        if (isMounted) {
          setSelectedCrash(res.data)
          setAiResponse(res.data.aiAnalysis || '')
          setIsStreaming(!res.data.aiAnalysis)
        }
      } catch (err) {
        console.error('Error fetching crash details:', err)
      }
    }

    fetchCrashDetails()

    return () => {
      isMounted = false
    }
  }, [selectedCrash?._id])

  // Listen to live AI analysis streaming for the selected crash
  useSocket(
    selectedCrash?._id ? `analysis:token:${selectedCrash._id}` : null,
    (token) => {
      setIsStreaming(true)
      setAiResponse((prev) => prev + token)
    }
  )

  useSocket(
    selectedCrash?._id ? `analysis:done:${selectedCrash._id}` : null,
    () => {
      setIsStreaming(false)
    }
  )

  // Find the primary source frame of the crash (usually the first non-native frame)
  const sourceFrame = selectedCrash?.frames?.find(f => !f.isNative) || selectedCrash?.frames?.[0]

  return (
    <div className="dashboard-layout">
      {/* Sidebar: Crash Feed List */}
      <aside className="sidebar-panel">
        <div className="brand">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2>CrashSense</h2>
        </div>
        <CrashFeed selectedCrash={selectedCrash} onSelectCrash={setSelectedCrash} />
      </aside>

      {/* Main Content Area: split into Code Viewer (Center) & AI Chat (Right) */}
      <main className="main-content">
        {selectedCrash ? (
          <>
            {/* Center Panel: Crash Details & Inspector */}
            <section className="inspector-panel">
              <div className="inspector-header">
                <div className="crash-title-wrapper">
                  <span className="project-tag">{selectedCrash.projectId}</span>
                  <h2 className="crash-name-large">{selectedCrash.name}</h2>
                </div>
                {selectedCrash.occurrenceCount > 1 && (
                  <div className="occurrence-badge-large">
                    Occurred {selectedCrash.occurrenceCount} times
                  </div>
                )}
              </div>

              <div className="crash-banner-error">
                <code className="crash-msg-text">{selectedCrash.message}</code>
              </div>

              {sourceFrame && (
                <div className="error-origin-box">
                  <div className="origin-title">Error Origin</div>
                  <div className="origin-details">
                    <span className="origin-fn">{sourceFrame.functionName}</span>
                    <span className="origin-path">
                      at {sourceFrame.file}:{sourceFrame.line}:{sourceFrame.column}
                    </span>
                  </div>
                </div>
              )}

              {/* Tabs navigation */}
              <div className="tabs-header">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'request' ? 'active' : ''}`}
                  onClick={() => setActiveTab('request')}
                >
                  HTTP Request
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
                  onClick={() => setActiveTab('headers')}
                >
                  Headers
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'environment' ? 'active' : ''}`}
                  onClick={() => setActiveTab('environment')}
                >
                  Environment
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'request' && (
                  <div className="tab-pane">
                    <div className="info-grid">
                      <div className="info-row">
                        <span className="info-label">Endpoint</span>
                        <div className="info-value">
                          <span className={`method-badge badge-${selectedCrash.request?.method?.toLowerCase()}`}>
                            {selectedCrash.request?.method}
                          </span>
                          <span className="endpoint-url">{selectedCrash.request?.url}</span>
                        </div>
                      </div>
                      <div className="info-row">
                        <span className="info-label">IP Address</span>
                        <span className="info-value text-mono">{selectedCrash.request?.ip || 'unknown'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Query Parameters</span>
                        <pre className="code-block-inspect">
                          {JSON.stringify(selectedCrash.request?.query || {}, null, 2)}
                        </pre>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Request Body</span>
                        <pre className="code-block-inspect">
                          {JSON.stringify(selectedCrash.request?.body || {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'headers' && (
                  <div className="tab-pane">
                    <pre className="code-block-inspect font-sm">
                      {JSON.stringify(selectedCrash.request?.headers || {}, null, 2)}
                    </pre>
                  </div>
                )}

                {activeTab === 'environment' && (
                  <div className="tab-pane">
                    <div className="info-grid">
                      <div className="info-row">
                        <span className="info-label">Node.js Version</span>
                        <span className="info-value text-mono">{selectedCrash.environment?.nodeVersion}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Platform / Arch</span>
                        <span className="info-value text-mono">
                          {selectedCrash.environment?.platform} ({selectedCrash.environment?.arch})
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Server Uptime</span>
                        <span className="info-value">
                          {Math.floor(selectedCrash.environment?.uptime || 0)} seconds
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Memory Usage</span>
                        <pre className="code-block-inspect">
                          {JSON.stringify(selectedCrash.environment?.memoryUsage || {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stack Trace Section */}
              <div className="stack-trace-section">
                <h3>V8 Stack Trace</h3>
                <div className="stack-trace-container">
                  {selectedCrash.frames && selectedCrash.frames.length > 0 ? (
                    <div className="stack-frames">
                      {selectedCrash.frames.map((frame, index) => (
                        <div
                          key={index}
                          className={`stack-frame-item ${frame.isNative ? 'native-frame' : ''}`}
                        >
                          <span className="frame-index">{index}</span>
                          <span className="frame-fn">{frame.functionName}</span>
                          <span className="frame-loc">
                            {frame.file}:{frame.line}:{frame.column}
                          </span>
                          {frame.isNative && <span className="frame-badge">native</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="raw-stack-trace">{selectedCrash.stack}</pre>
                  )}
                </div>
              </div>

              {/* Monaco Code Viewer Placeholder */}
              <div className="monaco-viewer-placeholder">
                <div className="placeholder-title">
                  <svg className="code-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Monaco Code Viewer
                </div>
                <p className="placeholder-desc">
                  Code snippet surrounding the crash line will be visualised here by <strong>Person 2</strong>.
                </p>
              </div>
            </section>

            {/* Right Panel: Streaming AI Chat */}
            <section className="ai-panel">
              <div className="ai-header">
                <div className="ai-header-title">
                  <svg className="sparkles-icon animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 21.5L7.5 17.5L3.5 16L7.5 14.5L9 10.5L10.5 14.5L14.5 16L10.5 17.5L9 21.5ZM19 12L18.25 10L16.25 9.25L18.25 8.5L19 6.5L19.75 8.5L21.75 9.25L19.75 10L19 12ZM19 21.5L18.25 19.5L16.25 18.75L18.25 18L19 16L19.75 18L21.75 18.75L19.75 19.5L19 21.5Z" />
                  </svg>
                  <h3>Groq AI Debugger</h3>
                </div>
                {isStreaming && <span className="streaming-indicator">streaming...</span>}
              </div>

              <div className="ai-content-scroll">
                <div className="ai-markdown-body">
                  {aiResponse ? (
                    <pre className="ai-response-rendered">{aiResponse}</pre>
                  ) : (
                    <div className="ai-thinking-state">
                      <div className="ai-pulse-circles">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <p>Llama 3.1 is analyzing the stack trace...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="chat-input-placeholder">
                <input
                  type="text"
                  disabled
                  placeholder="Ask follow-up questions... (Coming soon)"
                  className="disabled-chat-input"
                />
                <button type="button" disabled className="disabled-chat-submit">
                  Send
                </button>
              </div>
            </section>
          </>
        ) : (
          /* Empty Dashboard State */
          <div className="dashboard-empty-state">
            <div className="empty-graphic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="graphic-svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2>No Crash Selected</h2>
            <p>Select a crash from the live feed to start real-time root cause analysis and inspect request parameters.</p>
            <div className="listening-pulse">
              <span className="pulse-dot"></span>
              Waiting for live server crashes...
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
