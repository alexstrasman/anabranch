import type { Canvas, Thread } from '../domain/types'
import { CANVAS_VERSION } from '../domain/types'

/**
 * The single trust boundary for canvas data arriving from outside the running
 * app — an imported JSON file, or whatever localStorage happens to hold after a
 * bad write, a hand-edit, or a version skew.
 *
 * Throws with a human-readable reason. Callers decide what to do with it:
 * importCanvas surfaces the message to the user; loadCanvas swallows it and
 * returns null so a corrupt stored canvas degrades to a fresh empty one rather
 * than a white screen.
 */
export function validateCanvas(parsed: unknown): Canvas {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid canvas: not an object')
  }
  const candidate = parsed as Record<string, unknown>
  if (candidate.version !== CANVAS_VERSION) {
    throw new Error(`Unsupported canvas version: ${String(candidate.version)}`)
  }
  if (!Array.isArray(candidate.threads)) {
    throw new Error('Invalid canvas: threads must be an array')
  }
  candidate.threads.forEach(validateThread)
  return parsed as Canvas
}

function validateThread(t: unknown): asserts t is Thread {
  const o = t as Record<string, unknown>
  const ok =
    o &&
    typeof o.id === 'string' &&
    (o.parentId === null || typeof o.parentId === 'string') &&
    (o.branchPointMessageId === null || typeof o.branchPointMessageId === 'string') &&
    (o.quotedText === null || typeof o.quotedText === 'string') &&
    (o.title === null || typeof o.title === 'string') &&
    typeof o.collapsed === 'boolean' &&
    Array.isArray(o.messages) &&
    typeof o.position === 'object' && o.position !== null
  if (!ok) throw new Error(`Invalid thread: ${JSON.stringify(t)}`)
}
