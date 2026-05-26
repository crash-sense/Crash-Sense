function brokenFunction() {
  const obj = null
  return obj.property  // TypeError
}

function callerFunction() {
  return brokenFunction()
}

function makeSampleError() {
  try {
    callerFunction()
  } catch (e) {
    e.name = 'TypeError'
    return e
  }
}

module.exports = makeSampleError()