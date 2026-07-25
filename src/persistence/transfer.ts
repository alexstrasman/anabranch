import type { Canvas } from '../domain/types'
import { validateCanvas } from './validate'

export function exportCanvas(canvas: Canvas): string {
  return JSON.stringify(canvas, null, 2)
}

/**
 * Throws on anything that isn't a canvas we can render — the user picked this
 * file, so they get to hear why it was rejected.
 */
export function importCanvas(json: string): Canvas {
  return validateCanvas(JSON.parse(json))
}
