# VeriLedger webapp — specification

Oct 20, 2026 · @Alessandro David

This document describes what the webapp is, what was built on July 29, 2026, and what it must become to be deployed. Items marked with a story ID (VLW-NN) are not built yet; the story in [BACKLOG.md](BACKLOG.md) is where they get done. The API's specification, including the contracts this app depends on, is `veriledger-api/docs/SPEC.md`.

## Vision

A visitor should be able to see, in a few minutes and without installing anything, what a verifiable ledger gives them: a wallet whose private key only they hold, a transfer signed in their own browser, a block mined with their transaction in it, and a certificate that proves a document existed at a given moment. The webapp is the face of the portfolio project; the API is its engine.

**Goals of the current plan**

- A deployed instance anyone can try, on the same hostname as the API (VLW-25).
- Every claim of the README backed by a test: keys never leave the browser (AR-05), signatures the API accepts (AR-06), deep links that survive a reload (VLW-22).
- Green from a clean clone, with CI (VLW-10, VLW-11).

## Scope and features

Status: **Built** (exists on `main`, see the audit for its defects), **Planned** (a story in the backlog).

The pages keep their routes in design E ([DESIGN.md](DESIGN.md), ADR-0004). The Explorer became the **Tower** (VLW-28) and every page gets the new shell (VLW-27, VLW-33); the "Status" column describes what exists today.

| Page | Route | What it does | Status |
| --- | --- | --- | --- |
| Login | `/login` | Email and password against `POST /auth/login` (OAuth2 form); stores the token. "Try the demo" starts a 24-hour trader account with one click (API ADR-0006) | Built (VLW-01). VLW-33 adds design E, an empty form, the 401 shake and the return to the page the person was on. VLW-17 adds the session-expired redirect. "Try the demo" since VLW-34b, on a node in demo mode, with "Your demo ended…" when a demo account's session ends |
| Tower | `/` | The newest 10 blocks drawn as a tower; the list with "Load older blocks"; the selected block with its transactions; what waits for the next block. Height, waiting count and last block, refreshed every 10 s. `?block=n` opens a block. Mining to a reward address, for the trader and admin roles. Open without a session; a visitor sees "Sign in to mine" | Built (VLW-28), replacing the explorer of VLW-04; open to visitors since VLW-34a |
| Transaction | `/transaction/:hash` | The journey (signed, accepted, sealed, buried); the details with the signature verified in the browser; the block that holds it; a notarization's certificate (VLW-29b); times in UTC. Open without a session | Built (VLW-29, design E), replacing the page of VLW-05; open to visitors since VLW-34a |
| Wallet | `/wallet` | Create a key pair or open a key file; the address, its identity cube and its balance; save the key file and confirm it; forget the key; the address's activity and a look-up of any address (VLW-31b) | Built (VLW-31, design E), replacing the page of VLW-02; the key is created in the browser (VLW-16) and is the one Sign and send uses |
| Sign and send | `/transact` | Signs with the key held in the tab: open a key file or use the wallet's. Composes a transfer or a notarization (the document is hashed in the browser) and shows the message being signed. Signs it, sends the message and the signature, and shows the node's answer | Built (VLW-30, design E), replacing the page of VLW-03. It signs the API's canonical message (VLW-15) with the sender's next nonce (VLW-18) |
| Network | `/network` | This node and its peers on a ring map; the peer list; adding a peer (admin); resolving conflicts (admin). Open without a session, read-only | Built (VLW-32, design E), replacing the page of VLW-06; open to visitors since VLW-34a |
| Not found | any other path | The 404 tower with "Back to the tower", inside the shell. Open without a session | Built (VLW-33); open to visitors since VLW-34a |
| Failure | any page | A page that throws while drawing shows "This page ran into a problem" inside the shell, with "Try again" (no reload, so the key held in the tab stays) and "Back to the tower". The shell or the login throwing shows one full-screen card with "Reload" | Built (VLW-35) |

**Out of scope for this plan:** storing private keys (encrypted or not) beyond the session, hardware wallets, a block explorer for other networks, internationalization, a light theme.

## Architecture

A single-page app built by Vite into static files (ADR-0001).

| Folder | Holds | May import |
| --- | --- | --- |
| `src/pages` | One component per route | `components`, `lib`, `services`, `store`, `types` |
| `src/components` | Shared UI: `Layout`, the route guards (`RouteGuards.tsx`) and the shell's pieces; the error boundary (`ErrorBoundary.tsx`) and its two fallbacks, `PageFailed.tsx` inside the shell and `AppFailed.tsx` for the whole app (VLW-35); the identity cube (`IdentityCube.tsx`); the tower's pieces in `components/tower/` (drawing, block list, block detail, waiting list, freshness line); Sign and send's pieces in `components/transact/`; the transaction page's in `components/transaction/`; the wallet's in `components/wallet/`; the network's in `components/network/` | `lib`, `services`, `store`, `types` |
| `src/lib` | Pure logic with no React and no HTTP: the signed message and signing (`signing.ts`), key generation (`keys.ts`), the token's expiry and demo claim (`jwt.ts`), display formats (`format.ts`), merging pages of blocks (`chain.ts`), cube geometry (`isometric.ts`), an address's cube colours (`identicon.ts`), reading a key file (`keyFile.ts`), checking what is about to be signed (`compose.ts`), a document's SHA-256 (`digest.ts`), what a stored transaction says about itself: signature, journey, title (`transaction.ts`), an address's activity in words and sums (`activity.ts`), what a search can look up (`search.ts`), the peer map's ring and names (`peers.ts`) | `types`, `@noble/*` |
| `src/services` | The axios instance with the base URL, the token interceptor, the 401 handler that ends an expired session (VLW-17) and `detailOf` for the API's error messages; one module per area (`auth.ts`, `health.ts`, `ledger.ts`, `wallets.ts`, `nodes.ts`, `config.ts`). Each read checks the shape of the answer | `lib`, `store`, `types`, axios |
| `src/store` | Zustand stores: the session token, persisted in `localStorage` under `veriledger-storage`; the signed-in user from `GET /auth/me` (`user`, not persisted), whose role pages use for their rules; the toasts (`useToastStore`, each closes after 4 s), shown by `ToastRegion` on every page; whether the API answers and whether it starts demo accounts (`useHealthStore`), which the header status, the login, the offline banner and the "Try the demo" buttons read; whether a demo account is being started (`startingDemo`), which those buttons share; the key pair this tab signs with (`useKeyStore`), only in memory: a reload forgets it and signing out clears it (ADR-0002, VLW-30). It also remembers whether a key file of it exists (VLW-31) | `types` |
| `src/types` | The API's responses: `api.ts`, generated from its OpenAPI document (`openapi.json`, AR-09), and the names the code uses for them (`ledger.ts`, `network.ts`, `session.ts`); the webapp's own types beside them (`LoginRedirectState`, `SessionEndReason`, the browser's key pair) | Nothing outside `types` |

`src/Router.tsx` exports the route table as data (`routes`), so that AR-08 can walk it.
- The pages whose data the API serves to anyone (`/`, `/transaction/:hash`, `/network` and the 404) are wrapped in `OpenRoute`; `/wallet` and `/transact` in `ProtectedRoute` (`src/components/RouteGuards.tsx`), which redirects to `/login` without a token (ADR-0005).
  - Without a session the header's "Sign in", the tower's "Sign in to mine" and `ProtectedRoute` keep the page in the router state (`LoginRedirectState`), so `PublicRoute` returns there after signing in.
  - A 401 on a request that carried the session, or a stored token whose `exp` has passed (`src/lib/jwt.ts`), ends the session. Both guards then send the person to the login with `reason: 'expired'` (VLW-17), or `'demo-ended'` when the token carried the `demo` claim (VLW-34). The store reads no tokens, so whoever ends the session (the 401 handler, `useSessionToken`) passes the reason. The login takes the reason from its router state and the store forgets it, so a visitor can go back to an open page.
- `src/App.tsx` renders the table with `useRoutes`, and `src/main.tsx` mounts it inside `BrowserRouter`.
- A throw while drawing never blanks the app (VLW-35). `Layout` wraps each page in an `ErrorBoundary` inside `<main>`, so a page fails alone and the next route starts clean. `App` wraps everything in another, for the shell and the login.
- The tests of the architecture rules live in `src/architecture/`.

## Design

Design direction E ("Network", ADR-0004). [DESIGN.md](DESIGN.md) is the specification of the look and behaviour of every page. It covers:

- the CSS tokens and animations that go into `src/index.css`, unchanged;
- which real event triggers each animation;
- which endpoint feeds each element;
- what is deliberately not drawn because the API cannot provide it.

The design canvas's artboards are its pictures. A page and its artboard must match; a difference is fixed in the same PR.

## API usage

| Page | Calls | Auth |
| --- | --- | --- |
| Shell | `GET /health` every 10 s on every page, the login included (`HealthWatcher`, `src/services/health.ts`). It checks the API's database too (VLA-26): its 503 with `"database": "unreachable"` reads "no database", not "offline"; its `demo_mode` shows "Try the demo" (VLA-35); `POST /auth/demo` from "Try the demo"; `GET /auth/me` once per session, with `display_name` for the chip (`src/services/auth.ts`); the search: `GET /blocks?skip&limit=1` for a block number, `GET /blocks/{block_hash}` and `GET /transactions/{tx_hash}` for a full hash (`src/services/ledger.ts`, VLW-19) | Public; JWT |
| Login | `POST /auth/login` (form-urlencoded); `POST /auth/demo` for "Try the demo" (VLA-35) | Public |
| Tower | `GET /blocks?skip&limit` (the tower, older pages, a deep link), `GET /blocks/{block_hash}` (the selected block), `GET /transactions?status=PENDING&skip&limit` (waiting), every 10 s (`src/services/ledger.ts`, VLA-20, VLA-33); `POST /blocks/mine`, then `GET /blocks/{block_hash}` for the reward of the toast; a node mines one block at a time, and a second request gets a 429 whose detail the toast shows (VLA-29); `POST /auth/demo` from "Try the demo to mine" | Public; JWT to mine |
| Transaction | `GET /transactions/{tx_hash}` and `GET /blocks?skip=0&limit=1` (the height), every 10 s; `GET /blocks/{block_hash}` for a certificate's moment (`src/services/ledger.ts`, VLA-20) | Public |
| Wallet | `GET /wallets/{address}/balance` and `GET /wallets/{address}/transactions?skip=0&limit=20` (VLA-34), for the key's address and any address looked up (`src/services/wallets.ts`); keys are generated in the browser (`src/lib/keys.ts`, VLW-16), and the key file is written in it (`src/lib/keyFile.ts`) | Public |
| Sign and send | `GET /wallets/{address}/nonce` and `GET /wallets/{address}/balance` when a key is opened, after a 409 (the nonce) and for "Send another" (`src/services/wallets.ts`, VLA-16); `POST /transactions` (`src/services/ledger.ts`) | Public; JWT |
| Network | `GET /nodes` and `GET /blocks?skip=0&limit=1` (the height); `POST /nodes/register` and `POST /nodes/resolve`, admin only (`src/services/nodes.ts`, VLA-19) | Public; JWT |

Every request goes through `src/services/api.ts`, which adds `Authorization: Bearer <token>`. Errors show the API's `detail`.

The types of every answer are generated from the API's `docs/openapi.json` (VLA-37), copied unchanged into `src/types/openapi.json` at API commit b205e4e (VLA-26). `npm run types:api` regenerates `src/types/api.ts`, and CI fails when it is stale (AR-09). When the API changes an answer, the copy is updated with the commit it comes from, and `tsc` shows every place the code must follow.

## Signing contract

The webapp adopts the API's ADR-0004 through its own ADR-0002.

- **Keys** are Ed25519 raw keys in lowercase hex; the public key is the address. From VLW-16 they are generated in the browser with `@noble/curves` and never sent anywhere.
- **The message** (VLW-15):
  - `src/lib/signing.ts › buildSignedMessage` builds the API's ADR-0004 canonical message: keys sorted by code point, no whitespace, `payload` left out when absent, amounts as 8-decimal strings.
  - `toAmount` turns what a person types ("10", "0.5") into that spelling, without a float.
  - `signMessage` signs the UTF-8 bytes.
- **The nonce** (VLW-18):
  - The page reads the sender's next nonce from `GET /wallets/{address}/nonce` when the key is opened and shows it. The message carries it as an integer, between `fee` and `payload`.
  - A used or skipped nonce gets a 409 with the API's message ("Nonce N is not the next one for this sender; the next is M"). The page then reads the next nonce and says that signing again will use it.
  - Re-sending a byte-identical body gets a 200 with the stored transaction, so a retry after a timeout is safe (VLA-16).
- **The request:** `POST /transactions` carries the same amount strings and nonce that were signed.
- **The vectors:** every vector of `veriledger-api/docs/signing-vectors.json` passes byte for byte (AR-06). It is version 2, copied unchanged into `src/lib/__fixtures__/` at 47bec5c.
- **Before VLW-15** the page signed `JSON.stringify` of numbers, and the API rejected every transaction (audit, 2026-10-20).
- A notarization sends amount 0 to the sender's own address, with the document's hash as `payload`.

## Deployment

Static files served behind the same Caddy and hostname as the API (API ADR-0005, webapp ADR-0003): `/` serves the app, `/api` the API, so the browser sees one origin. It runs at https://veriledger.duckdns.org, on the product owner's Google Cloud VM, deployed with the API's runbook (`veriledger-api/docs/runbooks/deploy.md`) on 2026-10-22: the API's release 1.0.0 and this image at a `sha-` tag of `main` (VLW-25). Updating the webapp is the runbook's step 6 with a new `WEBAPP_IMAGE_TAG`.

- One image for any hostname (VLW-21):
  - The container runs `docker/write-config.sh`, which writes `{"apiBaseUrl": "<API_BASE_URL>"}` to `/config.json`. `API_BASE_URL` defaults to `/api`.
  - `src/main.tsx` reads that file (`src/services/config.ts`) before rendering. Without a usable file, the base URL is `VITE_API_URL`, set in `.env.development` and `.env.test` as `http://127.0.0.1:8000`, or else the same origin's `/api`.
  - No URL is built into the production bundle (AR-07).
- **The image** (VLW-22, `Dockerfile`):
  - Node 22 builds the files, and Caddy serves them as a non-root user on port 8080. Both bases are pinned by digest.
  - The files are the same for every architecture, so Node builds them on the build machine's own architecture: an arm64 image runs no npm under emulation.
  - At start the container runs `write-config.sh`.
  - It is built for amd64 and arm64 by the Image workflow. On every push to `main` the workflow also publishes it, public, as `ghcr.io/alesso2805/veriledger-webapp` with the tags `main` and `sha-<commit>`, and a release tag adds the version (`1.0.0`, `1.0`) (VLW-25). Pull requests build and smoke-test it without publishing.
- **`docker/Caddyfile`:**
  - Every unknown path answers `index.html`, so `/wallet` and `/transaction/<hash>` survive a reload.
  - `/assets/*` is cached for a year (`immutable`); everything else, `index.html` and `config.json` included, is `no-store`.
  - It sends the security headers: a Content Security Policy with `'self'` everywhere and `connect-src 'self'`, widened only by `CSP_CONNECT_SRC` for an API on another origin; `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`; and no `Server` header.
- **No `data:` URIs** (`build.assetsInlineLimit: 0`), so the policy needs no `data:` source.
- **`docker/smoke-test.sh`** checks a running image for deep links, caching, `config.json`, inline `data:` URIs and the headers. The Image workflow runs it on every PR.

## Non-functional requirements and security

| Category | Requirement | How it is verified |
| --- | --- | --- |
| Security | The private key never leaves the browser | A test that records every request of the generate → transfer → notarize flow and finds no private key (AR-05, `src/architecture/no-private-key-in-requests.test.tsx`, VLW-30) |
| Security | No pre-filled credentials; an expired session returns to the login | Component tests (VLW-17) |
| Security | Content Security Policy and security headers on the served files | `docker/smoke-test.sh` on the built image, in the Image workflow (VLW-22) |
| Security | No known high or critical vulnerability in dependencies | `npm audit --audit-level=high` in CI (VLW-11) |
| Correctness | Transactions signed here are accepted by the API | The API's golden vectors in Vitest (AR-06, VLW-15). `npm run test:e2e` (VLW-23) runs in CI against the API's published image, through its `docker-compose.ghcr.yml` at a pinned commit (VLA-38). A seeded admin signs in, creates a wallet in the browser, mines to it, sends a transfer and a notarization, mines them into a block, and checks the transfer's signature and the certificate with the same file. A visitor also starts a demo and mines with it |
| Correctness | Response types match the API | Types generated from the API's OpenAPI document, regenerated and diffed in CI (AR-09, VLW-19) |
| Deployment | One image for any hostname; deep links survive a reload | `docker/smoke-test.sh` on the built image (VLW-21, VLW-22); the image published to GHCR for the API's Compose (VLW-25a); the end-to-end flows (VLW-23). The `rehearsal` job (VLW-25b) runs the API's production Compose (`deploy/docker-compose.prod.yml`) with the pull request's own image on `https://localhost`, and runs the flows through its Caddy: one origin, the image's `/config.json`, and its Content Security Policy, any violation of which fails the run |
| Reproducibility | `npm ci && npm run build` from a clean clone | CI (VLW-10, VLW-11) |
| Accessibility | Every input has a label; visible focus; usable at 360 px with no horizontal scroll; no serious or critical axe-core violation | `npm run test:a11y` (VLW-24): Playwright in Chromium against the built app, with the API answered from fixtures (`e2e/mockApi.ts`), on every page and state at 1280 and 360 px: no serious or critical axe violation, no sideways scroll, and a visible focus on every control the keyboard reaches. axe-core also runs in the component tests for refusals, empty lists and not-found states (`toPassAxe`). Both run in CI |
| Robustness | A throw while drawing shows a fallback, never a blank page; nothing a person types, opens or navigates to, and no malformed answer from the API or `config.json`, makes a page throw | Component tests of both boundaries (VLW-35). `npm run test:a11y` also runs `e2e/robustness.spec.ts` (VLW-36), the audit of 2026-10-21 as a spec, in CI. It runs in Chromium at 1280 and 360 px against the mocked API, and covers odd routes, odd text in every field, files that are not key files, stored sessions the app did not write, and malformed answers. A step fails on an uncaught error or when a fallback shows |
| Quality | `tsc` strict, oxlint without warnings, architecture tests and Vitest green | GitHub Actions (VLW-10, VLW-13) |

## Engineering rules

**Stack.** React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Zustand 5, axios, lucide-react, `@noble/curves` 2; @fontsource Instrument Sans and Martian Mono; oxlint; Vitest, Testing Library and jsdom; axe-core and @axe-core/playwright; Playwright; dependency-cruiser; openapi-typescript. Node 22 LTS, 22.13 or later.

**Architecture rules.** The folder rules of the Architecture section, written as verifiable rules AR-01 to AR-09 in [ARCHITECTURE_RULES.md](ARCHITECTURE_RULES.md), each with the test that checks it (VLW-13).

**How we work**

- **A plan first.** Each story starts from a short plan, what will change and which files, agreed with the product owner before any code.
- **Raise contradictions.** If a request contradicts this specification, the contradiction is raised before the work starts. A change to this document goes in its own `docs(spec)` commit.
- **Small commits.** Conventional Commits, one PR per story; work over about 300 lines is split.
- **Check it in the browser.** Each screen is checked at 1280 and 360 px against a running API, with the demo's own data.
- **Cross-repository contracts.** Signing and endpoints are decided in the API's ADRs; a VLW story that depends on a VLA story says so and merges after it.

**Definition of done**

- The acceptance criteria are met and demonstrable in the browser.
- Unit tests for `lib`, `services` and `store`; a component test for each new page behavior.
- Green checks: `tsc -b`, oxlint without warnings, the architecture tests, Vitest, `vite build`.
- `npm ci && npm run build` works from a clean clone.
- This specification is updated when a page or a use of the API changes.
- If a story changes the architecture, docs/ARCHITECTURE_RULES.md, its tests and the corresponding ADR are updated in the same PR.

## Repository, conventions and living documentation

Target tree. Entries marked with a story do not exist yet.

```text
veriledger-webapp/
├── src/
│   ├── pages/                    # Login, Tower, TransactionDetail, Wallet, SignAndSend, Network, NotFound
│   ├── architecture/             # tests of the architecture rules
│   ├── components/               # Layout, RouteGuards, the shell's pieces; tower/ (VLW-28)
│   ├── lib/                      # signing.ts, keys.ts, jwt.ts, format.ts, chain.ts, isometric.ts; identicon.ts (VLW-31)
│   ├── services/api.ts
│   ├── store/useAppStore.ts
│   ├── types/                    # openapi.json, api.ts generated from it (AR-09), and their names
│   ├── Router.tsx                # the route table
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                 # design E tokens: the CSS block of DESIGN.md (AR-10)
├── public/favicon.svg            # the logo on the background colour (VLW-26)
├── e2e/                          # Playwright: a11y.spec.ts and its API fixtures (VLW-24); robustness.spec.ts on the same fixtures (VLW-36); flows.spec.ts against the API's stack (VLW-23)
├── docker/                       # write-config.sh, Caddyfile, smoke-test.sh
├── docs/
│   ├── SPEC.md                   # this document
│   ├── DESIGN.md                 # design E: tokens, motion, views
│   ├── BACKLOG.md
│   ├── ARCHITECTURE_RULES.md
│   ├── AUDIT.md
│   ├── COMMENTS_REVIEW.md        # what the comment cleanup kept and removed (VLW-14)
│   ├── adr/
│   └── sprints/
├── .github/workflows/          # ci.yml (checks), image.yml (amd64 and arm64 image, smoke test)
├── .dependency-cruiser.cjs       # import rules AR-01 to AR-04
├── Dockerfile
├── .dockerignore
├── .gitattributes                # LF for the container files
├── .env.development, .env.test # VITE_API_URL for the dev server and the tests
├── .nvmrc
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig*.json
├── .oxlintrc.json
├── CLAUDE.md
├── CHANGELOG.md                  # what changes, release by release (VLW-26)
└── README.md
```

| Artifact | Purpose | When it is updated |
| --- | --- | --- |
| `docs/SPEC.md` | Vision, pages, architecture, API usage, contracts | When a page or a use of the API changes |
| `docs/BACKLOG.md` | Stories, acceptance criteria, sprint plan | At planning and when a story is added or moved |
| `docs/DESIGN.md` | Tokens, motion and the specification of every view; links the design canvas | When a view, a token or an animation changes, together with its artboard |
| `docs/ARCHITECTURE_RULES.md` | Verifiable architecture rules and their tests | When a story changes the architecture |
| `docs/adr/NNNN-*.md` | One technical decision | Every non-trivial decision |
| `docs/sprints/sprint-N.md` | What was delivered, decisions, spec changes, retro | At the close of each sprint |
| `docs/AUDIT.md` | Independent comparison of the repository against these documents | Before a release, or when asked |

**Conventions.** Branches `feat/VLW-NN-description`, `fix/…`, `chore/…`; Conventional Commits; PRs reference the story and include the DoD checklist; components in PascalCase, one per file; code, comments and documentation in English; user-facing text in English.
