'use strict'

const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Use a secret from env, or a fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_crashsense_2026'

async function auth(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' })
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header must start with Bearer' })
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Missing token' })
  }

  try {
    // 1. Try decoding as JWT (Frontend Auth)
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await User.findById(decoded.id).select('-password')
      if (user) {
        req.user = user
        return next()
      }
    } catch (jwtErr) {
      // If it fails to parse as JWT, fall through and try API key
    }

    // 2. Try looking it up as an API Key (npm package auth)
    const userByApiKey = await User.findOne({ apiKey: token }).select('-password')
    if (userByApiKey) {
      req.user = userByApiKey
      return next()
    }

    // Neither JWT nor API key worked
    return res.status(403).json({ error: 'Unauthorized: Invalid token or API key' })
  } catch (err) {
    console.error('[auth middleware] Error:', err.message)
    res.status(500).json({ error: 'Server authentication error' })
  }
}

module.exports = auth