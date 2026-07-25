import { describe, it, expect, beforeEach } from 'vitest'
import { emptyCanvas } from '../domain/thread'
import { saveCanvas, loadCanvas, saveApiKey, loadApiKey, clearApiKey } from './storage'

beforeEach(() => localStorage.clear())

describe('canvas persistence', () => {
  it('round-trips a canvas through localStorage', () => {
    const c = emptyCanvas('root')
    saveCanvas(c)
    expect(loadCanvas()).toEqual(c)
  })
  it('returns null when nothing is stored', () => {
    expect(loadCanvas()).toBeNull()
  })
  it('returns null (does not throw) on corrupt data', () => {
    localStorage.setItem('tangent:canvas:v1', '{not json')
    expect(loadCanvas()).toBeNull()
  })
  // Well-formed JSON of the wrong shape used to load fine and then blow up in
  // CanvasView on `canvas.threads.map` — a white screen on every reload with no
  // in-app way out. loadCanvas validates, so it degrades to a fresh canvas.
  it('returns null on valid JSON with the wrong shape', () => {
    localStorage.setItem('tangent:canvas:v1', JSON.stringify({ version: 1 })) // no threads
    expect(loadCanvas()).toBeNull()
  })
  it('returns null on an unknown version', () => {
    localStorage.setItem('tangent:canvas:v1', JSON.stringify({ version: 99, threads: [] }))
    expect(loadCanvas()).toBeNull()
  })
  it('returns null on a thread missing required fields', () => {
    localStorage.setItem('tangent:canvas:v1', JSON.stringify({ version: 1, threads: [{ id: 'x' }] }))
    expect(loadCanvas()).toBeNull()
  })
  it('returns null on a JSON scalar', () => {
    localStorage.setItem('tangent:canvas:v1', '42')
    expect(loadCanvas()).toBeNull()
  })
})

describe('api key persistence', () => {
  it('saves, loads, and clears the key', () => {
    saveApiKey('sk-ant-123')
    expect(loadApiKey()).toBe('sk-ant-123')
    clearApiKey()
    expect(loadApiKey()).toBeNull()
  })
})
