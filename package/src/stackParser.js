
'use strict'

function parseStack(err, maxFrames = 10) {
  if (!err || !err.stack) return []

  const originalPrepare = Error.prepareStackTrace

  let callSites = []

  try {
    Error.prepareStackTrace = (_, sites) => {
      callSites = sites
      return sites  // return sites not err.stack
    }

    // create a new error to trigger prepareStackTrace fresh
    const newErr = { stack: err.stack }
    Error.captureStackTrace(newErr)
    newErr.stack  // trigger it

  } finally {
    Error.prepareStackTrace = originalPrepare
  }

  if (!callSites || callSites.length === 0) return []

  return callSites
    .slice(0, maxFrames)
    .map(site => ({
      file: site.getFileName() || 'unknown',
      line: site.getLineNumber(),
      column: site.getColumnNumber(),
      functionName: site.getFunctionName() || '<anonymous>',
      isNative: site.isNative(),
      isConstructor: site.isConstructor(),
    }))
    .filter(frame => !frame.isNative && frame.file !== 'unknown')
}

module.exports = { parseStack }