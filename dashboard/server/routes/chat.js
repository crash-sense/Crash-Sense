'use strict'

const express = require('express')
const router = express.Router()
const Session = require('../models/Session')
const Crash = require('../models/Crash')
const { chatWithGroq } = require('../services/groq')

// POST /api/chat
// User sends a follow-up question about a crash
router.post('/', async (req, res) => {
  const { crashId, message } = req.body

  if (!crashId || !message) {
    return res.status(400).json({ error: 'crashId and message are required' })
  }

  try {
    const crash = await Crash.findById(crashId)
    if (!crash) return res.status(404).json({ error: 'Crash not found' })

    // Get existing session or create new one
    let session = await Session.findOne({ crashId })
    if (!session) {
      session = new Session({ crashId, messages: [] })
    }

    // Save user message
    session.messages.push({ role: 'user', content: message })
    await session.save()

    // Stream AI reply via Socket.io
    const reply = await chatWithGroq(
      crash,
      session.messages,
      req.io,
      crashId
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
router.get('/:crashId', async (req, res) => {
  try {
    const session = await Session.findOne({ crashId: req.params.crashId })
    res.json(session ? session.messages : [])
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' })
  }
})

module.exports = router