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
| VLW-37 | #58 | ADR-0006, ADR-0007 and ADR-0008; SPEC's scope and conventions; epic E6; CLAUDE.md | — |
| VLW-38 | #59; the canvas, versions 62 to 70 | C's dark theme on every view and frame, contrast checked; the theme and language switches in every navbar; every text in Spanish, on the pages "C · Modo oscuro" and "C · Español"; DESIGN.md rewritten for C | On the canvas: the `theme` and `lang` tweaks of each view, and its navbar switches in play mode. AR-10 still passes |
| VLW-39 | 39a #60, 39b #61 | 39a: C's tokens in `src/index.css`, light and dark, with E's cube tokens at the end until VLW-48; Bricolage Grotesque (variable) and JetBrains Mono; AR-10 also checks that both dark lists are the same. E's views keep their layout in C's colours, in both themes | `npm test` (AR-10); `npm run test:a11y`; any page in a browser, with the system in light and then in dark. 39b: `usePreferencesStore` keeps System, Light or Dark under `veriledger-preferences`; `public/theme.js` sets it before the first paint; the switch sits in the navbar and cycles the three, saying its state in words; a choice the app did not write follows the system | Click the switch in the navbar: the page turns light, dark, then follows the system again; reload on Dark and the page opens dark with no flash. `docker/smoke-test.sh` checks `/theme.js` |
| VLW-40 | 40a #62, 40b this PR | 40a: `src/lib/i18n` with `en.ts` and `es.ts` of one type; the API's known messages in Spanish, unknown ones as they came; counts and dates through `Intl` in the page's language, amounts with the API's point; the language stored with the theme, else the browser's first language the app speaks; `<html lang>`; the EN/ES switch in the navbar; the shell, the 404 and the failure cards in both languages | Press EN in the navbar: the tabs, the status, the search and the buttons turn Spanish, and `<html lang>` is `es`; reload and it stays Spanish. 40b: the login, the tower and the transaction page, the certificate's sentence ("20 de octubre de 2026 a las 16:21:55 UTC") and the journey included | The same switch on `/login`, `/` and a transaction's page |
| VLW-41 | — | — | — |
| VLW-42 | — | — | — |

## Sprint decisions

- **C, two languages and two themes come before 1.0.0** (product owner, 2026-10-22). VLW-26 moved to Sprint 6, so its screenshots show C.
- **A typed dictionary, no library** (product owner, 2026-10-22, ADR-0007). The Spanish dictionary has the English one's type, so a missing text fails `tsc`. Dates, numbers and plurals come from `Intl`.
- **The API's known errors are translated in the webapp** (product owner, 2026-10-22, ADR-0007). An unknown one is shown as it came.
- **The dark theme is designed before it is built** (product owner, 2026-10-22, ADR-0008). What the canvas shows is what ships.
- **The Spanish copy and its numbers are approved as drawn** (product owner, 2026-10-22). Amounts keep the API's spelling with a point in both languages, other numbers and dates follow `Intl` (ADR-0007, unchanged).
- **The language switch's name starts with its code** (VLW-40a): "EN, English. Switch to español". axe requires the visible "EN" in the name, and drops what is in parentheses; the canvas follows.
- **DESIGN.md keeps E's token block at its end until VLW-39** (VLW-38). AR-10 compares `src/index.css` with it, so the checks stay green while C is drawn but not built; VLW-39 swaps the two blocks with the code in one PR.
- **Fixed on the canvas while writing DESIGN.md** (VLW-38): the light `ink-line` token pointed at itself, so ink panels had no borders in light; `ink-line` was raised to pass 3:1 on ink in both themes; two colours were literals that failed in dark; the forget-key panel got its own token, `ink-danger`; the header's buttons wrap at 360 px when signed out; the sans font is the variable Bricolage with its optical sizes, as in the canvas.

## Changes to the specification in this sprint

- Design C, English and Spanish, and light and dark themes join the scope; "user-facing text in English" becomes "in English and Spanish" (VLW-37).
- DESIGN.md describes C; the code keeps E's tokens until VLW-39 (VLW-38).

## Retro

- **Went well:** —
- **To improve:** —
- **To try:** —
