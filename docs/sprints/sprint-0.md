# Sprint 0 — Baseline as built, documented and audited (VLW-01 to VLW-07)

**Status as of 2026-10-20:** VLW-01 to VLW-06 were built on July 29, 2026, before there was a backlog; they are recorded here retroactively so that each one has acceptance criteria the audit can check. VLW-07 (this documentation) was merged through #6. The sprint closes on October 25, together with the API's Sprint 0.

## Where the code stands

`main` at `770f4f4`. The app arrived in one commit (`d96901f`, all six pages), then two more (`1b3acb3` fees and mining, `a382ef4` the explorer's look and the notarization certificate) through PR #1 (`feat/mining-ui-components`). On GitHub that history lived on `feat/network-dashboard`, the default branch; the remote had no `main`. It was renamed to `main` on 2026-10-20. No CI ran: the repository has no workflow, and no tests.

## What was delivered

| Story | Commits | Result | Verification |
| --- | --- | --- | --- |
| VLW-01 | `d96901f` | Login, persisted token, protected routes, logout | No test. Checked in Chrome: works, but the form starts with the admin's email and password, and a token expired in July still showed the app as signed in |
| VLW-02 | `d96901f`, `1b3acb3` | Wallet generation and balance | No test. Checked in Chrome: the pair comes from `POST /wallets/generate` |
| VLW-03 | `d96901f`, `1b3acb3`, `a382ef4` | Transfer and notarization signed in the browser | No test. Checked in Chrome: both answered "Invalid transaction signature" |
| VLW-04 | `d96901f`, `1b3acb3`, `a382ef4` | Explorer with stats, mining and search | No test. Checked in Chrome: mining works; a transaction inside a block opens "Not Found" |
| VLW-05 | `a382ef4` | Transaction detail and notarization certificate | No test. Not reachable from a block's link |
| VLW-06 | `d96901f`, `a382ef4` | Peers and resolve | No test. Checked in Chrome: every peer is shown "ACTIVE", including internal addresses |
| VLW-07 | [#6](https://github.com/Alesso2805/veriledger-webapp/pull/6) | CLAUDE.md, SPEC, BACKLOG, four ADRs, ARCHITECTURE_RULES, DESIGN, AUDIT, these notes | Merged through #6 with CI green |

On 2026-10-20 `npm ci && npm run build` from a fresh clone failed (`TS6133: 'Hash' is declared but its value is never read` in `Explorer.tsx`).

## Sprint decisions

- **One backlog per repository, one sprint calendar** with the API (VLA-NN / VLW-NN).
- **Contracts are the API's.** The signed message (API ADR-0004) and the deployment (API ADR-0005) are decided there; this repository's ADR-0002 and ADR-0003 adopt them.
- **The audit drives the plan.** Every blocking or important finding of `docs/AUDIT.md` became a story in E1 to E4.
- **Proposed, not accepted:** ADR-0002 (keys and signing only in the browser) and ADR-0003 (static files behind the API's Caddy) wait for the product owner.
- **Design direction E, accepted (ADR-0004).**
  - Five directions were explored in a design canvas: ledger book, instrument, fingerprint, containers, and tower and network. The product owner chose E.
  - Its eight final artboards and `docs/DESIGN.md` are the specification. The same tokens and keyframes go into `src/index.css`.
  - Animations only follow real events. Mining shows elapsed time, because the API reports no progress.
  - The redesign is epic E5 (VLW-27 to VLW-34), brought forward in order:
    - foundation in Sprint 1, views in Sprints 2 and 3;
    - the API's data endpoints move to its Sprint 2;
    - deployment stays in Sprint 4.
- **Demo access, accepted (API ADR-0006).** No sign-up. Visitors browse without an account and start a 24-hour trader account with one click (VLW-34). The account expires; what it recorded stays on the chain.

## Changes to the specification in this sprint

The specification did not exist before; `docs/SPEC.md` and `docs/BACKLOG.md` were written on 2026-10-20 from the code, the README and the audit.

## Retro

- **Went well:** six screens with a consistent look in one day, and signing already happens in the browser on the transact page.
- **To improve:** nothing checked the screens against the real API: the core flow (sign a transfer) never worked, and the build broke on an unused import without anyone noticing.
- **To try:** from Sprint 1, CI on every PR, and every screen checked in the browser against a running API at 1280 and 360 px before it is called done.
