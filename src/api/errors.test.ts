import { describe, it, expect } from 'vitest'
import { describeApiError } from './errors'

describe('describeApiError', () => {
  it('maps 401 to an invalid-key message', () => {
    expect(describeApiError(401)).toMatch(/key/i)
  })
  it('maps 429 to a rate-limit message', () => {
    expect(describeApiError(429)).toMatch(/rate limit/i)
  })
  it('maps 0 (no response) to a network message', () => {
    expect(describeApiError(0)).toMatch(/network/i)
  })
  it('maps 5xx to an Anthropic-side message', () => {
    expect(describeApiError(529)).toMatch(/anthropic|overloaded|temporar/i)
  })
})
