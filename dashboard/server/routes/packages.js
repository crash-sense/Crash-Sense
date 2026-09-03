'use strict'

const express = require('express')
const router = express.Router()
const Package = require('../models/Package')
const authMiddleware = require('../middleware/auth')
const Groq = require('groq-sdk')
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// POST /api/packages
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, version, description, content } = req.body
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' })
    }

    const pkg = new Package({
      user: req.user._id,
      name,
      version,
      description,
      content,
      status: 'processing'
    })
    
    await pkg.save()
    res.status(201).json(pkg)

    // Run AI analysis asynchronously
    try {
      const prompt = `Analyze this Node.js package content/dependencies and provide a brief security and quality summary. Return ONLY a Markdown formatted response:
Name: ${name}
Version: ${version}
Content:
${content}
`
      const chatCompletion = await groq.chat.completions.create({
        model: 'groq/compound-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      })

      pkg.analysis = chatCompletion.choices[0]?.message?.content || 'No analysis provided.'
      pkg.status = 'completed'
      await pkg.save()
    } catch (aiErr) {
      console.error('Package analysis failed:', aiErr)
      pkg.status = 'failed'
      pkg.analysis = 'Failed to analyze package due to AI error.'
      await pkg.save()
    }
  } catch (err) {
    console.error('Failed to import package:', err)
    res.status(500).json({ error: 'Failed to import package' })
  }
})

// GET /api/packages
router.get('/', authMiddleware, async (req, res) => {
  try {
    const packages = await Package.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(packages)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch packages' })
  }
})

module.exports = router
