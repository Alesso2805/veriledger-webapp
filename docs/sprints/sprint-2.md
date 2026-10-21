# Sprint 2 — The tower, and signing that works with keys that never leave the browser (VLW-15 to VLW-18, VLW-21, VLW-22, VLW-28, VLW-30)

**Status as of 2026-10-20:** planned for November 9 – 22, 2026. 22 points, with VLW-21 moved in from Sprint 4 and VLW-22 from Sprint 3. Its counterpart, the API's Sprint 2, is VLA-16, VLA-17, VLA-19, VLA-20, VLA-33, VLA-34 and VLA-36.

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
| VLW-15 | this PR | `src/lib/signing.ts` holds `buildSignedMessage`, which builds the API's ADR-0004 message, `toAmount`, which gives the 8-decimal spelling without floats, and `signMessage`. The transact page signs through `lib` and sends the signed strings, so it no longer imports `@noble`: AR-02's exception and the `@ts-ignore` are gone. The API's vectors (version 1, copied at 7ce0465) pass in `src/lib/signing.test.ts` (AR-06) | 121 tests, including 4 vectors × message, signature and public key. By hand, against the API at main (7ce0465) on a throwaway database: a wallet generated in the browser, a block mined to it (50); a transfer of 10 with fee 0.1 and a notarization of a SHA-256 were both accepted. The request bodies carried `"10.00000000"`, `"0.10000000"` and `"0.00000000"`, and no private key. After a second block the balances were 90 and 10 |
| VLW-16 | this PR | `src/lib/keys.ts` generates the Ed25519 pair with `@noble/curves` as raw 32-byte lowercase hex, the format the API verifies, and it is checked against RFC 8032 test 1. The wallet page no longer calls `/wallets/generate` and says the key was never sent and is not stored. AR-05 no longer lists Wallet as a known violation. The test that records every request of the flow moved to VLW-30 (product owner, 2026-10-20) | 69 + 2 tests. In Chrome against a local API, "Generate New Wallet" shows two 64-hex keys and sends no request at all (Resource Timing is empty apart from `/health`) |
| VLW-30 | — | — | — |
| VLW-18 | — | — | — |
| VLW-17 | this PR | A 401 on a request that carried the session ends it (`expire()` in the store), and the guards take the person to the login with "Your session expired" and back to the page afterwards. A stored token whose `exp` has passed is dropped at start; `src/lib/jwt.ts` reads `exp`, and the API still checks the signature. A token with no readable `exp` is left for the API to judge. Only the token is persisted, so the notice does not return on a reload. The empty form came with VLW-33 | 83 tests (12 new: jwt, the store's `expire`, the 401 interceptor, the expired-token and mid-visit redirects). In Chrome against a local API: a stored token with a past `exp` led to the login with the notice and was cleared; a forged token with a future `exp` got a 401 from `/auth/me` and did the same; signing in returned to `/network` |
| VLW-28 | 28a (#23), 28b (#24), 28c (this PR) | **28a, the data.** `src/services/ledger.ts` reads blocks, one block by hash, and the mempool, and it mines. Each read rejects an answer that is not the API's, such as `index.html`. `src/types/ledger.ts` has the VLA-20 fields and `FullBlock`, and `status` says `FAILED`, as the API does, instead of `REJECTED`. `src/lib/format.ts` writes amounts, nonces, short hashes, the kind and route of a transaction, and local times. **28b, the tower** replaces the explorer at `/`: the drawing of the newest 10 blocks, the list with "Load older blocks", the selected block with its transactions, the waiting list, and height, waiting count and last block. It polls every 10 s; a new block drops in with "Block #n joined the chain.", and the counts pop. `?block=n` selects and keeps a block. The loading, empty and error states follow the decisions above. `src/lib/chain.ts` merges pages of blocks and notices a replaced chain; `detailOf` gives the API's error text. The selected cube uses two new tokens. **28c, mining.** The card takes a reward address. While the request is pending, a dashed cube floats on the tower, the elapsed time counts in the browser, and the waiting list dims. The sealed block becomes the selection, with the toast "Block #n sealed · nonce N · reward R VL"; the reward comes from the block's coinbase. A refusal shows the API's `detail` in a toast. A viewer sees the button disabled with the reason, and so does anyone while `/health` fails. The role from `/auth/me` now lives in the session store, so the user chip and the tower share one request. A poll sent before a mined block arrives cannot take that block away again | 159 tests after 28b (16 new); 165 after 28c (6 new). In Chrome, against the API at main (080ab56) on a throwaway database with 12 to 15 blocks and a pending transfer: the tower, list, detail and waiting list matched the artboard at 1280 px (three columns) and at 360 px (one column, no sideways scroll). `?block=12` opened block 12 with its two transactions, and "Load older blocks" reached #0. A block mined from outside appeared at the next poll with its toast, and the toast closed after 4 s. The test of the list caught that the button's accessible name read "Block #21 tx"; spaces between the spans fixed it. 28c, in Chrome against the same API: mining blocks #15 and #16 showed the floating cube, the elapsed time and the dimmed waiting list. Each new block was selected, with the toast "Block #16 sealed · nonce 176,501 · reward 50.00 VL" and no second toast from the next poll. At 360 px the card stacks under the tower |
| VLW-21 | this PR | The API base URL comes from `/config.json`. `docker/write-config.sh` writes `{"apiBaseUrl": …}` from `API_BASE_URL` (default `/api`), and `main.tsx` reads the file before rendering. Without the file it falls back to `VITE_API_URL` (`.env.development`, `.env.test`) or the same origin's `/api`. AR-07 has no known violation left, and the production bundle contains no URL. `getHealth` now accepts only the API's `{"status": "ok"}`: a misrouted `/api` gets `index.html` with a 200 and showed "online" | 90 tests. With the production build served on :5173 and a `config.json` from the script, the app fetched `/config.json` first and then called `http://127.0.0.1:8000`; signed in, it showed the explorer with 14 blocks. Without `config.json`, the server answered `index.html` and the app called `127.0.0.1:5173/api/...`, which is the same-origin fallback |
| VLW-22 | this PR | `Dockerfile`: Node 22 builds the files and Caddy 2.11.7 serves them as a non-root user on :8080, with both bases pinned by digest. At start it writes `config.json`. `docker/Caddyfile` sends the `index.html` fallback, a year-long cache for `/assets/*` and `no-store` for the rest, a strict CSP (`CSP_CONNECT_SRC` for an API on another origin) and the security headers, without a `Server` header. `docker/smoke-test.sh` checks a running image. The Image workflow builds amd64 and arm64 and smoke-tests amd64, with actions pinned by SHA. `.gitattributes` keeps the container files LF: on this Windows checkout the script had CRLF and would have failed at start | A local build gave a 94 MB image. The smoke test passed with the default `/api` and failed against a plain static server and against the first image, whose CSS had `data:` fonts. With the image on :5173 against a local API, `/wallet` and `/transaction/<hash>` opened directly, `config.json` was read first, and the calls went to the API. Two Martian Mono subsets were first blocked by the CSP; after `assetsInlineLimit: 0`, all 18 fonts loaded and no `data:` URI was left |

## Sprint decisions

- **VLW-21 moved in from Sprint 4 and VLW-22 from Sprint 3** (product owner, 2026-10-21). Every remaining Sprint 2 story waits for the API (VLA-15, VLA-16, VLA-20, VLA-33), and these two do not.
- **VLW-28 in three PRs** (product owner, 2026-10-21): 28a the data, 28b the tower, 28c mining. The same day the product owner decided three differences from the artboard. The artboard and DESIGN.md change with the PR that builds each one:
  - **One message when the API is down.** The shell's offline banner says it; the tower keeps the last blocks and its freshness line says it is retrying. The tower's own error card is only for failures the banner does not explain, such as a 500 from `/blocks`, and it shows the API's `detail`.
  - **"Block #n joined the chain."** When polling finds a new block, the toast says this instead of "arrived from another node", because another user of the same node may have mined it.
  - **Two new tokens** for the selected cube's sides, `--color-vl-cube-left-on` and `--color-vl-cube-right-on`, because the artboard's colours had none.
- **No assets inlined as `data:` URIs** (VLW-22). Vite inlined two small font files, which the Content Security Policy blocked; `build.assetsInlineLimit: 0` keeps the policy strict instead of allowing `data:`.
- **Found for VLW-28.** Without a working API behind `/api`, the old explorer gets HTML instead of blocks, calls `.reduce` on `undefined`, and the whole app goes blank. Nothing catches a render error. The tower must check the shape of `/blocks`, and a route-level error boundary would keep the shell alive when a page fails.

## Changes to the specification in this sprint

—

## Retro

- **Went well:** —
- **To improve:** —
- **To try:** —
