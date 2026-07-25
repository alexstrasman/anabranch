import type { Message } from '../domain/types'
import { DEFAULT_MODEL, MAX_TOKENS } from '../domain/types'
import { parseSSELines } from './sse'
import { describeApiError } from './errors'

const ENDPOINT = 'https://api.anthropic.com/v1/messages'

export interface StreamHandlers {
  onText: (delta: string) => void
  onDone: () => void
  onError: (message: string) => void
}

export async function streamMessage(
  opts: { apiKey: string; messages: Message[]; model?: string; signal?: AbortSignal },
  handlers: StreamHandlers,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      signal: opts.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': opts.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        stream: true,
        messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    handlers.onError(describeApiError(0))
    return
  }

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => '')
    handlers.onError(describeApiError(response.status, body))
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n')
      buffer = parts.pop() ?? '' // keep the trailing partial line
      for (const event of parseSSELines(parts)) {
        if (event.type === 'text') handlers.onText(event.text)
        else if (event.type === 'error') { handlers.onError(event.message); return }
        else if (event.type === 'done') { handlers.onDone(); return }
      }
    }
    handlers.onDone()
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    handlers.onError(describeApiError(0))
  }
}
