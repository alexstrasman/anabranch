import type { Canvas, Message, Thread } from './types'
import { CANVAS_VERSION } from './types'

export function emptyCanvas(rootId: string, position = { x: 0, y: 0 }): Canvas {
  return {
    version: CANVAS_VERSION,
    threads: [{
      id: rootId, parentId: null, branchPointMessageId: null,
      quotedText: null, title: null, collapsed: false,
      messages: [], position,
    }],
  }
}

function mapThread(canvas: Canvas, id: string, fn: (t: Thread) => Thread): Canvas {
  return { ...canvas, threads: canvas.threads.map((t) => (t.id === id ? fn(t) : t)) }
}

export function appendMessage(canvas: Canvas, threadId: string, message: Message): Canvas {
  return mapThread(canvas, threadId, (t) => ({ ...t, messages: [...t.messages, message] }))
}

export function replaceMessage(
  canvas: Canvas, threadId: string, messageId: string, content: string,
): Canvas {
  return mapThread(canvas, threadId, (t) => ({
    ...t,
    messages: t.messages.map((msg) => (msg.id === messageId ? { ...msg, content } : msg)),
  }))
}

/** Attaches a delivery error to a message without touching its `content`. */
export function setMessageError(
  canvas: Canvas, threadId: string, messageId: string, error: string,
): Canvas {
  return mapThread(canvas, threadId, (t) => ({
    ...t,
    messages: t.messages.map((msg) => (msg.id === messageId ? { ...msg, error } : msg)),
  }))
}

export function branchFromMessage(
  canvas: Canvas,
  parentThreadId: string,
  branchPointMessageId: string,
  newThreadId: string,
  position: { x: number; y: number },
  quotedText: string | null = null,
): Canvas {
  const child: Thread = {
    id: newThreadId, parentId: parentThreadId, branchPointMessageId,
    quotedText, title: null, collapsed: false, messages: [], position,
  }
  return { ...canvas, threads: [...canvas.threads, child] }
}

/**
 * Strips assistant messages with zero-length content.
 *
 * A persisted `{role:'assistant', content:''}` is not cosmetic — the Anthropic
 * API rejects a mid-conversation message with empty content (400: all messages
 * must have non-empty content except the optional final assistant message), so
 * assembleContext would produce a payload that fails on every subsequent send
 * in that thread. Phase A has no delete-message affordance, so the thread —
 * and if it is the root, the whole canvas — would be unusable forever.
 *
 * Applied on the way to storage only. In memory the empty placeholder must
 * survive so the user sees the assistant turn appear the moment they hit send.
 */
export function withoutEmptyAssistantMessages(canvas: Canvas): Canvas {
  return {
    ...canvas,
    threads: canvas.threads.map((t) => ({
      ...t,
      messages: t.messages.filter((m) => !(m.role === 'assistant' && m.content.length === 0)),
    })),
  }
}

export function moveThread(
  canvas: Canvas, threadId: string, position: { x: number; y: number },
): Canvas {
  return mapThread(canvas, threadId, (t) => ({ ...t, position }))
}
