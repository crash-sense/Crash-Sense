# CrashSense

A runtime AI debugger for Express.js applications. CrashSense intercepts server crashes the moment they happen, parses the V8 stack trace, and delivers a real-time AI-powered explanation through a browser-based dashboard — without any IDE or manual log digging.

---

## Overview

Most debugging tools require you to reproduce a crash, set breakpoints, or dig through log files. CrashSense takes a different approach: install one middleware package into any Express.js application and the next time it crashes, a structured analysis appears instantly in your dashboard with an AI explanation of what went wrong, why it happened, and how to fix it.

The project is split into two parts that work together:

- **`package/`** — a lightweight npm middleware that runs inside any Express app, intercepts unhandled errors, and reports them to the dashboard
- **`dashboard/`** — a MERN stack web application that receives crash reports, stores them, runs AI analysis via Groq, and presents a real-time debugging interface

---

## How It Works

```
Express app throws an unhandled error at runtime
        |
crashsense middleware intercepts it
        |
V8 stack trace is parsed into structured frames
        |
Request context is extracted and sanitized
        |
Crash payload is sent to the dashboard server
        |
Dashboard saves to MongoDB and notifies React via Socket.io
        |
Groq LLM generates a structured JSON crash analysis
        |
Dashboard renders the structured AI diagnostics card
and developer can ask follow-up questions via live stream
```

---

## Structured AI Diagnostics

CrashSense leverages Llama 3.3 70B on Groq using strict **JSON Mode** to convert messy runtime crashes into structured, reliable telemetry. Instead of raw text blocks, the AI returns a parsed JSON payload with the following fields:

* **`errorType`** — Categorized error class (e.g., `TypeError`, `ReferenceError`).
* **`affectedFile`** — The exact file path that caused the crash.
* **`lineNumber`** — The exact source code line number.
* **`functionName`** — The executing function scope.
* **`rootCause`** — A plain-English, jargon-free explanation of the error.
* **`suggestedFix`** — A comparative before/after code fix payload.
* **`prevention`** — A preventative tip to avoid similar bugs in the future.

This structured output is parsed on the React frontend and rendered in an interactive card featuring syntax-highlighted code comparisons.

---

## Tech Stack

**npm Package**
- Node.js — V8 Stack Trace API for structured frame extraction
- Axios — HTTP reporting to dashboard

**Dashboard Backend**
- Node.js and Express.js — API server
- MongoDB Atlas — crash and session storage
- Mongoose — schema and query layer
- Socket.io — real-time event streaming to React
- Groq SDK — Llama 3.1 70B inference for crash analysis

**Dashboard Frontend**
- React and Vite — UI framework
- Monaco Editor — code viewer with crash line highlighting
- Socket.io Client — receives live crash events and AI token stream
- Axios — HTTP requests to backend API

---

## Repository Structure

```
crashsense/
├── package/                      npm middleware package
│   ├── src/
│   │   ├── index.js              middleware factory — main export
│   │   ├── stackParser.js        V8 stack trace parser
│   │   ├── context.js            request and environment extractor
│   │   └── reporter.js           HTTP crash reporter
│   ├── test/
│   │   ├── index.test.js
│   │   ├── stackParser.test.js
│   │   └── fixtures/
│   │       └── sampleError.js
│   └── package.json
│
└── dashboard/                    MERN web application
    ├── server/
    │   ├── index.js              Express and Socket.io entry point
    │   ├── models/
    │   │   ├── Crash.js
    │   │   └── Session.js
    │   ├── routes/
    │   │   ├── crashes.js
    │   │   └── chat.js
    │   ├── services/
    │   │   └── groq.js
    │   └── middleware/
    │       └── auth.js
    └── client/
        └── src/
            ├── hooks/useSocket.js
            ├── pages/Dashboard.jsx
            ├── components/
            │   ├── CrashFeed.jsx
            │   ├── CodeViewer.jsx
            │   └── AIChat.jsx
            └── api/client.js
```

---

## Getting Started

### Prerequisites

- Node.js 18 or above
- A free MongoDB Atlas account at mongodb.com/atlas
- A free Groq API key at console.groq.com

### Clone the repository

```bash
git clone https://github.com/crash-sense/Crash-Sense.git
cd Crash-Sense
```

### Set up the dashboard server

```bash
cd dashboard/server
npm install
cp .env.example .env
```

Edit `.env` and fill in your values:

```
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
GROQ_API_KEY=your_groq_api_key
CRASHSENSE_API_KEY=any_random_secret_string
CLIENT_URL=http://localhost:5173
```

Start the server:

```bash
npm run dev
```

### Set up the dashboard client

```bash
cd dashboard/client
npm install
cp .env.example .env
```

Edit `.env`:

```
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

Start the client:

```bash
npm run dev
```

### Install the npm package in any Express app

```bash
npm install crashsense
```

Add to your Express application:

```js
const express = require('express')
const crashsense = require('crashsense')

const app = express()

app.use(crashsense({
  dashboardUrl: 'http://localhost:5000',
  apiKey: 'your_crashsense_api_key',
  projectId: 'my-app'
}))

// your routes here

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal Server Error' })
})
```

The next time your app throws an unhandled error, it will appear in the dashboard with a full AI explanation.

---

## Configuration Options

| Option | Required | Default | Description |
|---|---|---|---|
| `dashboardUrl` | Yes | — | URL of your running dashboard server |
| `apiKey` | Yes | — | Secret key shared with the dashboard |
| `projectId` | Yes | — | Identifier for this application |
| `enabled` | No | `true` | Set `false` to disable reporting |
| `sanitize` | No | `true` | Redact passwords and tokens from payloads |
| `maxFrames` | No | `10` | Number of stack frames to extract |
| `timeout` | No | `3000` | HTTP POST timeout in milliseconds |

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/crashes | Bearer token | Receive crash from middleware |
| GET | /api/crashes | None | List all crashes |
| GET | /api/crashes/:id | None | Single crash with full details |
| POST | /api/chat | None | Send message to AI |
| GET | /api/chat/:crashId | None | Fetch chat history |
| GET | /health | None | Server health check |

---

## Real-time Events

The dashboard uses Socket.io to push events to the React client without polling.

| Event | Direction | Description |
|---|---|---|
| `new:crash` | Server to client | New crash saved to database |
| `analysis:token:{crashId}` | Server to client | One AI token during analysis stream |
| `analysis:done:{crashId}` | Server to client | AI analysis complete |
| `chat:token:{crashId}` | Server to client | One AI token during chat stream |
| `chat:done:{crashId}` | Server to client | Chat reply complete |

---

## Running Tests

```bash
cd package
npm test
npm test -- --coverage
```

---

## Deployment

The dashboard is designed for free deployment with no infrastructure cost.

- **Backend** — deploy `dashboard/server` to Render.com free tier
- **Frontend** — deploy `dashboard/client` to Vercel free tier
- **Database** — MongoDB Atlas M0 free cluster
- **AI** — Groq API free tier (14,400 requests per day)

After deployment, update the `dashboardUrl` in your middleware configuration to point to your Render.com URL.

---

## Zero-Overhead & Async Reporting Architecture

CrashSense is designed to run in production environments with **zero overhead** on your HTTP request lifecycle and server availability:

1. **Non-Blocking Fire-and-Forget Reporting**: The middleware captures and parses the crash context synchronously, but transmits the payload to the dashboard backend asynchronously without using `await`. It immediately routes execution to the next Express error handler using `next(err)`. This ensures that your client's HTTP response is never delayed by the monitoring tool's network latency.
2. **Strict Timeouts**: To prevent slow network connections to the dashboard server from locking up Node.js sockets or holding memory, the reporter client implements a hard-coded HTTP timeout (default `3000ms`).
3. **Preventing Zombie Processes**: When Node.js experiences a critical unhandled exception, the process is left in an unstable state. CrashSense allows your server to report the telemetry immediately before the process manager (like PM2 or Docker) restarts the process. This prevents "zombie" processes that leak memory or fail to respond to health check pings.

---

## Security

- All crash payloads are sanitized before transmission — passwords, tokens, and authorization headers are replaced with `[REDACTED]`
- Dashboard endpoints that receive crash data require a Bearer token
- Environment variables are never logged or exposed in responses
- The middleware uses a strict HTTP timeout to prevent any impact on application response times

---

## Project Status

This project is being built as a final year BTech computer science project. Active development is in progress.

---