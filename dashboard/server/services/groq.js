'use strict'

const Groq = require('groq-sdk')
const Crash = require('../models/Crash')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const MODEL = 'llama-3.3-70b-versatile'

// ─── System Prompt for Initial JSON Analysis ──────────────────────────────────
function buildInitialAnalysisSystemPrompt() {
  return `You are an expert Node.js and Express.js debugger built into CrashSense, a real-time crash monitoring tool.

When given a crash report, you must analyze the error and return a JSON object with the following fields:
{
  "errorType": "The type of error (e.g. TypeError, ReferenceError, etc.)",
  "affectedFile": "The file path where the error occurred",
  "lineNumber": "The line number where the error occurred",
  "functionName": "The function name where the error occurred",
  "rootCause": "A clear, plain-English explanation of why this error happened",
  "suggestedFix": "A markdown block showing the corrected code, comparing 'Before' and 'After'",
  "prevention": "One practical tip to prevent this class of error in the future"
}

You must return ONLY the raw JSON object. Do not include any markdown formatting, backticks, or explanation outside the JSON.`
}

// ─── System Prompt for Chat ───────────────────────────────────────────────────
// This tells Groq how to behave for every conversation
// Think of it as the personality and rules of your AI debugger
function buildSystemPrompt() {
  return `You are an expert Node.js and Express.js debugger built into CrashSense, a real-time crash monitoring tool.

When given a crash report, you must:
1. Explain what went wrong in plain English — no jargon
2. Point to the exact file, line, and function that caused the issue
3. Explain WHY it happened — the root cause, not just the symptom
4. Show a concrete code fix with before and after example
5. Give one tip to prevent this class of error in future

Always format your response exactly like this:
## What Happened
## Why It Happened
## The Fix
## Prevention

Be direct and practical. The developer is looking at this during a crisis.`
}

// ─── Crash Context Builder ────────────────────────────────────────────────────
// Formats raw crash data into readable text the AI can understand
// Better context = better AI response
function buildCrashContext(crash) {
  const topFrames = (crash.frames || []).slice(0, 5)

  const framesText = topFrames.length
    ? topFrames
        .map((f) => `  at ${f.functionName} (${f.file}:${f.line}:${f.column})`)
        .join('\n')
    : '  No frames available'

  return `
ERROR DETAILS:
  Type: ${crash.name || 'Error'}
  Message: ${crash.message || 'Unknown error'}

STACK TRACE (top 5 frames):
${framesText}

HTTP REQUEST THAT CAUSED THE CRASH:
  Method: ${crash.request?.method || 'unknown'}
  URL: ${crash.request?.url || 'unknown'}
  Body: ${JSON.stringify(crash.request?.body || {}, null, 2)}

ENVIRONMENT:
  Node.js: ${crash.environment?.nodeVersion || 'unknown'}
  Platform: ${crash.environment?.platform || 'unknown'}
  Memory used: ${crash.environment?.memoryUsage?.heapUsedMB || 'unknown'} MB
  Server uptime: ${crash.environment?.uptime || 'unknown'} seconds
`
}

// ─── analyseWithGroq ──────────────────────────────────────────────────────────
// Called automatically when a new crash arrives
// Streams the first AI explanation token by token via Socket.io
// Caches the full response on the crash document in MongoDB
async function analyseWithGroq(crash, io) {
  const crashContext = buildCrashContext(crash)

  const stream = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(),
      },
      {
        role: 'user',
        content: `Please analyse this crash and explain what went wrong:\n${crashContext}`,
      },
    ],
    stream: true,
    max_tokens: 1024,
    // Lower temperature = more focused and factual responses
    // Higher temperature = more creative but less reliable
    // 0.3 is ideal for debugging explanations
    temperature: 0.3,
  })

  let fullResponse = ''

  // Each chunk contains one token (a word or part of a word)
  // We emit it immediately so React can show it appearing word by word
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || ''
    if (token) {
      fullResponse += token
      // Event name includes crashId so React knows which crash this belongs to
      // Multiple crashes can be open at once — the ID keeps streams separate
      io.emit(`analysis:token:${crash._id}`, token)
    }
  }

  // Tell React the stream is finished
  io.emit(`analysis:done:${crash._id}`)

  // Cache the full response in MongoDB
  // Next time this crash is opened — we return the cached version
  // instead of calling Groq again (saves API calls)
  await Crash.findByIdAndUpdate(crash._id, { aiAnalysis: fullResponse })

  return fullResponse
}

// ─── chatWithGroq ─────────────────────────────────────────────────────────────
// Called when user sends a follow-up question in the chat
// Sends FULL conversation history every time because Groq has no memory
// between separate API calls — it is completely stateless
async function chatWithGroq(crash, messages, io, crashId) {
  const crashContext = buildCrashContext(crash)

  // Build the full message array for Groq
  // We always include:
  // 1. System prompt (how to behave)
  // 2. Crash context as first user message (what we are debugging)
  // 3. A dummy assistant reply to set the scene
  // 4. The real conversation history from MongoDB
  const groqMessages = [
    {
      role: 'system',
      content: buildSystemPrompt(),
    },
    {
      role: 'user',
      content: `I am debugging this crash:\n${crashContext}`,
    },
    {
      role: 'assistant',
      content: 'I have reviewed the crash details. I am ready to help you debug it. What would you like to know?',
    },
    // Spread the actual conversation from MongoDB
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ]

  const stream = await groq.chat.completions.create({
    model: MODEL,
    messages: groqMessages,
    stream: true,
    max_tokens: 512,
    temperature: 0.3,
  })

  let fullResponse = ''

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || ''
    if (token) {
      fullResponse += token
      io.emit(`chat:token:${crashId}`, token)
    }
  }

  io.emit(`chat:done:${crashId}`)

  return fullResponse
}

module.exports = { analyseWithGroq, chatWithGroq }