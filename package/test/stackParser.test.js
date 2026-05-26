// test/stackParser.test.js

const { parseStack } = require('../src/stackParser')

function makeError() {
  try {
    null.property  // deliberately causes TypeError
  } catch (e) {
    return e
  }
}

describe('parseStack', () => {

  test('returns an array', () => {
    const frames = parseStack(makeError())
    expect(Array.isArray(frames)).toBe(true)
  })

  test('returns empty array if null is passed', () => {
    const frames = parseStack(null)
    expect(frames).toEqual([])
  })

  test('returns empty array if error has no stack', () => {
    const err = new Error('no stack')
    delete err.stack
    const frames = parseStack(err)
    expect(frames).toEqual([])
  })

  test('each frame has required fields', () => {
    const frames = parseStack(makeError())
    expect(frames.length).toBeGreaterThan(0)
    const frame = frames[0]
    expect(frame).toHaveProperty('file')
    expect(frame).toHaveProperty('line')
    expect(frame).toHaveProperty('column')
    expect(frame).toHaveProperty('functionName')
    expect(frame).toHaveProperty('isNative')
    expect(frame).toHaveProperty('isConstructor')
  })

  test('respects maxFrames limit', () => {
    const frames = parseStack(makeError(), 2)
    expect(frames.length).toBeLessThanOrEqual(2)
  })

  test('filters out native frames', () => {
    const frames = parseStack(makeError())
    frames.forEach(frame => {
      expect(frame.isNative).toBe(false)
    })
  })

  test('does not mutate the original error', () => {
    const err = makeError()
    const originalStack = err.stack
    parseStack(err)
    expect(err.stack).toBe(originalStack)
  })

})