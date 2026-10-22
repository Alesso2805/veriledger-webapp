# ADR-0006: Design direction C ("Fingerprint"), replacing direction E

- **Status:** Accepted on 2026-10-22 (product owner)
- **Date:** 2026-10-22
- **Supersedes:** ADR-0004 for the direction. Its rule that the canvas and the code show the same thing, with the same tokens and motion, stays.
- **Related:** [DESIGN.md](../DESIGN.md); ADR-0007 (two languages); ADR-0008 (light and dark themes); epic E6, VLW-37 to VLW-48

## Context

Direction E was built in Sprints 1 to 3 and deployed on 2026-10-22. On the same day, directions C, D and E were drawn in full on the canvas: every view, at 1440, 768 and 360 px, with the same data, states and copy. The product owner compared them and chose C.

## Options

1. **Keep E.** Built, deployed and tested; the dark technical look is common among ledger explorers.
2. **Move to D ("Containers").** A strong metaphor (parcels, containers, a train), loud and brutalist; the train scrolls sideways on a phone.
3. **Move to C ("Fingerprint").** The first bytes of a hash drawn as coloured bars. Each block shows its own fingerprint and the one it links to, so the chain visibly holds together, from real data (`hash` and `previous_hash`).

## Decision

Option 3, under the same rules ADR-0004 set for E:

- **Same tokens in the canvas and the code.** The token names stay (`--color-vl-*`, `--font-vl-*`, `--animate-vl-*`), so code that uses them keeps working. The values change.
- **Motion is CSS only and starts from a real event.** The motion map is in DESIGN.md.
- **Every view maps to endpoints.** What the API cannot provide is not drawn.
- **What the canvas shows is what ships.** At 1440, 768 and 360 px, in both themes (ADR-0008) and both languages (ADR-0007).

**Visual language.**

- **Ground and cards:** a cool grey ground, with white cards at radii of 24 to 28 px and no borders. Fields have a 1.5 px border that passes 3:1.
- **Accents:** one accent, cobalt `#2F45FF`, for actions, focus and the `0000` of a seal. Dark ink panels hold what matters most: the key, the certificate and the message being signed.
- **Type:** Bricolage Grotesque for text and titles, JetBrains Mono for hashes and numbers, self-hosted with @fontsource.
- **Fingerprints:** eight colours, one per byte (byte mod 8).
  - A block shows 8 bytes of its hash.
  - An address shows a strip of 12 bars in the wallet and a 2×2 avatar in lists.
  - A signature and a notarized document show their own fingerprints.
  - The fingerprint is decoration next to the hash or address, never instead of it.

**What changes in the code.**

| Today (E) | With C |
| --- | --- |
| The **tower** | A **ribbon** of block tiles, oldest to newest, each linked to the one before |
| The view's name, Tower | The chain (the `/` route does not change, nor does any other route) |
| The **identity cube** (`identicon.ts`, `IdentityCube.tsx`) | The fingerprint (`fingerprint.ts`) |
| Peers on the network map | Cards with their avatar |

**What the exploration of C had that the final views do not**, because the API cannot back it:

- the "change one entry" tamper demo;
- colours that flicker while mining (mining shows elapsed time, as before);
- "Synced with 2 peers";
- a balance that counts up;
- a filter on the activity that the backlog does not ask for.

## Consequences

- Epic E6 rebuilds the views in C, one story per view, each in both languages and both themes.
- DESIGN.md is rewritten for C (VLW-38). Its CSS block, light and dark, becomes what AR-10 compares with `src/index.css`.
- The canvas keeps E's and D's pages as history. "C · Vistas finales" is the specification.
- Release 1.0.0 waits for C (product owner, 2026-10-22), so the README's screenshots show the design that ships (VLW-26).
- A tile's colours come from bytes of the hash, so two blocks rarely look alike. Colour is still never the only signal: to someone who cannot tell the colours apart, the number and the hash written beside them say the same.
