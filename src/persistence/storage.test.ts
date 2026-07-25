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
})

describe('api key persistence', () => {
  it('saves, loads, and clears the key', () => {
    saveApiKey('sk-ant-123')
    expect(loadApiKey()).toBe('sk-ant-123')
    clearApiKey()
    expect(loadApiKey()).toBeNull()
  })
})
