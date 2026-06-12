'use strict'

const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
])

const SENSITIVE_BODY_FIELDS = new Set([
  'password',
  'confirmpassword',
  'token',
  'secret',
  'apikey',
  'creditcard',
  'cvv',
])

function extractContext(req, sanitize = true) {
  return {
    request: extractRequest(req, sanitize),
    environment: extractEnvironment(),
  }
}

function extractRequest(req, sanitize) {
  if (!req) return {}

  try {
    const headers = sanitize ? sanitizeHeaders(req.headers || {}) : req.headers || {}
    const body = sanitize ? sanitizeBody(req.body || {}) : req.body || {}

    return {
      method: req.method || 'UNKNOWN',
      url: req.originalUrl || req.url || 'UNKNOWN',
      headers,
      body: safeSerialise(body),
      query: req.query || {},
      params: req.params || {},
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
    }
  } catch {
    return { error: 'Failed to extract request context' }
  }
}

function extractEnvironment() {
  try {
    const mem = process.memoryUsage()
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.floor(process.uptime()),
      memoryUsage: {
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      },
    }
  } catch {
    return { error: 'Failed to extract environment info' }
  }
}

function sanitizeHeaders(headers) {
  const result = { ...headers }
  Object.keys(result).forEach((key) => {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]'
    }
  })
  return result
}

function sanitizeBody(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return body
  }
  const result = { ...body }
  Object.keys(result).forEach((key) => {
    if (SENSITIVE_BODY_FIELDS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]'
    }
  })
  return result
}

function safeSerialise(value) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return '[Unserializable]'
  }
}

module.exports = { extractContext }