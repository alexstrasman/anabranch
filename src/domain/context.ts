import type { Canvas, Message, Thread } from './types'

export function getThread(canvas: Canvas, id: string): Thread {
  const t = canvas.threads.find((t) => t.id === id)
  if (!t) throw new Error(`Thread not found: ${id}`)
  return t
}

/** Root-first chain from the root thread down to (and including) `threadId`. */
export function ancestorChain(canvas: Canvas, threadId: string): Thread[] {
  const chain: Thread[] = []
  let current: Thread | null = getThread(canvas, threadId)
  while (current) {
    chain.unshift(current)
    current = current.parentId ? getThread(canvas, current.parentId) : null
  }
  return chain
}

/**
 * The messages to send to the model for `threadId`:
 * every ancestor's messages truncated at the branch point its child sprang from,
 * concatenated root-first, then the thread's own messages.
 */
export function assembleContext(canvas: Canvas, threadId: string): Message[] {
  const chain = ancestorChain(canvas, threadId)
  const result: Message[] = []
  for (let i = 0; i < chain.length; i++) {
    const thread = chain[i]
    if (i === chain.length - 1) {
      result.push(...thread.messages)
      continue
    }
    const branchPoint = chain[i + 1].branchPointMessageId
    const idx = thread.messages.findIndex((m) => m.id === branchPoint)
    if (idx === -1) {
      throw new Error(`Branch point ${branchPoint} not found in thread ${thread.id}`)
    }
    result.push(...thread.messages.slice(0, idx + 1))
  }
  return result
}
