import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useStore.getState().initCanvas()
})

describe('store — pure actions', () => {
  it('initializes with a single root thread', () => {
    expect(useStore.getState().canvas.threads).toHaveLength(1)
  })
  it('adds a user message and returns its id', () => {
    const rootId = useStore.getState().canvas.threads[0].id
    const id = useStore.getState().addUserMessage(rootId, 'hello')
    const root = useStore.getState().canvas.threads[0]
    expect(root.messages).toHaveLength(1)
    expect(root.messages[0]).toMatchObject({ id, role: 'user', content: 'hello' })
  })
  it('accumulates streamed deltas into an assistant message', () => {
    const rootId = useStore.getState().canvas.threads[0].id
    const id = useStore.getState().startAssistantMessage(rootId)
    useStore.getState().appendToMessage(rootId, id, 'Hel')
    useStore.getState().appendToMessage(rootId, id, 'lo')
    const msg = useStore.getState().canvas.threads[0].messages.find((m) => m.id === id)!
    expect(msg.content).toBe('Hello')
  })
  it('branches to a new thread wired to the branch point', () => {
    const rootId = useStore.getState().canvas.threads[0].id
    const mId = useStore.getState().addUserMessage(rootId, 'q')
    const childId = useStore.getState().branch(rootId, mId, 'quoted')
    const child = useStore.getState().canvas.threads.find((t) => t.id === childId)!
    expect(child).toMatchObject({ parentId: rootId, branchPointMessageId: mId, quotedText: 'quoted' })
  })
  it('persists after a mutation', () => {
    const rootId = useStore.getState().canvas.threads[0].id
    useStore.getState().addUserMessage(rootId, 'saved?')
    expect(localStorage.getItem('tangent:canvas:v1')).toContain('saved?')
  })
})
