export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: number
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
export const MAX_TOKENS = 4096
