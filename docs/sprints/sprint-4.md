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

- **No server yet** (product owner, 2026-10-21). VLW-25 is prepared and rehearsed locally, like the API's VLA-27, and the real deployment waits for the product owner. The webapp's image is published to GHCR, public like the API's, so the API's Compose can run it behind Caddy (VLW-25a).

## Changes to the specification in this sprint

—

## Retro

- **Went well:** —
- **To improve:** —
- **To try:** —
