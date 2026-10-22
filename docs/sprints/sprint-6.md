# Sprint 6 — Every view in design C, the checks in both themes and both languages, the repository ready to be public, release 1.0.0 (VLW-43 to VLW-49, VLW-26)

**Status as of 2026-10-22:** planned for January 4 – 17, 2027; it starts early, right after Sprint 5's stories (VLW-37 to VLW-42). 24 points, with VLW-49 (added on 2026-10-22).

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
| VLW-47 | #71 | The network in design C. The map on a dotted card, this node on an ink card, each peer on a `surface` card with a 2×2 avatar from its URL (`peerHex`, FNV-1a, as the canvas does) and dashed edges that turn accent while resolving. The resolve, add-peer and list cards with C's sizes; outcomes on `ok-soft` or `danger-soft`. Nothing in `src` uses E's cube tokens any more | `/network` at 1440, 768 and 360 px, light and dark, English and Spanish: as an admin add a peer (it pops, the others glide) and resolve (pulses go out and come back); as a visitor, read-only |
| VLW-48 | this PR | The browser checks in both themes and both languages. `npm run test:a11y` runs each width twice, light in English (`desktop`, `phone`) and dark in Spanish (`desktop-dark-es`, `phone-dark-es`), from the browser's colour scheme and language: 84 checks, up from 42. The accessibility, robustness and end-to-end specs find every control by the dictionaries' words (`e2e/i18n.ts`), and the accessibility pass checks that the page took the project's language and theme. E's last tokens (the cube colours, `drop`, `float`) are gone from `index.css` and DESIGN.md | `npm run test:a11y` lists the four projects and passes; a low-contrast dark `muted` fails only `desktop-dark-es` (ARCHITECTURE_RULES.md › deliberate breaks) |
| VLW-49 | this PR | The repository ready to be public, as Willay's is (VIG-45): MIT license; `SECURITY.md` with GitHub's private vulnerability reporting, turned on; a README for visitors with the live demo, what to try, highlights, the audit's result, tests and architecture; `CLAUDE.md`, `.claude/`, `docs/AUDIT.md` and `docs/COMMENTS_REVIEW.md` out of version control; the repository's description, website and topics, and no wiki. With the API's VLA-39 | GitHub shows the license, the security policy and the About box; the README reads without broken links; `git ls-files` no longer lists the four local files |
| VLW-26 | — | — | — |

## Sprint decisions

- **A tile of the ribbon is named by its content** (VLW-43). A label of its own ("Block #11, 2 txs") hid the tile's visible text from its name, which axe reports. The content is ordered to be read as "#11 16:34 0000a3f19c… · 2 txs, links to #10", and order classes draw the link on top, as the canvas does.
- **The mocked API's hashes look like a chain's** (VLW-43): the proof of work's four zeros, then hex that changes from block to block, so the fingerprints in the accessibility pass and in screenshots are like a real node's.

- **A fingerprint on ink is ringed with `ink-line`** (VLW-44). `fp-ring` is nearly transparent in the light theme, so the ink bar of a document's fingerprint vanished on the certificate's ink panel; the legend already used `ink-line`.
- **The mocked API has a sealed notarization** (VLW-44), the API's own "notarization" vector in block #9, so the accessibility pass checks the certificate on ink, which no other case draws.
- **Light in English and dark in Spanish, not all four pairs** (VLW-48). A theme changes only colours and a language only words, so two pairs per width reach every colour of both themes and every text of both languages, at half the time of four. Both come from the browser (`colorScheme`, `locale`), so the checks also cover a first visit that follows the system and the browser's language; the stored choice is covered by the unit tests.
- **Both repositories were already public** (found on 2026-10-22, VLW-49). GitHub showed them as public before this sprint, so their history was searched for secrets: GitHub's scanning had no open alert, and a search for passwords, keys and tokens found only test vectors, CI values and the development admin password, which the API refuses in production (VLA-24). Taking the internal files out of version control hides them from now on; their history stays.
- **The specs speak the dictionaries** (VLW-48). A spec that typed "Sign in" would find nothing in Spanish, and would break the day a text changes. `e2e/i18n.ts` gives every test the dictionary of its project's language, with helpers for texts that carry a number.

## Changes to the specification in this sprint

- The tower becomes the chain (VLW-43).
- The transaction page in design C (VLW-44).
- Sign and send in design C (VLW-45).
- The wallet in design C; the identity cube leaves the architecture (VLW-46).
- The network in design C (VLW-47).
- The browser checks in both themes and both languages, and the end of E's tokens (VLW-48).
- The repository's tree: `LICENSE` and `SECURITY.md`; the agent's instructions and the internal notes stay local (VLW-49).

## Retro

- **Went well:** —
- **To improve:** —
- **To try:** —
