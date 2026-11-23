'use strict'

// ─────────────────────────────────────────────────────────────────────────────
// patchAgent.js — Auto-Patch Generator (LangGraph Pipeline)
//
// ✅ PERSON 1 (FRIEND) — delivers this file with:
//    • LangGraph StateGraph + Annotation state schema
//    • Node 1: fetchFile  — downloads the crashed file from GitHub
//    • Node 2: analyseCrash — asks Groq LLM what's wrong and why
//    • Stub placeholders for Kavya's Node 3 & Node 4
//    • runPatchAgent() entry-point that invokes the compiled graph
//
// ⏳ PERSON 2 (KAVYA) — will fill in:
//    • generatePatchNode  (Node 3)
//    • createPRNode       (Node 4)
//    • POST /api/crashes/:id/patch route in routes/crashes.js
//    • Generate Fix button + PR link in AIChat.jsx
//
// DATA FLOW (LangGraph StateGraph):
//   [START] → fetchFile → analyseCrash → generatePatch → createPR → [END]
//
// Each node receives the full state object, does its job, and returns a
// PARTIAL state update. LangGraph merges the update back into the full state
// automatically before calling the next node.
// ─────────────────────────────────────────────────────────────────────────────

const { StateGraph, Annotation } = require('@langchain/langgraph')
const { ChatGroq } = require('@langchain/groq')
const { HumanMessage } = require('@langchain/core/messages')
const { Octokit } = require('@octokit/rest')

// ─────────────────────────────────────────────────────────────────────────────
// STATE SCHEMA — Annotation.Root
//
// This defines the shape of the object that flows through all 4 nodes.
//
// Annotation() with no args = last-writer-wins semantics.
// That means if a node returns { fileContent: "..." }, only fileContent is
// updated — every other field keeps its previous value. This is exactly what
// we want for a sequential pipeline.
//
// Think of this as the "shared whiteboard" all 4 nodes read from and write to.
// ─────────────────────────────────────────────────────────────────────────────
const PatchStateAnnotation = Annotation.Root({
  // ── Input data (set in runPatchAgent before the graph starts) ─────────────
  crashId:      Annotation(),   // MongoDB _id as string
  filePath:     Annotation(),   // absolute path from crash.frames[0].file
  crashMessage: Annotation(),   // e.g. "Cannot read properties of undefined"
  crashName:    Annotation(),   // e.g. "TypeError"
  lineNumber:   Annotation(),   // line number where the crash happened
  frames:       Annotation(),   // full array of stack frames

  // ── Filled by Node 1 (fetchFile) ──────────────────────────────────────────
  relPath:      Annotation({ default: () => '' }),  // repo-relative path for GitHub API
  fileContent:  Annotation({ default: () => '' }),  // raw source code of the crashed file

  // ── Filled by Node 2 (analyseCrash) ───────────────────────────────────────
  analysis:     Annotation({ default: () => '' }),  // LLM explanation of the root cause

  // ── Filled by Node 3 (generatePatch) — Kavya ──────────────────────────────
  patchedContent: Annotation({ default: () => '' }), // complete fixed file as a string

  // ── Filled by Node 4 (createPR) — Kavya ───────────────────────────────────
  prUrl:        Annotation({ default: () => '' }),   // GitHub PR URL

  // ── Error tracking ─────────────────────────────────────────────────────────
  error:        Annotation({ default: () => null }), // string if something failed
})

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — emitProgress
//
// Emits a Socket.io event that the React frontend listens to.
// This is what drives the live "Fetching file..." → "Analysing..." text
// that appears in the AIChat.jsx panel while the pipeline is running.
//
// Event name pattern: patch:progress:{crashId}
// AIChat.jsx will subscribe to this exact event name for the selected crash.
// ─────────────────────────────────────────────────────────────────────────────
function emitProgress(io, crashId, message) {
  io.emit(`patch:progress:${crashId}`, message)
  console.log(`[patchAgent] [${crashId}] ${message}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — toRelativePath
//
// Problem: crash.frames[0].file is an ABSOLUTE path on the developer's machine:
//   e.g. "D:\Projects\my-app\routes\users.js"
//
// GitHub API needs a REPO-RELATIVE path:
//   e.g. "routes/users.js"
//
// Strategy: find the repo name in the path and take everything after it.
// Falls back to just the filename if the repo name isn't found.
// ─────────────────────────────────────────────────────────────────────────────
function toRelativePath(absolutePath, repoName) {
  if (!absolutePath) return null

  // Normalise Windows backslashes → forward slashes
  const normalised = absolutePath.replace(/\\/g, '/')

  const marker = `/${repoName}/`
  const idx = normalised.indexOf(marker)

  if (idx !== -1) {
    // Take everything AFTER "/repoName/"
    return normalised.substring(idx + marker.length)
  }

  // Fallback to just the filename
  return normalised.split('/').pop()
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE 1 — fetchFile
//
// What it receives from state:
//   state.filePath      — absolute path from the crash
//   state.crashId       — used to emit progress events
//
// What it returns (partial state update):
//   { relPath, fileContent }
//
// How it works:
//   1. Converts the absolute path to a GitHub-relative path
//   2. Calls the GitHub API using Octokit to download the file
//   3. GitHub returns content as base64 — we decode it to a plain string
//   4. Returns the relative path + decoded source code
//
// The `io`, `userOctokit`, `githubOwner`, `githubRepo` variables come from
// the closure in runPatchAgent — nodes are defined as arrow functions inside
// that function so they can access those values without them being in the state.
// ─────────────────────────────────────────────────────────────────────────────
function makeFetchFileNode(io, userOctokit, githubOwner, githubRepo) {
  return async function fetchFileNode(state) {
    emitProgress(io, state.crashId, '📂 Fetching crashed file from GitHub...')

    // Convert absolute path to repo-relative path
    const relPath = toRelativePath(state.filePath, githubRepo)

    if (!relPath) {
      throw new Error(`Could not derive repo-relative path from: ${state.filePath}`)
    }

    // Octokit GitHub API call — downloads file metadata + base64-encoded content
    // Throws a 404 error if the file doesn't exist in the repo
    const { data } = await userOctokit.repos.getContent({
      owner: githubOwner,  // e.g. "vanshikav312"
      repo:  githubRepo,   // e.g. "test-crash-app"
      path:  relPath,      // e.g. "routes/users.js"
    })

    // GitHub returns file content as base64-encoded string
    // Buffer.from(base64string, 'base64').toString('utf-8') decodes it
    const fileContent = Buffer.from(data.content, 'base64').toString('utf-8')

    emitProgress(
      io,
      state.crashId,
      `✅ File fetched: ${relPath} (${fileContent.split('\n').length} lines)`
    )

    // Return a PARTIAL state update — LangGraph merges this into the full state
    // before calling the next node. We only return what this node produced.
    return {
      relPath,      // repo-relative path — needed again in Node 4 (createPR)
      fileContent,  // raw source code string — used by Node 2 and Node 3
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE 2 — analyseCrash
//
// What it receives from state:
//   state.fileContent   — the full source code (set by Node 1)
//   state.crashMessage  — e.g. "Cannot read properties of undefined"
//   state.crashName     — e.g. "TypeError"
//   state.lineNumber    — line number where it crashed
//   state.frames        — stack trace frames array
//   state.crashId       — for progress events
//
// What it returns (partial state update):
//   { analysis }        — LLM explanation of the root cause
//
// How it works:
//   1. Builds a detailed prompt with the full file + crash info
//   2. Sends it to Groq LLM via ChatGroq
//   3. Asks the LLM: "what is wrong at this line and why?"
//   4. The LLM response (the analysis string) is stored in state.analysis
//   5. Node 3 (Kavya) reads state.analysis to understand what to fix
// ─────────────────────────────────────────────────────────────────────────────
function makeAnalyseCrashNode(io, model) {
  return async function analyseCrashNode(state) {
    emitProgress(io, state.crashId, '🔍 Analysing crash with Groq AI...')

    // Format the top 5 stack frames into readable text
    const framesText = (state.frames || [])
      .slice(0, 5)
      .map(f => `  at ${f.functionName || '<anonymous>'} (${f.file}:${f.line}:${f.column})`)
      .join('\n')

    // Build the analysis prompt.
    // The more specific context we give, the more accurate the LLM response.
    const prompt = `
You are an expert Node.js debugger. A runtime crash occurred in the following file.

=== CRASH DETAILS ===
Error Type    : ${state.crashName}
Error Message : ${state.crashMessage}
Crashed at line: ${state.lineNumber}

=== STACK TRACE (top 5 frames) ===
${framesText || 'No frames available'}

=== FULL FILE CONTENT (with line numbers for reference) ===
${state.fileContent
  .split('\n')
  .map((line, i) => `${String(i + 1).padStart(4, ' ')} | ${line}`)
  .join('\n')}

=== YOUR TASK ===
Identify the EXACT block of code at or around line ${state.lineNumber} that caused this crash.

Explain:
1. What the faulty code does
2. Exactly why it causes this specific "${state.crashName}: ${state.crashMessage}" error
3. What the correct behaviour should be — what change is needed to fix it

Be precise. Your analysis will be used by another AI call to generate the actual code fix.
`.trim()

    // HumanMessage wraps our text prompt in the format LangChain expects.
    // model.invoke() sends it to Groq and waits for the full response.
    // Temperature 0.1 = mostly deterministic — we want accurate analysis, not creativity.
    const response = await model.invoke(
      [new HumanMessage(prompt)],
      { temperature: 0.1, maxTokens: 1024 }
    )

    // response.content is the LLM's text reply
    const analysis = response.content

    emitProgress(io, state.crashId, '✅ Root cause identified')

    // Return partial state update — only the analysis field
    return { analysis }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE 3 — generatePatch  (Kavya's Implementation)
//
// Receives: state.fileContent, state.analysis, state.crashMessage, state.lineNumber
// Returns:  { patchedContent }  — the complete fixed file as a raw string
// ─────────────────────────────────────────────────────────────────────────────
function makeGeneratePatchNode(io, model) {
  return async function generatePatchNode(state) {
    emitProgress(io, state.crashId, '🛠️ Generating code fix with Groq AI...')

    const prompt = `
You are a senior Node.js developer. You must fix the bug in the provided source code.

=== ORIGINAL FILE (${state.relPath}) ===
${state.fileContent}

=== ROOT CAUSE ANALYSIS ===
${state.analysis}

=== CRASH DETAILS ===
Error: ${state.crashName}: ${state.crashMessage}
Crashed at line: ${state.lineNumber}

=== STRICT INSTRUCTIONS ===
1. Return the COMPLETE, valid, syntax-correct file content.
2. Fix ONLY the bug by replacing or updating the broken code at/around line ${state.lineNumber}.
3. Do NOT duplicate existing lines (like app.listen or route definitions).
4. Do NOT include markdown code fences (no \`\`\` or \`\`\`javascript).
5. Do NOT include explanations, commentary, or extra conversational text.
6. Output ONLY raw executable JavaScript code.
`.trim()

    const response = await model.invoke(
      [new HumanMessage(prompt)],
      { temperature: 0.1, maxTokens: 2048 }
    )

    let patchedContent = response.content.trim()

    // Strip markdown code fences if the LLM still includes them
    if (patchedContent.startsWith('```')) {
      patchedContent = patchedContent.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
    }

    emitProgress(io, state.crashId, '✅ Patch generated successfully')

    return { patchedContent }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE 4 — createPR  (Kavya's Implementation)
//
// Receives: state.crashId, state.relPath, state.patchedContent, state.crashMessage
// Returns:  { prUrl }  — the GitHub Pull Request URL
// ─────────────────────────────────────────────────────────────────────────────
function makeCreatePRNode(io, userOctokit, githubOwner, githubRepo) {
  return async function createPRNode(state) {
    emitProgress(io, state.crashId, '🚀 Creating branch & Pull Request on GitHub...')

    // Step 1: Get HEAD SHA of main branch
    const { data: mainRef } = await userOctokit.git.getRef({
      owner: githubOwner,
      repo: githubRepo,
      ref: 'heads/main',
    })
    const latestSHA = mainRef.object.sha

    // Step 2: Create unique branch name using the crashId
    const branchName = `crashsense-fix-${state.crashId}`

    // Step 3: Create the new branch ref on GitHub
    await userOctokit.git.createRef({
      owner: githubOwner,
      repo: githubRepo,
      ref: `refs/heads/${branchName}`,
      sha: latestSHA,
    })

    // Step 4: Get file SHA on the new branch (required by GitHub API to update a file)
    const { data: fileData } = await userOctokit.repos.getContent({
      owner: githubOwner,
      repo: githubRepo,
      path: state.relPath,
      ref: branchName,
    })

    // Step 5: Commit the patched content to the new branch
    await userOctokit.repos.createOrUpdateFileContents({
      owner: githubOwner,
      repo: githubRepo,
      path: state.relPath,
      message: `[CrashSense] Auto-fix for ${state.crashName}: ${state.crashMessage}`,
      content: Buffer.from(state.patchedContent).toString('base64'),
      sha: fileData.sha,
      branch: branchName,
    })

    // Step 6: Open a Pull Request from branchName -> main
    const { data: pr } = await userOctokit.pulls.create({
      owner: githubOwner,
      repo: githubRepo,
      title: `[CrashSense] Auto-fix: ${state.crashName}: ${state.crashMessage}`,
      head: branchName,
      base: 'main',
      body: `## CrashSense Auto-Patch

**Crash ID:** \`${state.crashId}\`
**Error:** \`${state.crashName}: ${state.crashMessage}\`
**File:** \`${state.relPath}\` (line ${state.lineNumber})

### Root Cause Analysis
${state.analysis}

---
*Generated automatically by CrashSense Agentic AI Pipeline.*`,
    })

    const prUrl = pr.html_url
    emitProgress(io, state.crashId, `🎉 Pull Request opened: ${prUrl}`)

    return { prUrl }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH BUILDER — buildGraph
//
// Creates and compiles the LangGraph StateGraph.
//
// The graph is a simple linear chain:
//   [START] → fetchFile → analyseCrash → generatePatch → createPR → [END]
//
// Each edge means "when this node finishes, go to the next node".
// LangGraph automatically passes the merged state to each node.
//
// The graph is compiled into a Runnable — call graph.invoke(initialState)
// to execute the full pipeline.
// ─────────────────────────────────────────────────────────────────────────────
function buildGraph(io, userOctokit, githubOwner, githubRepo, model) {
  const graph = new StateGraph(PatchStateAnnotation)

    // Register the 4 nodes — each gets a name (used in edge definitions)
    // and a function (the node implementation).
    // Nodes are created using factory functions (make*Node) which close over
    // io, userOctokit, githubOwner, githubRepo, and model.
    .addNode('fetchFile',      makeFetchFileNode(io, userOctokit, githubOwner, githubRepo))
    .addNode('analyseCrash',   makeAnalyseCrashNode(io, model))
    .addNode('generatePatch',  makeGeneratePatchNode(io, model))
    .addNode('createPR',       makeCreatePRNode(io, userOctokit, githubOwner, githubRepo))

    // Define the execution order using directed edges.
    // '__start__' is a special LangGraph constant for the entry point.
    // '__end__' is a special LangGraph constant for the exit point.
    .addEdge('__start__',     'fetchFile')
    .addEdge('fetchFile',     'analyseCrash')
    .addEdge('analyseCrash',  'generatePatch')
    .addEdge('generatePatch', 'createPR')
    .addEdge('createPR',      '__end__')

    // compile() locks the graph and returns a Runnable with an .invoke() method
    .compile()

  return graph
}

// ─────────────────────────────────────────────────────────────────────────────
// runPatchAgent — Main entry point
//
// Called from routes/crashes.js (Kavya's route) when the developer
// clicks "Generate Fix" in the dashboard.
//
// @param {Object} crash  — full crash document from MongoDB
// @param {Object} io     — Socket.io server instance from req.io
// @param {Object} config — { githubToken, githubOwner, githubRepo }
//                          comes from the user's browser localStorage
// @returns {string}      — the GitHub PR URL
// ─────────────────────────────────────────────────────────────────────────────
async function runPatchAgent(crash, io, config = {}) {
  const crashId = crash._id.toString()

  // ── Resolve GitHub credentials ────────────────────────────────────────────
  // Prefer credentials sent from the browser (user's own GitHub account).
  // Fall back to process.env for server-side configured deployments.
  const githubToken = config.githubToken || process.env.GITHUB_TOKEN
  const githubOwner = config.githubOwner || process.env.GITHUB_OWNER
  const githubRepo  = config.githubRepo  || process.env.GITHUB_REPO

  // ── Validate credentials ──────────────────────────────────────────────────
  if (!githubToken || githubToken.startsWith('ghp_xxx')) {
    throw new Error(
      'GitHub Token not set. Click ⚙ in the AI panel to enter your GitHub credentials.'
    )
  }
  if (!githubOwner) throw new Error('GitHub Owner (username) not set. Click ⚙ in the AI panel.')
  if (!githubRepo)  throw new Error('GitHub Repo name not set. Click ⚙ in the AI panel.')

  // ── Validate crash data ───────────────────────────────────────────────────
  const filePath = crash.frames?.[0]?.file
  if (!filePath) {
    throw new Error('Crash has no file path in frames[0].file — cannot determine which file to patch.')
  }

  // ── Create per-request instances ─────────────────────────────────────────
  // A new Octokit is created for each request using the user's own GitHub token.
  // This means different developers on the same dashboard use their own accounts.
  const userOctokit = new Octokit({ auth: githubToken })

  // ChatGroq is the LangChain wrapper around the Groq SDK.
  // It follows the standard LangChain Chat Model interface (invoke, stream, etc.)
  // We create one model instance shared between nodes 2 and 3.
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model:  'llama3-70b-8192',
  })

  // ── Build and compile the LangGraph pipeline ──────────────────────────────
  const graph = buildGraph(io, userOctokit, githubOwner, githubRepo, model)

  // ── Set up initial state ──────────────────────────────────────────────────
  // This is the "starting whiteboard" passed to Node 1.
  // Each node reads what it needs and adds its outputs.
  const initialState = {
    crashId,
    filePath,
    crashMessage: crash.message  || 'Unknown error',
    crashName:    crash.name     || 'Error',
    lineNumber:   crash.frames?.[0]?.line || 0,
    frames:       crash.frames   || [],
  }

  // Signal to the frontend that the pipeline has started
  io.emit(`patch:start:${crashId}`, { crashId })

  // ── Invoke the graph ──────────────────────────────────────────────────────
  // graph.invoke() runs all 4 nodes in sequence, passing the merged state
  // between them. It returns the FINAL state after all nodes have run.
  //
  // If any node throws, invoke() re-throws — the catch in the route handles it.
  const finalState = await graph.invoke(initialState)

  // Signal to the frontend that the pipeline finished — include the PR URL
  io.emit(`patch:done:${crashId}`, { prUrl: finalState.prUrl })

  return finalState.prUrl
}

module.exports = { runPatchAgent, PatchStateAnnotation }
