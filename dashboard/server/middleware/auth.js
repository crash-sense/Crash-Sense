'use strict'

function auth(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({
      error: 'Missing Authorization header'
    })
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authorization header must start with Bearer'
    })
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      error: 'Missing token'
    })
  }

  if (token !== process.env.CRASHSENSE_API_KEY) {
    return res.status(403).json({
      error: 'Invalid API key'
    })
  }

  next()
}

module.exports = auth