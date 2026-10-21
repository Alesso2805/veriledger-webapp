# Sprint 2 — The tower, and signing that works with keys that never leave the browser (VLW-15 to VLW-18, VLW-28, VLW-30)

**Status as of 2026-10-20:** planned for November 9 – 22, 2026. 17 points. Its counterpart, the API's Sprint 2, is VLA-16, VLA-17, VLA-19, VLA-20, VLA-33, VLA-34 and VLA-36.

**Order:** VLW-15 and VLW-16, then VLW-30 on top of them, then VLW-18 once the API's nonce exists, then VLW-17, then VLW-28 when VLA-20 and VLA-33 are merged.

**Decisions before it starts**

- **Settled on 2026-10-20:** the product owner accepted the API's ADR-0002, ADR-0004 and ADR-0005, and the webapp's ADR-0002 and ADR-0003.
- **Still waiting:** VLA-15 must publish `docs/signing-vectors.json`. VLW-15 and AR-06 depend on it.

**Dependencies on the API**

| Webapp story | Needs |
| --- | --- |
| VLW-15 | VLA-15 (signing vectors) |
| VLW-18 | VLA-16 (the nonce endpoint) |
| VLW-28 | VLA-20 (block number and hash on a transaction) and VLA-33 (pending transactions) |

## What was delivered

| Story | PRs | Result | Verification |
| --- | --- | --- | --- |
| VLW-15 | — | — | — |
| VLW-16 | this PR | `src/lib/keys.ts` generates the Ed25519 pair with `@noble/curves` as raw 32-byte lowercase hex, the format the API verifies, and it is checked against RFC 8032 test 1. The wallet page no longer calls `/wallets/generate` and says the key was never sent and is not stored. AR-05 no longer lists Wallet as a known violation. The test that records every request of the flow moved to VLW-30 (product owner, 2026-10-20) | 69 + 2 tests. In Chrome against a local API, "Generate New Wallet" shows two 64-hex keys and sends no request at all (Resource Timing is empty apart from `/health`) |
| VLW-30 | — | — | — |
| VLW-18 | — | — | — |
| VLW-17 | this PR | A 401 on a request that carried the session ends it (`expire()` in the store), and the guards take the person to the login with "Your session expired" and back to the page afterwards. A stored token whose `exp` has passed is dropped at start; `src/lib/jwt.ts` reads `exp`, and the API still checks the signature. A token with no readable `exp` is left for the API to judge. Only the token is persisted, so the notice does not return on a reload. The empty form came with VLW-33 | 83 tests (12 new: jwt, the store's `expire`, the 401 interceptor, the expired-token and mid-visit redirects). In Chrome against a local API: a stored token with a past `exp` led to the login with the notice and was cleared; a forged token with a future `exp` got a 401 from `/auth/me` and did the same; signing in returned to `/network` |
| VLW-28 | — | — | — |

## Sprint decisions

—

## Changes to the specification in this sprint

—

## Retro

- **Went well:** —
- **To improve:** —
- **To try:** —
