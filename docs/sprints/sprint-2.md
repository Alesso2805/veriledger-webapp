# Sprint 2 — The tower, and signing that works with keys that never leave the browser (VLW-15 to VLW-18, VLW-21, VLW-28, VLW-30)

**Status as of 2026-10-20:** planned for November 9 – 22, 2026. 19 points, with VLW-21 moved in from Sprint 4. Its counterpart, the API's Sprint 2, is VLA-16, VLA-17, VLA-19, VLA-20, VLA-33, VLA-34 and VLA-36.

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
| VLW-21 | this PR | The API base URL comes from `/config.json`. `docker/write-config.sh` writes `{"apiBaseUrl": …}` from `API_BASE_URL` (default `/api`), and `main.tsx` reads the file before rendering. Without the file it falls back to `VITE_API_URL` (`.env.development`, `.env.test`) or the same origin's `/api`. AR-07 has no known violation left, and the production bundle contains no URL. `getHealth` now accepts only the API's `{"status": "ok"}`: a misrouted `/api` gets `index.html` with a 200 and showed "online" | 90 tests. With the production build served on :5173 and a `config.json` from the script, the app fetched `/config.json` first and then called `http://127.0.0.1:8000`; signed in, it showed the explorer with 14 blocks. Without `config.json`, the server answered `index.html` and the app called `127.0.0.1:5173/api/...`, which is the same-origin fallback |

## Sprint decisions

- **VLW-21 moved in from Sprint 4** (product owner, 2026-10-21). Every remaining Sprint 2 story waits for the API (VLA-15, VLA-16, VLA-20, VLA-33), and the runtime configuration does not.
- **Found for VLW-28.** Without a working API behind `/api`, the old explorer gets HTML instead of blocks, calls `.reduce` on `undefined`, and the whole app goes blank. Nothing catches a render error. The tower must check the shape of `/blocks`, and a route-level error boundary would keep the shell alive when a page fails.

## Changes to the specification in this sprint

—

## Retro

- **Went well:** —
- **To improve:** —
- **To try:** —
