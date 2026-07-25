import { describe, it, expect } from 'vitest'
import { emptyCanvas, appendMessage, branchFromMessage } from '../domain/thread'
import { exportCanvas, importCanvas } from './transfer'

function sample() {
  let c = emptyCanvas('root')
  c = appendMessage(c, 'root', { id: 'a1', role: 'assistant', content: 'hi', createdAt: 1 })
  c = branchFromMessage(c, 'root', 'a1', 'B', { x: 400, y: 0 }, 'quote')
  return c
}

describe('import/export round trip', () => {
  it('exports then imports to a deep-equal canvas', () => {
    const c = sample()
    expect(importCanvas(exportCanvas(c))).toEqual(c)
  })
  it('rejects non-JSON', () => {
    expect(() => importCanvas('{nope')).toThrow()
  })
  it('rejects a missing/unknown version', () => {
    expect(() => importCanvas(JSON.stringify({ version: 99, threads: [] }))).toThrow(/version/i)
  })
  it('rejects a canvas without a threads array', () => {
    expect(() => importCanvas(JSON.stringify({ version: 1 }))).toThrow(/threads/i)
  })
  it('rejects a thread missing required fields', () => {
    const bad = { version: 1, threads: [{ id: 'x' }] }
    expect(() => importCanvas(JSON.stringify(bad))).toThrow()
  })
})
