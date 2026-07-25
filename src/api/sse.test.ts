import { describe, it, expect } from 'vitest'
import { parseSSELines } from './sse'

describe('parseSSELines', () => {
  it('extracts text deltas from content_block_delta events', () => {
    const lines = [
      'event: content_block_delta',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hel"}}',
      '',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"lo"}}',
      '',
    ]
    expect(parseSSELines(lines)).toEqual([
      { type: 'text', text: 'Hel' },
      { type: 'text', text: 'lo' },
    ])
  })
  it('emits a done event on message_stop', () => {
    const lines = ['data: {"type":"message_stop"}', '']
    expect(parseSSELines(lines)).toEqual([{ type: 'done' }])
  })
  it('emits an error event on an error payload', () => {
    const lines = ['data: {"type":"error","error":{"message":"overloaded"}}', '']
    expect(parseSSELines(lines)).toEqual([{ type: 'error', message: 'overloaded' }])
  })
  it('ignores ping and unrecognized events', () => {
    expect(parseSSELines(['data: {"type":"ping"}', ''])).toEqual([])
  })
  it('ignores non-data lines', () => {
    expect(parseSSELines(['event: message_start', ':heartbeat'])).toEqual([])
  })
})
