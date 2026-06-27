// src/index.js

'use strict'

const fs = require('fs')
const { parseStack } = require('./stackParser')
const { extractContext } = require('./context')
const { sendReport } = require('./reporter')

function readSourceCode(filePath, lineNum, contextLines = 15) {
  if (!filePath || filePath === 'unknown' || typeof lineNum !== 'number') return null
  try {
    if (!fs.existsSync(filePath)) return null
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split(/\r?\n/)
    
    const start = Math.max(0, lineNum - 1 - contextLines)
    const end = Math.min(lines.length, lineNum - 1 + contextLines + 1)
    
    return {
      content: lines.slice(start, end).join('\n'),
      startLine: start + 1,
      errorLine: lineNum
    }
  } catch (err) {
    console.error('[crashsense] Failed to read source snippet:', err.message)
    return null
  }
}

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

      let sourceSnippet = null
      if (frames && frames.length > 0) {
        const topFrame = frames[0]
        sourceSnippet = readSourceCode(topFrame.file, topFrame.line)
      }

      const payload = {
        projectId: options.projectId,
        message: err.message,
        name: err.name || 'Error',
        stack: err.stack,
        frames,
        request: context.request,
        environment: context.environment,
        sourceSnippet,
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