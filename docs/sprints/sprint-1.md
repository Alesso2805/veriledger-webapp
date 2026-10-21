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
| VLW-13 | [#7](https://github.com/Alesso2805/veriledger-webapp/pull/7) (`bb5b6c2`, `7e3ecc9`, `c9c412e`, `fbaa9c6`) | dependency-cruiser 18.5.0 (`npm run lint:arch`, a CI step) checks AR-01 to AR-04. Vitest in `src/architecture/` walks every module for AR-05 and AR-07, and every route for AR-08. The routes became data: `Router.tsx` exports `routes`, and `App.tsx` uses `useRoutes`, 1.4 kB smaller. Known violations are named with their story: AR-02 VLW-15, AR-05 VLW-16, AR-07 VLW-21. AR-06 comes with VLW-15 and AR-09 with VLW-19. AR-07 now allows form placeholders | Eight deliberate local breaks, one per check, were all caught (table in ARCHITECTURE_RULES.md). Draft #8 made the store import the API client: run 39531305016 failed at `npm run lint:arch`. Run 39531253851 on #7 is green |
| VLW-27 | 27a [#9](https://github.com/Alesso2805/veriledger-webapp/pull/9); 27b [#10](https://github.com/Alesso2805/veriledger-webapp/pull/10); 27c toasts | **27a:** `index.css` is DESIGN.md's block (AR-10), with the fonts self-hosted and the Tailwind scan limited to `src`; the old classes are in `legacy.css`. **27b:** the design E header, with logo, tabs, transaction search, `/health` every 10 s, email and role from `/auth/me`, "Sign out", skip link and `<main key={pathname}>` with `animate-vl-fade-up`. "Sign out" was added to the canvas (version 31) and to DESIGN.md. **27c:** a toast store and region on every page, login included. Toasts come in three kinds (ok, err, info) as in the artboard, enter with `animate-vl-toast-in`, close after 4 s and can be dismissed. A single polite live region announces them; the artboard's `role="status"` on each toast is left out, because nested live regions get read twice | **27a:** tokens, fonts and the reduced-motion rule were checked in Chrome. **27b:** in Chrome against a local API at 1280 px, the skip link appears on the first Tab, the tabs mark the current page, `main` replays `vl-fade-up` on each route, and the search opens `/transaction/<hash>`. At 360 px nothing scrolls sideways (352 of 352 px): the status and "Sign out" share the logo's row, the search sits below, and the tabs scroll inside their strip. **27c:** in Chrome the three kinds render as drawn. Dismissing removes only that toast; one was still there at 3.9 s and none at 4.3 s. At 360 px they wrap inside the screen (352 of 352 px) |
| VLW-33 | 33a [#12](https://github.com/Alesso2805/veriledger-webapp/pull/12); 33b [#13](https://github.com/Alesso2805/veriledger-webapp/pull/13); 33c 404 | **33a:** the login of the artboard "E · Login y demo con un clic". It has an empty form, a 401 shake replayed by remounting the form, and a session-expired notice. After signing in it returns to the page the person was on (`ProtectedRoute` keeps it in the router state). A new token, `--color-vl-shadow`, covers the shadow under the tower; it is in DESIGN.md, `index.css` and all eight artboards (canvas version 32). Below 940 px the form comes first. "Try the demo" comes with VLW-34. **33b:**
- `useHealthStore` is fed by `HealthWatcher`, which checks `/health` every 10 s on every page, the login included.
- The header status, the login status line and the offline banner read that store. The banner shows "Can’t reach <host>. Retrying every 10 s." and "Retry now", and opens and closes through `grid-template-rows`.
- "Back online." is shown only when the API comes back after being offline.
- The banner's background became the token `--color-vl-danger-soft`.
- The artboard's "last data we had" and "Data is up to date" were dropped, because no page keeps or refreshes data yet (canvas version 33).

**33c:** the 404 tower of the artboard, with the dashed missing cube floating (`animate-vl-float`) and "Back to the tower". It is the shell's catch-all route, so AR-08 also covers it | **33a:** in Chrome against a local API, a wrong password returned 401: the form ran `vl-shake`, the borders turned `#FF7A6B` and the message appeared. Editing a field cleared the error. The right password returned to `/wallet`, where the person had been sent from. At 360 px the form starts at 112 px instead of 786 px, with no sideways scroll. **33b:** in Chrome against a local API, stopping it turned the status to "offline" and opened the banner within 12 s (420 ms, `--ease-vl-out`). Starting it again closed the banner on the next check and showed "Back online." once. At 360 px the banner wraps without sideways scroll. The login status line reads "127.0.0.1:8000 · online". **33c:** in Chrome, `/no/such/page` shows the 404 inside the shell and "Back to the tower" opens `/`. At 360 px it is one column with no sideways scroll. Tests: the 404 with a session, the login without one, and AR-08 walking `/*` |
| VLW-14 | — | — | — |

## Sprint decisions

- **`main` exists on GitHub.** The remote had no `main`; its default branch was `feat/network-dashboard`. On 2026-10-20 it was renamed to `main`.
- **Branch protection.** `main` requires the `ci` check, for admins too, and forbids force pushes and deletion.
  - No review is required, since there is one developer.
  - A branch does not need to be up to date before merging, because every push to `main` runs CI again.
- **Node 22.13 or later** (`engines` `^22.13.0`). jsdom 29 needs it; jsdom 30 would need 22.22.2.
- **Stacked PRs.** When a lower PR merges, the next PR's base is changed to `main` before the merged branch is deleted. Deleting the branch first closed #3, which had to be reopened.
- **VLW-27 in three PRs** (product owner, 2026-10-20), because it exceeds ~300 lines: 27a tokens and fonts, 27b the shell, 27c toasts.
- **Old neon styles move to `src/legacy.css`** (product owner, 2026-10-20). `index.css` holds only design E. The pages that are not replaced yet keep their look inside the new shell.
  - Each replacing story deletes the classes only its page used.
  - VLW-32 deletes the file.
  - Nothing new may use those classes.
- **Found for VLW-27.** Tailwind 4 scans the whole repository, `docs/` included, so the class names in DESIGN.md's examples end up in the built CSS (+1.6 kB). VLW-27 should restrict the scan to `src`: `@import "tailwindcss" source("../src");`, also in DESIGN.md's CSS block. Done in 27a: the build no longer contains classes that only DESIGN.md uses (`.bg-vl-surface`, `.animate-vl-drop`).

## Changes to the specification in this sprint

—

## Retro

- **Went well:** —
- **To improve:** —
- **To try:** —
