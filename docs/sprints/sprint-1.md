# Sprint 1 — Builds from a clean clone, with tests and CI, inside design E's shell and sign-in (VLW-10 to VLW-14, VLW-27, VLW-33)

**Status as of 2026-10-20:** planned for October 26 – November 8, 2026. 14 points. Nothing in this sprint waits for the API. Its counterpart, the API's Sprint 1, is VLA-10 to VLA-15 and VLA-32.

**Order:** VLW-11, VLW-12, VLW-10, VLW-13, VLW-27, VLW-33, VLW-14.

**Pending decisions before it starts**

- The architecture-test tool (ARCHITECTURE_RULES.md › Proposed tool) for VLW-13.
- The comment inventory confirmed, for VLW-14. It now applies only to files that survive the redesign.

## What was delivered

| Story | PRs | Result | Verification |
| --- | --- | --- | --- |
| VLW-11 | [#2](https://github.com/Alesso2805/veriledger-webapp/pull/2) (`488eaea`, `9585116`, `7cf65e3`, `c3b1209`) | Unused `Hash` import and catch bindings removed; `@noble/ed25519` and `@noble/hashes` dropped; `npm audit fix` cleared 5 high advisories (axios, follow-redirects, nanoid, source-map-js, vite 8.1.5 → 8.3.4); template assets removed; `.nvmrc` 22 and `engines` `^22.12.0`; README corrected | Fresh clone on 2026-10-20: `npm ci && npm run build` green, `oxlint --deny-warnings` 0 warnings, `npm audit --audit-level=high` 0. In Chrome against a local API: login, explorer search error and network resolve unchanged. At 360 px both pages still scroll sideways, as before (same CSS output; fixed by VLW-27 and VLW-24) |
| VLW-12 | [#3](https://github.com/Alesso2805/veriledger-webapp/pull/3), stacked on #2 (`e2d345a`, `7c71157`, `d37cf73`) | `npm test` runs Vitest 5.0.3 with jsdom 29.1.1 and Testing Library. 10 tests cover the store (token, persistence, reload), the token interceptor (in-process adapter, no network) and the route guards (asserted by path). `engines` moves to `^22.13.0` because jsdom 30 needs 22.22.2 | Fresh clone on 2026-10-20: `npm ci` without engine warnings, build green, 10 of 10 tests pass, lint 0, audit 0. Breaking the interceptor fails 2 tests; letting visitors through `ProtectedRoute` fails 1. The app bundle is unchanged (same hash as #2) |
| VLW-10 | [#4](https://github.com/Alesso2805/veriledger-webapp/pull/4), stacked on #3 (`bb0296e`) | `.github/workflows/ci.yml` runs on every PR and on pushes to `main`: `npm ci`, lint (now `--deny-warnings` in the script too), `npm test`, `npm run build` (`tsc -b` and `vite build`) and `npm audit --audit-level=high`. It uses Node from `.nvmrc`, actions pinned by SHA (checkout v7.0.1, setup-node v7.0.0) and `contents: read`. Branch protection waited for the stack to merge, because #2 and #3 had no workflow and could never report the check. `main` now requires `ci`, with admins included and force pushes and deletion disabled | Run 39521626010 on #4: every step green. Draft #5 reintroduced the unused import: run 39521898778 failed at `npm run lint` and skipped the rest; #5 was closed and its branch deleted. After the merge, run 39530381568 on `main` passed |
| VLW-13 | — | — | — |
| VLW-27 | — | — | — |
| VLW-33 | — | — | — |
| VLW-14 | — | — | — |

## Sprint decisions

- **`main` exists on GitHub.** The remote had no `main`; its default branch was `feat/network-dashboard`. On 2026-10-20 it was renamed to `main`.
- **Branch protection.** `main` requires the `ci` check, for admins too, and forbids force pushes and deletion.
  - No review is required, since there is one developer.
  - A branch does not need to be up to date before merging, because every push to `main` runs CI again.
- **Node 22.13 or later** (`engines` `^22.13.0`). jsdom 29 needs it; jsdom 30 would need 22.22.2.
- **Stacked PRs.** When a lower PR merges, the next PR's base is changed to `main` before the merged branch is deleted. Deleting the branch first closed #3, which had to be reopened.
- **Found for VLW-27.** Tailwind 4 scans the whole repository, `docs/` included, so the class names in DESIGN.md's examples end up in the built CSS (+1.6 kB). VLW-27 should restrict the scan to `src`: `@import "tailwindcss" source("../src");`, also in DESIGN.md's CSS block.

## Changes to the specification in this sprint

—

## Retro

- **Went well:** —
- **To improve:** —
- **To try:** —
