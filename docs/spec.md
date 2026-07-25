# Proof artifact one: Anabranch (design)

Drafted 24 July 2026. This closes phase 2 of the launch roadmap: artifact one is
chosen, scoped, and specced. It records the decision trail so the ideas that
lost stay banked rather than lost, and it defines the artifact tightly enough
that phase 3 can start building without reopening scope.

## The decision

Artifact one is **Anabranch**: a web app where an AI conversation lives on an
infinite canvas instead of a scrolling column, and a new thread can be branched
from any message, or from a selected line of text inside a message, with every
branch visible and navigable as a node graph.

The one-sentence proof it carries: a designer who ships product, an
opinionated, polished, working tool in the exact space his buyers live in
daily, built in public with the agents it's built for.

The name is settled: **Anabranch**, chosen 25 July 2026 after the collision
check the risks list below called for. It replaced the working title Tangent.
An anabranch is a river channel that leaves the main stem and rejoins it
downstream — divergence, and the eventual reconvergence that merging threads
would one day be.

## Why this one, and what got banked

The brainstorm locked three constraints first: dense product UI with a system
underneath and motion as the garnish (the B-then-C-then-A craft signature);
open about the agent-assisted workflow but centered on design judgment; and
30-40 hours of protected time with something publicly live by hour 10-15.

Anabranch won on motivation, ownership, and adjacency. A thing made beats a
thing improved on the future Fold site and in the human-story thread. The
canvas plays to a real pull toward editor-grade interaction surfaces. And in
2026 the buyer lives in agent workflows daily, so product thinking applied to
AI tooling reads as their world, not a hobby. The scope risk that originally
benched the idea is handled by React Flow doing the canvas mechanics and by
the scope contract below.

Banked candidates, in order of strength, for artifact two and beyond:

- **Acasa rebuild.** A one-feature redesign-rebuild of helloacasa.com, a
  visibly stagnant household bill-splitting app Alex used and resents. Lived
  critique plus a real before/after baseline, no codebase to inherit. Held
  back from artifact one because it is a consumer app, not the locked B2B
  surface, and because "could become a product" is the named second-business
  trap.
- **Open-source B2B redesign** (Mautic, Zammad, SuiteCRM-tier roughness).
  The strongest buyer-legibility and built-in before/afters; needs a scouting
  pass to pick a target that is recognizable, rough, and easy to run.
- **The Mac app delight rep.** A small, obsessively polished utility in the
  Timezone Pro genre. Never competes with artifact hours: it is a timeboxed
  weekend piece (3-5 hours) whose recording is craft content. If it turns out
  genuinely lovely it can graduate to a Fold-site feature and a launch push,
  as Timezone Pro did for Friendly. Note the optics: a small utility showpiece
  is literally Friendly's move, so the framing must be Alex's own, not an echo.
- **Design mode for OBS.** Dead as an artifact (wrong audience, hostile
  C++/Qt terrain, multi-hundred-hour genre), but it flagged the pull toward
  canvas and direct-manipulation surfaces that Anabranch now serves.

## The scope contract

Agreed before design and binding through the build:

- It is a web app with a live URL, bring-your-own-API-key. No auth, no
  accounts, no cloud sync, no collaboration, no mobile.
- A walking skeleton is publicly live by hour 10-15.
- Every hour after the skeleton deepens the artifact in public, each week a
  visible before/after.
- It is an artifact, not a startup. Others exist in this space and that is
  fine. "Done" is defined in this spec, not by a roadmap of user requests.

## The interaction model

**A node is a thread, not a message.** Each node on the canvas is a compact
column of messages, scrollable, with its own composer. The alternative, one
node per message, fails at density: a real conversation becomes hundreds of
nodes and the graph turns to spaghetti at exactly the moment the tool should
be proving its worth. Threads-as-nodes keeps the canvas legible at real scale,
and it makes the core content unit crisp: one wall of linear chat versus a
tree of focused threads.

Branching creates a new thread-node, connected by an edge anchored to the
exact message it sprang from. A branch's context is the ancestor chain: every
message from the root down to and including the branch point. Branching from a
text selection additionally seeds the new thread with the selection quoted, so
going off on a tangent is one gesture. Context assembly is a walk up the
tree, and it is the one genuinely algorithmic piece of the app.

## Architecture

A client-only static app. React, Vite, TypeScript. React Flow
(@xyflow/react) does canvas mechanics: pan, zoom, nodes, edges. Deployed on
Vercel. There is no server and no database: that is the scope contract made
physical, and the reason the whole hour budget lands on interaction design
and polish instead of plumbing.

The Anthropic API key is entered once, stored in localStorage, and sent
directly from the browser to the Anthropic API (the CORS path Anthropic
supports via the anthropic-dangerous-direct-browser-access header), with
streaming responses. The UI says plainly: your key never leaves your browser
except to go to Anthropic. Anthropic-only for v1; a provider abstraction is
exactly the speculative plumbing the scope contract exists to kill.

Persistence is localStorage, so canvases survive refresh, plus export and
import as JSON so nothing feels trapped. That is the whole data story.

## Build sequence

**Walking skeleton, live by hour 10-15:** one thread node on a canvas; send,
stream, receive; branch-from-message creating a connected node; pan and zoom;
key entry; localStorage persistence; deployed at the live URL. Ugly is
acceptable; working is not negotiable.

Then one deepening theme per week, each one a before/after post:

1. **The system underneath.** Tokens, type scale, spacing; the node, edge,
   and composer components rebuilt on it.
2. **Branch-from-selection and the branch animation.** Node sprouts, edge
   draws, camera eases over. The screen-recording money shot.
3. **Honest states.** First-run and empty (key entry as a designed moment,
   not a form), streaming, errors (bad key, rate limit, network), long-thread
   handling.
4. **Density.** Collapse threads to title chips, minimap, fit-view, auto-tidy
   layout.
5. **Keyboard flow.** Cmd+enter, node-to-node navigation, quick-branch. The
   pass that makes it feel like a tool, not a demo.
6. **The finishing pass.** Export and import, a sample canvas so keyless
   visitors can still touch it, OG images, the ship post.

## What done means, and the non-goals wall

Done is the six themes shipped. A LATER.md in the repo collects every idea
beyond them, which is where any "it could be a product" pressure gets parked,
visibly.

Non-goals, permanent for this artifact: auth, accounts, cloud sync,
collaboration, mobile, multi-provider support, MCP or tool use, monetization.

## Testing

Unit tests cover context assembly (the tree walk, the one place a subtle bug
produces silently wrong AI answers) and the persistence and import-export
round trip. Everything else is manual, in-browser, and filmed, since for a
craft artifact the testing is itself the content.

## Where it lives

Its own public repo from day one, MIT licensed, in its own Conductor
workspace. Build-in-public with a private repo would be a half-measure, and
under the agent-open stance the code being agent-written is part of the
story, not a liability. This fold-studio repo keeps the strategy and specs;
the artifact is a product and gets a product's home. Off-hours, zero Friendly
overlap, per the standing confidentiality rule.

## The content mine, briefly

The build feeds the audience spec's four layers directly: the build log is
the weekly theme-by-theme story; the craft micro-content is the branch
animation, the states, the density work, each a recording; the buyer-legible
thesis rides along as "AI tooling is where the design-to-code gap is worst;
this is what design engineering does about it"; and the human thread is
building an agent tool with agents. The recurring before/after unit is the
same conversation as a wall of linear text versus a navigable canvas.

## Risks and open items

- Canvas UIs are deep. React Flow covers the mechanics, but edge cases
  (layout collisions, very long threads, huge graphs) can eat hours. The
  density theme is capped at its week; overflow goes to LATER.md.
- The browser-direct API path means the artifact is useless to visitors
  without an Anthropic key. The sample canvas in theme 6 is the mitigation,
  and it matters enough that it must not be cut.
- Momentum at 5 hours a week is the roadmap's named risk. The skeleton gate
  at hour 10-15 exists to put a live URL in the bio early; if the skeleton
  slips past hour 20, cut scope, not the gate.
- ~~The name.~~ **Closed 25 July 2026.** The check ran before the first public
  post and forced a rename: an existing branching-AI-chat project already held
  the name Tangent. Thirty-one alternatives across four naming lanes were
  checked for collision and subdomain availability; the artifact is now
  **Anabranch**, and the skeleton gate deploys to `anabranch.vercel.app`
  (confirmed free 25 July 2026). No domain purchased and no
  handle created — posts go out from Alex's own account, per the artifact-not-
  startup rule. Full trail: `docs/superpowers/specs/2026-07-25-name-decision.md`.
- Crowded space. Branching-chat tools exist and more will appear mid-build.
  Irrelevant to an artifact whose job is proof and point of view; the spec
  records this so mid-build discouragement doesn't reopen the decision.
