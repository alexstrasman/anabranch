import { describe, it, expect } from 'vitest'
import type { Canvas, Message } from './types'
import { ancestorChain, assembleContext } from './context'

function msg(id: string, role: 'user' | 'assistant', content: string): Message {
  return { id, role, content, createdAt: 0 }
}

// root: u1,a1,u2,a2 ; branch B off a1 (message id 'a1'): u3,a3 ; branch C off u3
const canvas: Canvas = {
  version: 1,
  threads: [
    { id: 'root', parentId: null, branchPointMessageId: null, quotedText: null,
      title: null, collapsed: false, position: { x: 0, y: 0 },
      messages: [msg('u1','user','one'), msg('a1','assistant','two'),
                 msg('u2','user','three'), msg('a2','assistant','four')] },
    { id: 'B', parentId: 'root', branchPointMessageId: 'a1', quotedText: null,
      title: null, collapsed: false, position: { x: 0, y: 0 },
      messages: [msg('u3','user','five'), msg('a3','assistant','six')] },
    { id: 'C', parentId: 'B', branchPointMessageId: 'u3', quotedText: null,
      title: null, collapsed: false, position: { x: 0, y: 0 },
      messages: [msg('u4','user','seven')] },
  ],
}

describe('ancestorChain', () => {
  it('returns [root] for the root thread', () => {
    expect(ancestorChain(canvas, 'root').map(t => t.id)).toEqual(['root'])
  })
  it('returns root-first chain for a deep branch', () => {
    expect(ancestorChain(canvas, 'C').map(t => t.id)).toEqual(['root', 'B', 'C'])
  })
})

describe('assembleContext', () => {
  it('is just the thread messages for the root', () => {
    expect(assembleContext(canvas, 'root').map(m => m.id))
      .toEqual(['u1', 'a1', 'u2', 'a2'])
  })
  it('includes parent messages up to and including the branch point, then own', () => {
    // B branched off a1, so root contributes u1,a1 (NOT u2,a2), then B's own
    expect(assembleContext(canvas, 'B').map(m => m.id))
      .toEqual(['u1', 'a1', 'u3', 'a3'])
  })
  it('walks multiple levels, truncating each parent at its child branch point', () => {
    // C branched off u3 in B; B branched off a1 in root
    expect(assembleContext(canvas, 'C').map(m => m.id))
      .toEqual(['u1', 'a1', 'u3', 'u4'])
  })
  it('throws if a branch point message is missing from the parent', () => {
    const broken: Canvas = { version: 1, threads: [
      canvas.threads[0],
      { ...canvas.threads[1], branchPointMessageId: 'nope' },
    ] }
    expect(() => assembleContext(broken, 'B')).toThrow(/branch point/i)
  })
  it('throws if the thread id does not exist', () => {
    expect(() => assembleContext(canvas, 'ghost')).toThrow(/not found/i)
  })
  // A delivery error rides alongside a message so the user can see it. It must
  // never reach the model — neither smuggled into `content` nor as a stray
  // field on the payload — or every later turn in the thread, and every branch
  // below it, is silently fed "⚠️ Rate limit hit" as assistant context.
  it('never leaks a message error into what it sends to the model', () => {
    const withError: Canvas = {
      version: 1,
      threads: [{
        ...canvas.threads[0],
        messages: [
          msg('u1', 'user', 'one'),
          { ...msg('a1', 'assistant', ''), error: 'Rate limit hit. Wait a moment and retry.' },
        ],
      }],
    }
    const assembled = assembleContext(withError, 'root')
    expect(assembled.map((m) => m.content)).toEqual(['one', ''])
    expect(assembled.every((m) => !('error' in m))).toBe(true)
    expect(JSON.stringify(assembled)).not.toMatch(/rate limit/i)
  })
})
