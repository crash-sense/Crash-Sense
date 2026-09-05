const express = require('express');
const crashsense = require('crashsense-agent');

const app = express();
app.use(express.json());

// ─── CrashSense Middleware ────────────────────────────────────────────────────
// NOTE: Replace CRASHSENSE_API_KEY with the key set on your Render server.
//       Go to render.com → crashsense-backend → Environment → CRASHSENSE_API_KEY
app.use(crashsense({
  dashboardUrl: 'https://crashsense-backend.onrender.com',
  apiKey: 'dev-secret-key-change-this', // ← replace with Render key if different
  projectId: 'crash-demo',
}));

// ─── Routes ──────────────────────────────────────────────────────────────────

// Route 1: TypeError — accessing property of undefined
app.get('/crash/type-error', (req, res) => {
  const user = undefined;
  console.log(user.name); // 💥 TypeError
  res.json({ ok: true });
});

// Route 2: ReferenceError — using undeclared variable
app.get('/crash/reference-error', (req, res) => {
  console.log(nonExistentVariable); // 💥 ReferenceError
  res.json({ ok: true });
});

// Route 3: Custom thrown error
app.get('/crash/custom-error', (req, res) => {
  throw new Error('Something went horribly wrong in the payment service!'); // 💥
  res.json({ ok: true });
});

// Route 4: Async error
app.get('/crash/async-error', async (req, res) => {
  await Promise.reject(new Error('Database connection timed out after 30s')); // 💥
  res.json({ ok: true });
});

// ─── Express Error Handler (Required — passes error to crashsense) ────────────
app.use((err, req, res, next) => {
  console.error('💥 App crashed:', err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Test crash app running at http://localhost:${PORT}`);
  console.log('\n📌 Hit any of these URLs in your browser to trigger a crash:');
  console.log(`   http://localhost:${PORT}/crash/type-error`);
  console.log(`   http://localhost:${PORT}/crash/reference-error`);
  console.log(`   http://localhost:${PORT}/crash/custom-error`);
  console.log(`   http://localhost:${PORT}/crash/async-error`);
  console.log('\n👀 Watch crashes appear live at: https://crash-sense.vercel.app\n');
});
