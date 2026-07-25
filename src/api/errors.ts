export function describeApiError(status: number, body?: string): string {
  switch (true) {
    case status === 0:
      return 'Network error — could not reach Anthropic. Check your connection.'
    case status === 401:
      return 'That API key was rejected. Check the key and try again.'
    case status === 429:
      return 'Rate limit hit. Wait a moment and retry.'
    case status >= 500:
      return 'Anthropic is temporarily unavailable (overloaded or erroring). Try again shortly.'
    default:
      return `Request failed (${status}).${body ? ` ${body}` : ''}`
  }
}
