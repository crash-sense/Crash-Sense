const s = {
  page: { flex: 1, background: '#0a0a0a', padding: '28px', overflowY: 'auto', fontFamily: 'system-ui, sans-serif', color: '#fff' },
  title: { color: '#fff', fontSize: '22px', fontWeight: '600', margin: '0 0 6px' },
  subtitle: { color: '#555', fontSize: '13px', margin: '0 0 36px' },
  section: { marginBottom: '36px', maxWidth: '720px' },
  h2: { color: '#fff', fontSize: '17px', fontWeight: '600', margin: '0 0 12px', paddingBottom: '10px', borderBottom: '1px solid #1f1f1f' },
  h3: { color: '#ddd', fontSize: '14px', fontWeight: '600', margin: '20px 0 8px' },
  p: { color: '#888', fontSize: '13px', lineHeight: '1.7', margin: '0 0 10px' },
  code: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '2px 6px', color: '#7dd3fc', fontFamily: 'monospace', fontSize: '12px' },
  codeBlock: { background: '#111', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '16px', color: '#7dd3fc', fontFamily: 'monospace', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre', margin: '10px 0' },
  ol: { color: '#888', fontSize: '13px', lineHeight: '2', paddingLeft: '20px', margin: '0 0 10px' },
  ul: { color: '#888', fontSize: '13px', lineHeight: '2', paddingLeft: '20px', margin: '0 0 10px' },
  flow: { background: '#111', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '16px', margin: '10px 0', color: '#aaa', fontSize: '12px', fontFamily: 'monospace', lineHeight: '1.9' },
  tip: { background: '#001a0d', border: '1px solid #0a4d2a', borderRadius: '6px', padding: '10px 14px', color: '#4ade80', fontSize: '12px', margin: '10px 0' },
  warn: { background: '#1a0d00', border: '1px solid #4d2a0a', borderRadius: '6px', padding: '10px 14px', color: '#fb923c', fontSize: '12px', margin: '10px 0' },
}

export default function Documentation() {
  return (
    <div style={s.page}>
      <h1 style={s.title}>Documentation</h1>
      <p style={s.subtitle}>Everything you need to know about CrashSense.</p>

      {/* ── Getting Started ── */}
      <div style={s.section}>
        <h2 style={s.h2}>Getting Started</h2>
        <p style={s.p}><strong style={{ color: '#fff' }}>CrashSense</strong> is a real-time crash monitoring tool for Express.js applications. When your Node.js server crashes, CrashSense intercepts the error, parses the stack trace, and displays an AI-powered analysis on this dashboard — all within seconds, with no manual log digging required.</p>
        <p style={s.p}><strong style={{ color: '#fff' }}>Who is it for?</strong> Node.js / Express.js developers who want instant, actionable insights when their server crashes.</p>

        <h3 style={s.h3}>How to Create an Account</h3>
        <ol style={s.ol}>
          <li>Go to the CrashSense dashboard URL.</li>
          <li>Click <strong style={{ color: '#fff' }}>Create one</strong> on the login screen.</li>
          <li>Enter your name, email, and a password (minimum 6 characters).</li>
          <li>You will be logged in automatically and land on your personal dashboard.</li>
        </ol>

        <h3 style={s.h3}>How to Connect Your Express App</h3>
        <ol style={s.ol}>
          <li>Copy your unique API Key from the Dashboard home page.</li>
          <li>Install the npm package in your Express project: <code style={s.code}>npm install crashsense</code></li>
          <li>Add the middleware at the bottom of your Express app:</li>
        </ol>
        <div style={s.codeBlock}>{`const crashsense = require('crashsense')

app.use(crashsense({
  dashboardUrl: 'https://crashsense-backend.onrender.com',
  apiKey: 'YOUR_API_KEY_HERE',
  projectId: 'my-app'
}))`}</div>
        <div style={s.tip}>✓ Your API Key is unique to your account. Never share it publicly.</div>
      </div>

      {/* ── Dashboard ── */}
      <div style={s.section}>
        <h2 style={s.h2}>Dashboard</h2>
        <p style={s.p}>The Dashboard home gives you a quick overview of your monitoring activity.</p>
        <ul style={s.ul}>
          <li><strong style={{ color: '#fff' }}>Recent Crashes:</strong> The total number of errors received recently.</li>
          <li><strong style={{ color: '#fff' }}>Projects:</strong> The number of distinct projects being monitored.</li>
          <li><strong style={{ color: '#fff' }}>API Key:</strong> Your unique key for the npm middleware.</li>
        </ul>
      </div>

      {/* ── Crash Monitoring ── */}
      <div style={s.section}>
        <h2 style={s.h2}>Crash / Error Monitoring</h2>
        <p style={s.p}>Navigate to <strong style={{ color: '#fff' }}>Crashes</strong> in the sidebar to see all errors from your apps.</p>
        <h3 style={s.h3}>What you see on a Crash</h3>
        <ul style={s.ul}>
          <li><strong style={{ color: '#fff' }}>Error Name:</strong> e.g. <code style={s.code}>TypeError</code>, <code style={s.code}>ReferenceError</code></li>
          <li><strong style={{ color: '#fff' }}>Error Message:</strong> The human-readable description of what broke.</li>
          <li><strong style={{ color: '#fff' }}>Stack Trace:</strong> The chain of function calls leading up to the crash.</li>
          <li><strong style={{ color: '#fff' }}>Timestamp:</strong> When the crash occurred.</li>
          <li><strong style={{ color: '#fff' }}>HTTP Request:</strong> The method and URL that triggered the crash.</li>
          <li><strong style={{ color: '#fff' }}>AI Analysis:</strong> Root cause, suggested fix, and prevention tip — generated automatically.</li>
        </ul>
        <h3 style={s.h3}>Stack Trace Explained</h3>
        <p style={s.p}>A stack trace shows you the "call chain" — the sequence of function calls that happened before the crash. The top of the stack is where the crash actually happened. The lines below show how the code got there. CrashSense automatically filters out Node.js internal frames and shows you only your code.</p>
      </div>

      {/* ── Package Importing ── */}
      <div style={s.section}>
        <h2 style={s.h2}>Importing a Package</h2>
        <p style={s.p}>The Packages section lets you paste in any <code style={s.code}>package.json</code> content or code snippet and receive an AI-powered security and quality analysis.</p>

        <h3 style={s.h3}>How to Import a Package</h3>
        <ol style={s.ol}>
          <li>Click <strong style={{ color: '#fff' }}>Packages</strong> in the sidebar.</li>
          <li>Fill in the Package Name (required), Version, and a short Description.</li>
          <li>Paste your <code style={s.code}>package.json</code> content or any relevant source code into the Content box.</li>
          <li>Click <strong style={{ color: '#fff' }}>Import &amp; Analyze</strong>.</li>
          <li>The package is saved and AI analysis runs in the background.</li>
          <li>Refresh the page after a few seconds — you will see the analysis result appear below the form.</li>
        </ol>

        <h3 style={s.h3}>What happens behind the scenes</h3>
        <div style={s.flow}>
{`User fills form & clicks Import
        ↓
Frontend sends POST /api/packages
        ↓
Backend saves package to MongoDB (tied to your account)
        ↓
AI (Groq) analyzes the package content
        ↓
Analysis result is saved back to the package record
        ↓
Appears in your Packages list`}</div>

        <h3 style={s.h3}>Common Import Issues</h3>
        <ul style={s.ul}>
          <li><strong style={{ color: '#fff' }}>Missing Name:</strong> Package Name is required. The form will not submit without it.</li>
          <li><strong style={{ color: '#fff' }}>Missing Content:</strong> Paste at least some content for the AI to analyze.</li>
          <li><strong style={{ color: '#fff' }}>Status shows "failed":</strong> The AI service may be temporarily unavailable. Try re-importing.</li>
        </ul>
      </div>

      {/* ── Generated Code ── */}
      <div style={s.section}>
        <h2 style={s.h2}>Generated Code</h2>
        <p style={s.p}>The Generated Code section lets you describe what you need in plain English and receive ready-to-use Node.js or React code.</p>

        <h3 style={s.h3}>How to Generate Code</h3>
        <ol style={s.ol}>
          <li>Click <strong style={{ color: '#fff' }}>Generated Code</strong> in the sidebar.</li>
          <li>Type a clear description of what you need in the text area.</li>
          <li>Click <strong style={{ color: '#fff' }}>Generate Code</strong>.</li>
          <li>The request is sent to the AI. After a few seconds, refresh to see the result.</li>
          <li>Use the <strong style={{ color: '#fff' }}>Copy Code</strong> button to copy the output.</li>
        </ol>

        <h3 style={s.h3}>Tips for better results</h3>
        <ul style={s.ul}>
          <li>Be specific: "Write an Express route that..." works better than "write some code".</li>
          <li>Mention the framework: Node.js, Express, React, etc.</li>
          <li>Include constraints: "with JWT authentication", "using async/await", etc.</li>
        </ul>
      </div>

      {/* ── Troubleshooting ── */}
      <div style={s.section}>
        <h2 style={s.h2}>Troubleshooting</h2>

        <h3 style={s.h3}>Login failed</h3>
        <p style={s.p}>Make sure you are using the exact email and password you registered with. Passwords are case-sensitive.</p>

        <h3 style={s.h3}>Crash not appearing in dashboard</h3>
        <ul style={s.ul}>
          <li>Check that your <code style={s.code}>dashboardUrl</code> is correct in the npm middleware config.</li>
          <li>Check that your <code style={s.code}>apiKey</code> exactly matches the one shown in your Dashboard home.</li>
          <li>The Render backend may be sleeping (free tier). Wait 30 seconds and try again.</li>
        </ul>

        <h3 style={s.h3}>API key not working</h3>
        <p style={s.p}>Each user has a unique API key. Make sure you are copying the one from your own Dashboard home page and not a hardcoded placeholder.</p>

        <h3 style={s.h3}>AI analysis not showing</h3>
        <p style={s.p}>AI analysis runs asynchronously. Wait a few seconds after a crash arrives, then click the crash to refresh. If analysis still does not appear, the Groq API may be temporarily unavailable.</p>

        <h3 style={s.h3}>Session expired / kicked to login</h3>
        <p style={s.p}>Sessions last 7 days. Simply log in again to restore your session.</p>

        <div style={s.warn}>⚠ If crashes from other users appear in your dashboard, please report this immediately — this should never happen due to backend data isolation.</div>
      </div>

      {/* ── FAQ ── */}
      <div style={s.section}>
        <h2 style={s.h2}>FAQ</h2>

        <h3 style={s.h3}>Can multiple users use the same API key?</h3>
        <p style={s.p}>No. Each API key is tied to exactly one user account. If you share your key, that person's crashes will appear in your dashboard.</p>

        <h3 style={s.h3}>Does the npm package slow down my Express app?</h3>
        <p style={s.p}>No. The crash report is sent asynchronously using a fire-and-forget approach with a 3-second timeout. Your app does not wait for CrashSense to respond before continuing.</p>

        <h3 style={s.h3}>Can I monitor multiple projects?</h3>
        <p style={s.p}>Yes. Use different <code style={s.code}>projectId</code> values in each app's middleware config. All crashes will appear in your dashboard grouped by project.</p>

        <h3 style={s.h3}>Is my data private?</h3>
        <p style={s.p}>Yes. All crashes, packages, and generated code are stored under your user account. Other users cannot access your data. Backend queries are always filtered by your authenticated user ID.</p>
      </div>
    </div>
  )
}
