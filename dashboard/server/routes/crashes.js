'use strict'

const express = require('express')
const router = express.Router()
const Crash = require('../models/Crash')
const { analyseWithGroq } = require('../services/groq')
const authMiddleware = require('../middleware/auth')

// POST /api/crashes
// Receives crash from npm package
router.post('/', authMiddleware, async (req, res) => {
  try {
    const crash = new Crash(req.body)
    await crash.save()

    // Tell React a new crash arrived — instantly
    req.io.emit('new:crash', crash)

    // Run AI analysis in background — don't make package wait
    analyseWithGroq(crash, req.io).catch((err) => {
      console.error('AI analysis failed:', err.message)
    })

    res.status(201).json({ success: true, id: crash._id })
  } catch (err) {
    console.error('Failed to save crash:', err.message)
    res.status(500).json({ error: 'Failed to save crash' })
  }
})

// GET /api/crashes
// React dashboard fetches all crashes on load
router.get('/', async (req, res) => {
  try {
    const { projectId, page = 1, limit = 50 } = req.query
    const query = projectId ? { projectId } : {}

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
// Fetch local file content to display on the dashboard code viewer
router.get('/source', async (req, res) => {
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
// React fetches single crash when user clicks it
router.get('/:id', async (req, res) => {
  try {
    const crash = await Crash.findById(req.params.id)
    if (!crash) return res.status(404).json({ error: 'Crash not found' })
    res.json(crash)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crash' })
  }
})

module.exports = router