# Sprint 5 — Design C's foundation: dark theme designed, both themes and both languages in the code, the shell and the sign-in (VLW-37 to VLW-42)

**Status as of 2026-10-22:** planned for December 21, 2026 – January 3, 2027; it starts early, while Sprint 4 waits only for VLW-26, which moved to Sprint 6. 19 points.

**Why this sprint exists** (product owner, 2026-10-22). Directions C, D and E were drawn in full on the canvas, every view at 1440, 768 and 360 px. The product owner chose C, in English and Spanish and in light and dark themes, before release 1.0.0. The decisions are ADR-0006 to ADR-0008:

- C replaces E's direction, and E's rules on tokens, motion and the canvas stay.
- The texts come from a typed dictionary, and the API's known errors are translated.
- The theme follows the system, with a switch in the navbar, and the dark theme is designed in the canvas first.

**Order** (product owner, 2026-10-22):

1. VLW-37, the decisions.
2. VLW-38, C's dark theme and the Spanish texts on the canvas, and DESIGN.md rewritten for C.
3. VLW-39, the tokens and themes in the code.
4. VLW-40, both languages on the pages as they are.
5. VLW-41, the shell.
6. VLW-42, the sign-in.

**Dependencies on the API:** none. The API's English errors are translated in the webapp (ADR-0007), so no VLA story is needed.

**The deployed instance** keeps its pinned image (`WEBAPP_IMAGE_TAG`) until epic E6 is done, so visitors never see a half-redesigned app.

## What was delivered

| Story | PRs | Result | Verification |
| --- | --- | --- | --- |
| VLW-37 | this PR | ADR-0006, ADR-0007 and ADR-0008; SPEC's scope and conventions; epic E6; CLAUDE.md | — |
| VLW-38 | — | — | — |
| VLW-39 | — | — | — |
| VLW-40 | — | — | — |
| VLW-41 | — | — | — |
| VLW-42 | — | — | — |

## Sprint decisions

- **C, two languages and two themes come before 1.0.0** (product owner, 2026-10-22). VLW-26 moved to Sprint 6, so its screenshots show C.
- **A typed dictionary, no library** (product owner, 2026-10-22, ADR-0007). The Spanish dictionary has the English one's type, so a missing text fails `tsc`. Dates, numbers and plurals come from `Intl`.
- **The API's known errors are translated in the webapp** (product owner, 2026-10-22, ADR-0007). An unknown one is shown as it came.
- **The dark theme is designed before it is built** (product owner, 2026-10-22, ADR-0008). What the canvas shows is what ships.

## Changes to the specification in this sprint

- Design C, English and Spanish, and light and dark themes join the scope; "user-facing text in English" becomes "in English and Spanish" (VLW-37).

## Retro

- **Went well:** —
- **To improve:** —
- **To try:** —
