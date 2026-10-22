# ADR-0008: Light and dark themes that follow the system, with a switch in the navbar

- **Status:** Accepted on 2026-10-22 (product owner)
- **Date:** 2026-10-22
- **Related:** ADR-0006 (design C); ADR-0007 (two languages); ADR-0003 (the Content Security Policy); AR-10; VLW-38, VLW-39

## Context

Design E was dark only, and SPEC listed a light theme as out of scope. Design C was drawn light. The product owner wants both themes: they follow the system's preference, and a switch in the navbar lets the person choose (2026-10-22).

## Options

1. **The system's preference only** (`prefers-color-scheme`), with no switch. This is simple, but the person cannot pick a theme different from the system's.
2. **The system by default, plus a switch: System, Light or Dark.** The choice is remembered in the browser.
3. **Light only**, as C was drawn. This does not do what was asked.

**And how the dark theme is defined:**

- (a) designed in the canvas first;
- (b) derived in the code.

## Decision

Option 2, with the dark theme designed in the canvas first (product owner, 2026-10-22). What the canvas shows is what ships (ADR-0006).

- **Two sets of the same tokens.**
  - The light values sit under `:root`.
  - The dark ones sit under `:root[data-theme="dark"]`, and under `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])`.
  - Each theme sets its `color-scheme`, so the browser's own scrollbars and form controls match.
  - Components use only tokens, as they already must (no hex colours), so they need no change to switch.
- **The preference** is `system`, `light` or `dark`. It is stored with the language under `veriledger-preferences`.
  - With `system`, no `data-theme` is set, so the page follows the system as it changes.
  - With `light` or `dark`, the attribute pins that theme.
- **No flash of the wrong theme.**
  - `public/theme.js` is a few lines loaded in `<head>` before the styles. It sets `data-theme` from the stored preference before anything paints.
  - It is a file and not an inline script, because the Content Security Policy allows only `'self'` scripts.
- **The dark theme of C** is designed in the canvas (VLW-38):
  - every artboard of "C · Vistas finales" gets a theme control;
  - text passes 4.5:1, field borders and focus pass 3:1;
  - the fingerprint palette is checked on dark ground, where the ink bar needs an outline.
- **The switch** is in the navbar. It says the current choice in words to a screen reader, and DESIGN.md draws it (VLW-38).

## Consequences

- AR-10 compares the whole block, both themes included, with DESIGN.md.
- The accessibility pass runs in both themes, at 1280 and 360 px (VLW-48).
- `index.html` loads `/theme.js`. It is not hashed, so Caddy serves it with `no-store` like `index.html`, and the smoke test checks that it answers.
- SPEC's "Out of scope: … a light theme" is removed.
