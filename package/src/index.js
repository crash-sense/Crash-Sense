// src/index.js

'use strict'

const { parseStack } = require('./stackParser')
const { extractContext } = require('./context')
const { sendReport } = require('./reporter')

function crashsense(config = {}) {

  if (!config.dashboardUrl) throw new Error('[crashsense] dashboardUrl is required')
  if (!config.apiKey) throw new Error('[crashsense] apiKey is required')
  if (!config.projectId) throw new Error('[crashsense] projectId is required')

  const options = {
    dashboardUrl: config.dashboardUrl,
    apiKey: config.apiKey,
    projectId: config.projectId,
    enabled: config.enabled !== false,   // default true
    sanitize: config.sanitize !== false, // default true
    maxFrames: config.maxFrames || 10,
    timeout: config.timeout || 3000,
  }

  
  return async function crashsenseMiddleware(err, req, res, next) {
    if (!options.enabled) {
      return next(err)
    }

    try {
      const frames = parseStack(err, options.maxFrames)
      const context = extractContext(req, options.sanitize)

      const payload = {
        projectId: options.projectId,
        message: err.message,
        name: err.name || 'Error',
        stack: err.stack,
        frames,
        request: context.request,
        environment: context.environment,
        timestamp: new Date().toISOString(),
      }

      
      sendReport(payload, options).catch(err => {
        console.error('[crashsense] Failed to send crash report:', err.message)
      })

    } catch (parseErr) {
      
      console.error('[crashsense] Internal error:', parseErr.message)
    }

    
    next(err)
  }
}

module.exports = crashsense