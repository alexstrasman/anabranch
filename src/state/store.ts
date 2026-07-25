import { create } from 'zustand'
import type { Canvas } from '../domain/types'
import {
  emptyCanvas, appendMessage, replaceMessage, branchFromMessage, moveThread,
  setMessageError, withoutEmptyAssistantMessages,
} from '../domain/thread'
import { assembleContext, getThread } from '../domain/context'
import { saveCanvas, loadCanvas, saveApiKey, loadApiKey, clearApiKey } from '../persistence/storage'
import { streamMessage } from '../api/anthropic'

const newId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`

interface StoreState {
  canvas: Canvas
  apiKey: string | null
  initCanvas: () => void
  setApiKey: (key: string) => void
  clearKey: () => void
  addUserMessage: (threadId: string, content: string) => string
  startAssistantMessage: (threadId: string) => string
  appendToMessage: (threadId: string, messageId: string, delta: string) => void
  failMessage: (threadId: string, messageId: string, error: string) => void
  branch: (parentThreadId: string, branchPointMessageId: string, quotedText?: string | null) => string
  moveThreadTo: (threadId: string, position: { x: number; y: number }) => void
  sendMessage: (threadId: string, content: string) => Promise<void>
  replaceCanvas: (canvas: Canvas) => void
}

// Persists to localStorage and updates state. Use for every mutating action
// EXCEPT the streaming accumulator and the assistant placeholder below.
//
// What reaches storage is filtered: a zero-length assistant message is dropped
// before the write. The in-memory canvas keeps it, so the placeholder still
// renders — but it can never be persisted, from this path or any other, and so
// can never come back after a reload to poison assembleContext. See
// withoutEmptyAssistantMessages for why that matters.
function commit(set: (partial: Partial<StoreState>) => void, canvas: Canvas) {
  saveCanvas(withoutEmptyAssistantMessages(canvas))
  set({ canvas })
}

// Updates state only, no localStorage write. Streaming tokens arrive many
// times per second via appendToMessage; persisting on every delta would mean
// a full JSON.stringify + synchronous localStorage write dozens of times a
// second, stuttering the UI as canvases grow. sendMessage persists once the
// stream terminates (onDone or onError) instead, so the accumulated content
// is still saved without paying that cost per token.
function commitLocal(set: (partial: Partial<StoreState>) => void, canvas: Canvas) {
  set({ canvas })
}

export const useStore = create<StoreState>((set, get) => ({
  canvas: emptyCanvas(newId('thread')),
  apiKey: loadApiKey(),

  initCanvas: () => {
    const loaded = loadCanvas()
    set({ canvas: loaded ?? emptyCanvas(newId('thread')), apiKey: loadApiKey() })
  },

  setApiKey: (key) => { saveApiKey(key); set({ apiKey: key }) },
  clearKey: () => { clearApiKey(); set({ apiKey: null }) },

  addUserMessage: (threadId, content) => {
    const id = newId('msg')
    commit(set, appendMessage(get().canvas, threadId, { id, role: 'user', content, createdAt: Date.now() }))
    return id
  },

  // Non-persisting on purpose. This writes the empty placeholder the streamed
  // tokens accumulate into; if the tab closed mid-stream while it was in
  // storage, the next send in that thread would 400 forever.
  startAssistantMessage: (threadId) => {
    const id = newId('msg')
    commitLocal(set, appendMessage(get().canvas, threadId, { id, role: 'assistant', content: '', createdAt: Date.now() }))
    return id
  },

  appendToMessage: (threadId, messageId, delta) => {
    const thread = getThread(get().canvas, threadId)
    const current = thread.messages.find((m) => m.id === messageId)?.content ?? ''
    commitLocal(set, replaceMessage(get().canvas, threadId, messageId, current + delta))
  },

  // Attaches the error beside the message rather than inside its content, so it
  // stays visible to the user without becoming assistant context on the next turn.
  failMessage: (threadId, messageId, error) => {
    commit(set, setMessageError(get().canvas, threadId, messageId, error))
  },

  branch: (parentThreadId, branchPointMessageId, quotedText = null) => {
    const id = newId('thread')
    const parent = getThread(get().canvas, parentThreadId)
    const position = { x: parent.position.x + 420, y: parent.position.y + 60 }
    commit(set, branchFromMessage(get().canvas, parentThreadId, branchPointMessageId, id, position, quotedText))
    return id
  },

  moveThreadTo: (threadId, position) => {
    commit(set, moveThread(get().canvas, threadId, position))
  },

  sendMessage: async (threadId, content) => {
    const { apiKey } = get()
    if (!apiKey) return
    get().addUserMessage(threadId, content)

    // Nothing awaits sendMessage — ThreadNode fires and forgets — so an escaping
    // throw becomes an unhandled rejection and the user just sees their message
    // sent with no reply and no explanation. Every failure, whether it comes
    // from assembleContext or from the stream, lands on the same visible path,
    // exactly once.
    let assistantId: string | null = null
    let settled = false
    const fail = (message: string) => {
      if (settled) return
      settled = true
      if (assistantId === null) assistantId = get().startAssistantMessage(threadId)
      get().failMessage(threadId, assistantId, message)
    }

    try {
      // Assemble BEFORE the placeholder exists, so the empty assistant message
      // is never part of the payload.
      const context = assembleContext(get().canvas, threadId)
      const id = get().startAssistantMessage(threadId)
      assistantId = id
      await streamMessage(
        { apiKey, messages: context },
        {
          onText: (delta) => get().appendToMessage(threadId, id, delta),
          onDone: () => {
            if (settled) return
            settled = true
            commit(set, get().canvas)
          },
          onError: fail,
        },
      )
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err))
    }
  },

  replaceCanvas: (canvas) => commit(set, canvas),
}))
