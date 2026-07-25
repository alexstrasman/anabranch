import { create } from 'zustand'
import type { Canvas } from '../domain/types'
import { emptyCanvas, appendMessage, replaceMessage, branchFromMessage, moveThread } from '../domain/thread'
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
  branch: (parentThreadId: string, branchPointMessageId: string, quotedText?: string | null) => string
  moveThreadTo: (threadId: string, position: { x: number; y: number }) => void
  sendMessage: (threadId: string, content: string) => Promise<void>
  replaceCanvas: (canvas: Canvas) => void
}

// Persists to localStorage and updates state. Use for every mutating action
// EXCEPT the streaming accumulator below.
function commit(set: (partial: Partial<StoreState>) => void, canvas: Canvas) {
  saveCanvas(canvas)
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

  startAssistantMessage: (threadId) => {
    const id = newId('msg')
    commit(set, appendMessage(get().canvas, threadId, { id, role: 'assistant', content: '', createdAt: Date.now() }))
    return id
  },

  appendToMessage: (threadId, messageId, delta) => {
    const thread = getThread(get().canvas, threadId)
    const current = thread.messages.find((m) => m.id === messageId)?.content ?? ''
    commitLocal(set, replaceMessage(get().canvas, threadId, messageId, current + delta))
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
    const context = assembleContext(get().canvas, threadId)
    const assistantId = get().startAssistantMessage(threadId)
    await streamMessage(
      { apiKey, messages: context },
      {
        onText: (delta) => get().appendToMessage(threadId, assistantId, delta),
        onDone: () => { commit(set, get().canvas) },
        onError: (message) => {
          get().appendToMessage(threadId, assistantId, `\n\n⚠️ ${message}`)
          commit(set, get().canvas)
        },
      },
    )
  },

  replaceCanvas: (canvas) => commit(set, canvas),
}))
