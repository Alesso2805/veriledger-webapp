# VeriLedger webapp — design (direction C, "Fingerprint")

Oct 22, 2026 · Chosen by the product owner on 2026-10-22 ([ADR-0006](adr/0006-design-direction-c.md)), in light and dark themes ([ADR-0008](adr/0008-light-and-dark-themes.md)) and in English and Spanish ([ADR-0007](adr/0007-two-languages.md)). It replaces direction E ([ADR-0004](adr/0004-design-direction-e.md)).

**Canvas:** https://claude.ai/artifact/PEDxibhnmsErQTovt5b6pP. It is private until shared from the canvas.

- **"C · Vistas finales"** is the specification: every view at 1440, 768 and 360 px, in light, with each view's states as tweaks.
- **"C · Modo oscuro"** mounts the same views in the dark theme, and **"C · Español"** in Spanish. Every view also has a `theme` and a `lang` tweak, and its navbar switches work.
- "E · Vistas finales", the direction the code drew until epic E6 rebuilt every view in C (VLW-41 to VLW-47), "D · Vistas finales" and "Exploración A–E" are kept for reference only.

## The promise: what the canvas shows is what ships

1. **Same tokens.** Every artboard declares the CSS custom properties of [the tokens block](#tokens-and-motion), with the same names and values the webapp declares in Tailwind 4's `@theme`. A colour, font, easing or animation changes in both places in the same PR, or in neither.
2. **CSS only.** Keyframes and transitions from that block. No animation library, no JavaScript-driven animation.
3. **Only real events animate.** An animation starts because data arrived, a request started or settled, or the person acted (see [Motion map](#motion-map)). Nothing suggests progress the app cannot measure.
4. **Replays are remounts.** In the code an animation replays through a React `key` change (`key={selectedBlock}`, `key={height}`). The canvas reaches the same effect by mounting a new element; the visual result is identical.
5. **Reduced motion.** With `prefers-reduced-motion: reduce`, every animation and transition takes 1 ms. No information depends on motion.
6. **Only data the app can have.** Every number, list and status maps to an endpoint or a computation in the browser ([Views](#views)). What the API does not expose is not drawn ([What the design does not show](#what-the-design-does-not-show)).
7. **Design-only affordances are listed.** The canvas has a few things that exist only to review the design ([Design-only affordances](#design-only-affordances)). They are not built.
8. **Both themes.** Every view is drawn light and dark from the same tokens; a component never picks a colour by theme ([Themes](#themes)).
9. **Both languages.** Every text is drawn in English and Spanish, and the canvas's texts are the dictionaries' texts ([Languages](#languages)).

## Tokens and motion

This block goes into `src/index.css` as is (VLW-39). A test (AR-10) fails if the two differ by a single character, or if the two lists of dark values differ. The canvas artboard "C · Motion y tokens" shows every token in both themes and replays every animation.

- `source("../src")` limits Tailwind's class scan to `src`. Without it, Tailwind also scans `docs/` and builds the class names of this document's examples into the app.
- **Bricolage Grotesque** is the variable font with its optical-size axis (`opsz.css`), like the canvas's: big titles are drawn tighter than body text, by the font itself. Its family is "Bricolage Grotesque Variable"; the canvas loads the same font from Google Fonts as "Bricolage Grotesque", so the token names both and each place uses the one it has.
- **The light values** are the theme's defaults, in `@theme`. **The dark values** override the same names, once for a dark choice in the navbar (`data-theme="dark"`) and once for the system's preference when nothing is chosen (ADR-0008). The two dark lists are the same, and AR-10's test keeps them so.
- Each theme sets `color-scheme`, so the browser's own scrollbars and form controls follow it.
- Tokens that do not change with the theme (`wait`, `on-wait`, `on-ink`, `on-ink-muted`, `ink-danger`, `logo-tile`) are declared once.

```css
@import "tailwindcss" source("../src");
@import "@fontsource-variable/bricolage-grotesque/opsz.css";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/500.css";

@theme {
  --color-vl-bg: #EEF1F4;
  --color-vl-surface: #FFFFFF;
  --color-vl-raised: #F6F8FA;
  --color-vl-line: #7D8895;
  --color-vl-line-soft: #E3E8ED;
  --color-vl-text: #101418;
  --color-vl-muted: #55606B;
  --color-vl-faint: #9AA6B2;
  --color-vl-accent: #2F45FF;
  --color-vl-on-accent: #FFFFFF;
  --color-vl-ok: #0F7B5F;
  --color-vl-ok-soft: #E3F6EE;
  --color-vl-danger: #B42318;
  --color-vl-danger-soft: #FDECEA;
  --color-vl-wait: #F5C400;
  --color-vl-wait-soft: #FFF4C2;
  --color-vl-on-wait: #101418;
  --color-vl-skeleton: #E3E8ED;
  --color-vl-ink: #101418;
  --color-vl-on-ink: #FFFFFF;
  --color-vl-on-ink-muted: #C3CBD3;
  --color-vl-ink-raised: #1C232A;
  --color-vl-ink-line: #62707C;
  --color-vl-ink-danger: #2A1A1C;
  --color-vl-inset: #101418;
  --color-vl-strong: #101418;
  --color-vl-on-strong: #FFFFFF;
  --color-vl-on-strong-muted: #C3CBD3;
  --color-vl-fp-ring: rgb(16 20 24 / 0.06);
  --color-vl-logo-tile: #FFFFFF;
  --color-vl-shadow: rgb(16 20 24 / 0.16);
  --font-vl-sans: "Bricolage Grotesque Variable", "Bricolage Grotesque", system-ui, sans-serif;
  --font-vl-mono: "JetBrains Mono", ui-monospace, monospace;
  --ease-vl-out: cubic-bezier(.2, .7, .2, 1);
  --ease-vl-in-out: cubic-bezier(.45, 0, .2, 1);
  --ease-vl-spring: cubic-bezier(.2, .8, .2, 1);
  --animate-vl-fade-up: vl-fade-up 280ms var(--ease-vl-out) both;
  --animate-vl-fade-in: vl-fade-in 280ms ease both;
  --animate-vl-tile-in: vl-tile-in 560ms var(--ease-vl-out) both;
  --animate-vl-bars-in: vl-bars-in 520ms var(--ease-vl-spring) both;
  --animate-vl-travel: vl-travel 760ms var(--ease-vl-in-out) both;
  --animate-vl-pop: vl-pop 420ms ease both;
  --animate-vl-shake: vl-shake 360ms ease both;
  --animate-vl-reveal: vl-reveal 700ms var(--ease-vl-out) both;
  --animate-vl-pulse: vl-pulse 1.2s ease-in-out infinite;
  --animate-vl-toast-in: vl-toast-in 280ms var(--ease-vl-out) both;
}

:root { color-scheme: light; --vl-dur-fast: 160ms; --vl-dur-base: 280ms; --vl-dur-slow: 420ms; }

:root[data-theme="dark"] {
  color-scheme: dark;
  --color-vl-bg: #0E1116;
  --color-vl-surface: #171B22;
  --color-vl-raised: #1F242C;
  --color-vl-line: #6E7A89;
  --color-vl-line-soft: #2A3039;
  --color-vl-text: #EEF1F4;
  --color-vl-muted: #A3ADB9;
  --color-vl-faint: #4A5360;
  --color-vl-accent: #8392FF;
  --color-vl-on-accent: #0E1116;
  --color-vl-ok: #4FD1A5;
  --color-vl-ok-soft: #12302A;
  --color-vl-danger: #FF8A8A;
  --color-vl-danger-soft: #3A1C1F;
  --color-vl-wait-soft: #3A3214;
  --color-vl-skeleton: #232933;
  --color-vl-ink: #262D38;
  --color-vl-ink-raised: #313946;
  --color-vl-ink-line: #74808F;
  --color-vl-inset: #07090C;
  --color-vl-strong: #EEF1F4;
  --color-vl-on-strong: #0E1116;
  --color-vl-on-strong-muted: #4A5360;
  --color-vl-fp-ring: rgb(255 255 255 / 0.34);
  --color-vl-shadow: rgb(0 0 0 / 0.5);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --color-vl-bg: #0E1116;
    --color-vl-surface: #171B22;
    --color-vl-raised: #1F242C;
    --color-vl-line: #6E7A89;
    --color-vl-line-soft: #2A3039;
    --color-vl-text: #EEF1F4;
    --color-vl-muted: #A3ADB9;
    --color-vl-faint: #4A5360;
    --color-vl-accent: #8392FF;
    --color-vl-on-accent: #0E1116;
    --color-vl-ok: #4FD1A5;
    --color-vl-ok-soft: #12302A;
    --color-vl-danger: #FF8A8A;
    --color-vl-danger-soft: #3A1C1F;
    --color-vl-wait-soft: #3A3214;
    --color-vl-skeleton: #232933;
    --color-vl-ink: #262D38;
    --color-vl-ink-raised: #313946;
    --color-vl-ink-line: #74808F;
    --color-vl-inset: #07090C;
    --color-vl-strong: #EEF1F4;
    --color-vl-on-strong: #0E1116;
    --color-vl-on-strong-muted: #4A5360;
    --color-vl-fp-ring: rgb(255 255 255 / 0.34);
    --color-vl-shadow: rgb(0 0 0 / 0.5);
  }
}

body { background: var(--color-vl-bg); color: var(--color-vl-text); font-family: var(--font-vl-sans); }
:focus-visible { outline: 3px solid var(--color-vl-accent); outline-offset: 2px; }

@keyframes vl-fade-up { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes vl-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes vl-tile-in { from { opacity: 0; transform: translateX(32px) scale(.96) } to { opacity: 1; transform: none } }
@keyframes vl-bars-in { from { opacity: 0; transform: scaleY(.2) } to { opacity: 1; transform: none } }
@keyframes vl-travel { 0% { offset-distance: 0%; opacity: 0 } 12% { opacity: 1 } 88% { opacity: 1 } 100% { offset-distance: 100%; opacity: 0 } }
@keyframes vl-pop { 0% { transform: scale(1) } 40% { transform: scale(1.16) } 100% { transform: scale(1) } }
@keyframes vl-shake { 0%, 100% { transform: none } 20% { transform: translateX(-6px) } 40% { transform: translateX(6px) } 60% { transform: translateX(-3px) } 80% { transform: translateX(3px) } }
@keyframes vl-reveal { from { opacity: 0; filter: blur(6px) } to { opacity: 1; filter: none } }
@keyframes vl-pulse { 0%, 100% { opacity: 1 } 50% { opacity: .45 } }
@keyframes vl-toast-in { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
```

Utilities follow from the names: `bg-vl-surface`, `text-vl-muted`, `font-vl-mono`, `ease-vl-out`, `animate-vl-tile-in`. Transitions use `duration-(--vl-dur-fast)` and friends.

**What the tokens are for, and their contrast** (checked for both themes on 2026-10-22; text needs 4.5:1, field borders and focus 3:1):

| Token | Use | Light | Dark |
| --- | --- | --- | --- |
| `bg`, `surface`, `raised` | The ground; cards and fields; hover and read-only fields | — | — |
| `text` | Text | 18.5:1 on surface | 15.2:1 |
| `muted` | Secondary text | 6.4:1 | 7.6:1 |
| `line` | Field borders | 3.6:1 | 4.0:1 |
| `line-soft`, `skeleton`, `faint` | Dividers, skeletons, empty bars; `faint` only for disabled controls and decoration | decoration | decoration |
| `accent`, `on-accent` | Actions, focus, the `0000` of a seal | 6.2:1; its text 6.2:1 | 6.2:1; its text 6.8:1 |
| `ok`, `danger` | Online, accepted, a match; refusals and failures | 5.2:1; 6.6:1 | 9.0:1; 7.6:1 |
| `ok-soft`, `danger-soft`, `wait-soft` | Behind an accepted card, a refusal, a waiting chip. `text` on them; `ok` and `danger` titles on their own | text 16.2:1 and more; ok 4.6:1, danger 5.7:1 | text 11.3:1 and more; ok 7.4:1, danger 6.8:1 |
| `wait`, `on-wait` | A step still to do: the "Download .json" button and its ring | 11.3:1 | 11.3:1 |
| `ink`, `on-ink`, `on-ink-muted` | Panels that stay dark in both themes: the key, the certificate, the legend, toasts | 18.5:1; 11.3:1 | 13.9:1; 8.5:1 |
| `ink-raised`, `ink-line` | Rows and control borders inside an ink panel | — ; 3.6:1 on ink | — ; 3.5:1 on ink |
| `ink-danger` | The forget-key confirmation inside the ink panel, with a coral ring | white 16.6:1, ring 5.5:1 | the same |
| `inset` | The message being signed | 18.5:1 | 17.6:1 |
| `strong`, `on-strong`, `on-strong-muted` | The active tab, a selected row, the dark buttons. They invert in dark, where an ink button would not stand out | 18.5:1 | 16.7:1 |
| `fp-ring` | The 1 px outline of every fingerprint bar, so ink and cobalt bars show on dark cards | decoration | decoration |
| `logo-tile`, `shadow` | The logo's white tile in both themes; the search results' shadow | decoration | decoration |

**Removed from E:** the cube tokens, the shadow under the tower, `drop` and `float`. **Added:** `ok-soft`, `wait` and its companions, `skeleton`, `ink` and its companions, `strong` and its companions, `fp-ring`, `logo-tile`, `tile-in`, `bars-in` and the spring easing. The focus outline grows from 2 to 3 px.

**Colours on ink panels.** A few marks on ink use the fingerprint palette, the same in both themes because ink is dark in both: mint for a match and for the signature's check, coral for "No match" and for forgetting a key, sky for the certificate's label and the nonce in the message being signed, and mint, coral and sky for the toasts' dots (ok, error, information). The code takes them from the palette in `src/lib/fingerprint.ts`, never as literals in a component.

## Themes

ADR-0008: the theme follows the system unless the person chooses one.

- **The switch** sits in the navbar, after the language switch, and at the top of the login card. It cycles **System → Light → Dark → System**. Its icon shows the current choice (a monitor, a sun, a moon), and its label says the choice and the next one in words: "Theme: System. Switch to Light", "Tema: Sistema. Cambiar a Claro".
- **The preference** is stored with the language under `veriledger-preferences` (`usePreferencesStore`, VLW-39). With System, no `data-theme` is set and the page follows the system as it changes; Light or Dark pins `data-theme` on `<html>`.
- **No flash of the wrong theme:** `public/theme.js`, loaded in `<head>` before the styles, sets `data-theme` from the stored preference before the first paint. It is a file, not an inline script, because the Content Security Policy allows only `'self'` scripts.
- **What changes:** only the tokens' values. Ink panels stay dark in both themes. The `strong` elements invert in dark (the active tab, a selected row, the dark buttons), so they still stand out from the cards. Fingerprint colours never change: they are data.
- **Nothing animates** when the theme changes; the page draws again in the new colours.

## Languages

ADR-0007: English and Spanish, from a typed dictionary.

- **The switch** sits in the navbar, before the theme switch, and at the top of the login card. It shows the current language, "EN" or "ES", and its label says it in that language and offers the other: "EN, English. Switch to español", "ES, español. Cambiar a English".
- **The language** is the stored choice, otherwise the browser's: the first `es-*` gives Spanish, anything else English. `<html lang>` follows it.
- **The copy:** every text of the canvas, in both languages, is in each view's dictionary (its `T` table and its `L(en, es)` texts). The page "C · Español" shows them all, checked at 360 px on 2026-10-22. They become `src/lib/i18n/en.ts` and `es.ts` in VLW-40. The Spanish is neutral and uses *tú*.
- **Terms:**

  | English | Spanish |
  | --- | --- |
  | The chain, Chain | La cadena, Cadena |
  | Sign and send | Firmar y enviar |
  | Wallet | Billetera |
  | Network; peer | Red; nodo |
  | Block; fingerprint | Bloque; huella |
  | Transfer; notarization, notarize | Transferencia; notarización, notarizar |
  | Mining reward; mine block #13 | Recompensa de minado; minar el bloque #13 |
  | Amount; fee; waiting | Monto; comisión; en espera |
  | Sign in; sign out; try the demo | Iniciar sesión; cerrar sesión; probar la demo |
  | Key file; private key | Archivo de clave; clave privada |
  | Proof of existence | Prueba de existencia |
  | Signed, Accepted, Sealed, Buried | Firmada, Aceptada, Sellada, Enterrada |

- **Not translated:** the name VeriLedger and the unit VL; hashes, addresses and amounts; the keys of the signed message; the roles (admin, trader, viewer, demo) and a guest's name ("Guest 4F2A"), which are the API's data.
- **Numbers and dates** go through `Intl` in the page's language: "20 Oct 2026" and "20 oct 2026"; a nonce "3,104,227" and "3.104.227"; a duration "1.2 s" and "1,2 s". Amounts keep the API's spelling with a point in both, because they are what is signed ("50.30 VL"). The transaction page and the certificate stay in UTC in both languages (product owner, 2026-10-22).
- **The API's messages:** the known ones are shown in the page's language ("Node already registered", "El nodo ya está registrado"); an unknown one is shown as it came, so nothing is hidden. The chain's error card shows "Internal Server Error" that way in both languages.
- **Long Spanish texts** were fitted at 360 px: the kind switch reads "Transferencia | Notarizar"; the freshness line "Actualizado hace 6 s · cada 10 s"; a stat's label may take two lines, and its value stays aligned with its neighbours'; a waiting transaction's fee keeps one line.

## Motion map

| Event (real) | Animation | Where |
| --- | --- | --- |
| A route renders | `animate-vl-fade-up` on `<main>` (keyed by pathname) | Every view |
| The login renders | Its card `animate-vl-fade-up`; the three linked tiles `animate-vl-tile-in`, 160 ms apart | Login |
| A block arrives: `POST /blocks/mine` returned, or polling found a new block | Its tile `animate-vl-tile-in` into the ribbon and its fingerprint `animate-vl-bars-in`; its list row `animate-vl-fade-up`; `animate-vl-pop` on the height and the waiting count | The chain |
| `POST /blocks/mine` is pending | The dashed "next block" tile `animate-vl-pulse`, its border turns the accent colour, and its caption counts the elapsed time measured in the browser; the waiting list fades to 0.45 (`opacity`, `--vl-dur-slow`) | The chain |
| A block is pointed at or focused | Its tile lifts (`translateY(-4px)`, 260 ms `--ease-vl-out`); its "links to" strip and the fingerprint it links to get an accent ring, and the connector between them turns solid and accent (`box-shadow`, `stroke`, 200 ms); the caption `animate-vl-fade-up` explains the link | The chain |
| A block is selected | Its tile keeps an accent ring; the detail panel remounts with `animate-vl-fade-up`; its list row turns `strong` (`--vl-dur-fast`) | The chain |
| A fingerprint appears for the first time: a key created or opened on the page, a signature produced, a document hashed, a file checked | `animate-vl-bars-in` on its bars; an address's 12 bars 45 ms apart | Wallet, Sign and send, Transaction |
| `POST /nodes/resolve` is pending | One `animate-vl-travel` pulse per peer, looping, from this node outwards; the edges and the peers' rings turn the accent colour | Network |
| `POST /nodes/resolve` settled | One reply pulse per peer, inwards, once; result card `animate-vl-fade-up` (or `animate-vl-shake` on failure) | Network |
| A peer is registered (201) | Peers move to their new places on the ring with a `transform` transition (`--vl-dur-slow`); the new one `animate-vl-pop`, its list row `animate-vl-fade-up` | Network |
| A request is refused (401 sign-in, 400 signature or funds, 409 nonce, 400 peer, 429 demo) or an address is malformed | `animate-vl-shake` on the form or result card | Login, Sign and send, Network, Wallet |
| A signature is produced in the browser | `animate-vl-reveal` on the hex; its card's accent ring fades in (`box-shadow`, `--vl-dur-slow`) | Sign and send |
| A transaction's page loads, or polling finds it sealed | The journey bar fills with a `width` transition (900 ms, `--ease-vl-out`); each step reached `animate-vl-pop`; the status chip `animate-vl-fade-in` | Transaction |
| The kind switches between transfer and notarization | The pill slides with `transform` (300 ms, `--ease-vl-out`); the fields for the new kind `animate-vl-fade-up` | Sign and send |
| A file is being hashed (`crypto.subtle.digest`) | `animate-vl-pulse` on "Hashing…" (no percentage: the API gives none) | Transaction, Sign and send |
| A checked file matches, or not | "Match" `animate-vl-fade-up`; "No match" `animate-vl-shake` | Transaction |
| A balance arrives | `animate-vl-pop` | Wallet |
| The activity loads | Each row `animate-vl-fade-up`, 40 ms after the one above | Wallet |
| First response pending | Skeletons with `animate-vl-pulse` | Every list |
| A background action finished | Toast `animate-vl-toast-in`, 4 s, dismissible | Shell |
| `/health` fails or recovers | Banner opens or closes with `grid-template-rows` 0fr ↔ 1fr (`--vl-dur-slow`); "Back online" toast | Shell |
| `/auth/me` answers, after signing in or starting a demo | The user chip `animate-vl-fade-in` | Shell |
| `POST /auth/demo` is pending | "Try the demo" and "Creating a demo account…" `animate-vl-pulse` | Shell, Login |
| A panel opens or closes (key steps, forget-key confirmation) | `grid-template-rows` 0fr ↔ 1fr (`--vl-dur-slow`) | Wallet |
| The 404 renders | The missing tile `animate-vl-tile-in`, 200 ms after the page | Not found |
| A page, the shell or the login throws while drawing, and its boundary catches it | The fallback card `animate-vl-fade-up` | Every view (VLW-35) |
| Hover on rows and buttons | Background and border, `--vl-dur-fast` | Everywhere |

Only `transform`, `opacity`, colours, `box-shadow`, `filter` (reveal) and `grid-template-rows` animate. Layout properties (`left`, `top`, `width`, `height`) never do; the one width transition is the journey bar's fill on the transaction page, which runs once on mount. Changing the theme or the language animates nothing.

## Views

Each view lists its artboard, its data and the stories that build it. Its texts are in both languages on the artboard; this document quotes the English ones.

### Shell (every route)

- **Artboard:** the header of every view, and "C · Estados del shell, toasts y errores".
- **Header:**
  - the logo, four bars (cobalt, tangerine, mint, ink) on a white tile in both themes, and "VeriLedger". The page is titled "VeriLedger"; the favicon becomes the logo's tile (VLW-41);
  - search, "Block number or hash" (VLW-19a): the API looks up a block number or a full 64-character hash, never a prefix (product owner, 2026-10-21).
    - A number opens "Block #n", or says "No block #n yet.".
    - A full hash is tried as a block (`GET /blocks/{block_hash}`) and as a transaction (`GET /transactions/{tx_hash}`). Whatever it is shows in the results card, such as "Transfer 7f31c2a9… · in block #10".
    - Anything else reads "Type a block number or a full 64-character hash.".
    - Enter opens the first result, and Escape closes the card;
  - the language switch and the theme switch ([Languages](#languages), [Themes](#themes)), 40 px squares on `surface`;
  - `/health` status, polled every 10 s: a dot and "api · online", "offline", or "no database" when the API answers that its database does not (VLA-26);
  - signed in: a chip with the email and the role in the accent's mono, then a "Sign out" pill. A demo account shows "Guest XXXX · demo · N h left" (VLW-34b): `display_name`, and the hours left from `expires_at`, then minutes in the last hour. It counts down once a minute, and a demo that runs out while the page is open ends there and opens the login. The chip appears with `animate-vl-fade-in` when `/auth/me` answers;
  - signed out: a "Sign in" pill and an accent "Try the demo" pill (API ADR-0006, VLW-34). "Sign in" returns to the page the visitor was on. "Try the demo" shows only when `/health` says `demo_mode`; it reads "Starting…" with `animate-vl-pulse` while `POST /auth/demo` is pending, signs the visitor in where they are, and puts a refusal (a 429) in a toast in the API's words;
  - the tabs, The chain, Sign and send, Wallet and Network, as pills in a `surface` capsule; the current one is `strong`.
- **Under the header:** a skip link, which slides in with `transform` on focus; the offline banner on `danger-soft`: "Can’t reach <API host>. Retrying every 10 s." with "Retry now", or "<API host> answers, but its database does not. Retrying every 10 s." (product owner, 2026-10-21), and mining then says it waits for the database. When `/health` answers again, it closes and a "Back online." toast appears.
- **Toasts** are ink cards bottom-right, with a dot (mint, coral or sky) and a × to dismiss.
- **At 360 px** (below 640 px):
  - the logo keeps its tile, and "VeriLedger" is hidden visually but still read;
  - the switches, the status and "Sign out" share the logo's row; "api ·" and the chip are hidden;
  - the search takes its own line, and the tabs another, scrolling sideways;
  - signed out on a node in demo mode, the switches, the status, "Sign in" and "Try the demo" do not fit beside the logo. They take the rows under it, right-aligned: the switches and the status, then "Sign in" and "Try the demo" (canvas version 70). The artboards draw 360 px signed in, but the 404's, which is signed out.
- **Stories:** VLW-41 (with VLW-39's switches and VLW-40's texts); before it VLW-27, VLW-33, VLW-17, VLW-34, VLW-35.

### Login — `/login`

- **Artboard:** "C · Login y demo con un clic". Tweaks: `reason` (none, expired, demo ended), `outcome` (success, error), `demoOutcome` (created, rate limited).
- **Data:** `POST /auth/login` (OAuth2 form); `POST /auth/demo` (API ADR-0006, VLA-35); `/health` for the status line.
- **The card:** the language and theme switches at its top right, on `bg`; "Sign in"; "<host> · online"; email and password; the dark submit button; "or"; the demo card on `bg`; "Regular accounts are created by an administrator. Browse the chain without an account →", to `/` (ADR-0005).
- **States:**
  - empty form (never pre-filled), submitting ("Signing in…" on `skeleton`), 401 error with the form's shake and red borders;
  - session-expired notice on `wait-soft`, and a demo-ended notice: "Your demo ended after 24 h. Start a new demo or sign in. What it recorded is still on the chain." It comes from the token's `demo` claim, so it holds after a reload too;
  - "Try the demo · no account needed", under "Just looking around?", only when `/health` says `demo_mode`: "Creating a demo account…" with `animate-vl-pulse`, then the same redirect as a sign-in. A 429 is shown in the page's language when known, and shakes;
  - redirect to the page the person was on.
- **Beside the card:** the logo, three linked tiles (each one's "links to" strip is the fingerprint of the one above it), and "A ledger anyone can check." with three lines on what the ledger does.
- **Narrow screens:** the form comes first in the page and is drawn on the right on wide screens (`flex-direction: row-reverse`). When the two columns (440 and 520 px at their base) do not fit side by side, they wrap with the form on top, so a phone opens on the form, and the keyboard and a screen reader reach it first at every width.
- **Stories:** VLW-42; before it VLW-33, VLW-17, VLW-34.

### The chain — `/` (and `/?block=<number>` for a deep link)

- **Artboard:** "C · La cadena". Tweaks: `role` (admin, trader, viewer, demo, signed out), `state` (ready, loading, empty, error), `incoming` (a block that joined the chain).
- **Signed out:** the chain, list, detail and waiting list are public (VLA-36, ADR-0005). The mine button reads "Try the demo to mine" and starts a demo account in place (VLW-34b). Its note reads "Anyone can look. To mine, start a demo: one click, no email." and, while the demo starts, the button reads "Starting a demo…". On a node without demo mode it reads "Sign in to mine" with "Anyone can look. To mine, sign in.", and opens the login, which comes back to the chain.
- **Data:**
  - blocks: `GET /blocks?skip&limit`. The newest 10 make the ribbon; "Load older blocks" pages back; the height is the top block's number (VLA-20).
  - selected block: `GET /blocks/{block_hash}` (VLA-20), with the mining reward first and every transaction linked by `tx_hash`.
  - waiting: `GET /transactions?status=PENDING` (VLA-33). It shows the newest 10; the count is the API's `total`.
  - mining: `POST /blocks/mine` with the reward address in the card, which starts with the address of the key held in the tab, if any (the artboard draws it filled; VLW-43). The button needs the trader or admin role. The toast after mining reads "Block #n sealed · nonce N · reward R VL": the nonce is the response's, the reward the block's coinbase amount. The new block becomes the selection.
- **The head:** "The chain", its freshness line, and three stats: Height, Waiting and Last block (the top block's time).
- **The ribbon** (`hash` and `previous_hash`, nothing else):
  - one tile per block, oldest to newest, with the dashed "next block" tile at the newest end. Each tile has "links to" and the fingerprint of `previous_hash`, its own fingerprint, its number and time, and the first ten characters of its hash with its transaction count;
  - a tile is named by its content in reading order, "#11 16:34 0000a3f19c… · 1 tx, links to #10", and the order classes draw the link on top: a label of its own would hide the visible text from its name (axe's label in name);
  - a dashed connector joins each tile to the one before it. Pointing at a tile lights the link: its "links to" strip, the previous tile's fingerprint and the connector between them, and the caption below says "The fingerprint of #11 is exactly what #12 links to." The newest says "#12 is the newest block. The next one will link to its fingerprint.";
  - the ribbon is its own scroll box, laid out newest-first from the right (`flex-direction: row-reverse`), so it opens at the newest block without a script; the arrows scroll it when it has focus. Above it, "+ 6 older blocks (#0 to #5)" or "all blocks loaded".
- **The detail:** "Block #n" and its fingerprint; the hash with its leading zeros in the accent colour; "Links to" with the previous block's number, small fingerprint and short hash; Nonce; Sealed; "After it" ("Nothing yet: it is the newest block", or "N blocks link back to it"); the transactions, each with its sender's 2×2 avatar, kind, route and amount.
- **The list:** "Blocks · newest first", rows with a small fingerprint, "Block #n", count and time, the selected one `strong`; "Load older blocks".
- **The side:** the mine card (reward address, note, button); "Waiting for the next block" with its count, each with an avatar, kind, route, amount and fee; "How to read a fingerprint" on ink, with the selected block's first four bytes, their colours and their names.
- **Selection:** without `?block=n` it follows the top of the chain. Picking a block writes `?block=n` and keeps it selected while new blocks arrive. A link to a block below the loaded pages reads that one block.
- **Polling:** every 10 s; "Updated N s ago" counts in the browser and is not a live region. A block found by polling slides into the ribbon and shows the toast "Block #n joined the chain." It does not say "from another node": another user of the same node may have mined it (product owner, 2026-10-21).
- **States:**
  - loading: skeleton tiles and rows;
  - empty: "No blocks yet. The first block mined becomes the genesis block, number 0.", and the next tile is "the genesis block";
  - API unreachable: the shell's banner says so, and the chain keeps the last data with "Last update N s ago · retrying"; mining is disabled with "Mining is unavailable while the API is unreachable." (not drawn; it belongs to the shell);
  - the chain's own error card, on `danger-soft`, is only for failures the banner does not explain, such as a 500 from `/blocks`. It shows the API's `detail` and "Retry now";
  - viewer role: mining is disabled, with "Mining needs the trader or admin role.".
- **Stories:** VLW-43; it replaces the tower of VLW-28.

### Transaction — `/transaction/:hash`

- **Artboard:** "C · Transacción y certificado". Tweaks: `example` (transfer, notarization, pending, not found, loading).
- **Data:** `GET /transactions/{tx_hash}` with `block_number`, `block_hash` and `nonce` (VLA-20, VLA-16). The height, the top block's number from `GET /blocks`, counts the blocks on top. Both are read again every 10 s, so a waiting transaction is seen when it is sealed.
- **Times are UTC** on this page (product owner, 2026-10-21), so a certificate says the same in every country and language. The chain shows the reader's own time.
- **Breadcrumb:** Chain / Block #n / Transaction.
- **Header:** the kind, a title ("5.00 VL from 1bf8…0e42 to 7c2d…e51b", "A document notarized by …", "A document waiting to be sealed", "A mining reward of … to …"), the time, and a chip: "In block #n" on `ok-soft`, "Waiting" on `wait-soft`, or "Failed" on `danger-soft`.
- **Journey:** Signed → Accepted → Sealed in block #n → Buried, from `status`, `block_number` and the height. It is Buried once one block rests on its block, with "N blocks link back to it" ("N bloques después").
  - A mining reward is never signed by a person. Its first steps read "Created · by the node that mined it" and "Accepted · with its block" (2026-10-21; the artboard has no reward example).
  - The bar fills once on mount, and each step reached pops. A screen reader hears each step with "done" or "not yet". At 360 px the hints are hidden and the four labels stay.
  - Waiting: "Waiting for the next block. This page checks again every 10 s." pulses under it.
- **Details:** the full hash; From, To and the signature shortened; the document's hash for a notarization; amount, fee and nonce. "Copy link" copies the page's address.
- **Signature line:** a mint check and "Signature checked in this browser against the sender’s address", verified with the API's canonical message (VLW-15), rebuilt from the stored fields with `toFixed(8)` and the nonce (`src/lib/transaction.ts`).
  - A signature that does not match says so in the danger colour; the artboard has only the checked state.
  - A mining reward has no signature: "the block's proof of work seals it".
  - A row from before VLA-16 has no nonce, so it cannot be checked, and the page says so.
  - Near 10^10 a float cannot spell an amount back with 8 decimals, so the message cannot be rebuilt. The page says this browser cannot check it, in the neutral colour, and never calls it invalid (2026-10-21).
- **A time the browser cannot read** shows as "—", here and on the chain, instead of failing the page. A certificate without a readable moment says "when block #n was sealed" (2026-10-21).
- **Sealed in:** a card linking to `/?block=n`, with the block's fingerprint, its number, its hash and "N blocks link back to it".
- **Certificate** (a sealed notarization, VLW-29b), on ink:
  - "PROOF OF EXISTENCE" in sky, then "This document existed on 20 October 2026 at 16:21:55 UTC." The moment is the block's seal from `GET /blocks/{block_hash}`, which the chain backs. Until it loads, the heading says the document existed when block #n was sealed.
  - "Its fingerprint, sealed in block #n", the document's fingerprint, and its hash in 8 groups of 8, in a grid that fits its container.
  - "Check a file against it": `crypto.subtle.digest('SHA-256', file)` is compared with `payload`. The result shows "Certified" with the document's fingerprint and the file's name with the file's own fingerprint below it, so a mismatch is visible bar by bar. "Match" (mint) fades up; "No match" (coral) shakes and says that one changed character changes the whole fingerprint. The file never leaves the browser.
  - A waiting notarization has no certificate yet.
- **Not found** (a 404): "No transaction with this hash on this node", the hash, why (it may still be on its way, or it was refused and left no trace), and "Back to the chain". Any other failure shows a card with the API's `detail` and "Retry now" when `/health` answers; otherwise the shell's banner speaks.
- **Stories:** VLW-44; before it VLW-29.

### Sign and send — `/transact`

- **Artboard:** "C · Firmar y enviar". Tweaks: `keyState` (loaded, none), `serverReply` (accepted, invalid signature, insufficient funds, nonce used).
- **Data:** the key held in memory for the tab (`useKeyStore`, ADR-0002); balance `GET /wallets/{address}/balance`; nonce `GET /wallets/{address}/nonce` (VLA-16); `POST /transactions`.
- **No key:** "No key in this tab", why keys are never stored, "Open a key file" (accent) and "Create a wallet".
- **The key** (VLW-30a):
  - The wallet page leaves the pair it creates in the tab's memory.
  - "Open a key file" reads the JSON the wallet saves, `{"public_key", "private_key"}`. The public key is derived again from the private one, and a file whose halves do not match is refused with the reason.
  - A reload forgets the key, and signing out clears it.
  - "Signing as" shows the address's fingerprint (8 bars), the address (8 characters on each side) and "Available" with the balance.
- **Composing** (VLW-30b, `src/lib/compose.ts`):
  - The kind switch, "Transfer | Notarize a document" ("Transferencia | Notarizar"), is a pill that slides; the current kind is `strong`.
  - The nonce is read from the node when the key is opened, shown read-only in the accent colour, with "The nonce is this address’s next number, read from the node. A signed message works only once."
  - The checks match the API's. The address must be 64 hex characters, and the amount above 0 with at most 8 decimals. The fee is 0 or more. A notarization needs its document's hash: "Choose the document", hashed here, with its fingerprint and "<name> · SHA-256 …".
  - The amount turns red when amount and fee exceed the balance. That is a hint; the API has the last word.
  - Red borders appear only once a field has text, so an empty form is not an error.
  - "What you are signing", on `inset`: the message key by key, addresses and payload shortened, the nonce in sky, and "<N> bytes · keys sorted · no spaces". Once complete, the lines are exactly the signed message (tested). The keys are data and stay in English.
  - Choosing the other kind starts without a document.
- **Signing:** "Sign with this key" (accent). The "Ed25519 signature · 64 bytes" card shows its 16-bar fingerprint and the hex, which reveals, and an accent ring; before that, "Not signed yet.". Editing after signing discards it: "You changed the message, so the old signature no longer matches. Sign again." in the accent colour.
- **What travels:** three tiles, "Sent · The message", "Sent · The signature" and "Never sent · Your private key", the last with an accent ring.
- **Sending** (VLW-30c): "Send to the node" (`strong`) posts the signed fields and the signature.
  - "Accepted by the node" on `ok-soft` shows the `tx_hash`, "Open the transaction" and "Send another". "Send another" keeps the kind, the address and the fee, and reads the nonce and the balance again.
  - A refusal shows a card on `danger-soft` that shakes. Its title comes from the API's text: "The node refused the signature", "Not enough funds", "This nonce was already used", "The node did not answer", otherwise "The node refused the transaction". The API's own words follow it, in the page's language when known.
  - After a 409 the page reads the next nonce, says so, and asks to sign again; the signature is discarded.
- **Stories:** VLW-45; before it VLW-30, VLW-15, VLW-16, VLW-18.

### Wallet — `/wallet`

- **Artboard:** "C · Wallet". Tweaks: `start` (no wallet, existing wallet).
- **Data:** keys from `@noble/curves` in the browser (VLW-16); balance `GET /wallets/{address}/balance`; activity `GET /wallets/{address}/transactions` (VLA-34).
- **No wallet:** two cards, "Create a wallet" (a new Ed25519 pair, generated here) and "Open a key file" (read here, kept only in memory).
- **The address:** its fingerprint as 12 tall bars, which grow in (`bars-in`, 45 ms apart) only when the key was just created or opened on this page; "Your address · its fingerprint is the strip above"; the address in 8 groups; "Copy address", which turns `strong` and says "Copied".
- **The balance:** "Available" and the balance in large numbers with "VL" (it pops when it arrives), then "Sign and send". Under it, "100.00 received · 5.30 sent · 0.20 waiting" adds up the activity, only when the whole of it is loaded; otherwise "The 20 newest of N" shows under the list. A new address reads "New address: nothing received yet".
- **The key**, on ink:
  - "Save your key now" and why ("It exists only in this tab…"), or, once done, "Your key is saved" and "Keep the file where only you can reach it…";
  - "1 · Save the key file" with "Download .json" (`wait`), which saves `{"public_key", "private_key"}` (`keyFileText`) as `veriledger-<first 8>.json` and turns into a mint "Saved"; "2 · I stored it somewhere safe", a checkbox. The current step has a `wait` ring, and the steps fold away once both are done (`grid-template-rows`);
  - the store remembers whether a file of the key exists, and a key opened from its file counts as saved (VLW-31a);
  - "Forget this key in this tab" asks inline on `ink-danger` with a coral ring, with no browser dialog: "Forget it" (coral) and "Keep it". Forgetting returns to create or open.
- **Activity** (VLW-31b): the 20 newest of `GET /wallets/{address}/transactions`. Each is linked to its page, with the other party's avatar (this address's own for a reward or a notarization), "Mining reward", "Notarized a document", "Sent to …" or "Received from …", its detail, a chip ("Waiting" on `wait-soft`, "Block #n" on `ok-soft`, and "Failed" on `danger-soft`, which the artboard does not draw) and what it does to the balance ("+50.00", "−5.10"). Rows fade up 40 ms apart. Without activity: "No transactions yet. Mine a block with this address as the reward address, or ask someone to send you VL." and "Go to the chain".
- **Look up any address:** its 12-bar fingerprint builds as the person types; a bar stays `skeleton` until its byte is complete, and the counter reads "n / 64". The border is the accent colour while the address is incomplete, and ok when it is valid. "Show balance" gives "Balance of <address>" and the balance, or the 64-character rule with a shake.
- **Stories:** VLW-46; before it VLW-31, VLW-16.

### Network — `/network`

- **Artboard:** "C · Red". Tweaks: `role`, `resolveResult` (authoritative, replaced, failed), `registerResult` (ok, duplicate, private address), `startEmpty`.
- **Data:** `GET /nodes`, `POST /nodes/register` (admin; private addresses refused, VLA-19), `POST /nodes/resolve` (admin). The height, before and after resolving, is the newest block's number from `GET /blocks?skip=0&limit=1`.
- **The map,** on a dotted `surface` card: this node in the centre as an ink card, "This node" and "height N"; the registered peers evenly on a ring (`src/lib/peers.ts`) as `surface` cards with a 2×2 avatar, the first label of the host over the rest ("node-b" over "example.org"; an IP stays whole, over its port), joined to the centre by dashed edges. Positions and the edges' rotation use `transform`, so adding a peer glides, and the new one pops.
  - A peer has no key, so its avatar comes from its URL: four colours of the palette from a hash of the URL (FNV-1a). It tells peers apart and claims nothing else.
  - Without peers, a dashed ring. To a screen reader the map is one image ("This node at height 10, with 3 peers"); the list carries the rest.
  - On a phone the map scrolls sideways in its box. It opens centred on this node, and the box takes the keyboard focus, so the arrow keys scroll it too (VLW-24).
- **Resolve conflicts** (admin): "Asks every peer for its chain. If one is longer and fully valid, this node adopts it."
  - While `POST /nodes/resolve` is pending the button reads "Asking N peers…". A pulse per peer travels out along its edge (`offset-path`) and loops, and the edges and peers' rings turn the accent colour. Nothing pretends to know which peer answered: the API reports only the outcome.
  - When it settles, one reply pulse per peer comes back, once, and the card says what happened, on `ok-soft` or `danger-soft`: "Our chain is already the longest valid one"; "Adopted a longer valid chain", with the height before and after; "Could not finish resolving", with the API's words, and the card shakes.
  - Disabled without peers, and for other roles.
- **Add a peer** (admin):
  - The form of the address (`http(s)://` and a host) is checked in the browser: "Use a full address that starts with http:// or https://.".
  - Everything else is the API's: a host that does not resolve, a private or local address (VLA-19), a duplicate. Its 400 is shown in the page's language when known, otherwise in its own words, and the form shakes.
  - Typing after a refusal keeps the field and its focus.
  - In development the API's Compose sets `ALLOW_PRIVATE_PEERS`, so `http://127.0.0.1:8001` registers there. Production refuses it.
- **Other roles and visitors** see the map and the list, with "Only an admin can add peers or resolve conflicts. You can still see who this node talks to." Signed in, the form shows until `/auth/me` answers, and the API refuses anyone else with a 403. A visitor never sees it (ADR-0005).
- **The list:** "Registered peers · N", each with its avatar, URL and "registered". If `GET /nodes` fails, the page says the node did not answer instead of showing an empty list.
- **Stories:** VLW-47; before it VLW-32.

### Not found — any unknown route

- **Artboard:** "C · 404".
- **The card:** three tiles in a row: a fingerprint, a missing tile drawn dashed in the accent colour, and another fingerprint, joined by dashed connectors; "404"; "This page is not on the chain"; "The address may be mistyped, or the link is from an older version of the app."; "Back to the chain".
- **Where:** inside the shell, as the catch-all child route. It opens without a session too, like the chain it leads back to (ADR-0005, product owner, 2026-10-21).
- **Stories:** VLW-41; before it VLW-33.

### Failure — a page, or the shell (VLW-35)

- **Artboard:** "C · Estados del shell, toasts y errores".
- **Why:** a throw while drawing unmounts the whole React app and leaves a blank page. A boundary catches it instead (product owner, 2026-10-21).
- **A page that throws** is replaced by a card inside the shell, which keeps working:
  - a `danger` ring; a tile, a broken connector and an empty dashed tile, all in the danger colour: nothing is missing this time, something broke;
  - "Error", "This page ran into a problem", and "Something failed while it was drawn. The other pages still work, and a key held in this tab is kept.";
  - "Try again" draws the page again without a reload, which would forget the key held in the tab. "Back to the chain" opens `/`, and on the chain itself only "Try again" is offered;
  - another route starts without the failure, because `<main>` is keyed by pathname.
- **The shell or the login throwing** turns the whole screen into one card: the logo, "Error", "VeriLedger ran into a problem", "Reloading usually fixes it. A reload forgets a key held in this tab, so open its key file again afterwards." and "Reload". It needs no router, store or API, and it reads the stored language and theme itself.
- **Both cards** have `role="alert"`, with the heading as the page's `h1` (an `h2` on the artboard, among other states); enter with `animate-vl-fade-up` when the failure is caught; and send the error nowhere: React logs it to the browser's console.
- **Not covered:** a failure in an event handler or a request. It does not blank the page, and each one shows its own error.
- **The pattern of every view's states**, on the same artboard: loading (pulsing `skeleton` shapes), empty (what is missing, what to do next, one action) and error (on `danger-soft`, the API's answer and a way to try again). Each view draws its own states in this pattern, in the shape its artboard gives them, so they are not shared components (product owner, 2026-10-22).
- **Stories:** VLW-41; before it VLW-35.

## Fingerprints

C draws a hash or an address as coloured bars, one per byte. `src/lib/fingerprint.ts` (VLW-43) implements exactly this, and replaces E's identity cube:

```ts
// cobalt, tangerine, mint, lemon, ink, sky, coral, lilac
export const PALETTE = ['#2F45FF', '#FF7A1A', '#1FB58F', '#F5C400', '#101418', '#7AB8FF', '#FF5A6E', '#A88BFF'] as const;

// One colour per byte (byte mod 8); a byte not yet complete is null, drawn as a skeleton bar.
export function fingerprint(hex: string, bars: number): (string | null)[] {
  return Array.from({ length: bars }, (_, i) => {
    const byte = hex.slice(i * 2, i * 2 + 2);
    return /^[0-9a-f]{2}$/.test(byte) ? PALETTE[parseInt(byte, 16) % 8] : null;
  });
}
```

- **A block** shows 8 bytes of its hash: the bytes that follow its leading zeros, which are the proof of work and the same in every block (`MINING_DIFFICULTY`, 4 by default). Its "links to" strip is the same 8 bytes of `previous_hash`. The genesis block links to nothing, so its strip is all skeleton.
- **An address** shows its first 12 bytes in the wallet, its first 8 in "Signing as", and its first 4 as a 2×2 avatar in lists.
- **A signature** shows its first 16 bytes, and **a document** its first 8.
- **A peer** has no key; its 2×2 avatar comes from a hash of its URL ([Network](#network--network)).
- **Every bar** has a 1 px inset ring of `fp-ring`, so the ink bar shows on dark cards and the cobalt one on ink. On an ink panel (the certificate, the legend) the ring is `ink-line`, so the ink bar shows there in the light theme too.
- **The fingerprint is decoration** next to the number, hash or address, never instead of it: it is `aria-hidden`, and the text beside it carries the meaning. Two blocks rarely look alike, but someone who cannot tell the colours apart reads the same thing in the number and the hash.
- **The legend** ("How to read a fingerprint") names the colours in the page's language: cobalt, tangerine, mint, lemon, ink, sky, coral, lilac; cobalto, mandarina, menta, limón, tinta, cielo, coral, lila.

## What the design does not show

| Not shown | Why |
| --- | --- |
| A live nonce counter while mining, or colours that flicker while mining | The API answers only when the block is sealed. The design shows elapsed time, measured in the browser. |
| A "change one entry" demo of tampering | The API exposes no way to alter a block; drawing one would show something the app cannot do. |
| Peers' heights, mempools, gossip between them, or "Synced with N peers" | The API exposes only this node's peer list and the result of resolving. |
| An "ACTIVE" status for peers | Nothing checks it; the API stores the word at registration (audit). Peers are "registered". |
| A balance that counts up | The balance is one number from the API; it pops when it arrives. |
| A filter on the activity | Not in the backlog. |
| A percentage while hashing a file | `crypto.subtle.digest` gives no progress. |
| A downloadable PDF certificate | Not planned; the page itself, its link and the browser's print are the certificate. |
| Sign-up with email, password reset | Visitors use one-click demo accounts (API ADR-0006); regular accounts are created by an admin; there is no mail server, so no reset. |
| Deleting a demo account's transactions | Confirmed transactions are immutable. The account expires; what it recorded stays on the chain, and the interface says so. |
| A translation of every API message | Only the known ones are translated (ADR-0007); an unknown one is shown in the API's words rather than hidden. |

## Design-only affordances

They exist in the canvas to review the design and are not built:

- the **Tweaks** panel of each artboard (theme, language, roles, states, server replies). In the app the theme and the language come from the navbar's switches;
- simulated latencies (the API's real timing replaces them);
- the "Signed in · open the chain" and "You are Guest 4F2A · open the chain" links on the login artboard (the app redirects by itself);
- the example buttons next to file pickers and fields ("The original", "An edited copy", "Use an example file", "Use an example").

## Responsive and accessibility

- **Layouts follow their container:** flex rows that wrap and `auto-fill` grids. The one breakpoint is 640 px, below which the header reflows, the big titles shrink, page margins narrow and the journey's hints hide. At 360 px every view is one column. The canvas checks every view at 1440, 768 and 360 px, in both themes and both languages.
- **The ribbon** scrolls sideways in its own box and opens at the newest block. **The network map** keeps its 860 × 440 geometry and scrolls sideways in its own box on narrow screens, because pulses follow fixed paths. The list under each carries the same information.
- **Labels:** every input has a `<label>`, in the page's language; the switches say their state in words.
- **Live regions:** status changes (mining, hashing, results, toasts) are in `aria-live` regions; errors use `role="alert"`.
- **Interactive elements** are `<button>` or `<a>`, with a visible 3 px accent focus outline and a skip link.
- **Colour is never alone:** every status has text next to its dot or colour, and every fingerprint has its hash or address beside it.
- **Language:** `<html lang>` is the page's language, so a screen reader reads each in its own voice.
- VLW-24 checks all of it with axe-core and Playwright at 1280 and 360 px. VLW-48 runs each width twice, light in English and dark in Spanish: a theme changes only colours and a language only words, so the two pairs reach every colour of both themes and every text of both languages.
