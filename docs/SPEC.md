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

The pages keep their routes in design E ([DESIGN.md](DESIGN.md), ADR-0004). The Explorer becomes the **Tower** (VLW-28) and every page gets the new shell (VLW-27, VLW-33); the "Status" column describes what exists today.

| Page | Route | What it does | Status |
| --- | --- | --- | --- |
| Login | `/login` | Email and password against `POST /auth/login` (OAuth2 form); stores the token. "Try the demo" starts a 24-hour trader account with one click (API ADR-0006) | Built (VLW-01). VLW-33 adds design E, an empty form, the 401 shake and the return to the page the person was on. The session-expired redirect comes with VLW-17 and the demo with VLW-34 |
| Explorer → Tower | `/` | Latest blocks (refresh every 10 s), stats, mining with a miner address, search by transaction hash | Built (VLW-04); block search in VLW-19; the tower, waiting list and honest states in VLW-28 |
| Transaction detail | `/transaction/:hash` | Status, hash, parties, value, fee, block; a notarization (amount 0 + payload) is shown as a certificate | Built (VLW-05); links from a block open the wrong key until VLW-19 |
| Wallet | `/wallet` | Create a key pair, check any address's balance | Built (VLW-02) with the pair created by the server; in the browser in VLW-16 |
| Transact | `/transact` | Transfer or notarize: signs in the browser and sends the signed transaction | Built (VLW-03); the API rejects its signatures until VLW-15 |
| Network | `/network` | Add a peer URL, list peers, resolve conflicts | Built (VLW-06) |

**Out of scope for this plan:** storing private keys (encrypted or not) beyond the session, hardware wallets, a block explorer for other networks, internationalization, a light theme.

## Architecture

A single-page app built by Vite into static files (ADR-0001).

| Folder | Holds | May import |
| --- | --- | --- |
| `src/pages` | One component per route | `components`, `lib`, `services`, `store`, `types` |
| `src/components` | Shared UI: `Layout` and the route guards (`RouteGuards.tsx`) today; loading, empty and error states with design E (VLW-27, VLW-28, VLW-33) | `lib`, `services`, `store`, `types` |
| `src/lib` | Pure logic with no React and no HTTP: the signed message and signing (`signing.ts`), key generation (`keys.ts`), hex helpers. Planned (VLW-15, VLW-16) | `types`, `@noble/*` |
| `src/services` | The axios instance with the base URL and the token interceptor; the 401 handler (VLW-17) | `lib`, `store`, `types`, axios |
| `src/store` | Zustand stores: the session token, persisted in `localStorage` under `veriledger-storage`; the toasts (`useToastStore`, each closes after 4 s), shown by `ToastRegion` on every page; whether the API answers (`useHealthStore`), which the header status, the login and the offline banner read | `types` |
| `src/types` | Types of the API's responses; generated from its OpenAPI document in VLW-19 | Nothing |

`src/Router.tsx` exports the route table as data (`routes`), so that AR-08 can walk it.
- Every route except `/login` is wrapped in `ProtectedRoute` (`src/components/RouteGuards.tsx`), which redirects to `/login` without a token.
  - It keeps the page in the router state (`LoginRedirectState`), so `PublicRoute` returns there after signing in.
  - VLW-17 adds `reason: 'expired'` to that state.
- `src/App.tsx` renders the table with `useRoutes`, and `src/main.tsx` mounts it inside `BrowserRouter`.
- The tests of the architecture rules live in `src/architecture/`.

**Today** `Transaction.tsx` imports `@noble/curves` and builds the signed message itself, and `src/lib` does not exist (audit, AR-02).

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
| Shell | `GET /health` every 10 s on every page, the login included (`HealthWatcher`, `src/services/health.ts`); `GET /auth/me` once per session (`src/services/auth.ts`) | Public; JWT |
| Login | `POST /auth/login` (form-urlencoded) | Public |
| Explorer | `GET /blocks`, `POST /blocks/mine`, `GET /transactions/{tx_hash}` (search) | JWT |
| Transaction detail | `GET /transactions/{tx_hash}` | JWT |
| Wallet | `POST /wallets/generate` (removed in VLW-16), `GET /wallets/{address}/balance` | Public |
| Transact | `POST /transactions`; `GET /wallets/{address}/nonce` from VLW-18 | JWT |
| Network | `GET /nodes`, `POST /nodes/register`, `POST /nodes/resolve` | JWT |

Every request goes through `src/services/api.ts`, which adds `Authorization: Bearer <token>`. Errors show the API's `detail`.

## Signing contract

The webapp adopts the API's ADR-0004 through its own ADR-0002.

- **Keys** are Ed25519 raw keys in lowercase hex; the public key is the address. From VLW-16 they are generated in the browser with `@noble/curves` and never sent anywhere.
- **As built**, the app signs `JSON.stringify` of `{amount, fee, receiver_address, sender_address[, payload]}` with sorted keys. The API verifies Python's `json.dumps` of the same keys, which has spaces and writes `10.0` for `10`, so it rejects every transaction (audit, 2026-10-20).
- **Target** (VLW-15, VLW-18): `buildSignedMessage` in `src/lib/signing.ts` produces the canonical message of the API's ADR-0004, sorted keys, no whitespace, amounts as 8-decimal strings and a `nonce`, and passes every vector of `veriledger-api/docs/signing-vectors.json`, copied into `src/lib/__fixtures__/`.
- A notarization sends amount 0 to the sender's own address, with the document's hash as `payload`.

## Deployment

Static files served behind the same Caddy and hostname as the API (API ADR-0005, webapp ADR-0003): `/` serves the app, `/api` the API, so the browser sees one origin.

- One image for any hostname: the container writes `/config.json` (the API base URL) from its environment at start, and the app reads it before rendering (VLW-21). In development, `VITE_API_URL` or the default `http://127.0.0.1:8000`.
- Every unknown path answers `index.html`, so `/wallet` and `/transaction/<hash>` survive a reload (VLW-22).
- Hashed assets are cached for a year; `index.html` and `config.json` are never cached (VLW-22).

## Non-functional requirements and security

| Category | Requirement | How it is verified |
| --- | --- | --- |
| Security | The private key never leaves the browser | A test that records every request of the generate → transfer → notarize flow and finds no private key (AR-05, VLW-16) |
| Security | No pre-filled credentials; an expired session returns to the login | Component tests (VLW-17) |
| Security | Content Security Policy and security headers on the served files | Header check in the end-to-end tests (VLW-22) |
| Security | No known high or critical vulnerability in dependencies | `npm audit --audit-level=high` in CI (VLW-11) |
| Correctness | Transactions signed here are accepted by the API | The API's golden vectors in Vitest (AR-06, VLW-15) and an end-to-end transfer (VLW-23) |
| Correctness | Response types match the API | Types generated from the API's OpenAPI document (AR-09, VLW-19) |
| Deployment | One image for any hostname; deep links survive a reload | End-to-end tests on the built image (VLW-21, VLW-22) |
| Reproducibility | `npm ci && npm run build` from a clean clone | CI (VLW-10, VLW-11) |
| Accessibility | Every input has a label; visible focus; usable at 360 px with no horizontal scroll; no serious or critical axe-core violation | axe-core in the component tests and Playwright at 360 px (VLW-24) |
| Quality | `tsc` strict, oxlint without warnings, architecture tests and Vitest green | GitHub Actions (VLW-10, VLW-13) |

## Engineering rules

**Stack.** React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Zustand 5, axios, lucide-react, `@noble/curves` 2; @fontsource Instrument Sans and Martian Mono; oxlint; Vitest, Testing Library and jsdom; Playwright; dependency-cruiser. Node 22 LTS, 22.13 or later.

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
│   ├── pages/                    # Login, Explorer, TransactionDetail, Wallet, Transaction, Network
│   ├── architecture/             # tests of the architecture rules
│   ├── components/               # Layout, RouteGuards; states (VLW-27)
│   ├── lib/                      # signing.ts, keys.ts, identicon.ts (VLW-15, VLW-16, VLW-31)
│   ├── services/api.ts
│   ├── store/useAppStore.ts
│   ├── types/                    # generated from the API's OpenAPI (VLW-19)
│   ├── Router.tsx                # the route table
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css                 # design E tokens: the CSS block of DESIGN.md (AR-10)
│   └── legacy.css                # neon classes of the pages not yet replaced; deleted by VLW-32
├── public/favicon.svg
├── e2e/                          # Playwright (VLW-23)
├── docker/                       # nginx or Caddy config and the config.json writer (VLW-21, VLW-22)
├── docs/
│   ├── SPEC.md                   # this document
│   ├── DESIGN.md                 # design E: tokens, motion, views
│   ├── BACKLOG.md
│   ├── ARCHITECTURE_RULES.md
│   ├── AUDIT.md
│   ├── adr/
│   └── sprints/
├── .github/workflows/ci.yml
├── .dependency-cruiser.cjs       # import rules AR-01 to AR-04
├── Dockerfile                    # VLW-22
├── .nvmrc
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig*.json
├── .oxlintrc.json
├── CLAUDE.md
├── CHANGELOG.md                  # VLW-26
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
