export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
  // A delivery failure that happened while producing THIS message — rate limit,
  // bad key, dropped connection. It rides alongside the message so the user can
  // see it, and is deliberately NOT part of `content`: assembleContext walks the
  // ancestor chain, so error text inside `content` would become genuine
  // assistant context on every later turn in the thread and every branch below
  // it. Optional so canvases written before this field load unchanged.
  error?: string
}

export interface Thread {
  id: string
  parentId: string | null            // null for the root thread
  branchPointMessageId: string | null // the message in the PARENT this branched from
  quotedText: string | null          // seeded text from a branch-from-selection
  title: string | null               // derived lazily (theme 4)
  collapsed: boolean                 // density chip state (theme 4)
  messages: Message[]
  position: { x: number; y: number } // canvas coordinates
}

export interface Canvas {
  version: number
  threads: Thread[]
}

export const CANVAS_VERSION = 1
export const DEFAULT_MODEL = 'claude-sonnet-5'  // Anthropic-only per scope; single constant, no abstraction

// max_tokens is a hard cap on TOTAL output. 4096 was tight even for a plain
// conversational reply, and would truncate a long one mid-sentence. 16384 is
// roughly a 12,000-word ceiling — far more than any thread-node turn needs,
// so it never binds in practice, while still bounding a runaway response.
// (claude-sonnet-5 allows up to 128k; we stream, so there is no HTTP-timeout
// reason to stay low, but a chat column has no use for that headroom.)
export const MAX_TOKENS = 16384
