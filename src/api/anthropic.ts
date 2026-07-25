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
        // Do NOT remove. On claude-sonnet-5, OMITTING `thinking` runs adaptive
        // thinking — a silent default change from Sonnet 4.6, which ran with
        // thinking off. Adaptive at the default `high` effort spends from the
        // same max_tokens budget as the visible reply, and thinking blocks
        // stream with empty text (display defaults to "omitted"), so the user
        // gets a long silent pause and then a truncated or empty answer.
        // Phase A is a plain chat/branching surface with no use for visible
        // reasoning, so we turn it off explicitly. `{type:'disabled'}` is
        // accepted on claude-sonnet-5.
        thinking: { type: 'disabled' },
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

  // Dispatch a batch of complete SSE lines.
  // 'terminal' — a done/error event fired; the caller must stop immediately and
  //              must not call any further handler (exactly-once contract).
  // 'events'   — only non-terminal events fired (text deltas).
  // 'none'     — the lines produced no events at all.
  const dispatch = (lines: string[]): 'terminal' | 'events' | 'none' => {
    const events = parseSSELines(lines)
    for (const event of events) {
      if (event.type === 'text') handlers.onText(event.text)
      else if (event.type === 'error') { handlers.onError(event.message); return 'terminal' }
      else if (event.type === 'done') { handlers.onDone(); return 'terminal' }
    }
    return events.length > 0 ? 'events' : 'none'
  }

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n')
      buffer = parts.pop() ?? '' // keep the trailing partial line
      if (dispatch(parts) === 'terminal') return
    }
    // The connection ended without a terminal event. Flush the decoder's held
    // multi-byte remainder, then the trailing partial line, before deciding.
    buffer += decoder.decode()
    if (buffer.trim()) {
      const result = dispatch([buffer])
      // dispatch already fired the single terminating handler.
      if (result === 'terminal') return
      // Leftover bytes that parsed into nothing: a half-written SSE frame.
      if (result === 'none') {
        handlers.onError('The response was cut off before it finished. Try sending it again.')
        return
      }
    }
    handlers.onDone()
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    handlers.onError(describeApiError(0))
  }
}
