# LATER

The parking lot. Per the spec (`docs/spec.md`), **done** is the six themes
shipped — nothing more. This file is where every idea beyond them gets parked,
**visibly**, so that "it could be a product" pressure has somewhere to go that
isn't scope creep. Parking an idea here is the win, not a deferral of a promise.

Adding something to this file is free. Taking something *out* of it — promoting
it into the build — is a scope decision that reopens the contract, and should be
rare.

---

## Parked by the non-goals wall (permanent for this artifact)

These are explicitly **out**, forever, for Anabranch. They live here so the
pressure to add them lands in a file instead of in the build. If any of them is
ever worth doing, it is a *different* artifact, not a change to this one.

- Auth / accounts
- Cloud sync
- Collaboration / multiplayer
- Mobile
- Multi-provider support (OpenAI, local models, a provider-abstraction layer) —
  named in the spec as "exactly the speculative plumbing the scope contract
  exists to kill"
- MCP or tool use
- Monetization

## Post-v1 features we already know we want

Not in the six-theme scope, but decided as genuine future work (distinct from
the permanent non-goals above):

- **Anthropic model selector.** A picker to switch between Anthropic models
  (Opus / Sonnet / Haiku) per thread or per canvas — a nice interaction
  opportunity and a natural bit of chrome. **This is not multi-provider
  support** (which stays a permanent non-goal): it selects among Anthropic
  models only, so it sits comfortably inside the scope contract. The v1 build
  leaves a one-line hook for it — `streamMessage` accepts an optional `model`
  that defaults to `DEFAULT_MODEL` — so adding the selector later is a UI
  addition, not a refactor.

- **Merging / rejoining threads.** Fold a branch that reached a useful
  conclusion back into its parent, combining two thread-nodes into one. Wanted,
  and named: an *anabranch* is a river channel that leaves the main stem and
  **rejoins** it downstream, so the name describes the finished idea rather than
  the v1 subset. Explicitly **not** in the six-theme scope, and considerably more
  expensive than it looks:

  **It changes the shape of the core data structure.** Today every thread has
  exactly one parent, so the canvas is a *tree* and `assembleContext` is a plain
  walk up to the root. A merged thread has two parents, which makes the canvas a
  **DAG** — a directed acyclic graph, meaning a node may have several parents but
  no path ever loops back on itself. Once that is true, "the ancestor chain"
  stops being a single path, and three questions with no obvious right answer
  appear:

  - How do two parent histories interleave into one message list the model reads
    sensibly — by timestamp, by branch, or in some authored order?
  - Ancestors that both parents share: included once, or twice?
  - What happens when the merged context blows the token budget?

  That is a redesign of the one piece the spec singles out as "the one place a
  subtle bug produces silently wrong AI answers" — not a feature bolted onto v1.
  If it is ever built it earns its own spec and its own test suite. Parked here
  deliberately: wanting it is not a reason to widen the six themes.

## Density overflow (capped at its week)

The density theme is one week. Anything past that cap parks here rather than
eating the week:

- Layout collision avoidance for pathological graphs (hundreds of nodes)
- Very-long-thread performance work beyond basic scrolling
- Huge-graph rendering / virtualization
- Smarter auto-tidy (force-directed, or preserving manual positions)

## Ideas banked from the brainstorm (future artifacts, not this one)

Recorded so they stay banked rather than lost. These are candidates for
artifact two and beyond, not for Anabranch:

- **Acasa rebuild** — one-feature redesign-rebuild of helloacasa.com.
- **Open-source B2B redesign** — Mautic / Zammad / SuiteCRM-tier target;
  needs a scouting pass.
- **The Mac app delight rep** — a small, obsessively polished utility
  (Timezone Pro genre); timeboxed weekend piece, never competes with artifact
  hours.
- **Design mode for OBS** — dead as an artifact (wrong audience, hostile
  C++/Qt terrain), kept only as the note that flagged the pull toward
  canvas / direct-manipulation surfaces that Anabranch now serves.

## Ideas that arrived mid-build

Running list — append here as they come up, don't act on them:

_(empty)_
