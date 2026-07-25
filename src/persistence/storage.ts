import type { Canvas } from '../domain/types'
import { validateCanvas } from './validate'

const CANVAS_KEY = 'anabranch:canvas:v1'
const API_KEY = 'anabranch:apiKey'

// localStorage.setItem throws on quota exhaustion and in Safari private
// browsing, where the whole store is unavailable. The first canvas write
// happens inside sendMessage, so an escaping throw would kill the send path
// before the request was ever made. Persistence is best-effort: if it fails,
// the in-memory canvas stays usable for the session and we say so once in the
// console. No retry, no quota estimation, no storage-full UI — those are a
// later theme's problem.
function writeItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch (err) {
    console.warn(`Anabranch: could not persist "${key}" — continuing in memory only.`, err)
  }
}

export function saveCanvas(canvas: Canvas): void {
  writeItem(CANVAS_KEY, JSON.stringify(canvas))
}

/**
 * Never throws. A stored value that is missing, unparseable, or well-formed
 * JSON of the wrong shape all return null, so the app boots to a fresh empty
 * canvas instead of a permanent white screen.
 */
export function loadCanvas(): Canvas | null {
  try {
    // getItem is inside the try too: some browsers make localStorage itself
    // throw on access (Safari private browsing, storage disabled by policy).
    // This function must never throw — initCanvas has no other fallback.
    const raw = localStorage.getItem(CANVAS_KEY)
    if (!raw) return null
    return validateCanvas(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveApiKey(key: string): void {
  writeItem(API_KEY, key)
}

export function loadApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY)
  } catch {
    return null
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(API_KEY)
  } catch {
    // Nothing to do: the caller has already dropped the key from memory.
  }
}
