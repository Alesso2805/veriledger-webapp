# Sprint 6 — Every view in design C, the checks in both themes and both languages, release 1.0.0 (VLW-43 to VLW-48, VLW-26)

**Status as of 2026-10-22:** planned for January 4 – 17, 2027; it starts early, right after Sprint 5's stories (VLW-37 to VLW-42). 22 points.

**Why this sprint exists** (product owner, 2026-10-22). Sprint 5 drew C's dark theme and Spanish texts, and put C's tokens, both themes, both languages, the shell and the sign-in into the code. This sprint rebuilds the remaining views in C, one story each, then runs the checks in both themes and both languages, and releases 1.0.0 with screenshots of C.

**Order** (product owner, 2026-10-22):

1. VLW-43, the chain, which replaces the tower.
2. VLW-44 to VLW-47: the transaction and its certificate, Sign and send, the wallet, the network.
3. VLW-48, the checks in both themes and both languages, and E's leftovers removed.
4. VLW-26, release 1.0.0, with the README's screenshots taken from the deployed instance.

**Dependencies on the API:** none.

**The deployed instance** keeps its pinned image (`WEBAPP_IMAGE_TAG`) until the epic is done, so visitors never see a half-redesigned app. Updating it is the product owner's (the API's runbook, step 6).

## What was delivered

| Story | PRs | Result | Verification |
| --- | --- | --- | --- |
| VLW-43 | #67 | The chain in design C, replacing the tower. The ribbon of the newest 10 blocks, each tile with its fingerprint and the fingerprint it links to; pointing at a tile lights the link, and a caption explains it; the dashed next tile counts the mining time. The detail with the block's fingerprint, the list, the mine card (it starts with the address of the key held in the tab), the waiting list with avatars, and "How to read a fingerprint". `fingerprint.ts` gains `afterProofOfWork`; `isometric.ts` and the tower's components are gone | `/` at 1440, 768 and 360 px, light and dark, English and Spanish: point at a tile and its link lights; mine a block and its tile slides in |
| VLW-44 | #68 | The transaction and its certificate in design C. The journey on a card, the status chip on `ok-soft`, `wait-soft` or `danger-soft`, the details with the mint signature check, "Sealed in" with the block's fingerprint and "N blocks link back to it". The certificate on ink: the document's fingerprint over its hash in groups, and a checked file's fingerprint under the certified one, so a mismatch shows bar by bar. The mocked API gains a sealed notarization, so the accessibility pass draws the certificate | `/transaction/<hash>` of a transfer and of a notarization at 1440, 768 and 360 px, light and dark, English and Spanish: check the original file (Match) and an edited one (No match, its bars differ) |
| VLW-45 | #69 | Sign and send in design C. "Signing as" with the address's fingerprint and the balance; the kind switch as a `strong` pill; the document's fingerprint once it is hashed; the message on ink; the signature's 16-bar fingerprint growing above its hex, with an accent ring; the three tiles of what travels; refusals on `danger-soft`; "Accepted by the node" on `ok-soft`. The amount turns red only when the balance does not cover it with the fee (`checkDraft` returns `covered`) | `/transact` at 1440, 768 and 360 px, light and dark, English and Spanish: with no key; with the wallet's key, notarize a file and sign it; type more than the balance |
| VLW-46 | #70 | The wallet in design C. The address's fingerprint of 12 tall bars, growing in when the key was just made or opened; the address in groups with "Copy address"; the balance in large numbers. The key's steps and the forget confirmation on ink. The activity with each row's avatar and a status chip (`activityRow` gains `peer`); a look-up whose fingerprint builds as the address is typed, with "Balance of …". `IdentityCube.tsx` and `identicon.ts` are gone | `/wallet` at 1440, 768 and 360 px, light and dark, English and Spanish: create a wallet (its bars grow), download and confirm the key, forget it inline; open a key file with activity; type an address in the look-up |
| VLW-47 | this PR | The network in design C. The map on a dotted card, this node on an ink card, each peer on a `surface` card with a 2×2 avatar from its URL (`peerHex`, FNV-1a, as the canvas does) and dashed edges that turn accent while resolving. The resolve, add-peer and list cards with C's sizes; outcomes on `ok-soft` or `danger-soft`. Nothing in `src` uses E's cube tokens any more | `/network` at 1440, 768 and 360 px, light and dark, English and Spanish: as an admin add a peer (it pops, the others glide) and resolve (pulses go out and come back); as a visitor, read-only |
| VLW-48 | — | — | — |
| VLW-26 | — | — | — |

## Sprint decisions

- **A tile of the ribbon is named by its content** (VLW-43). A label of its own ("Block #11, 2 txs") hid the tile's visible text from its name, which axe reports. The content is ordered to be read as "#11 16:34 0000a3f19c… · 2 txs, links to #10", and order classes draw the link on top, as the canvas does.
- **The mocked API's hashes look like a chain's** (VLW-43): the proof of work's four zeros, then hex that changes from block to block, so the fingerprints in the accessibility pass and in screenshots are like a real node's.

- **A fingerprint on ink is ringed with `ink-line`** (VLW-44). `fp-ring` is nearly transparent in the light theme, so the ink bar of a document's fingerprint vanished on the certificate's ink panel; the legend already used `ink-line`.
- **The mocked API has a sealed notarization** (VLW-44), the API's own "notarization" vector in block #9, so the accessibility pass checks the certificate on ink, which no other case draws.

## Changes to the specification in this sprint

- The tower becomes the chain (VLW-43).
- The transaction page in design C (VLW-44).
- Sign and send in design C (VLW-45).
- The wallet in design C; the identity cube leaves the architecture (VLW-46).
- The network in design C (VLW-47).

## Retro

- **Went well:** —
- **To improve:** —
- **To try:** —
