# Architecture rules

Oct 20, 2026 · Sources: [SPEC.md](SPEC.md), [BACKLOG.md](BACKLOG.md), [CLAUDE.md](../CLAUDE.md), the README, [the ADRs](adr/) and the API's ADR-0004 and ADR-0005.

Each rule is one sentence that a test can prove or refute. A rule about "every" module, route or file is checked by a test that walks the whole list, so something new that breaks it fails without anyone adding a case. The tests do not exist yet: they are VLW-13, and wait for the tool below to be confirmed.

## Rules

| ID | Rule | Origin | How it is verified |
| --- | --- | --- | --- |
| AR-01 | Only modules under `src/services` import `axios`. | README › Backend connection (one place to configure the API); SPEC › Architecture | dependency-cruiser `forbidden` rule from every module outside `src/services` to `axios`. |
| AR-02 | Only modules under `src/lib` import `@noble/*`. | SPEC › Architecture and › Signing contract; ADR-0002 | dependency-cruiser `forbidden` rule from every module outside `src/lib` to `^@noble/`. |
| AR-03 | Dependencies between folders follow SPEC › Architecture: `pages → components, lib, services, store, types`; `components → lib, services, store, types`; `services → lib, store, types`; `store → types`; `lib → types`; `types →` nothing; and only `src/Router.tsx` imports `src/pages`. | SPEC › Architecture (folder table) | dependency-cruiser: one `forbidden` rule per disallowed direction, evaluated over every module. |
| AR-04 | There are no circular imports. | SPEC › Architecture (dependencies point inward) | dependency-cruiser `no-circular`. |
| AR-05 | No request sent through the API client carries a private key, and no code calls `/wallets/generate`. | README › Application flow ("The Private Key never leaves the browser"); SPEC › Non-functional requirements; ADR-0002 | Vitest: an axios adapter that records every request while the generate → transfer → notarize flow runs, then searches every URL, header and body for the private key; plus a scan of every file under `src` for `/wallets/generate`. |
| AR-06 | The signed message and signature reproduce every vector of the API's `docs/signing-vectors.json`. | SPEC › Signing contract; ADR-0002; API ADR-0004 (proposed) | Vitest: iterate the vectors copied to `src/lib/__fixtures__/`; compare the message byte for byte and the signature. Verifiable once the API's ADR-0004 is accepted and VLA-15 writes the vectors. |
| AR-07 | No module under `src` contains an absolute `http(s)://` URL other than XML namespaces; the API base URL comes from runtime configuration. | SPEC › Deployment; ADR-0003 | Vitest: read every file under `src` and fail on an `http://` or `https://` literal outside an allowlist (`http://www.w3.org/2000/svg`). |
| AR-08 | Every route except `/login` renders only with a session. | SPEC › Architecture (`ProtectedRoute`) | Vitest: iterate the route table exported by `Router.tsx`, render each path without a token and expect `/login`. Needs the routes as data (a small refactor inside VLW-13). |
| AR-09 | The types of the API's responses are generated from the API's OpenAPI document, not written by hand. | SPEC › API usage | CI runs `openapi-typescript` against the API's `/openapi.json` (the committed `docs/openapi.json` once VLA-30 exists) into `src/types/api.ts` and fails on `git diff`; `tsc` then catches every mismatch. |

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

## Proposed tool (waiting for your confirmation)

**dependency-cruiser + Vitest + openapi-typescript**, all run in CI (VLW-10):

- **dependency-cruiser** for the import rules (AR-01 to AR-04): it understands TypeScript paths and walks every module. Install the package `dependency-cruiser` as a dev dependency and run its `depcruise` binary through an npm script. Do not run `npx depcruise` without it installed: the npm package named `depcruise` is a placeholder published against dependency confusion.
- **Vitest** for the behavioral and file-walking rules (AR-05 to AR-08), next to the unit tests of VLW-12.
- **openapi-typescript** for AR-09.

Alternatives considered: eslint-plugin-boundaries (needs ESLint next to oxlint, which has no boundary rules of its own), and a hand-written import scanner in Vitest (no new dependency, but resolving TypeScript paths and cycles would be reimplemented).

## Which test covers which rule (after confirmation)

| Test | Rules |
| --- | --- |
| `.dependency-cruiser.cjs` (`npm run lint:arch`) | AR-01, AR-02, AR-03, AR-04 |
| `src/lib/signing.test.ts` | AR-06 |
| `src/architecture/no-private-key-leaves.test.ts` | AR-05 |
| `src/architecture/no-absolute-urls.test.ts` | AR-07 |
| `src/architecture/protected-routes.test.tsx` | AR-08 |
| CI step `npm run types:api` + `git diff --exit-code` | AR-09 |

**A rule that will fail on the first run, on its own.** AR-02: `src/pages/Transaction.tsx:5` imports `@noble/curves`. AR-05 (the wallet page calls `/wallets/generate`), AR-06, AR-07 (`src/services/api.ts:5`) and AR-09 fail too. VLW-13 lands the tests with those rules marked as expected failures and the story that fixes each, so CI is green and the debt is visible; removing the mark is part of the fixing story's DoD.
