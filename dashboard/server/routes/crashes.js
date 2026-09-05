'use strict'

const express = require('express')
const router = express.Router()
const Crash = require('../models/Crash')
const { analyseWithGroq } = require('../services/groq')
const { runPatchAgent } = require('../services/patchAgent')
const authMiddleware = require('../middleware/auth')

// POST /api/crashes
// Receives crash from npm package
router.post('/', authMiddleware, async (req, res) => {
  try {
    const crash = new Crash({
      ...req.body,
      user: req.user._id // Attach to authenticated user account
    })
    await crash.save()

    const room = req.user._id.toString()

    // Tell React a new crash arrived — instantly (isolated room)
    req.io.to(room).emit('new:crash', crash)

    // Run AI analysis in background
    analyseWithGroq(crash, req.io, room).catch((err) => {
      console.error('AI analysis failed:', err.message)
    })

    res.status(201).json({ success: true, id: crash._id })
  } catch (err) {
    console.error('Failed to save crash:', err.message)
    res.status(500).json({ error: 'Failed to save crash' })
  }
})

// POST /api/crashes/:id/patch
// Triggers the LangGraph Auto-Patch agentic pipeline
router.post('/:id/patch', authMiddleware, async (req, res) => {
  try {
    const crash = await Crash.findOne({ _id: req.params.id, user: req.user._id })
    if (!crash) return res.status(404).json({ error: 'Crash not found' })

    const { githubToken, githubOwner, githubRepo } = req.body
    const room = req.user._id.toString()

    // Run the agentic pipeline
    const prUrl = await runPatchAgent(crash, req.io, {
      githubToken,
      githubOwner,
      githubRepo
    }, room)

    res.json({ success: true, prUrl })
  } catch (err) {
    console.error('[routes/crashes] Patch generation failed:', err.message)
    res.status(500).json({ error: err.message || 'Patch generation failed' })
  }
})

// GET /api/crashes
// React dashboard fetches crashes for authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { projectId, page = 1, limit = 50 } = req.query
    const query = { user: req.user._id }
    if (projectId) query.projectId = projectId

    const crashes = await Crash.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('-stack')

    res.json(crashes)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crashes' })
  }
})

// GET /api/crashes/source
// Fetch local file content for code viewer
router.get('/source', authMiddleware, async (req, res) => {
  try {
    const filePath = req.query.filePath
    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' })
    }

    const fs = require('fs')
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' })
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    res.json({ content })
  } catch (err) {
    console.error('Failed to read source file:', err.message)
    res.status(500).json({ error: 'Failed to read source file' })
  }
})

// GET /api/crashes/:id
// React fetches single crash
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const crash = await Crash.findOne({ _id: req.params.id, user: req.user._id })
    if (!crash) return res.status(404).json({ error: 'Crash not found' })
    res.json(crash)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crash' })
  }
})

module.exports = router