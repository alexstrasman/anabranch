import { describe, it, expect } from 'vitest'
import type { Message } from './types'
import {
  emptyCanvas, appendMessage, replaceMessage, branchFromMessage, moveThread,
  setMessageError, withoutEmptyAssistantMessages,
} from './thread'

const m = (id: string, content: string): Message => ({ id, role: 'user', content, createdAt: 0 })

describe('emptyCanvas', () => {
  it('creates one empty root thread', () => {
    const c = emptyCanvas('root')
    expect(c.version).toBe(1)
    expect(c.threads).toHaveLength(1)
    expect(c.threads[0]).toMatchObject({ id: 'root', parentId: null, messages: [] })
  })
})

describe('appendMessage', () => {
  it('adds a message without mutating the input', () => {
    const c = emptyCanvas('root')
    const c2 = appendMessage(c, 'root', m('u1', 'hi'))
    expect(c.threads[0].messages).toHaveLength(0) // original untouched
    expect(c2.threads[0].messages.map((x) => x.id)).toEqual(['u1'])
  })
})

describe('replaceMessage', () => {
  it('updates content of an existing message in place', () => {
    let c = emptyCanvas('root')
    c = appendMessage(c, 'root', { id: 'a1', role: 'assistant', content: '', createdAt: 0 })
    c = replaceMessage(c, 'root', 'a1', 'streamed text')
    expect(c.threads[0].messages[0].content).toBe('streamed text')
  })
})

describe('setMessageError', () => {
  it('attaches the error beside the message, leaving content untouched', () => {
    let c = emptyCanvas('root')
    c = appendMessage(c, 'root', { id: 'a1', role: 'assistant', content: 'partial', createdAt: 0 })
    c = setMessageError(c, 'root', 'a1', 'Rate limit hit.')
    expect(c.threads[0].messages[0]).toMatchObject({ content: 'partial', error: 'Rate limit hit.' })
  })
})

describe('withoutEmptyAssistantMessages', () => {
  it('drops zero-length assistant messages and keeps everything else', () => {
    let c = emptyCanvas('root')
    c = appendMessage(c, 'root', m('u1', 'hi'))                                        // user, kept
    c = appendMessage(c, 'root', { id: 'a1', role: 'assistant', content: '', createdAt: 0 })
    c = appendMessage(c, 'root', { id: 'a2', role: 'assistant', content: 'ok', createdAt: 0 })
    expect(withoutEmptyAssistantMessages(c).threads[0].messages.map((x) => x.id)).toEqual(['u1', 'a2'])
  })
  it('drops an empty assistant message even when it carries an error', () => {
    let c = emptyCanvas('root')
    c = appendMessage(c, 'root', { id: 'a1', role: 'assistant', content: '', createdAt: 0, error: 'boom' })
    // The error is transient UI feedback; persisting the empty message to keep
    // it would recreate the exact 400 this function exists to prevent.
    expect(withoutEmptyAssistantMessages(c).threads[0].messages).toEqual([])
  })
  it('never drops an empty USER message', () => {
    let c = emptyCanvas('root')
    c = appendMessage(c, 'root', m('u1', ''))
    expect(withoutEmptyAssistantMessages(c).threads[0].messages).toHaveLength(1)
  })
  it('does not mutate the input', () => {
    let c = emptyCanvas('root')
    c = appendMessage(c, 'root', { id: 'a1', role: 'assistant', content: '', createdAt: 0 })
    withoutEmptyAssistantMessages(c)
    expect(c.threads[0].messages).toHaveLength(1)
  })
})

describe('branchFromMessage', () => {
  it('adds a child thread wired to the branch point', () => {
    let c = emptyCanvas('root')
    c = appendMessage(c, 'root', m('a1', 'answer'))
    c = branchFromMessage(c, 'root', 'a1', 'B', { x: 400, y: 0 }, 'quoted bit')
    const b = c.threads.find((t) => t.id === 'B')!
    expect(b).toMatchObject({
      parentId: 'root', branchPointMessageId: 'a1',
      quotedText: 'quoted bit', messages: [], position: { x: 400, y: 0 },
    })
  })
})

describe('moveThread', () => {
  it('updates only the target position', () => {
    const c = moveThread(emptyCanvas('root'), 'root', { x: 10, y: 20 })
    expect(c.threads[0].position).toEqual({ x: 10, y: 20 })
  })
})
