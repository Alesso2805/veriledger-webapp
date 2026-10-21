# Sprint 3 — Every other view in design E, open to visitors (VLW-19, VLW-29, VLW-31, VLW-32, VLW-34)

**Status as of 2026-10-21:** done, ahead of its dates (November 23 – December 6, 2026): all 14 points, in PRs #31 to #41. The production image of the original goal (VLW-22) had already come in Sprint 2. Its counterpart, the API's Sprint 3, delivered VLA-22, VLA-23, VLA-25, VLA-35 and VLA-37; VLA-18 is still to do there, and nothing here depends on it.

**Order** (product owner, 2026-10-21): VLW-29, then VLW-31, then VLW-19, then VLW-34 when VLA-35 is merged, then VLW-32 when VLA-19 is merged. Built as VLW-29, VLW-31, VLW-19a, VLW-32 (VLA-19 arrived first), VLW-34, and VLW-19b last, after VLA-37.

**Dependencies on the API**

| Webapp story | Needs | State at the close |
| --- | --- | --- |
| VLW-29 | VLA-20 (block number and hash on a transaction) | Merged before the sprint |
| VLW-31 | VLA-34 (an address's transactions) | Merged before the sprint |
| VLW-19 | VLA-20; VLA-37, the API's `docs/openapi.json`, for the generated types (AR-09) | Merged (VLA-37 on 2026-10-21) |
| VLW-34 | VLA-36 (public reads) and VLA-35 (`POST /auth/demo`, its claim, `demo_mode`, the limits) | Merged |
| VLW-32 | VLA-19 (peer roles, peer token, safe peer URLs) | Merged |

## What was delivered

| Story | PRs | Result | Verification |
| --- | --- | --- | --- |
| VLW-29 | 29a (#31), 29b (#32) | **29a, the page.** `/transaction/:hash` in design E:<br>• the header and its status chip;<br>• the journey (Signed → Accepted → Sealed → Buried), with the bar filling once and each step reached popping;<br>• the details;<br>• "Sealed in Block #n";<br>• the not-found page;<br>• polling every 10 s.<br>The signature is verified in the browser: `src/lib/transaction.ts` rebuilds the signed fields and `verifySignature` checks them. A mining reward reads "Created · by the node that mined it", because nobody signs it. Times are in UTC. **29b, the certificate.** "Proof of existence" states the block's seal (from `GET /blocks/{block_hash}`), not the time the node received the transaction. The fingerprint is in 8 groups. "Check a file against it" hashes a file with `crypto.subtle.digest`, and the file never leaves the browser | 246, then 249 tests. Each of the API's 4 vectors, stored as the API stores it, verifies, and a changed amount does not. In Chrome against the API at main: a sealed transfer; a waiting one that turned into "In block #23" at the next poll; an unknown hash; a mining reward. The certificate of `contract.txt` said 15:06:45 UTC, the seal, not 15:06:19, the submission. The file gave "Match", and another file "No match". At 360 px the fingerprint grid first nearly touched; `auto-fill` fixed it |
| VLW-31 | 31a (#33), 31b (#34) | **31a, identity and key.** "Create a wallet" or "Open a key file"; the large identity cube; the address in 8 groups and the balance. "Download .json" writes `{"public_key", "private_key"}` from a Blob, and "I stored it somewhere safe" folds the steps away. "Forget this key" confirms inline. `useKeyStore` remembers whether a key file exists, so Sign and send and the wallet agree. **31b, activity and look-up.** The 20 newest transactions of `GET /wallets/{address}/transactions`, each linked, fading in 40 ms apart. The sums under the balance are done in units of 10^-8, and shown only when the whole activity is loaded. "Look up any address" colours the cube a byte at a time | 255, then 268 tests. In Chrome, the download was checked by intercepting the anchor's click, so no file landed in the Downloads folder. The RFC 8032 test key listed its 4 transactions, and "100.20 received · 10.20 sent · 0.00 waiting" matched the balance of 90.00. A looked-up address gave 60.90 VL, the same as the API. At 360 px everything stacks with no sideways scroll |
| VLW-19 | 19a (#35), 19b (#41) | **19a, the search.** "Block number or hash" in the header looks up a block number or a full 64-character hash, never a prefix, as the API does. A full hash is tried as a block and as a transaction. Enter opens the first result, and Escape closes the dropdown. **19b, generated types (AR-09).** The API's `docs/openapi.json` is copied unchanged at bbae7db into `src/types/openapi.json`, and `npm run types:api` (`openapi-typescript`) writes `src/types/api.ts`. `ledger.ts`, `network.ts` and `session.ts` only name the generated schemas. A CI step regenerates the types and fails on a diff. The links by `tx_hash` and the `FAILED` status had come with VLW-28 | 281 tests after 19a; 333 after 19b. In Chrome, "21", the notarization's hash and block #21's hash each found their result, and "64b61372" asked for a full hash. The generated types caught two fields our hand-written types had as optional and the API always sends: a transaction's `signature` and `/health`'s `demo_mode`. AR-09's step fails when `api.ts` is edited by hand, and when `openapi.json` changes without regenerating (both tried on a throwaway branch) |
| VLW-32 | 32a (#36), 32b (#37) | **32a, the map, the list and adding a peer.** This node in the centre, with the peers on a ring that moves with `transform`; a new peer pops. Labels are short; for a screen reader the map is one image and the list carries the rest. Adding a peer (admin) shows the API's 400s in its own words, with a shake. Every peer reads "registered", never "ACTIVE". **32b, resolving.** While `POST /nodes/resolve` is pending, a pulse per peer travels out along its edge (`offset-path`) and loops. When it settles, one comes back. The card then says kept, adopted (with the height before and after) or failed (with a shake). `legacy.css` is deleted, and with it the last old styles | 302, then 306 tests. In Chrome against two local nodes (node 2 longer by 4 blocks): "Adopted a longer valid chain · Height went from 25 to 29", then "Our chain is already the longest valid one", then a forced network error. The pulses were seen with the request held for 3 s. At 360 px the map scrolls inside its box |
| VLW-34 | 34a (#38), 34b-1 (#39), 34b-2 (#40) | **34a, visitors.** The tower, a transaction, the network and the 404 open without a session (ADR-0005). `/wallet` and `/transact` still need one. Signed out, the header shows "Sign in", which returns to the same page. A session that ends on an open page still opens the login with its notice. **34b-1, "Try the demo".** It is in the header, the login and the tower's mine button ("Try the demo to mine"), shown only when `/health` says `demo_mode`. It starts a demo account and signs the visitor in where they are; the API's 429s are shown in its words. **34b-2, the demo's session.** The chip reads "Guest XXXX · demo · N h left" and counts down once a minute. "Your demo ended…" comes from the token's `demo` claim, on a 401 or after a reload | 314, then 325, then 333 tests. In Chrome against the API at main with `DEMO_MODE=true`: a demo from each of the three places; a demo account mined block #30. An expired demo token and a demo token the API rejected both opened "Your demo ended…". With every limit set to 1, the three 429s showed as written: the per-IP limit on the login and in the header, the mining limit on the tower |

## Sprint decisions

- **Product owner, 2026-10-21:**
  - **Story splits:** VLW-29 in two PRs; VLW-32 as 32a then 32b; VLW-34 as 34a, 34b-1 and 34b-2.
  - **Times** on the transaction page are in UTC.
  - **The search** is exact: a block number or a full hash.
  - **The 404** opens without a session too (ADR-0005).
- **Agreed with the API, approved by the product owner on 2026-10-21:**
  - **OpenAPI document.** It was brought forward as VLA-37 (option A), so VLW-19b stayed in this sprint.
  - **VLA-35.** It gained a `"demo": true` claim in the demo's token, so "Your demo ended…" holds after a reload, and `demo_mode` in `/health`, so "Try the demo" shows only on a node that has it. The API confirmed that its cleanup deletes only the account, never chain data.
- **`color-scheme: dark`** went into the CSS block (VLW-32b). `legacy.css` had styled the scrollbars, and without it Chrome drew light ones.
- **"Your demo ended…" no longer says "and its account was deleted".** The API deletes the account later, with a cleanup command (VLW-34b-2, canvas version 42).
- **`openapi-typescript` declares TypeScript `^5.x` as a peer.** `package.json` overrides that peer for this one package, instead of installing with `--legacy-peer-deps` (VLW-19b).
- **Two architecture checks were narrowed to what their rules say** (VLW-19b):
  - **AR-03:** `types` imports nothing *outside* `types`.
  - **AR-05:** the scan for `/wallets/generate` skips the generated `api.ts`, which describes endpoints but calls none.
  - Each still fails on a real violation (tried).
- **Found in the browser, each pinned by a regression test:**
  - Typing after a refused peer lost the focus (32a).
  - The demo's countdown started from when the page opened (34b-2).
  - AR-07 took "https://." in help text for a URL (32a).

## Changes to the specification in this sprint

Each change below went into SPEC.md in its own `docs(spec)` commit:

| Story | Change |
| --- | --- |
| VLW-29 | The transaction page and the certificate |
| VLW-31 | The wallet: identity, key file, activity, look-up |
| VLW-19 | The search; the API's types come from its OpenAPI document |
| VLW-32 | The network page and its calls; `legacy.css` gone |
| VLW-34 | The pages a visitor opens without a session; the demo account, its endpoint and `demo_mode`; how a demo's session ends |

DESIGN.md:
- It describes the transaction, wallet, network, search, visitor and demo states as built.
- It gained `color-scheme: dark`, and Motion map rows for what these views animate, among them the journey bar, the peer ring, the chip's fade and the demo button.
- The canvas went from version 36 to 42.

ARCHITECTURE_RULES.md:
- AR-07 needs a host after `//`.
- AR-08 lists the public routes.
- AR-03 and AR-05 were narrowed as above.
- AR-09 is checked.

ADR-0005 records that visitors read without a session.

## Retro

- **Went well:** every view landed the day its API data merged, checked in a real browser against a live API. Contracts were agreed with the API before its PRs (VLA-35's strings, the OpenAPI document), and generated types now catch drift: they found two fields on the first run. Three bugs found in the browser each got a test that fails without the fix.
- **To improve:** 29a (about 440 lines) went over the ~300-line rule again. Sprint 2's closing PR stayed open while this sprint ran, and its BACKLOG then conflicted with eleven merged PRs.
- **To try:** estimate each part's size in the plan, and split before writing. Merge a sprint's closing PR before the next sprint's first story.
