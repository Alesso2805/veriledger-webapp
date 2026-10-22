# Sprint 4 — End-to-end and accessibility checks, deployed with the API, released as 1.0.0 (VLW-23 to VLW-26)

**Status as of 2026-10-21:** planned for December 7 – 20, 2026; it may start early, because Sprint 3 closed on 2026-10-21. 13 points.

**Order** (product owner, 2026-10-21):

1. VLW-24.
2. VLW-23, when VLA-21 and VLA-24 are merged.
3. VLW-25, with VLA-27.
4. VLW-26.

**Dependencies on the API**

| Webapp story | Needs | State on 2026-10-21 |
| --- | --- | --- |
| VLW-24 | Nothing | — |
| VLW-23 | VLA-22 (the image on GHCR), VLA-23 (Compose: migrate, then the API), VLA-21 (`CORS_ORIGINS`), VLA-24 (seeded users from the environment), VLA-35 (the demo) | VLA-22, VLA-23 and VLA-35 merged; VLA-21 and VLA-24 to come |
| VLW-25 | VLA-27 (the API's Caddy and production Compose, rehearsed locally until there is a server) | To come |
| VLW-26 | The deployed instance, for the README's screenshots | After VLW-25 |

## What was delivered

| Story | PRs | Result | Verification |
| --- | --- | --- | --- |
| VLW-24 | — | — | — |
| VLW-23 | — | — | — |
| VLW-25 | — | — | — |
| VLW-26 | — | — | — |

## Sprint decisions

- **VLW-23's admin comes from the environment.** The CI job sets `ADMIN_EMAIL` and `ADMIN_PASSWORD` for its throwaway stack, which the API seeds (VLA-24), and the flows read them as `E2E_ADMIN_*`, so no credential is written in the tests. The API's email check refuses reserved names such as `.test`, so the address is `@veriledger.com`. The job first built the API from source; since VLA-38 it runs the API's published image (`docker-compose.ghcr.yml`) at a pinned commit and `sha-` tag.
- **The flows read the block number from the API's answer.** Run in parallel on one chain, the demo flow once mined the number the admin's button showed. A real node has other miners too, so each mining step now waits for the toast of the block its own `POST /blocks/mine` sealed, and a transaction only has to be sealed in some block.
- **A database outage is not called "offline"** (product owner, 2026-10-21). The API's `/health` became a readiness check (VLA-26). Its 503 with `"database": "unreachable"` reads "no database" in the header and "<host> answers, but its database does not" in the banner, and the types were regenerated from the API at b205e4e. The `e2e` job moved to the same commit.
- **`e2e` became a required check on `main`** (product owner, 2026-10-21), next to `ci`.
- **Part of VLW-26 ahead of the order** (product owner, 2026-10-21), while the API prepared VLA-27: the title "VeriLedger", the logo as the favicon, and a first `CHANGELOG.md` under Unreleased. Version 1.0.0 and the README's screenshots still wait for VLW-25.
- **The API's limits stay on in the end-to-end flows** (VLA-29). A node mines one block at a time, so the mining step waits for `Retry-After` after a 429, or after the 409 race, and tries again, as a person reading the toast would. At the default difficulty the two flows met two such 429s locally, and both runs passed. The flows sign in once, under the five-per-minute limit, so no limit is turned off. The `e2e` job runs the API at 154e497.
- **The rehearsal runs this repository's own image** (VLW-25b). A `rehearsal` job starts the API's production Compose with the image the pull request builds, on `https://localhost`, and runs the flows through Caddy. A change that breaks the production path, such as a blocked request under the Content Security Policy, fails before it is published. Both API stacks in CI are pinned to the API's release 1.0.0.
- **The server** (product owner, 2026-10-21): a VM on Google Cloud, with a DuckDNS subdomain, set up by the product owner, and deployed with the API's runbook.
- **The image's files are built natively.** The Image workflow usually takes about 3 minutes, but two pull request runs hung for 30 minutes and were cancelled, in the arm64 build that ran `npm ci` under QEMU. The Node stage now runs on the build machine's own platform (`--platform=$BUILDPLATFORM`), since its output is the same static files for every architecture. Only the Caddy stage runs per target; a local arm64 build passed the smoke test.
- **No server yet** (product owner, 2026-10-21). VLW-25 is prepared and rehearsed locally, like the API's VLA-27, and the real deployment waits for the product owner. The webapp's image is published to GHCR, public like the API's, so the API's Compose can run it behind Caddy (VLW-25a).
- **Nothing blanks the app any more** (product owner, 2026-10-21). Letters past `f` in the wallet's look-up blanked the whole page (#53). An audit then read every function that runs while a page draws, and fuzzed Chromium, WebKit and Firefox with 795 checks.
  - Nothing a person types, opens or navigates to blanked a page. Five cases from stored or server data did, and #54 fixed them.
  - Two stories joined the sprint: VLW-35, a fallback for any future throw while drawing, and VLW-36, the fuzzer in CI.
  - The push of #54's merge started no workflows on `main`, so no `sha-ba528f1` image exists. The product owner chose to let the next merge publish one.

## Changes to the specification in this sprint

—

## Retro

- **Went well:** —
- **To improve:** —
- **To try:** —
