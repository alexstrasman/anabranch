# Anabranch

**[anabranch.vercel.app](https://anabranch.vercel.app)**

An AI conversation on an infinite canvas. Each node is a thread; branch a new
thread from any message. Bring your own Anthropic API key — it is stored only in
your browser and sent only to Anthropic.

Built in public as proof artifact #1 for Fold Studio. MIT licensed.

Currently the walking skeleton: it sends, streams, branches, persists, pans and
zooms, and it is deliberately unstyled. The design work runs as six themed
weeks from here — see `docs/spec.md`.

## Run locally
    npm install
    npm run dev

## Test
    npm test

47 tests across 7 files. The spec confines automated tests to the places a
silent bug is costly — context assembly (the ancestor-chain walk), the
persistence and import/export round trip, and SSE parsing plus error mapping.
Everything else is verified by hand in a browser, on purpose.

See `docs/spec.md` for the scope contract and `LATER.md` for parked ideas.
