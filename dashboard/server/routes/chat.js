'use strict'

const express = require('express')
const router = express.Router()
const Session = require('../models/Session')
const Crash = require('../models/Crash')
const { chatWithGroq } = require('../services/groq')
const authMiddleware = require('../middleware/auth')

// POST /api/chat
// User sends a follow-up question about a crash
router.post('/', authMiddleware, async (req, res) => {
  const { crashId, message } = req.body

  if (!crashId || !message) {
    return res.status(400).json({ error: 'crashId and message are required' })
  }

  try {
    const crash = await Crash.findOne({ _id: crashId, user: req.user._id })
    if (!crash) return res.status(404).json({ error: 'Crash not found' })

    // Get existing session or create new one
    let session = await Session.findOne({ crashId })
    if (!session) {
      session = new Session({ crashId, messages: [] })
    }

    // Save user message
    session.messages.push({ role: 'user', content: message })
    await session.save()

    const room = req.user._id.toString()

    // Stream AI reply via Socket.io to the user's isolated room
    const reply = await chatWithGroq(
      crash,
      session.messages,
      req.io,
      crashId,
      room
    )

    // Save AI reply
    session.messages.push({ role: 'assistant', content: reply })
    await session.save()

    res.json({ success: true })
  } catch (err) {
    console.error('Chat error:', err.message)
    res.status(500).json({ error: 'Chat failed' })
  }
})

// GET /api/chat/:crashId
// React fetches existing chat history when crash is opened
router.get('/:crashId', authMiddleware, async (req, res) => {
  try {
    // Verify ownership of the crash first
    const crash = await Crash.findOne({ _id: req.params.crashId, user: req.user._id })
    if (!crash) return res.status(404).json({ error: 'Crash not found' })

    const session = await Session.findOne({ crashId: req.params.crashId })
    res.json(session ? session.messages : [])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' })
  }
})

module.exports = router