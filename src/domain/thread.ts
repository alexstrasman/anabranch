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

export function moveThread(
  canvas: Canvas, threadId: string, position: { x: number; y: number },
): Canvas {
  return mapThread(canvas, threadId, (t) => ({ ...t, position }))
}
