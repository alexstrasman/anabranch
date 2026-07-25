export type StreamEvent =
  | { type: 'text'; text: string }
  | { type: 'error'; message: string }
  | { type: 'done' }

/** Parse a batch of complete SSE lines (data:/event:/blank/comment) into events. */
export function parseSSELines(lines: string[]): StreamEvent[] {
  const events: StreamEvent[] = []
  for (const line of lines) {
    if (!line.startsWith('data:')) continue
    const payload = line.slice('data:'.length).trim()
    if (!payload) continue
    let obj: any
    try {
      obj = JSON.parse(payload)
    } catch {
      continue
    }
    if (obj.type === 'content_block_delta' && obj.delta?.type === 'text_delta') {
      events.push({ type: 'text', text: obj.delta.text })
    } else if (obj.type === 'message_stop') {
      events.push({ type: 'done' })
    } else if (obj.type === 'error') {
      events.push({ type: 'error', message: obj.error?.message ?? 'Unknown error' })
    }
    // message_start / content_block_start / ping / etc. are ignored
  }
  return events
}
