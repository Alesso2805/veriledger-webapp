# Architecture rules

Oct 20, 2026 · Sources: [SPEC.md](SPEC.md), [BACKLOG.md](BACKLOG.md), [CLAUDE.md](../CLAUDE.md), the README, [the ADRs](adr/) and the API's ADR-0004 and ADR-0005.

Each rule is one sentence that a test can prove or refute. A rule about "every" module, route or file is checked by a test that walks the whole list, so something new that breaks it fails without anyone adding a case. The tests run in CI on every PR (VLW-13); two rules wait for the stories that make them testable.

## Rules

| ID | Rule | Origin | How it is verified | Status |
| --- | --- | --- | --- | --- |
| AR-01 | Only modules under `src/services` import `axios`. | README › Backend connection (one place to configure the API); SPEC › Architecture | dependency-cruiser rule `AR-01-axios-only-in-services`, over every module under `src`. | Checked |
| AR-02 | Only modules under `src/lib` import `@noble/*`. | SPEC › Architecture and › Signing contract; ADR-0002 | dependency-cruiser rule `AR-02-noble-only-in-lib`. | Checked |
| AR-03 | Dependencies between folders follow SPEC › Architecture: `pages → components, lib, services, store, types`; `components → lib, services, store, types`; `services → lib, store, types`; `store → types`; `lib → types`; `types →` nothing outside `types` (its named types are aliases of the generated `api.ts`, AR-09); and only `src/Router.tsx` imports `src/pages`. Test files are exempt, since a page's test imports its page. | SPEC › Architecture (folder table) | dependency-cruiser: one `AR-03-*` rule per disallowed direction, over every module. | Checked |
| AR-04 | There are no circular imports. | SPEC › Architecture (dependencies point inward) | dependency-cruiser rule `AR-04-no-circular`. | Checked |
| AR-05 | No request sent through the API client carries a private key, and no code calls `/wallets/generate`. | README › Application flow ("The Private Key never leaves the browser"); SPEC › Non-functional requirements; ADR-0002 | Vitest `src/architecture/no-server-generated-keys.test.ts` reads every module under `src` and lists those that call `/wallets/generate`. Vitest `src/architecture/no-private-key-in-requests.test.tsx` runs the design E flow through the real services: generate on the wallet page, then sign and send a transfer and a notarization. A stand-in adapter records every request, and the test searches every URL, header and body for the private key. A deliberate leak in the body made it fail (VLW-30). | Checked |
| AR-06 | The signed message and signature reproduce every vector of the API's `docs/signing-vectors.json`. | SPEC › Signing contract; ADR-0002; API ADR-0004 | Vitest `src/lib/signing.test.ts`: iterate the vectors copied to `src/lib/__fixtures__/`; compare the message byte for byte and the signature. | Checked (VLW-15); since VLW-18 the vectors are veriledger-api's version 2, with the nonce, copied at 47bec5c |
| AR-07 | No module under `src` contains an absolute `http(s)://` URL, other than XML namespaces and form placeholders (example text shown to the user, never requested); the API base URL comes from runtime configuration. | SPEC › Deployment; ADR-0003 | Vitest `src/architecture/no-absolute-urls.test.ts` reads every module under `src` and fails on an `http://` or `https://` URL with a host (not text that only names the scheme) outside the allowlist (`http://www.w3.org/2000/svg`) and outside `placeholder="…"`. | Checked |
| AR-08 | Every route except the public ones renders only with a session. The public ones are `/login` and the pages whose data the API serves to anyone: `/`, `/transaction/:hash`, `/network` and the 404 (ADR-0005). | SPEC › Architecture (`ProtectedRoute`, `OpenRoute`) | Vitest `src/architecture/protected-routes.test.tsx` walks the route table that `src/Router.tsx` exports and renders each path without a token: a protected path must end at `/login`, a public one must stay. The public paths are listed in the test, so a new route is protected unless it is added there and here. | Checked |
| AR-09 | The types of the API's responses are generated from the API's OpenAPI document, not written by hand. | SPEC › API usage | The API's `docs/openapi.json` is copied unchanged into `src/types/openapi.json`, pinned to an API commit (SPEC › API usage). CI runs `npm run types:api` (`openapi-typescript`) into `src/types/api.ts` and fails on `git diff`; `tsc` then catches every mismatch with the code. `src/types/ledger.ts`, `network.ts` and `session.ts` only name the generated schemas. | Checked (VLW-19, after VLA-37) |
| AR-10 | `src/index.css` is the CSS block of DESIGN.md › Tokens and motion, character for character, and its two lists of dark values (a dark choice, and the system's dark preference) are the same. | DESIGN.md › The promise (same tokens in the canvas and the code); ADR-0004, ADR-0006, ADR-0008 | Vitest `src/architecture/design-tokens.test.ts` reads both files as text and compares them, then compares the two dark lists. | Checked; the dark lists since VLW-39 |
| AR-11 | A page rendered in Spanish shows none of the English dictionary's texts, in what it draws or in its accessible names, placeholders and titles. | ADR-0007 (every user-facing text comes from `src/lib/i18n`); CLAUDE.md | Vitest `src/architecture/spanish-pages.test.tsx` renders every page in Spanish with a node's data (the login, the tower signed in and to a visitor, a sealed notarization, the network, the wallet and Sign and send with and without a key, the 404) and looks for every English text that the Spanish dictionary says differently, as a whole word. A text written inline in a component shows in English and fails. | Checked (VLW-40c) |

## Known violations

None. The debt that existed when the rules were written was removed by the stories named for it:

| Rule | Where | Removed by |
| --- | --- | --- |
| AR-02 | `src/pages/Transaction.tsx` imported `@noble/curves` | VLW-15 (signing in `src/lib`) |
| AR-05 | `src/pages/Wallet.tsx` called `/wallets/generate` | VLW-16 (keys generated in the browser) |
| AR-07 | `src/services/api.ts` hard-coded `http://127.0.0.1:8000` | VLW-21 (runtime configuration) |

**If new debt has to be accepted, it is listed where the rule is checked, next to the story that removes it:**
- **AR-05 and AR-07:** the test's `KNOWN_VIOLATIONS`. A new violation fails, and so does a listed violation once it is fixed.
- **Import rules (AR-01 to AR-04):** the rule's `pathNot` in `.dependency-cruiser.cjs`.

## Promises that are not verifiable as written

They come from the README. They are not rules until they are made concrete; this is how I propose to do it.

| Promise | Why it is not verifiable | Proposal |
| --- | --- | --- |
| "Dark Mode Premium UI" | A taste, not a property. | Make it two rules: (a) colors only through the theme tokens of `src/index.css` (`@theme`): a test fails on a hex color inside `className` or CSS outside `index.css` (180 such literals today); (b) every text and status color meets WCAG AA contrast on its background, measured in tests (VLW-24), in both themes since VLW-48. |
| "Ensuring absolute security" | No system has it; it cannot be tested. | Replace it in the README with the testable claims: AR-05, the Content Security Policy of VLW-22, and no high or critical `npm audit` finding (VLW-11). |
| "A fully functional, decentralized Blockchain application" | Describes the API, and "fully functional" is false today (the API rejects every signature). | Back it with the end-to-end flows of VLW-23, and describe decentralization as what the Network page does: register peers and adopt the longest valid chain. |

## Proposed rules (not in the specification; they need your decision)

| Proposal | Why | State today |
| --- | --- | --- |
| Pages stay under 200 lines; larger ones split into components. | `Transaction.tsx` (291 lines) and `Explorer.tsx` (264) mix form logic, signing and markup. | 2 pages over 200 lines. |
| The session token lives in memory (or `sessionStorage`), not `localStorage`. | A token in `localStorage` is readable by any injected script for 30 minutes. | Persisted in `localStorage` by Zustand. Trade-off: a reload logs the user out. |
| Every request has a typed function in `src/services` (`getBlocks`, `mineBlock`…); pages never write a path. | One place to change when the API's paths change (VLA-20, VLA-16). | Pages call `api.get('/…')` with literal paths. |

## Tool (confirmed by the product owner on 2026-10-20)

**dependency-cruiser + Vitest + openapi-typescript**, all run in CI.

- **dependency-cruiser** handles the import rules, AR-01 to AR-04.
  - It understands TypeScript paths, type-only imports included, and walks every module.
  - The package `dependency-cruiser` is a dev dependency, and its `depcruise` binary runs through `npm run lint:arch`.
  - Never run `npx depcruise` without it installed: the npm package named `depcruise` is a placeholder published against dependency confusion.
- **Vitest** handles the behavioral and file-walking rules, AR-05 to AR-08, next to the unit tests.
  - File walks use Vite's `import.meta.glob` with `?raw`, so they need no Node types in the app's `tsconfig`.
- **openapi-typescript** handles AR-09 (VLW-19). It declares TypeScript `^5.x` as a peer, and this project is on TypeScript 6, so `package.json` overrides that peer with the project's own TypeScript instead of installing with `--legacy-peer-deps`; `tsc` and the CI diff would show a generator that stopped working.

Alternatives considered:
- **eslint-plugin-boundaries.** It needs ESLint next to oxlint, which has no boundary rules of its own.
- **A hand-written import scanner in Vitest.** No new dependency, but resolving TypeScript paths and cycles would be reimplemented.

## Which test covers which rule

| Test | Rules | Runs in |
| --- | --- | --- |
| `.dependency-cruiser.cjs` (`npm run lint:arch`) | AR-01, AR-02, AR-03, AR-04 | CI step `npm run lint:arch` |
| `src/architecture/no-server-generated-keys.test.ts` | AR-05 (no `/wallets/generate`) | `npm test` |
| `src/architecture/no-private-key-in-requests.test.tsx` | AR-05 (no request carries the private key) | `npm test` |
| `src/architecture/no-absolute-urls.test.ts` | AR-07 | `npm test` |
| `src/architecture/protected-routes.test.tsx` | AR-08 | `npm test` |
| `src/architecture/design-tokens.test.ts` | AR-10 | `npm test` |
| `src/architecture/spanish-pages.test.tsx` | AR-11 | `npm test` |
| `src/lib/signing.test.ts` | AR-06 | `npm test` |
| The request-recording test | AR-05 (no private key in any request) | VLW-30 |
| CI step `npm run types:api` + `git diff --exit-code -- src/types/api.ts` | AR-09 | CI, before lint |

**Each check was shown to catch a violation** (2026-10-20). One break at a time was introduced locally, then restored:

| Deliberate break | Result |
| --- | --- |
| A page imports `axios` | AR-01 fails |
| A page imports `@noble/curves` | AR-02 fails |
| The store imports the API client | AR-03-store-inward and AR-04 (a cycle) fail |
| `Layout` imports a page | AR-03-only-router-imports-pages fails |
| A page gains an `https://` literal | AR-07 fails |
| `api.ts` loses its URL, so the known violation is fixed but still listed | AR-07 fails |
| Another page mentions `/wallets/generate` | AR-05 fails |
| A route outside `ProtectedRoute` | AR-08 fails for that path |
| `/wallet` moved under `OpenRoute` | AR-08 fails for `/wallet` |
| One token changed in `index.css` only, then in DESIGN.md only | AR-10 fails both times |
| One dark value changed in the system's list only, in both files (2026-10-22) | AR-10's dark-lists test fails |
| "Copy address" written inline in the wallet's identity card (2026-10-22) | AR-11 fails on the wallet with a key |
| A dark `muted` of low contrast, in the two dark lists of `index.css` only (2026-10-22) | `npm run test:a11y` fails on `color-contrast` in the `desktop-dark-es` project; the light `desktop` project passes (VLW-48) |
| A file in `src/types` imports `src/lib` | AR-03-types-import-nothing fails (2026-10-21) |
| `src/types/api.ts` edited by hand; then `openapi.json` changed without regenerating | AR-09's diff fails both times (2026-10-21) |

A deliberately broken PR also failed CI; see Sprint 1's notes.
