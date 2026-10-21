# Architecture rules

Oct 20, 2026 · Sources: [SPEC.md](SPEC.md), [BACKLOG.md](BACKLOG.md), [CLAUDE.md](../CLAUDE.md), the README, [the ADRs](adr/) and the API's ADR-0004 and ADR-0005.

Each rule is one sentence that a test can prove or refute. A rule about "every" module, route or file is checked by a test that walks the whole list, so something new that breaks it fails without anyone adding a case. The tests run in CI on every PR (VLW-13); two rules wait for the stories that make them testable.

## Rules

| ID | Rule | Origin | How it is verified | Status |
| --- | --- | --- | --- | --- |
| AR-01 | Only modules under `src/services` import `axios`. | README › Backend connection (one place to configure the API); SPEC › Architecture | dependency-cruiser rule `AR-01-axios-only-in-services`, over every module under `src`. | Checked |
| AR-02 | Only modules under `src/lib` import `@noble/*`. | SPEC › Architecture and › Signing contract; ADR-0002 | dependency-cruiser rule `AR-02-noble-only-in-lib`. | Checked, one known violation |
| AR-03 | Dependencies between folders follow SPEC › Architecture: `pages → components, lib, services, store, types`; `components → lib, services, store, types`; `services → lib, store, types`; `store → types`; `lib → types`; `types →` nothing; and only `src/Router.tsx` imports `src/pages`. Test files are exempt, since a page's test imports its page. | SPEC › Architecture (folder table) | dependency-cruiser: one `AR-03-*` rule per disallowed direction, over every module. | Checked |
| AR-04 | There are no circular imports. | SPEC › Architecture (dependencies point inward) | dependency-cruiser rule `AR-04-no-circular`. | Checked |
| AR-05 | No request sent through the API client carries a private key, and no code calls `/wallets/generate`. | README › Application flow ("The Private Key never leaves the browser"); SPEC › Non-functional requirements; ADR-0002 | Vitest `src/architecture/no-server-generated-keys.test.ts` reads every module under `src` and lists those that call `/wallets/generate`. The second check comes with VLW-16, once the flow lives in `src/lib`: an axios adapter records every request of generate → transfer → notarize and searches every URL, header and body for the private key. | Partly checked, one known violation |
| AR-06 | The signed message and signature reproduce every vector of the API's `docs/signing-vectors.json`. | SPEC › Signing contract; ADR-0002; API ADR-0004 (proposed) | Vitest `src/lib/signing.test.ts`: iterate the vectors copied to `src/lib/__fixtures__/`; compare the message byte for byte and the signature. | Comes with VLW-15, after the API's VLA-15 writes the vectors |
| AR-07 | No module under `src` contains an absolute `http(s)://` URL, other than XML namespaces and form placeholders (example text shown to the user, never requested); the API base URL comes from runtime configuration. | SPEC › Deployment; ADR-0003 | Vitest `src/architecture/no-absolute-urls.test.ts` reads every module under `src` and fails on an `http://` or `https://` literal outside the allowlist (`http://www.w3.org/2000/svg`) and outside `placeholder="…"`. | Checked, one known violation |
| AR-08 | Every route except `/login` renders only with a session. | SPEC › Architecture (`ProtectedRoute`) | Vitest `src/architecture/protected-routes.test.tsx` walks the route table that `src/Router.tsx` exports and renders each path without a token, expecting `/login`. The public paths are listed in the test; VLW-34 adds the public reads there and here. | Checked |
| AR-09 | The types of the API's responses are generated from the API's OpenAPI document, not written by hand. | SPEC › API usage | CI runs `openapi-typescript` against the API's committed `docs/openapi.json` into `src/types/api.ts` and fails on `git diff`; `tsc` then catches every mismatch. | Comes with VLW-19; no `openapi.json` is published yet (VLA-30) |

## Known violations

This is debt that existed when the rules were written. Each entry is named where the rule is checked, next to the story that removes it.

| Rule | Where | Removed by |
| --- | --- | --- |
| AR-02 | `src/pages/Transaction.tsx` imports `@noble/curves` | VLW-15 (signing moves to `src/lib`) |
| AR-05 | `src/pages/Wallet.tsx` calls `/wallets/generate` | VLW-16 (keys generated in the browser) |
| AR-07 | `src/services/api.ts` hard-codes `http://127.0.0.1:8000` | VLW-21 (runtime configuration) |

**Where they are listed:**
- **AR-05 and AR-07:** in the test's `KNOWN_VIOLATIONS`.
- **AR-02:** in the `pathNot` of its rule in `.dependency-cruiser.cjs`.

**What each check does:**
- **AR-05 and AR-07:** a new violation fails, and so does a listed violation once it is fixed. The fixing story cannot forget to remove the entry.
- **AR-02:** a new violation fails. Removing the exception is part of VLW-15's definition of done.

## Promises that are not verifiable as written

They come from the README. They are not rules until they are made concrete; this is how I propose to do it.

| Promise | Why it is not verifiable | Proposal |
| --- | --- | --- |
| "Dark Mode Premium UI" | A taste, not a property. | Make it two rules: (a) colors only through the theme tokens of `src/index.css` (`@theme`): a test fails on a hex color inside `className` or CSS outside `index.css` (180 such literals today); (b) every text and status color meets WCAG AA contrast on its background, measured in tests (VLW-24). |
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
- **openapi-typescript** handles AR-09, with VLW-19.

Alternatives considered:
- **eslint-plugin-boundaries.** It needs ESLint next to oxlint, which has no boundary rules of its own.
- **A hand-written import scanner in Vitest.** No new dependency, but resolving TypeScript paths and cycles would be reimplemented.

## Which test covers which rule

| Test | Rules | Runs in |
| --- | --- | --- |
| `.dependency-cruiser.cjs` (`npm run lint:arch`) | AR-01, AR-02, AR-03, AR-04 | CI step `npm run lint:arch` |
| `src/architecture/no-server-generated-keys.test.ts` | AR-05 (no `/wallets/generate`) | `npm test` |
| `src/architecture/no-absolute-urls.test.ts` | AR-07 | `npm test` |
| `src/architecture/protected-routes.test.tsx` | AR-08 | `npm test` |
| `src/lib/signing.test.ts` | AR-06 | VLW-15 |
| The request-recording test | AR-05 (no private key in any request) | VLW-16 |
| CI step `npm run types:api` + `git diff --exit-code` | AR-09 | VLW-19 |

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

A deliberately broken PR also failed CI; see Sprint 1's notes.
