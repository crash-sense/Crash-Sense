# CrashSense

[![Live Demo](https://img.shields.io/badge/Live_Demo-crash--sense.vercel.app-success?style=for-the-badge)](https://crash-sense.vercel.app/)
[![npm package](https://img.shields.io/npm/v/crashsense-express-agent?style=for-the-badge&color=blue)](https://www.npmjs.com/package/crashsense-express-agent)

A multi-tenant runtime AI debugger and **Agentic AI Auto-Patch Generator** for Express.js applications. CrashSense intercepts server crashes the moment they happen, parses V8 stack traces, delivers real-time AI diagnostics, and can automatically open **GitHub Pull Requests** with complete code fixes — without any manual log digging or IDE setup.

---

## Overview

Most debugging tools require you to reproduce a crash, set breakpoints, or dig through log files. CrashSense takes an autonomous agentic approach:
1. Install one middleware package into any Express.js application (`npm install crashsense-express-agent`).
2. When a crash occurs, a structured AI diagnostic analysis appears instantly on your private dashboard.
3. Click **⚡ Generate Fix & Open PR** to trigger a 4-node **LangGraph Agentic Pipeline** that fetches your code, fixes the bug, creates a branch, and opens a Pull Request on GitHub automatically!

---

## Agentic AI Auto-Patch Generator (LangGraph Pipeline)

CrashSense features an autonomous 4-node agentic workflow powered by **LangGraph** (`@langchain/langgraph`), **Groq LLM** (`@langchain/groq`), and **GitHub Octokit API** (`@octokit/rest`):

```
[Node 1: fetchFile]     → Downloads crashed file from GitHub API (Octokit)
         ↓
[Node 2: analyseCrash]  → Performs root-cause analysis with Groq LLM (Chain of Thought)
         ↓
[Node 3: generatePatch] → Rewrites the entire file with the bug fixed
         ↓
[Node 4: createPR]      → Creates branch `crashsense-fix-{crashId}`, commits code & opens GitHub PR
```

Real-time progress is streamed live to the dashboard via **Socket.io** so developers can watch each agent node execute step-by-step.

---

## Structured AI Diagnostics

CrashSense leverages Groq LLMs in strict **JSON Mode** to convert messy runtime crashes into structured, reliable telemetry:

* **`errorType`** — Categorized error class (e.g., `TypeError`, `ReferenceError`).
* **`affectedFile`** — The exact file path that caused the crash.
* **`lineNumber`** — The exact source code line number.
* **`functionName`** — The executing function scope.
* **`rootCause`** — A plain-English, jargon-free explanation of the error.
* **`suggestedFix`** — A comparative before/after code fix payload.
* **`prevention`** — A preventative tip to avoid similar bugs in the future.

---

## Installation & Setup

### 1. Install the official npm package

```bash
npm install crashsense-express-agent
```

### 2. Add middleware to your Express app

```js
const express = require('express')
const crashsense = require('crashsense-express-agent')

const app = express()

// Connect CrashSense middleware
app.use(crashsense({
  dashboardUrl: 'https://crashsense-backend.onrender.com',
  apiKey: 'YOUR_UNIQUE_API_KEY_FROM_DASHBOARD',
  projectId: 'my-express-service'
}))

// Your regular routes...
app.get('/', (req, res) => {
  res.send('App running!')
})

// Express Error Handler (Required — passes errors to CrashSense)
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal Server Error' })
})

app.listen(3000, () => console.log('Server running on port 3000'))
```

---

## Tech Stack

**Official npm Package (`crashsense-express-agent`)**
- Node.js — V8 Stack Trace API for structured frame extraction
- Axios — Fire-and-forget HTTP telemetry reporting

**Dashboard Backend (`dashboard/server`)**
- Node.js & Express.js — API server with multi-tenant auth (JWT + API Keys)
- MongoDB Atlas — user account, crash, package & code storage
- Socket.io — real-time event streaming & private room isolation
- LangGraph (`@langchain/langgraph`) — 4-node agentic workflow engine
- Groq LLM (`@langchain/groq`) — fast AI diagnostics & code patching (`groq/compound-mini`)
- Octokit (`@octokit/rest`) — GitHub API branch, commit & Pull Request automation

**Dashboard Frontend (`dashboard/client`)**
- React & Vite — fast responsive SPA
- Socket.io Client — real-time crash feed & agent progress streaming
- Axios — HTTP interceptors with auto-JWT token handling

---

## Repository Structure

```
crashsense/
├── package/                      official npm package (crashsense-express-agent)
│   ├── src/
│   │   ├── index.js              middleware factory — main export
│   │   ├── stackParser.js        V8 stack trace parser
│   │   ├── context.js            request and environment extractor
│   │   └── reporter.js           HTTP crash reporter
│   └── package.json
│
└── dashboard/                    MERN web application
    ├── server/
    │   ├── index.js              Express, Socket.io & keep-alive entry point
    │   ├── models/               User, Crash, Session, Package, GeneratedCode
    │   ├── routes/               auth, crashes (with /:id/patch), chat, packages, code
    │   ├── services/
    │   │   ├── groq.js           AI analysis service
    │   │   └── patchAgent.js     LangGraph 4-node Auto-Patch agent
    │   └── middleware/
    │       └── auth.js           JWT & API Key authentication
    └── client/
        └── src/
            ├── pages/            DashboardHome, Dashboard, Packages, GeneratedCode, Documentation, Login, Register
            ├── components/       CrashFeed, CodeViewer, AIChat, Sidebar
            └── api/client.js     Axios client with 60s timeout & JWT interceptors
```

---

## Security & Data Isolation

- **Multi-Tenant Architecture**: Every user account has a unique API Key and isolated MongoDB records.
- **WebSocket Rooms**: Socket.io connections authenticate via JWT and join private user rooms (`io.to(userId)`).
- **Sanitized Telemetry**: Passwords, tokens, and authorization headers are automatically redacted (`[REDACTED]`).
- **Zero-Overhead Async Reporting**: Telemetry is transmitted asynchronously without blocking HTTP response lifecycles.

---

## Deployment

- **Backend** — Render.com free tier (with automatic 14-minute self-ping keep-alive interval)
- **Frontend** — Vercel free tier (`https://crash-sense.vercel.app`)
- **Database** — MongoDB Atlas M0 free cluster
- **npm Registry** — [`crashsense-express-agent`](https://www.npmjs.com/package/crashsense-express-agent)