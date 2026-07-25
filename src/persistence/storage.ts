import type { Canvas } from '../domain/types'

const CANVAS_KEY = 'tangent:canvas:v1'
const API_KEY = 'tangent:apiKey'

export function saveCanvas(canvas: Canvas): void {
  localStorage.setItem(CANVAS_KEY, JSON.stringify(canvas))
}

export function loadCanvas(): Canvas | null {
  const raw = localStorage.getItem(CANVAS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Canvas
  } catch {
    return null
  }
}

export function saveApiKey(key: string): void {
  localStorage.setItem(API_KEY, key)
}

export function loadApiKey(): string | null {
  return localStorage.getItem(API_KEY)
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY)
}
