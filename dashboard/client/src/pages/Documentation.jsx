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
        <p style={s.p}><strong style={{ color: '#fff' }}>CrashSense</strong> is a real-time crash monitoring &amp; Agentic AI auto-fixing platform for Express.js applications. When your server crashes, CrashSense catches the error, parses the stack trace, and can automatically generate code fixes and open Pull Requests on GitHub!</p>
        <p style={s.p}><strong style={{ color: '#fff' }}>Who is it for?</strong> Node.js / Express.js developers who want instant real-time crash monitoring and automated AI pull requests.</p>

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
          <li>Install the official npm package in your Express project: <code style={s.code}>npm install crashsense-express-agent</code></li>
          <li>Add the middleware at the bottom of your Express app:</li>
        </ol>
        <div style={s.codeBlock}>{`const crashsense = require('crashsense-express-agent')

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
      </div>

      {/* ── Auto-Patch Generator ── */}
      <div style={s.section}>
        <h2 style={s.h2}>Auto-Patch Generator (Agentic AI)</h2>
        <p style={s.p}>CrashSense includes a 4-node <strong style={{ color: '#fff' }}>LangGraph Agentic AI Pipeline</strong> that automatically fixes crashes by creating branches and opening Pull Requests on GitHub!</p>

        <h3 style={s.h3}>How to Set Up Auto-Patch</h3>
        <ol style={s.ol}>
          <li>Create a GitHub Personal Access Token (PAT Classic):
            <br />Go to <strong style={{ color: '#fff' }}>GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate New Token</strong>.
            <br />Set expiration (e.g. 90 days) and check the <code style={s.code}>repo</code> scope (Full control of private &amp; public repositories).
          </li>
          <li>In the CrashSense dashboard, select a crash and click the <strong style={{ color: '#fff' }}>⚙ Settings icon</strong> in the top right of the AI panel.</li>
          <li>Enter your <strong style={{ color: '#fff' }}>GitHub Token</strong> (<code style={s.code}>ghp_...</code>), <strong style={{ color: '#fff' }}>GitHub Owner</strong> (username/org), and <strong style={{ color: '#fff' }}>Repository Name</strong>.</li>
          <li>Click <strong style={{ color: '#fff' }}>Save GitHub Settings</strong>.</li>
          <li>Click the <strong style={{ color: '#fff' }}>⚡ Generate Fix &amp; Open PR</strong> button!</li>
        </ol>

        <h3 style={s.h3}>The 4-Node Agentic Pipeline Flow</h3>
        <div style={s.flow}>
{`1. Node 1 (fetchFile)     → Downloads crashed file from GitHub API
        ↓
2. Node 2 (analyseCrash)  → Analyzes root cause with Groq LLM
        ↓
3. Node 3 (generatePatch) → Generates complete fixed code file
        ↓
4. Node 4 (createPR)      → Creates branch crashsense-fix-{crashId}, commits fix & opens PR on GitHub`}</div>

        <div style={s.tip}>✓ Real-time progress is streamed live via Socket.io so you can watch each step executing.</div>
      </div>

      {/* ── Package Importing ── */}
      <div style={s.section}>
        <h2 style={s.h2}>Importing a Package</h2>
        <p style={s.p}>The Packages section lets you paste in any <code style={s.code}>package.json</code> content or code snippet and receive an AI-powered security and quality analysis.</p>

        <h3 style={s.h3}>How to Import a Package</h3>
        <ol style={s.ol}>
          <li>Click <strong style={{ color: '#fff' }}>Packages</strong> in the sidebar.</li>
          <li>Fill in the Package Name (required), Version, and a short Description.</li>
          <li>Paste your <code style={s.code}>package.json</code> content or code snippet into the Content box.</li>
          <li>Click <strong style={{ color: '#fff' }}>Import &amp; Analyze</strong>.</li>
        </ol>
      </div>

      {/* ── Generated Code ── */}
      <div style={s.section}>
        <h2 style={s.h2}>Generated Code</h2>
        <p style={s.p}>The Generated Code section lets you describe what you need in plain English and receive ready-to-use Node.js or React code.</p>
      </div>

      {/* ── Troubleshooting ── */}
      <div style={s.section}>
        <h2 style={s.h2}>Troubleshooting</h2>

        <h3 style={s.h3}>Login failed</h3>
        <p style={s.p}>Make sure you are using the exact email and password you registered with. Passwords are case-sensitive.</p>

        <h3 style={s.h3}>Crash not appearing in dashboard</h3>
        <ul style={s.ul}>
          <li>Check that your <code style={s.code}>dashboardUrl</code> is correct in the npm middleware config.</li>
          <li>Check that your <code style={s.code}>apiKey</code> matches the one shown in your Dashboard home.</li>
        </ul>

        <h3 style={s.h3}>Auto-Patch returns 404 on GitHub</h3>
        <p style={s.p}>Make sure your GitHub Token has the <code style={s.code}>repo</code> scope checked and your GitHub Owner and Repo name match your target repository exactly.</p>
      </div>

      {/* ── FAQ ── */}
      <div style={s.section}>
        <h2 style={s.h2}>FAQ</h2>

        <h3 style={s.h3}>Can multiple users use the same API key?</h3>
        <p style={s.p}>No. Each API key is tied to exactly one user account. If you share your key, that person's crashes will appear in your dashboard.</p>

        <h3 style={s.h3}>Does the npm package slow down my Express app?</h3>
        <p style={s.p}>No. The crash report is sent asynchronously using a fire-and-forget approach with a 3-second timeout.</p>

        <h3 style={s.h3}>What is the published npm package name?</h3>
        <p style={s.p}>The official package is <code style={s.code}>crashsense-express-agent</code> available on the public npm registry.</p>
      </div>
    </div>
  )
}
