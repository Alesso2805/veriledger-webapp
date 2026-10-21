# ADR-0004: Design direction E ("Network"), with motion that the code can reproduce exactly

- **Status:** Accepted on 2026-10-20 (product owner)
- **Date:** 2026-10-20
- **Related:** [DESIGN.md](../DESIGN.md); ADR-0001; VLW-27 to VLW-33; API VLA-20, VLA-33, VLA-34

## Context

The look built on July 29 (navy background, neon cyan and violet gradients, glass panels, blurred orbs) reads as generic and machine-made. Five directions were explored in a design canvas:

- A, a ledger book;
- B, a dark instrument;
- C, colour fingerprints;
- D, shipping containers;
- E, a block tower and a node network.

Each had an explorer and one signature screen.

The product owner chose E. They also required that the designs and transitions they approve be the ones the webapp ships, not an idealised version.

## Options

1. **Pick E and let the implementation interpret it.** Fast, but the result drifts: different easings, approximated colours, animations for data the API does not have.
2. **Pick E and pin it down:** the same tokens in the canvas and the code, motion only from a shared CSS block, every animation tied to a real event, every view mapped to endpoints.

## Decision

Option 2.

- **Visual language:**
  - dark slate surfaces;
  - one amber accent (`#FFB547`) for actions, focus and the `0000` of proof of work;
  - Instrument Sans for text and Martian Mono for hashes and numbers, self-hosted with @fontsource;
  - blocks drawn as isometric cubes stacked into a tower;
  - addresses drawn as cubes coloured from their bytes;
  - the network as this node with its registered peers on a ring.
- **Tokens and motion** are the CSS block of DESIGN.md, declared in Tailwind 4's `@theme`. The canvas uses the same custom properties.
- **Animations are CSS only** and start only on real events (DESIGN.md › Motion map). Mining shows elapsed time, not a nonce; resolving animates the requests to the peers, not gossip the API cannot see.
- **Views:** the eight artboards of the canvas page "E · Vistas finales" are the specification. A difference between an artboard and the code is a bug in one of them, fixed in the same PR as the change that caused it.
- **New data the views need** becomes API work instead of invented UI:
  - pending transactions (VLA-33);
  - an address's activity (VLA-34);
  - block number and hash on a transaction (added to VLA-20).

## Consequences

- The redesign adds seven stories (VLW-27 to VLW-33) and two API stories. On 2026-10-20 the product owner chose to bring it forward in order:
  - the foundation lands in Sprint 1;
  - each view lands when its API data exists, since the API moved its data endpoints to Sprint 2;
  - deployment stays in Sprint 4.

  See BACKLOG.md.
- VLW-20 ("honest states") is absorbed by the shell and view stories.
- The design canvas is private; reviewers need it shared from the canvas.
- The network map needs 860 px. On narrow screens it scrolls inside its box and the peer list repeats its content.
- `offset-path` (pulses) needs current browsers. Where it is missing, the dots stay at their start and the result card still says what happened.
