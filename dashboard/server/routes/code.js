'use strict'

const express = require('express')
const router = express.Router()
const GeneratedCode = require('../models/GeneratedCode')
const authMiddleware = require('../middleware/auth')
const Groq = require('groq-sdk')
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// POST /api/code
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    const codeDoc = new GeneratedCode({
      user: req.user._id,
      prompt,
      status: 'pending'
    })
    
    await codeDoc.save()
    res.status(201).json(codeDoc)

    // Run AI generation asynchronously
    try {
      const systemPrompt = "You are an expert Node.js/React developer. Write clean, modern, and secure code based on the user's prompt. ONLY return markdown code blocks, do not include chatty text."
      const chatCompletion = await groq.chat.completions.create({
        model: 'groq/compound-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      })

      codeDoc.generatedContent = chatCompletion.choices[0]?.message?.content || 'No code generated.'
      codeDoc.status = 'completed'
      await codeDoc.save()
    } catch (aiErr) {
      console.error('Code generation failed:', aiErr)
      codeDoc.status = 'failed'
      codeDoc.generatedContent = 'Failed to generate code.'
      await codeDoc.save()
    }
  } catch (err) {
    console.error('Failed to generate code request:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/code
router.get('/', authMiddleware, async (req, res) => {
  try {
    const codes = await GeneratedCode.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(codes)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch generated codes' })
  }
})

module.exports = router
