# Anabranch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Anabranch — a client-only web app where an AI conversation lives on an infinite canvas as a graph of thread-nodes, with any message branchable into a new thread — walking-skeleton-first, then deepened over six themed weeks.

**Architecture:** A static React/Vite/TypeScript SPA. React Flow (`@xyflow/react`) supplies canvas mechanics (pan, zoom, nodes, edges). All conversation logic lives in a pure, framework-free `domain/` layer (the only genuinely algorithmic piece is context assembly — a walk up the branch tree). A thin zustand store wires the pure layer to React and to persistence. The Anthropic API is called browser-direct with streaming; there is no server and no database.

**Tech Stack:** React 18, Vite 5, TypeScript 5, `@xyflow/react` (React Flow 12), zustand, **Tailwind (v4) + shadcn/ui** for the component/chrome layer and design tokens, Vitest + happy-dom for the unit tests the spec mandates. Deployed on Vercel.

**On shadcn/ui:** shadcn is not a runtime dependency — its components are copied into `src/components/ui/` as plain React + Tailwind + Radix, owned and edited in-repo. Its CSS-variable theming *is* the design-token system, which is why Theme 1 ("the system underneath") becomes *customising* that token layer into Anabranch's own rather than hand-rolling one from scratch. shadcn covers the **chrome around the canvas** (composer, key entry, toolbar, model selector, alerts, chips); the canvas surface and the thread-node body stay hand-built on React Flow.

**Sequencing:** Tailwind + shadcn are installed in the scaffold (Task 1) so the tooling and the token layer exist from day one and nothing has to be retrofitted. The Phase A skeleton stays deliberately plain — "ugly is acceptable" — and may use raw controls where that is faster. Theme 1 (Tasks 14–15) is where the chrome is formalised onto shadcn primitives and the tokens are tuned into Anabranch's own system; that default-shadcn → Anabranch-system shift is exactly the theme's before/after.

## Global Constraints

Copied verbatim from the spec (`docs/spec.md`). Every task's requirements implicitly include this section.

- **Client-only static app.** React, Vite, TypeScript. React Flow (`@xyflow/react`) does canvas mechanics. Deployed on Vercel. "There is no server and no database."
- **Bring-your-own-API-key.** No auth, no accounts, no cloud sync, no collaboration, no mobile.
- **The key path.** "The Anthropic API key is entered once, stored in localStorage, and sent directly from the browser to the Anthropic API (the CORS path Anthropic supports via the `anthropic-dangerous-direct-browser-access` header), with streaming responses." The UI must say plainly: "your key never leaves your browser except to go to Anthropic."
- **Anthropic-only for v1.** "A provider abstraction is exactly the speculative plumbing the scope contract exists to kill." No provider abstraction layer. **Note the distinction:** *multi-provider* support (OpenAI, local models, an abstraction layer) is the permanent non-goal. A *model selector among Anthropic models* (Opus / Sonnet / Haiku) is a different thing and is compatible with the wall — it is deferred to post-v1 (see `LATER.md`), and the build leaves a one-line hook for it (`streamMessage` takes an optional `model` defaulting to `DEFAULT_MODEL`) rather than a hardcoded value buried in the client.
- **Persistence.** localStorage so canvases survive refresh, plus export and import as JSON. "That is the whole data story."
- **A node is a thread, not a message.** Each node is a compact, scrollable column of messages with its own composer.
- **Branch context = the ancestor chain.** "Every message from the root down to and including the branch point." Branch-from-selection additionally seeds the new thread with the selection quoted.
- **Non-goals, permanent for this artifact:** auth, accounts, cloud sync, collaboration, mobile, multi-provider support, MCP or tool use, monetization.
- **Testing.** Unit tests cover exactly two things: context assembly (the tree walk) and the persistence + import/export round trip. "Everything else is manual, in-browser, and filmed." This plan honors that boundary: pure logic is built strict-TDD; UI/interaction tasks use a build-then-manually-verify-in-browser cycle.
- **Licensing/home.** MIT licensed, its own public repo from day one.
- **The skeleton gate.** A walking skeleton is publicly live at a real URL by hour 10–15. "If the skeleton slips past hour 20, cut scope, not the gate."

## Testing Philosophy For This Plan

The spec draws a hard line, so this plan does too:

- **Strict TDD (failing test first) for the pure `domain/`, `persistence/`, and `api/` logic** — context assembly, thread operations, storage, import/export round trip, SSE parsing, error mapping, layout, title derivation. These are the places "a subtle bug produces silently wrong AI answers" or silently trashes a user's canvas.
- **Build-then-verify for UI/interaction tasks.** The "test" step is a written, specific manual check performed in the browser (and, per the spec, filmed). No React component rendering tests — the spec explicitly routes that effort into filmed manual verification instead.

Every UI task lists its manual verification as concrete, observable steps so a reviewer can reject it on evidence.

## File Structure

```
anabranch/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts               # vite + vitest config in one (shared `@` alias)
├── components.json              # shadcn/ui config
├── vercel.json
├── LICENSE                      # MIT
├── README.md
├── LATER.md                     # the parking lot the spec mandates
├── docs/
│   └── spec.md                  # already committed — source of truth
└── src/
    ├── main.tsx                 # React entry
    ├── App.tsx                  # top-level layout, gate, canvas mount
    ├── index.css                # Tailwind entry + shadcn CSS-var tokens (Theme 1 tunes this)
    ├── lib/
    │   └── utils.ts             # cn() helper (shadcn)
    ├── components/
    │   └── ui/                  # shadcn primitives, copied in (button, textarea, input, card, alert, badge, select…)
    ├── domain/
    │   ├── types.ts             # Message, Thread, Canvas, Role (the shared vocabulary)
    │   ├── context.ts           # ancestorChain, assembleContext  ← the algorithmic core
    │   ├── thread.ts            # emptyCanvas, appendMessage, branchFromMessage, replaceMessage
    │   ├── title.ts             # deriveTitle (theme 4)
    │   └── layout.ts            # tidyLayout (theme 4)
    ├── persistence/
    │   ├── storage.ts           # saveCanvas/loadCanvas, save/load/clearApiKey
    │   └── transfer.ts          # exportCanvas, importCanvas (validated round trip)
    ├── api/
    │   ├── sse.ts               # parseSSELines (pure SSE→events)
    │   ├── errors.ts            # describeApiError (status→human message)
    │   └── anthropic.ts         # streamMessage (fetch + streaming)
    ├── state/
    │   └── store.ts             # zustand store: wires domain + persistence + api
    ├── canvas/
    │   ├── CanvasView.tsx       # <ReactFlow> host, pan/zoom, minimap, fit-view
    │   └── ThreadNode.tsx       # a thread-node: message column + composer
    └── components/
        ├── KeyEntry.tsx         # first-run key entry (designed moment in theme 3)
        ├── Composer.tsx         # textarea + send
        ├── MessageView.tsx      # one message; owns selection→branch (theme 2)
        └── Toolbar.tsx          # export/import/sample buttons (theme 6)
```

Files that change together live together: all pure conversation logic under `domain/`, all browser-storage under `persistence/`, all network under `api/`. The store is the single seam between pure logic and React.

## Shared Vocabulary (defined in Task 2, referenced everywhere)

```typescript
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
```

---

# PHASE A — Walking Skeleton (live by hour 10–15)

> Ugly is acceptable; working is not negotiable. Phase A ends with a real URL that can send, stream, receive, branch, persist, pan and zoom. Deliverable of Task 12 is the skeleton gate.

---

### Task 1: Project scaffold and test harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts` (Vite + Vitest in one), `index.html`, `src/main.tsx`, `src/App.tsx`, `.gitignore`, `LICENSE`, plus the shadcn scaffold: `src/index.css`, `src/lib/utils.ts`, `components.json`, `src/components/ui/*`
- Test: `src/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm run dev`, `npm run build`, `npm test`. No app types yet.

- [ ] **Step 1: Write the failing test**

`src/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('toolchain', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `vitest: command not found` / no config (dependencies not installed yet).

- [ ] **Step 3: Create the scaffold**

`package.json`:
```json
{
  "name": "anabranch",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@xyflow/react": "^12.3.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.460.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.5.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "happy-dom": "^15.0.0",
    "tailwindcss": "^4.0.0",
    "tw-animate-css": "^1.0.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

> The `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`, and `tw-animate-css` packages are shadcn/ui's peer requirements (Tailwind v4). `npx shadcn@latest add <component>` in Step 3b copies each primitive's source into `src/components/ui/` — it does not add them as opaque dependencies.

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

`vite.config.ts` (Vite + Vitest in one file so the `@` alias is shared by both the app and the tests; there is no separate `vitest.config.ts`):
```typescript
/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'happy-dom' },
})
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Anabranch</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/App.tsx`:
```tsx
export default function App() {
  return <div>Anabranch</div>
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`.gitignore`:
```
node_modules
dist
.vercel
*.local
.DS_Store
```

`LICENSE`: the standard MIT license text, copyright "2026 Alex Strasman".

- [ ] **Step 3b: Initialise Tailwind + shadcn/ui**

Create `src/index.css` as the Tailwind v4 entry with shadcn's CSS-variable token layer. This is the file Theme 1 will customise — for the skeleton, shadcn's defaults are fine ("ugly is acceptable"):
```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --destructive: oklch(0.577 0.245 27.325);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --destructive: oklch(0.704 0.191 22.216);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-destructive: var(--destructive);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}

@layer base {
  * { border-color: var(--color-border); }
  body { background: var(--color-background); color: var(--color-foreground); }
}
```

Create `src/lib/utils.ts` (shadcn's `cn` helper):
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Create `components.json` (shadcn config, no-RSC Vite preset):
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui" }
}
```

Add the primitives the plan uses (copies their source into `src/components/ui/`):
```bash
npx shadcn@latest add button textarea input card alert badge select dropdown-menu tooltip
```
Apply the dark theme by adding `class="dark"` to `<html>` in `index.html` (Anabranch ships dark; Theme 1 refines the palette).

- [ ] **Step 4: Install and verify the test passes**

Run: `npm install && npm test`
Expected: PASS — 1 test.

- [ ] **Step 5: Verify build works**

Run: `npm run build`
Expected: exits 0, produces `dist/`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite + react + ts + vitest + tailwind + shadcn"
```

---

### Task 2: Domain types and context assembly (the algorithmic core)

This is the one place the spec says "a subtle bug produces silently wrong AI answers." It gets the most thorough tests in the plan.

**Files:**
- Create: `src/domain/types.ts`, `src/domain/context.ts`
- Test: `src/domain/context.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `types.ts`: `Role`, `Message`, `Thread`, `Canvas`, `CANVAS_VERSION`, `DEFAULT_MODEL`, `MAX_TOKENS` (as in Shared Vocabulary above).
  - `context.ts`: `getThread(canvas, id): Thread`, `ancestorChain(canvas, threadId): Thread[]` (root-first), `assembleContext(canvas, threadId): Message[]`.

- [ ] **Step 1: Create the types file**

`src/domain/types.ts`: exactly the Shared Vocabulary block above.

- [ ] **Step 2: Write the failing tests**

`src/domain/context.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import type { Canvas, Message } from './types'
import { ancestorChain, assembleContext } from './context'

function msg(id: string, role: 'user' | 'assistant', content: string): Message {
  return { id, role, content, createdAt: 0 }
}

// root: u1,a1,u2,a2 ; branch B off a1 (message id 'a1'): u3,a3 ; branch C off u3
const canvas: Canvas = {
  version: 1,
  threads: [
    { id: 'root', parentId: null, branchPointMessageId: null, quotedText: null,
      title: null, collapsed: false, position: { x: 0, y: 0 },
      messages: [msg('u1','user','one'), msg('a1','assistant','two'),
                 msg('u2','user','three'), msg('a2','assistant','four')] },
    { id: 'B', parentId: 'root', branchPointMessageId: 'a1', quotedText: null,
      title: null, collapsed: false, position: { x: 0, y: 0 },
      messages: [msg('u3','user','five'), msg('a3','assistant','six')] },
    { id: 'C', parentId: 'B', branchPointMessageId: 'u3', quotedText: null,
      title: null, collapsed: false, position: { x: 0, y: 0 },
      messages: [msg('u4','user','seven')] },
  ],
}

describe('ancestorChain', () => {
  it('returns [root] for the root thread', () => {
    expect(ancestorChain(canvas, 'root').map(t => t.id)).toEqual(['root'])
  })
  it('returns root-first chain for a deep branch', () => {
    expect(ancestorChain(canvas, 'C').map(t => t.id)).toEqual(['root', 'B', 'C'])
  })
})

describe('assembleContext', () => {
  it('is just the thread messages for the root', () => {
    expect(assembleContext(canvas, 'root').map(m => m.id))
      .toEqual(['u1', 'a1', 'u2', 'a2'])
  })
  it('includes parent messages up to and including the branch point, then own', () => {
    // B branched off a1, so root contributes u1,a1 (NOT u2,a2), then B's own
    expect(assembleContext(canvas, 'B').map(m => m.id))
      .toEqual(['u1', 'a1', 'u3', 'a3'])
  })
  it('walks multiple levels, truncating each parent at its child branch point', () => {
    // C branched off u3 in B; B branched off a1 in root
    expect(assembleContext(canvas, 'C').map(m => m.id))
      .toEqual(['u1', 'a1', 'u3', 'u4'])
  })
  it('throws if a branch point message is missing from the parent', () => {
    const broken: Canvas = { version: 1, threads: [
      canvas.threads[0],
      { ...canvas.threads[1], branchPointMessageId: 'nope' },
    ] }
    expect(() => assembleContext(broken, 'B')).toThrow(/branch point/i)
  })
  it('throws if the thread id does not exist', () => {
    expect(() => assembleContext(canvas, 'ghost')).toThrow(/not found/i)
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- context`
Expected: FAIL — `assembleContext` / `ancestorChain` not exported.

- [ ] **Step 4: Implement `src/domain/context.ts`**

```typescript
import type { Canvas, Message, Thread } from './types'

export function getThread(canvas: Canvas, id: string): Thread {
  const t = canvas.threads.find((t) => t.id === id)
  if (!t) throw new Error(`Thread not found: ${id}`)
  return t
}

/** Root-first chain from the root thread down to (and including) `threadId`. */
export function ancestorChain(canvas: Canvas, threadId: string): Thread[] {
  const chain: Thread[] = []
  let current: Thread | null = getThread(canvas, threadId)
  while (current) {
    chain.unshift(current)
    current = current.parentId ? getThread(canvas, current.parentId) : null
  }
  return chain
}

/**
 * The messages to send to the model for `threadId`:
 * every ancestor's messages truncated at the branch point its child sprang from,
 * concatenated root-first, then the thread's own messages.
 */
export function assembleContext(canvas: Canvas, threadId: string): Message[] {
  const chain = ancestorChain(canvas, threadId)
  const result: Message[] = []
  for (let i = 0; i < chain.length; i++) {
    const thread = chain[i]
    if (i === chain.length - 1) {
      result.push(...thread.messages)
      continue
    }
    const branchPoint = chain[i + 1].branchPointMessageId
    const idx = thread.messages.findIndex((m) => m.id === branchPoint)
    if (idx === -1) {
      throw new Error(`Branch point ${branchPoint} not found in thread ${thread.id}`)
    }
    result.push(...thread.messages.slice(0, idx + 1))
  }
  return result
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- context`
Expected: PASS — all 7 assertions.

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/domain/context.ts src/domain/context.test.ts
git commit -m "feat: domain types and context assembly (tree walk) with tests"
```

---

### Task 3: Pure thread operations

**Files:**
- Create: `src/domain/thread.ts`
- Test: `src/domain/thread.test.ts`

**Interfaces:**
- Consumes: `Canvas`, `Thread`, `Message`, `CANVAS_VERSION` from `types.ts`.
- Produces (all pure, immutable, ids passed in by caller so tests are deterministic):
  - `emptyCanvas(rootId: string, position?: {x,y}): Canvas`
  - `appendMessage(canvas: Canvas, threadId: string, message: Message): Canvas`
  - `replaceMessage(canvas: Canvas, threadId: string, messageId: string, content: string): Canvas` (for updating the streaming assistant message in place)
  - `branchFromMessage(canvas, parentThreadId, branchPointMessageId, newThreadId, position, quotedText?): Canvas`
  - `moveThread(canvas, threadId, position): Canvas`

- [ ] **Step 1: Write the failing tests**

`src/domain/thread.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import type { Message } from './types'
import { emptyCanvas, appendMessage, replaceMessage, branchFromMessage, moveThread } from './thread'

const m = (id: string, content: string): Message => ({ id, role: 'user', content, createdAt: 0 })

describe('emptyCanvas', () => {
  it('creates one empty root thread', () => {
    const c = emptyCanvas('root')
    expect(c.version).toBe(1)
    expect(c.threads).toHaveLength(1)
    expect(c.threads[0]).toMatchObject({ id: 'root', parentId: null, messages: [] })
  })
})

describe('appendMessage', () => {
  it('adds a message without mutating the input', () => {
    const c = emptyCanvas('root')
    const c2 = appendMessage(c, 'root', m('u1', 'hi'))
    expect(c.threads[0].messages).toHaveLength(0) // original untouched
    expect(c2.threads[0].messages.map((x) => x.id)).toEqual(['u1'])
  })
})

describe('replaceMessage', () => {
  it('updates content of an existing message in place', () => {
    let c = emptyCanvas('root')
    c = appendMessage(c, 'root', { id: 'a1', role: 'assistant', content: '', createdAt: 0 })
    c = replaceMessage(c, 'root', 'a1', 'streamed text')
    expect(c.threads[0].messages[0].content).toBe('streamed text')
  })
})

describe('branchFromMessage', () => {
  it('adds a child thread wired to the branch point', () => {
    let c = emptyCanvas('root')
    c = appendMessage(c, 'root', m('a1', 'answer'))
    c = branchFromMessage(c, 'root', 'a1', 'B', { x: 400, y: 0 }, 'quoted bit')
    const b = c.threads.find((t) => t.id === 'B')!
    expect(b).toMatchObject({
      parentId: 'root', branchPointMessageId: 'a1',
      quotedText: 'quoted bit', messages: [], position: { x: 400, y: 0 },
    })
  })
})

describe('moveThread', () => {
  it('updates only the target position', () => {
    const c = moveThread(emptyCanvas('root'), 'root', { x: 10, y: 20 })
    expect(c.threads[0].position).toEqual({ x: 10, y: 20 })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- thread`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/domain/thread.ts`**

```typescript
import type { Canvas, Message, Thread } from './types'
import { CANVAS_VERSION } from './types'

export function emptyCanvas(rootId: string, position = { x: 0, y: 0 }): Canvas {
  return {
    version: CANVAS_VERSION,
    threads: [{
      id: rootId, parentId: null, branchPointMessageId: null,
      quotedText: null, title: null, collapsed: false,
      messages: [], position,
    }],
  }
}

function mapThread(canvas: Canvas, id: string, fn: (t: Thread) => Thread): Canvas {
  return { ...canvas, threads: canvas.threads.map((t) => (t.id === id ? fn(t) : t)) }
}

export function appendMessage(canvas: Canvas, threadId: string, message: Message): Canvas {
  return mapThread(canvas, threadId, (t) => ({ ...t, messages: [...t.messages, message] }))
}

export function replaceMessage(
  canvas: Canvas, threadId: string, messageId: string, content: string,
): Canvas {
  return mapThread(canvas, threadId, (t) => ({
    ...t,
    messages: t.messages.map((msg) => (msg.id === messageId ? { ...msg, content } : msg)),
  }))
}

export function branchFromMessage(
  canvas: Canvas,
  parentThreadId: string,
  branchPointMessageId: string,
  newThreadId: string,
  position: { x: number; y: number },
  quotedText: string | null = null,
): Canvas {
  const child: Thread = {
    id: newThreadId, parentId: parentThreadId, branchPointMessageId,
    quotedText, title: null, collapsed: false, messages: [], position,
  }
  return { ...canvas, threads: [...canvas.threads, child] }
}

export function moveThread(
  canvas: Canvas, threadId: string, position: { x: number; y: number },
): Canvas {
  return mapThread(canvas, threadId, (t) => ({ ...t, position }))
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- thread`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/thread.ts src/domain/thread.test.ts
git commit -m "feat: pure immutable thread operations with tests"
```

---

### Task 4: Persistence (localStorage)

**Files:**
- Create: `src/persistence/storage.ts`
- Test: `src/persistence/storage.test.ts`

**Interfaces:**
- Consumes: `Canvas` from `types.ts`.
- Produces: `saveCanvas(canvas)`, `loadCanvas(): Canvas | null`, `saveApiKey(key)`, `loadApiKey(): string | null`, `clearApiKey()`.

- [ ] **Step 1: Write the failing tests**

`src/persistence/storage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { emptyCanvas } from '../domain/thread'
import { saveCanvas, loadCanvas, saveApiKey, loadApiKey, clearApiKey } from './storage'

beforeEach(() => localStorage.clear())

describe('canvas persistence', () => {
  it('round-trips a canvas through localStorage', () => {
    const c = emptyCanvas('root')
    saveCanvas(c)
    expect(loadCanvas()).toEqual(c)
  })
  it('returns null when nothing is stored', () => {
    expect(loadCanvas()).toBeNull()
  })
  it('returns null (does not throw) on corrupt data', () => {
    localStorage.setItem('anabranch:canvas:v1', '{not json')
    expect(loadCanvas()).toBeNull()
  })
})

describe('api key persistence', () => {
  it('saves, loads, and clears the key', () => {
    saveApiKey('sk-ant-123')
    expect(loadApiKey()).toBe('sk-ant-123')
    clearApiKey()
    expect(loadApiKey()).toBeNull()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- storage`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/persistence/storage.ts`**

```typescript
import type { Canvas } from '../domain/types'

const CANVAS_KEY = 'anabranch:canvas:v1'
const API_KEY = 'anabranch:apiKey'

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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- storage`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/persistence/storage.ts src/persistence/storage.test.ts
git commit -m "feat: localStorage persistence for canvas and api key"
```

---

### Task 5: Import/export round trip

**Files:**
- Create: `src/persistence/transfer.ts`
- Test: `src/persistence/transfer.test.ts`

**Interfaces:**
- Consumes: `Canvas`, `CANVAS_VERSION` from `types.ts`.
- Produces: `exportCanvas(canvas): string`, `importCanvas(json: string): Canvas` (throws on invalid/unversioned input).

- [ ] **Step 1: Write the failing tests**

`src/persistence/transfer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { emptyCanvas, appendMessage, branchFromMessage } from '../domain/thread'
import { exportCanvas, importCanvas } from './transfer'

function sample() {
  let c = emptyCanvas('root')
  c = appendMessage(c, 'root', { id: 'a1', role: 'assistant', content: 'hi', createdAt: 1 })
  c = branchFromMessage(c, 'root', 'a1', 'B', { x: 400, y: 0 }, 'quote')
  return c
}

describe('import/export round trip', () => {
  it('exports then imports to a deep-equal canvas', () => {
    const c = sample()
    expect(importCanvas(exportCanvas(c))).toEqual(c)
  })
  it('rejects non-JSON', () => {
    expect(() => importCanvas('{nope')).toThrow()
  })
  it('rejects a missing/unknown version', () => {
    expect(() => importCanvas(JSON.stringify({ version: 99, threads: [] }))).toThrow(/version/i)
  })
  it('rejects a canvas without a threads array', () => {
    expect(() => importCanvas(JSON.stringify({ version: 1 }))).toThrow(/threads/i)
  })
  it('rejects a thread missing required fields', () => {
    const bad = { version: 1, threads: [{ id: 'x' }] }
    expect(() => importCanvas(JSON.stringify(bad))).toThrow()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- transfer`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/persistence/transfer.ts`**

```typescript
import type { Canvas, Thread } from '../domain/types'
import { CANVAS_VERSION } from '../domain/types'

export function exportCanvas(canvas: Canvas): string {
  return JSON.stringify(canvas, null, 2)
}

export function importCanvas(json: string): Canvas {
  const parsed = JSON.parse(json) as unknown
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- transfer`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/persistence/transfer.ts src/persistence/transfer.test.ts
git commit -m "feat: validated JSON import/export round trip"
```

---

### Task 6: Anthropic SSE parsing (pure) + error mapping

The streaming network call itself (`anthropic.ts`) isn't unit-tested — its logic is factored into two pure, tested helpers so the un-tested part is a thin fetch wrapper.

**Files:**
- Create: `src/api/sse.ts`, `src/api/errors.ts`
- Test: `src/api/sse.test.ts`, `src/api/errors.test.ts`

**Interfaces:**
- Produces:
  - `sse.ts`: `type StreamEvent = { type: 'text'; text: string } | { type: 'error'; message: string } | { type: 'done' }`; `parseSSELines(lines: string[]): StreamEvent[]`.
  - `errors.ts`: `describeApiError(status: number, body?: string): string`.

- [ ] **Step 1: Write the failing tests**

`src/api/sse.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { parseSSELines } from './sse'

describe('parseSSELines', () => {
  it('extracts text deltas from content_block_delta events', () => {
    const lines = [
      'event: content_block_delta',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hel"}}',
      '',
      'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"lo"}}',
      '',
    ]
    expect(parseSSELines(lines)).toEqual([
      { type: 'text', text: 'Hel' },
      { type: 'text', text: 'lo' },
    ])
  })
  it('emits a done event on message_stop', () => {
    const lines = ['data: {"type":"message_stop"}', '']
    expect(parseSSELines(lines)).toEqual([{ type: 'done' }])
  })
  it('emits an error event on an error payload', () => {
    const lines = ['data: {"type":"error","error":{"message":"overloaded"}}', '']
    expect(parseSSELines(lines)).toEqual([{ type: 'error', message: 'overloaded' }])
  })
  it('ignores ping and unrecognized events', () => {
    expect(parseSSELines(['data: {"type":"ping"}', ''])).toEqual([])
  })
  it('ignores non-data lines', () => {
    expect(parseSSELines(['event: message_start', ':heartbeat'])).toEqual([])
  })
})
```

`src/api/errors.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { describeApiError } from './errors'

describe('describeApiError', () => {
  it('maps 401 to an invalid-key message', () => {
    expect(describeApiError(401)).toMatch(/key/i)
  })
  it('maps 429 to a rate-limit message', () => {
    expect(describeApiError(429)).toMatch(/rate limit/i)
  })
  it('maps 0 (no response) to a network message', () => {
    expect(describeApiError(0)).toMatch(/network/i)
  })
  it('maps 5xx to an Anthropic-side message', () => {
    expect(describeApiError(529)).toMatch(/anthropic|overloaded|temporar/i)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- api`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `src/api/sse.ts`**

```typescript
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
```

- [ ] **Step 4: Implement `src/api/errors.ts`**

```typescript
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- api`
Expected: PASS — all assertions in both files.

- [ ] **Step 6: Commit**

```bash
git add src/api/sse.ts src/api/errors.ts src/api/sse.test.ts src/api/errors.test.ts
git commit -m "feat: pure SSE parsing and API error mapping with tests"
```

---

### Task 7: Anthropic streaming client

Thin fetch wrapper over the tested helpers. Verified via a live call in Task 10 (build-then-verify), not a unit test — it is pure I/O.

**Files:**
- Create: `src/api/anthropic.ts`

**Interfaces:**
- Consumes: `Message`, `DEFAULT_MODEL`, `MAX_TOKENS` from `types.ts`; `parseSSELines` from `sse.ts`; `describeApiError` from `errors.ts`.
- Produces:
  ```typescript
  interface StreamHandlers {
    onText: (delta: string) => void
    onDone: () => void
    onError: (message: string) => void
  }
  function streamMessage(
    opts: { apiKey: string; messages: Message[]; model?: string; signal?: AbortSignal },
    handlers: StreamHandlers,
  ): Promise<void>
  ```
  The optional `model` (defaulting to `DEFAULT_MODEL`) is the forward-compat hook for the post-v1 Anthropic-model selector — see `LATER.md`. It is a single defaulted parameter, not a provider abstraction.

- [ ] **Step 1: Implement `src/api/anthropic.ts`**

```typescript
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run build`
Expected: exits 0 (no type errors). Runtime verification happens in Task 10.

- [ ] **Step 3: Commit**

```bash
git add src/api/anthropic.ts
git commit -m "feat: browser-direct Anthropic streaming client"
```

---

### Task 8: State store (zustand) wiring domain + persistence

**Files:**
- Create: `src/state/store.ts`
- Test: `src/state/store.test.ts` (covers only the pure reducer-style actions, not network)

**Interfaces:**
- Consumes: everything from `domain/`, `persistence/storage`, `api/anthropic`.
- Produces a `useStore` hook with state `{ canvas, apiKey }` and actions:
  - `initCanvas()` — load from storage or create `emptyCanvas`
  - `setApiKey(key)` / `clearKey()`
  - `addUserMessage(threadId, content): string` — appends a user message, returns its id
  - `startAssistantMessage(threadId): string` — appends an empty assistant message, returns id
  - `appendToMessage(threadId, messageId, delta)` — accumulates streamed text
  - `branch(parentThreadId, branchPointMessageId, quotedText?): string` — returns new thread id, auto-positions to the right
  - `moveThreadTo(threadId, position)`
  - `sendMessage(threadId, content)` — the orchestrator: user msg → assemble context → stream into a new assistant msg → persist
  - `replaceCanvas(canvas)` — for import & sample-loading

  Every mutating action calls `saveCanvas` after updating (persistence is a store concern, so components never touch storage).

- [ ] **Step 1: Write the failing tests (pure actions only)**

`src/state/store.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useStore.getState().initCanvas()
})

describe('store — pure actions', () => {
  it('initializes with a single root thread', () => {
    expect(useStore.getState().canvas.threads).toHaveLength(1)
  })
  it('adds a user message and returns its id', () => {
    const rootId = useStore.getState().canvas.threads[0].id
    const id = useStore.getState().addUserMessage(rootId, 'hello')
    const root = useStore.getState().canvas.threads[0]
    expect(root.messages).toHaveLength(1)
    expect(root.messages[0]).toMatchObject({ id, role: 'user', content: 'hello' })
  })
  it('accumulates streamed deltas into an assistant message', () => {
    const rootId = useStore.getState().canvas.threads[0].id
    const id = useStore.getState().startAssistantMessage(rootId)
    useStore.getState().appendToMessage(rootId, id, 'Hel')
    useStore.getState().appendToMessage(rootId, id, 'lo')
    const msg = useStore.getState().canvas.threads[0].messages.find((m) => m.id === id)!
    expect(msg.content).toBe('Hello')
  })
  it('branches to a new thread wired to the branch point', () => {
    const rootId = useStore.getState().canvas.threads[0].id
    const mId = useStore.getState().addUserMessage(rootId, 'q')
    const childId = useStore.getState().branch(rootId, mId, 'quoted')
    const child = useStore.getState().canvas.threads.find((t) => t.id === childId)!
    expect(child).toMatchObject({ parentId: rootId, branchPointMessageId: mId, quotedText: 'quoted' })
  })
  it('persists after a mutation', () => {
    const rootId = useStore.getState().canvas.threads[0].id
    useStore.getState().addUserMessage(rootId, 'saved?')
    expect(localStorage.getItem('anabranch:canvas:v1')).toContain('saved?')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- store`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/state/store.ts`**

```typescript
import { create } from 'zustand'
import type { Canvas } from '../domain/types'
import { emptyCanvas, appendMessage, replaceMessage, branchFromMessage, moveThread } from '../domain/thread'
import { assembleContext, getThread } from '../domain/context'
import { saveCanvas, loadCanvas, saveApiKey, loadApiKey, clearApiKey } from '../persistence/storage'
import { streamMessage } from '../api/anthropic'

const newId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`

interface StoreState {
  canvas: Canvas
  apiKey: string | null
  initCanvas: () => void
  setApiKey: (key: string) => void
  clearKey: () => void
  addUserMessage: (threadId: string, content: string) => string
  startAssistantMessage: (threadId: string) => string
  appendToMessage: (threadId: string, messageId: string, delta: string) => void
  branch: (parentThreadId: string, branchPointMessageId: string, quotedText?: string | null) => string
  moveThreadTo: (threadId: string, position: { x: number; y: number }) => void
  sendMessage: (threadId: string, content: string) => Promise<void>
  replaceCanvas: (canvas: Canvas) => void
}

function commit(set: (partial: Partial<StoreState>) => void, canvas: Canvas) {
  saveCanvas(canvas)
  set({ canvas })
}

export const useStore = create<StoreState>((set, get) => ({
  canvas: emptyCanvas(newId('thread')),
  apiKey: loadApiKey(),

  initCanvas: () => {
    const loaded = loadCanvas()
    set({ canvas: loaded ?? emptyCanvas(newId('thread')), apiKey: loadApiKey() })
  },

  setApiKey: (key) => { saveApiKey(key); set({ apiKey: key }) },
  clearKey: () => { clearApiKey(); set({ apiKey: null }) },

  addUserMessage: (threadId, content) => {
    const id = newId('msg')
    commit(set, appendMessage(get().canvas, threadId, { id, role: 'user', content, createdAt: Date.now() }))
    return id
  },

  startAssistantMessage: (threadId) => {
    const id = newId('msg')
    commit(set, appendMessage(get().canvas, threadId, { id, role: 'assistant', content: '', createdAt: Date.now() }))
    return id
  },

  appendToMessage: (threadId, messageId, delta) => {
    const thread = getThread(get().canvas, threadId)
    const current = thread.messages.find((m) => m.id === messageId)?.content ?? ''
    commit(set, replaceMessage(get().canvas, threadId, messageId, current + delta))
  },

  branch: (parentThreadId, branchPointMessageId, quotedText = null) => {
    const id = newId('thread')
    const parent = getThread(get().canvas, parentThreadId)
    const position = { x: parent.position.x + 420, y: parent.position.y + 60 }
    commit(set, branchFromMessage(get().canvas, parentThreadId, branchPointMessageId, id, position, quotedText))
    return id
  },

  moveThreadTo: (threadId, position) => {
    commit(set, moveThread(get().canvas, threadId, position))
  },

  sendMessage: async (threadId, content) => {
    const { apiKey } = get()
    if (!apiKey) return
    get().addUserMessage(threadId, content)
    const context = assembleContext(get().canvas, threadId)
    const assistantId = get().startAssistantMessage(threadId)
    await streamMessage(
      { apiKey, messages: context },
      {
        onText: (delta) => get().appendToMessage(threadId, assistantId, delta),
        onDone: () => {},
        onError: (message) => get().appendToMessage(threadId, assistantId, `\n\n⚠️ ${message}`),
      },
    )
  },

  replaceCanvas: (canvas) => commit(set, canvas),
}))
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- store`
Expected: PASS — all 5 assertions. (These exercise only pure actions; `sendMessage` is verified live in Task 10.)

- [ ] **Step 5: Commit**

```bash
git add src/state/store.ts src/state/store.test.ts
git commit -m "feat: zustand store wiring domain, persistence, streaming"
```

---

### Task 9: Canvas shell — React Flow with pan/zoom and a rendered thread

Build-then-verify (no render test; per spec, verified in-browser).

**Files:**
- Create: `src/canvas/CanvasView.tsx`, `src/canvas/ThreadNode.tsx`, `src/components/MessageView.tsx`, `src/components/Composer.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useStore`; React Flow's `ReactFlow`, `Background`, `Controls`, `Node`, `Edge`, `NodeProps`, `applyNodeChanges`.
- Produces:
  - `CanvasView`: maps `store.canvas.threads` → React Flow nodes (type `'thread'`) and derives edges from `parentId`/`branchPointMessageId` (edge `sourceHandle` = branch point message id). Registers `nodeTypes = { thread: ThreadNode }`. Handles `onNodesChange` → `moveThreadTo` on drag-stop.
  - `ThreadNode`: renders a bounded, scrollable column of `MessageView`s + a `Composer`; calls `store.sendMessage`.
  - `MessageView`: renders one message (role-styled). (Selection→branch handle added in Task 15.)
  - `Composer`: controlled textarea + Send button.

- [ ] **Step 1: Implement `src/components/MessageView.tsx`**

```tsx
import type { Message } from '../domain/types'

export function MessageView({ message }: { message: Message }) {
  return (
    <div data-role={message.role} style={{ padding: '6px 8px', whiteSpace: 'pre-wrap' }}>
      <strong>{message.role === 'user' ? 'You' : 'Claude'}:</strong> {message.content}
    </div>
  )
}
```

- [ ] **Step 2: Implement `src/components/Composer.tsx`**

```tsx
import { useState } from 'react'

export function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  const send = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }
  return (
    <div style={{ display: 'flex', gap: 4, padding: 8 }} className="nodrag">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        style={{ flex: 1, resize: 'none' }}
        placeholder="Message…"
      />
      <button onClick={send}>Send</button>
    </div>
  )
}
```

- [ ] **Step 3: Implement `src/canvas/ThreadNode.tsx`**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { Thread } from '../domain/types'
import { useStore } from '../state/store'
import { MessageView } from '../components/MessageView'
import { Composer } from '../components/Composer'

export function ThreadNode({ data }: NodeProps<{ thread: Thread }>) {
  const thread = data.thread
  const sendMessage = useStore((s) => s.sendMessage)
  return (
    <div style={{ width: 380, border: '1px solid #999', background: '#fff', borderRadius: 6 }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ maxHeight: 320, overflowY: 'auto' }} className="nodrag nowheel">
        {thread.quotedText && (
          <blockquote style={{ margin: 8, borderLeft: '3px solid #ccc', paddingLeft: 8, color: '#666' }}>
            {thread.quotedText}
          </blockquote>
        )}
        {thread.messages.map((m) => (
          <div key={m.id} style={{ position: 'relative' }}>
            <MessageView message={m} />
            <button
              onClick={() => useStore.getState().branch(thread.id, m.id)}
              style={{ position: 'absolute', right: 4, top: 4, fontSize: 10 }}
            >
              ⑃ branch
            </button>
            {/* Per-message source handle so an edge can anchor to this exact message */}
            <Handle type="source" position={Position.Right} id={m.id} style={{ top: 12 }} />
          </div>
        ))}
      </div>
      <Composer onSend={(text) => sendMessage(thread.id, text)} />
    </div>
  )
}
```

- [ ] **Step 4: Implement `src/canvas/CanvasView.tsx`**

```tsx
import { useMemo } from 'react'
import {
  ReactFlow, Background, Controls, type Node, type Edge, type NodeChange, applyNodeChanges,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useStore } from '../state/store'
import { ThreadNode } from './ThreadNode'

const nodeTypes = { thread: ThreadNode }

export function CanvasView() {
  const canvas = useStore((s) => s.canvas)
  const moveThreadTo = useStore((s) => s.moveThreadTo)

  const nodes: Node[] = useMemo(
    () => canvas.threads.map((t) => ({
      id: t.id, type: 'thread', position: t.position, data: { thread: t },
    })),
    [canvas.threads],
  )

  const edges: Edge[] = useMemo(
    () => canvas.threads
      .filter((t) => t.parentId && t.branchPointMessageId)
      .map((t) => ({
        id: `e_${t.id}`,
        source: t.parentId!,
        sourceHandle: t.branchPointMessageId!,
        target: t.id,
      })),
    [canvas.threads],
  )

  const onNodesChange = (changes: NodeChange[]) => {
    for (const c of changes) {
      if (c.type === 'position' && c.position && c.dragging === false) {
        moveThreadTo(c.id, c.position)
      }
    }
    applyNodeChanges(changes, nodes) // React Flow needs the call; store is source of truth
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}
```

- [ ] **Step 5: Wire `src/App.tsx`**

```tsx
import { useEffect } from 'react'
import { useStore } from './state/store'
import { CanvasView } from './canvas/CanvasView'

export default function App() {
  const initCanvas = useStore((s) => s.initCanvas)
  useEffect(() => { initCanvas() }, [initCanvas])
  return <CanvasView />
}
```

- [ ] **Step 6: Manual verification (in browser)**

Run: `npm run dev`, open the local URL.
Confirm, observably:
1. A single thread node renders with an empty message column and a composer.
2. Scroll wheel over empty canvas zooms; drag empty canvas pans; the node stays put relative to the canvas.
3. Dragging the node header moves it; after refresh the node is in its moved position (persistence + move wired).
4. No console errors.

- [ ] **Step 7: Commit**

```bash
git add src/canvas src/components/MessageView.tsx src/components/Composer.tsx src/App.tsx
git commit -m "feat: react flow canvas with thread node, pan/zoom, drag-persist"
```

---

### Task 10: Key entry gate + live streaming send/receive

Build-then-verify. This proves the whole vertical: key → send → stream → persist.

**Files:**
- Create: `src/components/KeyEntry.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useStore` (`apiKey`, `setApiKey`).
- Produces: `KeyEntry` — a minimal gate shown when `apiKey` is null; on submit calls `setApiKey`. Includes the mandated copy: "Your key never leaves your browser except to go to Anthropic."

- [ ] **Step 1: Implement `src/components/KeyEntry.tsx`**

```tsx
import { useState } from 'react'
import { useStore } from '../state/store'

export function KeyEntry() {
  const setApiKey = useStore((s) => s.setApiKey)
  const [value, setValue] = useState('')
  return (
    <div style={{ maxWidth: 420, margin: '15vh auto', fontFamily: 'system-ui' }}>
      <h1>Anabranch</h1>
      <p>Paste an Anthropic API key to begin.</p>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="sk-ant-…"
        style={{ width: '100%', padding: 8 }}
      />
      <button onClick={() => value.trim() && setApiKey(value.trim())} style={{ marginTop: 8 }}>
        Start
      </button>
      <p style={{ color: '#666', fontSize: 12, marginTop: 12 }}>
        Your key never leaves your browser except to go to Anthropic.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Gate the app in `src/App.tsx`**

```tsx
import { useEffect } from 'react'
import { useStore } from './state/store'
import { CanvasView } from './canvas/CanvasView'
import { KeyEntry } from './components/KeyEntry'

export default function App() {
  const initCanvas = useStore((s) => s.initCanvas)
  const apiKey = useStore((s) => s.apiKey)
  useEffect(() => { initCanvas() }, [initCanvas])
  return apiKey ? <CanvasView /> : <KeyEntry />
}
```

- [ ] **Step 3: Manual verification (in browser, with a real key)**

Run: `npm run dev`.
Confirm, observably:
1. With no stored key, the KeyEntry gate shows. Entering a real key reveals the canvas.
2. Type a message, Send: an assistant message appears and **streams in token-by-token** (not all at once).
3. Refresh: the key is still set (no gate) and the conversation persists.
4. Temporarily enter a bad key in localStorage (`anabranch:apiKey`) and send: the assistant message shows a `⚠️` error line (not a silent hang, not an uncaught console error).

- [ ] **Step 4: Commit**

```bash
git add src/components/KeyEntry.tsx src/App.tsx
git commit -m "feat: api key gate and live streaming send/receive"
```

---

### Task 11: Branch-from-message end-to-end

The branch button exists from Task 9; this task verifies the full branch semantics — new connected node, edge anchored to the exact message, and correct assembled context in the child.

Build-then-verify (the *logic* is already unit-tested in Tasks 2, 3, 8; this confirms it end-to-end in the UI).

**Files:** none new — verification + any fixes surfaced.

- [ ] **Step 1: Manual verification (in browser)**

Run: `npm run dev`. In the root thread, send two exchanges. Then:
1. Click "⑃ branch" on the assistant message of the **first** exchange. A new node appears to the right, connected by an edge whose source end is anchored at that message's row (not the top of the node).
2. In the new node, ask "what did I just ask you?" The reply reflects only the context up to and including the branch point (the first exchange), confirming `assembleContext` feeds the child correctly.
3. Branch again from the child. Edges form a legible tree; pan/zoom keeps all nodes navigable.
4. Refresh: the whole graph (nodes, positions, edges) persists.

- [ ] **Step 2: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: branch-from-message end-to-end wiring" || echo "no fixes needed"
```

---

### Task 12: Deploy to Vercel — THE SKELETON GATE

Deliverable: a public live URL. Per the spec, "if the skeleton slips past hour 20, cut scope, not the gate."

**Files:**
- Create: `vercel.json`, `README.md`

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

- [ ] **Step 2: Create `README.md`**

> **Rename note (25 July 2026):** the heading must read `# Anabranch`. The first
> pass of this step wrote `# Tangent`, and the follow-up rename commit missed
> both `README.md` and the `name` field in `package-lock.json`. Check both.

```markdown
# Anabranch

An AI conversation on an infinite canvas. Each node is a thread; branch a new
thread from any message. Bring your own Anthropic API key — it is stored only in
your browser and sent only to Anthropic.

Built in public as proof artifact #1 for Fold Studio. MIT licensed.

## Run locally
    npm install
    npm run dev

## Test
    npm test  # context assembly + persistence/import-export round trip

See `docs/spec.md` for the scope contract and `LATER.md` for parked ideas.
```

- [ ] **Step 3: Push the repo to its own public GitHub repo and connect Vercel**

```bash
git add vercel.json README.md
git commit -m "chore: vercel config and readme"
git push -u origin HEAD
```
Then, in Vercel: import the repo, accept the detected Vite settings, deploy.

**Name the Vercel project `anabranch`** so the production URL is
`anabranch.vercel.app` (verified free on 25 July 2026). This matters more than
it looks: the project name *is* the public URL, it goes straight into the
build-in-public bio, and renaming the project later changes the URL and breaks
every link already posted. If Vercel appends a suffix, the name was taken in
the interim — stop and pick a variant before deploying rather than shipping a
`anabranch-a1b2c3.vercel.app` URL.

- [ ] **Step 4: Manual verification (the gate)**

On the live Vercel URL:
1. KeyEntry gate shows; entering a key reveals the canvas.
2. Send/stream/receive works against Anthropic from the deployed origin (confirms the CORS/direct-browser header path works in production, not just localhost).
3. Branch, pan, zoom, refresh-persist all work.
4. Put the live URL where the build-in-public bio links.

- [ ] **Step 5: Commit / tag the skeleton**

```bash
git tag skeleton-live
git push --tags
```

**✅ Walking skeleton complete and publicly live. Phase A done.**

---

# PHASE B — Deepening Themes (one per week, each a before/after post)

> Themes ship in the spec's order. Each is a visible before/after. Keep each theme inside its week; overflow goes to `LATER.md` (see Task 13's LATER.md creation and the density risk note).

---

### Task 13: Confirm the LATER.md parking lot

The spec mandates a `LATER.md` "in the repo [that] collects every idea beyond [the six themes], which is where any 'it could be a product' pressure gets parked, visibly." **This file already exists at the repo root** (committed alongside this plan, before Phase A). This task is a checkpoint, not a creation step: confirm it is present and committed, and from here on route every theme's overflow into its "Density overflow" / "Ideas that arrived mid-build" sections rather than into the build.

**Files:**
- Verify: `LATER.md` (already committed)

- [ ] **Step 1: Confirm it exists and is committed**

Run: `git ls-files LATER.md`
Expected: prints `LATER.md`.

No commit needed — nothing changes here.

---

### Theme 1 — The system underneath

> Tokens, type scale, spacing; the node, edge, and composer components rebuilt on it. This is the B-then-C-then-A craft signature made concrete: a real system under the surface.

### Task 14: Make the token layer Anabranch's own

The skeleton already runs on shadcn's default CSS-variable tokens (Task 1, Step 3b). This task is where the before/after lives: replace shadcn's neutral defaults with **Anabranch's palette**, add an explicit **type scale** and **spacing rhythm**, and pin the surfaces the thread-node uses. Everything downstream reads these tokens — no hardcoded colours or sizes after this task.

**Files:**
- Modify: `src/index.css` (the shadcn token layer + `@theme`)

**Interfaces:**
- Produces: a customised `.dark` palette (Anabranch's accent, tuned surfaces), plus additional `@theme` tokens for the type scale (`--text-*`), a message-role colour pair (`--color-user`, `--color-assistant`), and a canvas surface (`--color-canvas`). All consumed as Tailwind utilities (`bg-card`, `text-user`, `text-sm`, etc.) via the `@theme inline` mapping.

- [ ] **Step 1: Customise the palette and add scale tokens in `src/index.css`**

Edit the `.dark` block with Anabranch's palette (accent + tuned surfaces) and extend `@theme inline` with the type scale, role colours, and canvas surface:
```css
.dark {
  --background: oklch(0.17 0.01 260);      /* deep slate canvas backdrop */
  --foreground: oklch(0.93 0.01 260);
  --card: oklch(0.21 0.012 260);           /* thread-node surface */
  --card-foreground: oklch(0.93 0.01 260);
  --primary: oklch(0.72 0.13 265);         /* Anabranch accent (branch blue) */
  --primary-foreground: oklch(0.17 0.01 260);
  --muted: oklch(0.27 0.012 260);
  --muted-foreground: oklch(0.68 0.02 260);
  --border: oklch(0.30 0.012 260);
  --input: oklch(0.30 0.012 260);
  --ring: oklch(0.72 0.13 265);
  --destructive: oklch(0.70 0.19 22);
  --user: oklch(0.80 0.09 250);            /* "You" message colour */
  --assistant: oklch(0.90 0.02 260);       /* "Claude" message colour */
  --canvas: oklch(0.14 0.01 260);          /* React Flow background */
}

@theme inline {
  /* ...existing color mappings from Task 1 remain... */
  --color-user: var(--user);
  --color-assistant: var(--assistant);
  --color-canvas: var(--canvas);
  /* type scale (1.25 modular, 16px base) */
  --text-xs: 0.64rem;
  --text-sm: 0.8rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5625rem;
}
```

- [ ] **Step 2: Manual verification**

Run `npm run dev`: the whole app shifts to Anabranch's palette (accent, surfaces, message-role colours). The shadcn primitives (buttons, inputs) pick up the new accent automatically because they reference the same tokens.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(design): customise shadcn tokens into Anabranch's system"
```

---

### Task 15: Rebuild node, edge, and composer on the tokens

Rebuild the hand-built canvas pieces to read from the shared tokens (Tailwind utilities), so the node/edge/composer look like one system with the shadcn chrome. The composer's controls become shadcn primitives.

**Files:**
- Modify: `src/canvas/ThreadNode.tsx`, `src/components/MessageView.tsx`, `src/components/Composer.tsx`, `src/canvas/CanvasView.tsx`

**Interfaces:** no signature changes — visual rebuild only. Replace inline `style` objects with Tailwind classes bound to the tokens (`bg-card`, `border-border`, `text-user`, `text-sm`, `rounded-lg`, `p-2`, …) and swap the raw `<textarea>`/`<button>` for shadcn `Textarea`/`Button`.

- [ ] **Step 1: Rebuild `MessageView.tsx` on tokens**

Replace inline styles with token utilities, e.g.:
```tsx
<div className="whitespace-pre-wrap px-2 py-1 text-sm leading-relaxed" data-role={message.role}>
  <span className={message.role === 'user' ? 'text-user' : 'text-assistant'}>
    <strong>{message.role === 'user' ? 'You' : 'Claude'}:</strong> {message.content}
  </span>
</div>
```

- [ ] **Step 2: Rebuild `Composer.tsx` on shadcn primitives**

```tsx
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function Composer({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  const send = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }
  return (
    <div className="nodrag flex gap-1 border-t border-border p-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="flex-1 resize-none text-sm"
        placeholder="Message…"
      />
      <Button size="sm" onClick={send}>Send</Button>
    </div>
  )
}
```

- [ ] **Step 3: Rebuild the `ThreadNode.tsx` container** on token utilities: `className="w-[380px] rounded-lg border border-border bg-card text-card-foreground shadow-lg"`; scroll area `className="nodrag nowheel max-h-80 overflow-y-auto p-2"`; quote block `className="m-2 border-l-2 border-primary pl-2 text-sm text-muted-foreground"`; branch buttons become shadcn `Button` (`variant="ghost" size="sm"`).

- [ ] **Step 4: Style edges** in `CanvasView.tsx`: give each derived edge `type: 'smoothstep'` and `style: { stroke: 'var(--border)', strokeWidth: 2 }` via `defaultEdgeOptions`; set the `<Background>` colour to `var(--border)` and the canvas wrapper to `bg-[var(--canvas)]`.

- [ ] **Step 5: Manual verification (before/after shot)**

Run `npm run dev`. The node, composer, messages, edges, and shadcn chrome now read as one system. Capture the before/after (default-shadcn skeleton vs. Anabranch's system) — this is the theme's post.

- [ ] **Step 6: Commit**

```bash
git add src/canvas src/components/MessageView.tsx src/components/Composer.tsx
git commit -m "feat(design): rebuild node, edge, composer on shared tokens + shadcn"
```

---

### Theme 2 — Branch-from-selection and the branch animation

> Node sprouts, edge draws, camera eases over. The screen-recording money shot.

### Task 16: Branch-from-text-selection (seed the quote)

**Files:**
- Modify: `src/components/MessageView.tsx` (detect selection within a message, offer a branch action), `src/canvas/ThreadNode.tsx` (pass thread id + message id down)

**Interfaces:**
- Consumes: `store.branch(parentThreadId, branchPointMessageId, quotedText)`.
- Produces: when the user selects text inside a message, a small "branch from selection" affordance appears; invoking it calls `branch(...)` with the selected substring as `quotedText`. The quoted text renders in the new node's `thread__quote` block (already supported from Task 9/15).

- [ ] **Step 1: Add selection handling to `MessageView.tsx`**

```tsx
import { useState } from 'react'
import type { Message } from '../domain/types'

export function MessageView({
  message, onBranch,
}: {
  message: Message
  onBranch: (messageId: string, quotedText: string | null) => void
}) {
  const [selection, setSelection] = useState<string | null>(null)

  const captureSelection = () => {
    const text = window.getSelection()?.toString().trim() ?? ''
    setSelection(text.length > 0 ? text : null)
  }

  return (
    <div className="message" data-role={message.role} onMouseUp={captureSelection}>
      <span className="message__label">{message.role === 'user' ? 'You' : 'Claude'}</span>
      <span className="message__body">{message.content}</span>
      {selection && (
        <button
          className="btn message__branch-sel nodrag"
          onMouseDown={(e) => { e.preventDefault(); onBranch(message.id, selection); setSelection(null) }}
        >
          ⑃ branch from “{selection.slice(0, 24)}{selection.length > 24 ? '…' : ''}”
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire `ThreadNode.tsx`** to pass `onBranch={(mId, quoted) => useStore.getState().branch(thread.id, mId, quoted)}` into `MessageView`, and keep the whole-message branch button calling `branch(thread.id, m.id, null)`.

- [ ] **Step 3: Manual verification**

Select a phrase inside an assistant message → the "branch from selection" affordance appears → clicking it creates a new node whose quote block shows the selected text; the child's context still assembles from the ancestor chain (verified by asking a follow-up).

- [ ] **Step 4: Commit**

```bash
git add src/components/MessageView.tsx src/canvas/ThreadNode.tsx
git commit -m "feat: branch from a text selection, seeding the quote"
```

---

### Task 17: The branch animation (sprout, draw, camera ease)

**Files:**
- Modify: `src/canvas/CanvasView.tsx` (use `useReactFlow` for animated camera; animate edge draw), `src/index.css` (node sprout keyframes), `src/state/store.ts` (expose `lastBranchedId` so the view can animate the newcomer)

**Interfaces:**
- Produces: on branch, (a) the new node scales/fades in ("sprout"), (b) its edge animates as it draws, (c) the camera eases to frame the new node via `setCenter(x, y, { duration })`.

- [ ] **Step 1: Track the newest branch in the store**

In `store.ts`, add `lastBranchedId: string | null` to state, set it inside `branch(...)` to the new id, and add `clearLastBranched: () => set({ lastBranchedId: null })`.

- [ ] **Step 2: Animate the camera + edge in `CanvasView.tsx`**

```tsx
// inside CanvasView, replacing the bare <ReactFlow> with a component that has access to the instance
import { useReactFlow } from '@xyflow/react'
import { useEffect } from 'react'
// ...
const { setCenter } = useReactFlow()
const lastBranchedId = useStore((s) => s.lastBranchedId)
const clearLastBranched = useStore((s) => s.clearLastBranched)

useEffect(() => {
  if (!lastBranchedId) return
  const t = canvas.threads.find((x) => x.id === lastBranchedId)
  if (t) setCenter(t.position.x + 190, t.position.y + 160, { zoom: 1, duration: 600 })
  clearLastBranched()
}, [lastBranchedId, canvas.threads, setCenter, clearLastBranched])
```
Give newly-branched edges `animated: true` (derive from `lastBranchedId`); mark the newest node with a `data.justBranched` flag consumed by `ThreadNode` to apply the sprout class. Wrap `<ReactFlow>` in `<ReactFlowProvider>` (in `App.tsx` or around `CanvasView`) so `useReactFlow` works.

- [ ] **Step 3: Sprout keyframes in `src/index.css`**

```css
@keyframes sprout {
  from { transform: scale(0.7); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
.thread--sprout { animation: sprout 320ms cubic-bezier(0.2, 0.8, 0.2, 1); }
@media (prefers-reduced-motion: reduce) { .thread--sprout { animation: none; } }
```

- [ ] **Step 4: Manual verification (the money shot)**

Branch from a message: node sprouts in, edge draws, camera eases to frame it — one continuous gesture. Record it. Confirm `prefers-reduced-motion` disables the sprout.

- [ ] **Step 5: Commit**

```bash
git add src/canvas src/state/store.ts
git commit -m "feat: branch animation — sprout, edge draw, camera ease"
```

---

### Theme 3 — Honest states

> First-run/empty, streaming, errors (bad key, rate limit, network), long-thread handling.

### Task 18: First-run / empty as a designed moment + streaming affordance

**Files:**
- Modify: `src/components/KeyEntry.tsx` (designed first-run), `src/canvas/ThreadNode.tsx` (empty-thread prompt; streaming indicator), `src/state/store.ts` (track streaming state per thread)

**Interfaces:**
- Produces: `store` gains `streamingThreadId: string | null` (set at `sendMessage` start, cleared on `onDone`/`onError`). `ThreadNode` shows a "typing" affordance while its id equals `streamingThreadId` and shows an empty-state prompt when it has no messages and no quote.

- [ ] **Step 1: Track streaming in `store.ts`**

Add `streamingThreadId: string | null` to state. In `sendMessage`: `set({ streamingThreadId: threadId })` before streaming; in both `onDone` and `onError`, `set({ streamingThreadId: null })`.

- [ ] **Step 2: KeyEntry as a designed moment**

Restyle `KeyEntry.tsx` using the shadcn `Card`, `Input`, and `Button` primitives on Anabranch's tokens: a centred `Card` (`bg-card`), product one-liner ("An AI conversation on an infinite canvas"), the key `Input`, the privacy line (already present, keep verbatim), and a "Try the sample instead" affordance stub (a `Button variant="ghost"`, wired in Task 24). No new logic beyond the sample stub calling a passed `onTrySample` (optional prop, unused until Task 24).

- [ ] **Step 3: Empty + streaming states in `ThreadNode.tsx`**

When `thread.messages.length === 0 && !thread.quotedText`, render a dim prompt ("Ask anything. Branch any reply.") in the scroll area. When `useStore(s => s.streamingThreadId) === thread.id`, render an animated "Claude is typing…" row beneath the messages.

- [ ] **Step 4: Manual verification**

Fresh load → designed first-run. Empty node → prompt. Send → typing indicator during stream, gone when done.

- [ ] **Step 5: Commit**

```bash
git add src/components/KeyEntry.tsx src/canvas/ThreadNode.tsx src/state/store.ts
git commit -m "feat: designed first-run, empty state, streaming indicator"
```

---

### Task 19: Honest error states + long-thread handling

**Files:**
- Modify: `src/canvas/ThreadNode.tsx` (render errors distinctly; long-thread affordance), `src/state/store.ts` (structured error state instead of appending ⚠️ into the message text)

**Interfaces:**
- Produces: `store` gains `errors: Record<string, string>` (threadId → last error message) set from `onError` (replacing the inline `⚠️` hack from Task 8) and cleared on the next successful send. `ThreadNode` renders the error via the shadcn `Alert` (`variant="destructive"`) with a Retry `Button` that re-sends the last user message. Long threads: the message column already scrolls (Task 9); add a "jump to latest" affordance and auto-scroll-to-bottom on new content.

- [ ] **Step 1: Structured errors in `store.ts`**

Add `errors: Record<string, string>`. In `sendMessage`, before streaming, clear this thread's error. Change `onError` to `set({ errors: { ...get().errors, [threadId]: message }, streamingThreadId: null })` and stop appending `⚠️` into message content. Add `retry(threadId)` that re-runs `sendMessage` with the thread's last user message content.

- [ ] **Step 2: Error banner + retry + long-thread scroll in `ThreadNode.tsx`**

Render `errors[thread.id]` in a shadcn `Alert variant="destructive"` with a Retry `Button` (`onClick={() => useStore.getState().retry(thread.id)}`). Add a `ref` to the scroll container and an effect that scrolls to bottom when `thread.messages` changes; when the user has scrolled up, show a "↓ latest" `Button` that jumps to bottom.

- [ ] **Step 3: Manual verification (each error path)**

- Bad key → "That API key was rejected…" banner, Retry present.
- Rate limit (or simulate a 429 by throttling) → rate-limit banner.
- Offline (devtools → offline) → network banner.
- Long thread (send many messages) → column scrolls, "↓ latest" works, auto-scrolls on new tokens.

- [ ] **Step 4: Commit**

```bash
git add src/canvas/ThreadNode.tsx src/state/store.ts
git commit -m "feat: honest error banners with retry + long-thread scroll"
```

---

### Theme 4 — Density

> Collapse threads to title chips, minimap, fit-view, auto-tidy layout. Capped at this week; overflow (layout collisions, huge graphs) goes to LATER.md.

### Task 20: Thread titles + collapse to chips

**Files:**
- Create: `src/domain/title.ts`, `src/domain/title.test.ts`
- Modify: `src/canvas/ThreadNode.tsx` (collapse toggle → chip render), `src/state/store.ts` (`toggleCollapsed`)

**Interfaces:**
- Produces: `deriveTitle(thread: Thread): string` (pure, tested). `store.toggleCollapsed(threadId)`. `ThreadNode` renders a compact chip (title + message count) when `thread.collapsed`, expandable on click.

- [ ] **Step 1: Write the failing tests**

`src/domain/title.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import type { Thread } from './types'
import { deriveTitle } from './title'

const base: Thread = {
  id: 't', parentId: null, branchPointMessageId: null, quotedText: null,
  title: null, collapsed: false, position: { x: 0, y: 0 }, messages: [],
}

describe('deriveTitle', () => {
  it('uses an explicit title when present', () => {
    expect(deriveTitle({ ...base, title: 'My title' })).toBe('My title')
  })
  it('falls back to the first user message, trimmed to length', () => {
    const long = 'a'.repeat(80)
    const t = { ...base, messages: [{ id: 'u', role: 'user' as const, content: long, createdAt: 0 }] }
    expect(deriveTitle(t)).toBe('a'.repeat(40) + '…')
  })
  it('uses the quoted text when there is no message yet', () => {
    expect(deriveTitle({ ...base, quotedText: 'a quote' })).toBe('a quote')
  })
  it('falls back to "New thread" when empty', () => {
    expect(deriveTitle(base)).toBe('New thread')
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- title` → FAIL.

- [ ] **Step 3: Implement `src/domain/title.ts`**

```typescript
import type { Thread } from './types'

const MAX = 40

export function deriveTitle(thread: Thread): string {
  if (thread.title) return thread.title
  const firstUser = thread.messages.find((m) => m.role === 'user')
  const source = firstUser?.content ?? thread.quotedText ?? ''
  const trimmed = source.trim()
  if (!trimmed) return 'New thread'
  return trimmed.length > MAX ? trimmed.slice(0, MAX) + '…' : trimmed
}
```

- [ ] **Step 4: Run to verify it passes** — `npm test -- title` → PASS.

- [ ] **Step 5: Collapse UI + store action**

Add `toggleCollapsed(threadId)` to `store.ts` (flips `thread.collapsed`, persists). In `ThreadNode.tsx`: a collapse button in a node header; when `thread.collapsed`, render only a chip (`deriveTitle(thread)` + `${thread.messages.length} msgs`) that expands on click.

- [ ] **Step 6: Manual verification** — collapse a busy node to a chip; the graph reads at a glance; expand restores it; state persists on refresh.

- [ ] **Step 7: Commit**

```bash
git add src/domain/title.ts src/domain/title.test.ts src/canvas/ThreadNode.tsx src/state/store.ts
git commit -m "feat: thread titles and collapse-to-chip density"
```

---

### Task 21: Minimap, fit-view, and auto-tidy layout

**Files:**
- Create: `src/domain/layout.ts`, `src/domain/layout.test.ts`
- Modify: `src/canvas/CanvasView.tsx` (add `<MiniMap>`, a fit-view control, a "tidy" button), `src/state/store.ts` (`tidy()`)

**Interfaces:**
- Produces: `tidyLayout(canvas: Canvas): Record<string, {x:number;y:number}>` (pure, tested) — a deterministic tree layout: x by depth, y by a running leaf counter, so siblings never overlap. `store.tidy()` applies it to all threads. `CanvasView` adds React Flow's `<MiniMap>` and wires `fitView`.

- [ ] **Step 1: Write the failing tests**

`src/domain/layout.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { emptyCanvas, appendMessage, branchFromMessage } from './thread'
import { tidyLayout } from './layout'

describe('tidyLayout', () => {
  it('places the root at the origin column', () => {
    const pos = tidyLayout(emptyCanvas('root'))
    expect(pos.root.x).toBe(0)
  })
  it('places children one column to the right of their parent', () => {
    let c = emptyCanvas('root')
    c = appendMessage(c, 'root', { id: 'a1', role: 'assistant', content: 'x', createdAt: 0 })
    c = branchFromMessage(c, 'root', 'a1', 'B', { x: 0, y: 0 })
    const pos = tidyLayout(c)
    expect(pos.B.x).toBeGreaterThan(pos.root.x)
  })
  it('gives two siblings distinct vertical positions (no overlap)', () => {
    let c = emptyCanvas('root')
    c = appendMessage(c, 'root', { id: 'a1', role: 'assistant', content: 'x', createdAt: 0 })
    c = branchFromMessage(c, 'root', 'a1', 'B', { x: 0, y: 0 })
    c = branchFromMessage(c, 'root', 'a1', 'C', { x: 0, y: 0 })
    const pos = tidyLayout(c)
    expect(pos.B.y).not.toBe(pos.C.y)
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- layout` → FAIL.

- [ ] **Step 3: Implement `src/domain/layout.ts`**

```typescript
import type { Canvas } from './types'

const COL = 440
const ROW = 360

/** Deterministic tree layout: x by depth from root, y by in-order leaf index. */
export function tidyLayout(canvas: Canvas): Record<string, { x: number; y: number }> {
  const byParent = new Map<string | null, string[]>()
  for (const t of canvas.threads) {
    const key = t.parentId
    byParent.set(key, [...(byParent.get(key) ?? []), t.id])
  }
  const positions: Record<string, { x: number; y: number }> = {}
  let leaf = 0
  const walk = (id: string, depth: number) => {
    const children = byParent.get(id) ?? []
    if (children.length === 0) {
      positions[id] = { x: depth * COL, y: leaf * ROW }
      leaf += 1
      return
    }
    const firstLeaf = leaf
    for (const child of children) walk(child, depth + 1)
    const lastLeaf = leaf - 1
    positions[id] = { x: depth * COL, y: ((firstLeaf + lastLeaf) / 2) * ROW }
  }
  for (const rootId of byParent.get(null) ?? []) walk(rootId, 0)
  return positions
}
```

- [ ] **Step 4: Run to verify it passes** — `npm test -- layout` → PASS.

- [ ] **Step 5: Wire minimap, fit-view, tidy** — add `store.tidy()` (applies `tidyLayout` to every thread's position, persists). In `CanvasView.tsx`, import `MiniMap`, render `<MiniMap />` inside `<ReactFlow>`; add toolbar buttons for "Fit" (`fitView()` via `useReactFlow`) and "Tidy" (`store.tidy()` then `fitView`).

- [ ] **Step 6: Manual verification** — build a messy graph; "Tidy" arranges it into a clean left-to-right tree with no overlaps; minimap reflects it; "Fit" frames everything. Note in LATER.md that overlap for pathological huge graphs is out of scope (density week cap).

- [ ] **Step 7: Commit**

```bash
git add src/domain/layout.ts src/domain/layout.test.ts src/canvas/CanvasView.tsx src/state/store.ts
git commit -m "feat: minimap, fit-view, and auto-tidy tree layout"
```

---

### Theme 5 — Keyboard flow

> Cmd+Enter, node-to-node navigation, quick-branch. The pass that makes it feel like a tool, not a demo.

### Task 22: Keyboard flow

**Files:**
- Modify: `src/components/Composer.tsx` (Cmd/Ctrl+Enter to send), `src/canvas/CanvasView.tsx` (global key handling for navigation + quick-branch), `src/state/store.ts` (`selectedThreadId`, `selectThread`, navigation helpers)

**Interfaces:**
- Produces: `store` gains `selectedThreadId: string | null` and `selectThread(id)`. Keyboard: **Cmd/Ctrl+Enter** sends from the focused composer; **arrow/Tab** moves selection parent↔child↔sibling; **Cmd/Ctrl+B** quick-branches from the selected thread's last message; a visible focus ring marks the selected node.

- [ ] **Step 1: Cmd/Ctrl+Enter in `Composer.tsx`**

Add `onKeyDown` to the textarea: `if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); send() }`.

- [ ] **Step 2: Selection + navigation in store**

Add `selectedThreadId` and `selectThread(id)`. Add navigation helpers computed from the tree: `selectParent()`, `selectFirstChild()`, `selectNextSibling()`, `selectPrevSibling()` (using `parentId` relationships). Add `quickBranch()` that branches from the selected thread's last message.

- [ ] **Step 3: Global key handling in `CanvasView.tsx`**

`useEffect` adding a `keydown` listener on `window`: arrows/Tab → navigation helpers (only when focus isn't in a textarea/input); Cmd/Ctrl+B → `quickBranch()`. On selection change, `setCenter` to the selected node. Mark the selected node with a focus-ring class in `ThreadNode`.

- [ ] **Step 4: Manual verification** — navigate the whole graph without the mouse: arrows move the focus ring between nodes and pan the camera; Cmd+Enter sends; Cmd+B sprouts a branch. Feels like a tool.

- [ ] **Step 5: Commit**

```bash
git add src/components/Composer.tsx src/canvas/CanvasView.tsx src/canvas/ThreadNode.tsx src/state/store.ts
git commit -m "feat: keyboard flow — cmd+enter, node navigation, quick-branch"
```

---

### Theme 6 — The finishing pass

> Export/import, a sample canvas so keyless visitors can still touch it, OG images, the ship post. The sample canvas is the named mitigation for the keyless-visitor risk and must not be cut.

### Task 23: Export / import UI

**Files:**
- Create: `src/components/Toolbar.tsx`
- Modify: `src/canvas/CanvasView.tsx` (mount the toolbar)

**Interfaces:**
- Consumes: `exportCanvas`, `importCanvas` (Task 5), `store.canvas`, `store.replaceCanvas`.
- Produces: `Toolbar` with Export (downloads `anabranch-canvas.json` via a Blob + object URL) and Import (file input → `importCanvas` → `replaceCanvas`, with a caught error surfaced to the user).

- [ ] **Step 1: Implement `src/components/Toolbar.tsx`**

```tsx
import { useRef } from 'react'
import { useStore } from '../state/store'
import { exportCanvas, importCanvas } from '../persistence/transfer'

export function Toolbar() {
  const canvas = useStore((s) => s.canvas)
  const replaceCanvas = useStore((s) => s.replaceCanvas)
  const fileRef = useRef<HTMLInputElement>(null)

  const doExport = () => {
    const blob = new Blob([exportCanvas(canvas)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'anabranch-canvas.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const doImport = async (file: File) => {
    try {
      replaceCanvas(importCanvas(await file.text()))
    } catch (err) {
      alert(`Could not import: ${(err as Error).message}`)
    }
  }

  return (
    <div className="toolbar">
      <button className="btn" onClick={doExport}>Export</button>
      <button className="btn" onClick={() => fileRef.current?.click()}>Import</button>
      <input
        ref={fileRef} type="file" accept="application/json" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = '' }}
      />
    </div>
  )
}
```
(Note: `importCanvas` errors are shown via `alert`; if the dialog constraint matters in the target environment, swap for an inline toast — but a native alert is acceptable here since it is user-triggered.)

- [ ] **Step 2: Mount the toolbar** as a React Flow `<Panel position="top-right">` in `CanvasView.tsx`, using shadcn `Button`s laid out with Tailwind utilities (`flex gap-2`). The `Toolbar` code above uses raw `<button className="btn">` as a placeholder — swap those for the shadcn `Button` component here.

- [ ] **Step 3: Manual verification** — Export downloads a JSON file; deleting localStorage and Importing that file restores the exact graph (round trip already unit-tested in Task 5; this confirms the UI wiring). Importing a malformed file shows a readable error, not a crash.

- [ ] **Step 4: Commit**

```bash
git add src/components/Toolbar.tsx src/canvas/CanvasView.tsx
git commit -m "feat: export/import toolbar wired to validated transfer"
```

---

### Task 24: Sample canvas for keyless visitors

The spec's named mitigation for "useless to visitors without a key" — must not be cut.

**Files:**
- Create: `src/sample/sampleCanvas.ts` (a hand-authored `Canvas` showing a branched conversation)
- Modify: `src/components/KeyEntry.tsx` (wire "Try the sample" stub from Task 18), `src/state/store.ts` (`loadSample()`), `src/App.tsx` (allow viewing the canvas in a read-only "sample" mode without a key)

**Interfaces:**
- Produces: `SAMPLE_CANVAS: Canvas` — a pre-built multi-thread graph (a root conversation plus two branches, including one branch-from-selection with a quote) so a keyless visitor can pan, zoom, branch-navigate, and read a real example. `store.loadSample()` sets it as the canvas and flags `sampleMode: true` (composers disabled / show "add your key to send"). Adding a key exits sample mode.

- [ ] **Step 1: Author `src/sample/sampleCanvas.ts`** — a `Canvas` literal with 3 threads and realistic message content demonstrating the branch model (root → branch-from-message → branch-from-selection with `quotedText`). Positions pre-tidied so it frames well on `fitView`.

- [ ] **Step 2: Wire `loadSample()` + sample mode** — in `store.ts` add `sampleMode: boolean` and `loadSample()` (sets `canvas = SAMPLE_CANVAS`, `sampleMode = true`, does NOT persist over the user's real canvas — guard `commit` to skip save in sample mode). `setApiKey` clears sample mode and re-loads the persisted canvas. In `ThreadNode`, when `sampleMode`, replace the composer with a "Add your API key to reply" affordance that opens `KeyEntry`.

- [ ] **Step 3: App + KeyEntry wiring** — `KeyEntry`'s "Try the sample instead" calls `loadSample()`; `App` renders `CanvasView` when `apiKey || sampleMode`.

- [ ] **Step 4: Manual verification** — with no key, "Try the sample" shows a real branched canvas that pans/zooms/navigates; composers invite a key rather than silently failing; adding a key swaps back to the user's own (empty) canvas without clobbering anything.

- [ ] **Step 5: Commit**

```bash
git add src/sample/sampleCanvas.ts src/components/KeyEntry.tsx src/state/store.ts src/App.tsx
git commit -m "feat: sample canvas so keyless visitors can touch the tool"
```

---

### Task 25: OG images, meta, and the ship post

**Files:**
- Create: `public/og.png` (1200×630 social card), `public/favicon.svg`
- Modify: `index.html` (title, description, OG/Twitter meta), `README.md` (finished overview + link to spec/LATER), `LATER.md` (final sweep of parked ideas)

**Interfaces:** none — static assets and docs.

- [ ] **Step 1: Add OG/meta to `index.html`**

```html
<meta name="description" content="An AI conversation on an infinite canvas. Branch any message into a new thread." />
<meta property="og:title" content="Anabranch" />
<meta property="og:description" content="An AI conversation on an infinite canvas. Branch any message into a new thread." />
<meta property="og:image" content="/og.png" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/favicon.svg" />
```

- [ ] **Step 2: Add the OG image and favicon** to `public/` (designed card using the token palette; the branch graph as the hero).

- [ ] **Step 3: Finalize README + LATER sweep** — README gets the finished feature list, the "bring your own key / key stays in your browser" note, run/test instructions, and links to `docs/spec.md` and `LATER.md`. Move any Phase B overflow ideas into `LATER.md`.

- [ ] **Step 4: Manual verification** — build, deploy, and check the OG card renders in a link-preview validator; favicon shows; the live URL is the ship-post link.

- [ ] **Step 5: Commit + tag the ship**

```bash
git add index.html public README.md LATER.md
git commit -m "feat: OG images, meta, favicon, and ship-post polish"
git tag six-themes-shipped
git push --tags
```

**✅ Done means the six themes shipped. This is that.**

---

## Self-Review (run against the spec)

**Spec coverage — every requirement maps to a task:**

| Spec requirement | Task(s) |
|---|---|
| Client-only React/Vite/TS + React Flow | 1, 9 |
| Node = a thread (scrollable column + composer) | 9, 15 |
| Branch from a message, edge anchored to that message | 9 (handle), 11 (verify) |
| Branch context = ancestor chain to the branch point | 2 (`assembleContext`) |
| Branch from a text selection, seed the quote | 16 |
| Browser-direct Anthropic key, `anthropic-dangerous-direct-browser-access`, streaming | 7, 10 |
| "Key never leaves your browser except to Anthropic" copy | 10, 18 |
| Anthropic-only, no provider abstraction | 7 (`DEFAULT_MODEL` constant; optional `model` param is a defaulted hook, not an abstraction) |
| Design system (shadcn/ui + Tailwind, customisable) | 1 (install), 14–15 (customise into Anabranch's tokens) |
| localStorage persistence | 4, 8 |
| JSON export/import | 5, 23 |
| Walking skeleton live by hour 10–15 (the gate) | 1–12 |
| Theme 1 — the system underneath | 14, 15 |
| Theme 2 — branch-from-selection + branch animation | 16, 17 |
| Theme 3 — honest states (first-run, streaming, errors, long threads) | 18, 19 |
| Theme 4 — density (chips, minimap, fit-view, auto-tidy) | 20, 21 |
| Theme 5 — keyboard flow | 22 |
| Theme 6 — export/import, sample canvas, OG, ship | 23, 24, 25 |
| Sample canvas mitigation (must not be cut) | 24 |
| Unit tests: context assembly + persistence/import-export round trip | 2, 4, 5 (plus 6, 20, 21 for other pure logic) |
| Everything else manual/in-browser/filmed | every UI task's manual-verification step |
| LATER.md parking lot | 13, 25 |
| MIT license, own public repo | 1 (LICENSE), 12 (push/deploy) |
| Deploy on Vercel | 12 |
| Non-goals wall (no auth/accounts/sync/collab/mobile/multi-provider/MCP/monetization) | honored by omission across all tasks |

**Placeholder scan:** No "TBD"/"add error handling"/"write tests for the above" left as work items. The two places that describe rather than show full code — Task 24 Step 1 (the sample `Canvas` literal) and Task 25 Step 2 (the OG image) — are content/asset authoring, not code logic; their shapes and constraints are fully specified.

**Type consistency:** `Canvas`/`Thread`/`Message`/`Role` are defined once (Task 2) and used verbatim throughout. Store action names are stable across tasks (`branch`, `sendMessage`, `appendToMessage`, `replaceCanvas`, `toggleCollapsed`, `tidy`, `loadSample`). `assembleContext`, `deriveTitle`, `tidyLayout`, `parseSSELines`, `describeApiError` keep one signature from definition through use.

## Execution Handoff

Deferred until the plan is approved (the user asked not to start implementing before approval). Once approved, the two execution options are subagent-driven (recommended) or inline execution.
