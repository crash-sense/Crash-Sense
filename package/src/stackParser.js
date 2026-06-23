'use strict'

function parseStack(err, maxFrames = 10) {
  if (!err || !err.stack) return []

  const lines = err.stack.split('\n')
  const frames = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('at ')) continue

    let functionName = '<anonymous>'
    let file = 'unknown'
    let lineNum = 0
    let column = 0

    // Match "at Name (file:line:col)"
    let match = line.match(/^at\s+(?:new\s+)?([^\s]+(?:\s+\[as\s+[^\]]+\])?(?:<anonymous>)?|[^:]+)\s+\((.*?):(\d+):(\d+)\)$/)
    if (!match) {
        // Fallback for "at Name (file:line:col)" where Name has spaces or is complex.
        match = line.match(/^at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)$/)
    }
    
    if (match) {
      functionName = match[1]
      file = match[2]
      lineNum = parseInt(match[3], 10)
      column = parseInt(match[4], 10)
    } else {
      // Match "at file:line:col"
      match = line.match(/^at\s+(.*?):(\d+):(\d+)$/)
      if (match) {
        file = match[1]
        lineNum = parseInt(match[2], 10)
        column = parseInt(match[3], 10)
      }
    }

    if (match) {
      const isNative = line.includes('(native)') || line.includes('node:') || file === 'unknown'
      frames.push({
        file,
        line: lineNum,
        column,
        functionName: functionName.replace(/ \[as .*\]/, ''),
        isNative,
        isConstructor: line.startsWith('at new ')
      })
    }
  }

  return frames
    .filter(f => !f.isNative)
    .slice(0, maxFrames)
}

module.exports = { parseStack }