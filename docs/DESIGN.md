# VeriLedger webapp — design (direction E, "Network")

Oct 20, 2026 · Chosen by the product owner on 2026-10-20 ([ADR-0004](adr/0004-design-direction-e.md)).

**Canvas:** https://claude.ai/artifact/PEDxibhnmsErQTovt5b6pP, page **"E · Vistas finales"**. It is private until shared from the canvas. The other page, "Exploración A–E", keeps the directions that were not chosen, for reference only.

## The promise: what the canvas shows is what ships

1. **Same tokens.** Every artboard declares the CSS custom properties of the [Tokens and motion](#tokens-and-motion) block, with the same names and values the webapp declares in Tailwind 4's `@theme`. A colour, font, easing or animation changes in both places in the same PR, or in neither.
2. **CSS only.** Keyframes and transitions from that block. No animation library, no JavaScript-driven animation.
3. **Only real events animate.** An animation starts because data arrived, a request started or settled, or the person acted (see [Motion map](#motion-map)). Nothing suggests progress the app cannot measure.
4. **Replays are remounts.** In the code an animation replays through a React `key` change (`key={selectedBlock}`, `key={height}`). The canvas reaches the same effect by mounting a new element; the visual result is identical.
5. **Reduced motion.** With `prefers-reduced-motion: reduce`, every animation and transition takes 1 ms. No information depends on motion.
6. **Only data the app can have.** Every number, list and status maps to an endpoint or a computation in the browser ([Views](#views)). What the API does not expose is not drawn ([What the design does not show](#what-the-design-does-not-show)).
7. **Design-only affordances are listed.** The canvas has a few things that exist only to review the design ([Design-only affordances](#design-only-affordances)). They are not built.

## Tokens and motion

This block goes into `src/index.css` as is. A test (AR-10) fails if the two differ by a single character. The canvas artboard "E · Motion y tokens" shows every token and replays every animation.

`source("../src")` limits Tailwind's class scan to `src`. Without it, Tailwind also scans `docs/` and builds the class names of this document's examples into the app.

```css
@import "tailwindcss" source("../src");
@import "@fontsource/instrument-sans/400.css";
@import "@fontsource/instrument-sans/500.css";
@import "@fontsource/instrument-sans/600.css";
@import "@fontsource/instrument-sans/700.css";
@import "@fontsource/martian-mono/400.css";
@import "@fontsource/martian-mono/500.css";

@theme {
  --color-vl-bg: #0E1014;
  --color-vl-surface: #161920;
  --color-vl-raised: #1D212A;
  --color-vl-line: #2A2F3A;
  --color-vl-line-soft: #22262F;
  --color-vl-text: #E8EAEE;
  --color-vl-muted: #9AA1AD;
  --color-vl-faint: #6B7280;
  --color-vl-accent: #FFB547;
  --color-vl-on-accent: #0E1014;
  --color-vl-ok: #5AD19A;
  --color-vl-danger: #FF7A6B;
  --color-vl-cube-top: #3A4150;
  --color-vl-cube-left: #262B35;
  --color-vl-cube-right: #2F3541;
  --color-vl-cube-left-on: #4A4F5C;
  --color-vl-cube-right-on: #3A3F4B;
  --color-vl-shadow: #12151B;
  --color-vl-danger-soft: #2A1714;
  --color-vl-inset: #090A0D;
  --font-vl-sans: "Instrument Sans", system-ui, sans-serif;
  --font-vl-mono: "Martian Mono", ui-monospace, monospace;
  --ease-vl-out: cubic-bezier(.2, .7, .2, 1);
  --ease-vl-in-out: cubic-bezier(.45, 0, .2, 1);
  --ease-vl-drop: cubic-bezier(.3, .6, .2, 1);
  --animate-vl-fade-up: vl-fade-up 280ms var(--ease-vl-out) both;
  --animate-vl-fade-in: vl-fade-in 280ms ease both;
  --animate-vl-drop: vl-drop 760ms var(--ease-vl-drop) both;
  --animate-vl-float: vl-float 900ms ease-in-out infinite;
  --animate-vl-travel: vl-travel 760ms var(--ease-vl-in-out) both;
  --animate-vl-pop: vl-pop 420ms ease both;
  --animate-vl-shake: vl-shake 360ms ease both;
  --animate-vl-reveal: vl-reveal 700ms var(--ease-vl-out) both;
  --animate-vl-pulse: vl-pulse 1.2s ease-in-out infinite;
  --animate-vl-toast-in: vl-toast-in 280ms var(--ease-vl-out) both;
}

:root { --vl-dur-fast: 160ms; --vl-dur-base: 280ms; --vl-dur-slow: 420ms; --vl-dur-drop: 760ms; }

body { background: var(--color-vl-bg); color: var(--color-vl-text); font-family: var(--font-vl-sans); }
:focus-visible { outline: 2px solid var(--color-vl-accent); outline-offset: 2px; }

@keyframes vl-fade-up { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes vl-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes vl-drop { 0% { opacity: 0; transform: translateY(-140px) } 70% { opacity: 1; transform: translateY(6px) } 85% { transform: translateY(-3px) } 100% { opacity: 1; transform: none } }
@keyframes vl-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
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

Utilities follow from the names: `bg-vl-surface`, `text-vl-muted`, `font-vl-mono`, `ease-vl-out`, `animate-vl-drop`. Transitions use `duration-(--vl-dur-fast)` and friends.

**Contrast on `--color-vl-bg`:** text 15.8:1, muted 7.3:1, accent 10.9:1, danger 7.5:1, ok above 9:1. `--color-vl-faint` (about 4.2:1) is only for disabled controls and decoration. `--color-vl-shadow` is decoration only: the ellipse under a tower. `--color-vl-danger-soft` is the background of the offline banner, under text in `--color-vl-text`. Both were added on 2026-10-20; the first artboards drew them with literal colours. `--color-vl-cube-left-on` and `--color-vl-cube-right-on` are the sides of the selected cube in the tower, whose top turns `--color-vl-accent`. They are decoration, added on 2026-10-21 for the same reason (VLW-28). `--color-vl-inset` is the background of the message being signed, darker than the page, under text in `--color-vl-text` (16.4:1); it was added on 2026-10-21 for the same reason (VLW-30).

## Motion map

| Event (real) | Animation | Where |
| --- | --- | --- |
| A route renders | `animate-vl-fade-up` on `<main>` (keyed by pathname) | Every view |
| A block arrives: `POST /blocks/mine` returned, or polling found a new block | `animate-vl-drop` on the new cube; `animate-vl-fade-up` on its list row; `animate-vl-pop` on height and waiting count | Tower |
| `POST /blocks/mine` is pending | Ghost cube with `animate-vl-float`; the elapsed time is measured in the browser | Tower |
| A block is selected or hovered | Cube `transform: translateX(18px)`, 380 ms `--ease-vl-out`; detail panel remounts with `animate-vl-fade-up` | Tower |
| `POST /nodes/resolve` is pending | One `animate-vl-travel` pulse per peer, looping, from this node outwards | Network |
| `POST /nodes/resolve` settled | One reply pulse per peer, inwards, once; result card `animate-vl-fade-up` (or `animate-vl-shake` on failure) | Network |
| A peer is registered (201) | Peers move to their new places on the ring with a `transform` transition (`--vl-dur-slow`); the new one `animate-vl-pop` | Network |
| A request is refused (401 login, 400 signature or funds, 409 nonce, 400 peer) | `animate-vl-shake` on the form or result card | Login, Sign and send, Network |
| A signature is produced in the browser | `animate-vl-reveal` on the hex | Sign and send |
| A transaction's page loads, or polling finds it sealed | The journey bar fills with a `width` transition (900 ms, `--ease-vl-out`); each step reached `animate-vl-pop`; the status chip `animate-vl-fade-in` | Transaction |
| The kind switches between transfer and notarization | The pill slides with `transform` (300 ms, `--ease-vl-out`); the fields for the new kind `animate-vl-fade-up` | Sign and send |
| A file is being hashed (`crypto.subtle.digest`) | `animate-vl-pulse` on "Hashing…" (no percentage: the API gives none) | Transaction, Sign and send |
| First response pending | Skeletons with `animate-vl-pulse` | Every list |
| A background action finished | Toast `animate-vl-toast-in`, 4 s, dismissible | Shell |
| `/health` fails or recovers | Banner opens or closes with `grid-template-rows` 0fr ↔ 1fr (`--vl-dur-slow`); "Back online" toast | Shell |
| A panel opens or closes (key steps, forget-key confirmation) | `grid-template-rows` 0fr ↔ 1fr (`--vl-dur-slow`) | Wallet |
| Hover on rows and buttons | Background and border, `--vl-dur-fast` | Everywhere |

Only `transform`, `opacity`, colours, `filter` (reveal) and `grid-template-rows` animate. Layout properties (`left`, `top`, `width`, `height`) never do; the one width transition is the journey bar's fill on the transaction page, which runs once on mount.

## Views

Each view lists its artboard, its data and the stories that build it. Endpoints marked *new* do not exist yet; their API stories are linked.

### Shell (every route)

- **Artboard:** the header of every view, and "E · Estados del shell".
- **Pieces:**
  - logo and tabs (Tower, Sign and send, Wallet, Network);
  - search: block number or hash → dropdown of matches (VLW-19). Until then it finds transactions by hash and reads "Transaction hash";
  - `/health` status, polled every 10 s;
  - signed in: email and role from `GET /auth/me`, then a "Sign out" pill (added 2026-10-20; the first artboards had no way to sign out). A demo account shows "Guest XXXX · demo · N h left";
  - signed out: "Sign in" and "Try the demo" (API ADR-0006, VLW-34);
  - skip link, which slides in with `transform` on focus; toast region;
  - offline banner under the header: "Can’t reach <API host>. Retrying every 10 s." with "Retry now". When `/health` answers again, it closes and a "Back online." toast appears. The first artboard also promised "the last data we had" and "Data is up to date"; the pages do not keep or refresh data yet, so that text was removed (2026-10-20);
  - 404 page: a tower with a missing cube.
- **At 360 px** (shown in "E · Estados del shell"):
  - the status ("online") and "Sign out" share the logo's row;
  - the search drops to its own line;
  - the tabs scroll sideways;
  - the user chip is hidden.
- **Stories:** VLW-27 (tokens, fonts, shell, toasts), VLW-33 (login, session expiry, offline, 404), VLW-17 (401 handling).

### Login — `/login`

- **Artboard:** "E · Login y demo con un clic". Tweaks: `reason` (none, expired, demo ended), `outcome` (success, error), `demoOutcome` (created, rate limited).
- **Data:** `POST /auth/login` (OAuth2 form); `POST /auth/demo` (API ADR-0006, VLA-35); `/health` for the status line.
- **States:**
  - empty form (never pre-filled), submitting, 401 error with shake;
  - session-expired notice, and a demo-ended notice that says what was recorded is still on the chain;
  - "Try the demo": creating, then redirect; 429 shown as the API words it;
  - redirect to the page the person was on.
- **Narrow screens:** below 940 px the two columns stack, with the form first and the tower and tagline after it, separated by a top border. Otherwise the form would start below the first screen on a phone. The artboard is drawn at 1440 px only. Added 2026-10-20.
- **Stories:** VLW-33, VLW-17, VLW-34.

### Tower — `/` (and `/?block=<number>` for a deep link)

- **Artboard:** "E · Torre". Tweaks: `role` (admin, trader, viewer, demo, signed out), `state` (ready, loading, empty, error), `incoming` (a block that joined the chain).
- **Signed out:** the tower, list, detail and waiting list are public (VLA-36). The mine button reads "Try the demo to mine" and starts a demo account in place (VLW-34).
- **Data:**
  - blocks: `GET /blocks?skip&limit`. The newest 10 are drawn as the tower; "Load older blocks" pages back; the height is the top block's number (VLA-20).
  - selected block: `GET /blocks/{block_hash}` (VLA-20), with the mining reward first and every transaction linked by `tx_hash`.
  - waiting: `GET /transactions?status=PENDING` (VLA-33). It shows the newest 10; the count is the API's `total`.
  - mining: `POST /blocks/mine` with the reward address typed in the card. The button needs the trader or admin role: the role comes from `GET /auth/me`, and until VLA-19 only the interface applies it. The toast after mining reads "Block #n sealed · nonce N · reward R VL". The nonce is the response's; the reward is the amount of the block's coinbase transaction, read with `GET /blocks/{block_hash}`. The new block becomes the selection.
- **Selection:** without `?block=n` it follows the top of the chain. Picking a block writes `?block=n` and keeps it selected while new blocks arrive. A link to a block below the loaded pages reads that one block.
- **Polling:** every 10 s; "Updated N s ago" counts in the browser and is not a live region, so a screen reader does not read it every second. A block found by polling drops onto the tower and shows the toast "Block #n joined the chain." It does not say "from another node": another user of the same node may have mined it (product owner, 2026-10-21).
- **States:**
  - loading: skeleton tower;
  - empty: the next block is the genesis block;
  - API unreachable: the shell's offline banner says so, and the tower keeps the last data. Its freshness line reads "Last update N s ago · retrying". Mining is disabled with "Mining is unavailable while the API is unreachable."; the artboard does not draw this state, which belongs to the shell.
  - The tower's own error card is only for failures the banner does not explain, such as a 500 from `/blocks`. It shows the API's `detail` and "Retry now" (product owner, 2026-10-21).
  - viewer role: mining is disabled, with the reason.
- **Stories:** VLW-28 (with VLA-20, VLA-33).

### Transaction — `/transaction/:hash`

- **Artboard:** "E · Transacción y certificado". Tweaks: `example` (transfer, notarization, pending, not found, loading).
- **Data:** `GET /transactions/{tx_hash}` with `block_number`, `block_hash` and `nonce` (VLA-20, VLA-16). The height, the top block's number from `GET /blocks`, counts the blocks on top. Both are read again every 10 s, so a waiting transaction is seen when it is sealed.
- **Times are UTC** on this page (product owner, 2026-10-21), so a certificate says the same in every country. The tower shows the reader's own time.
- **Journey:** Signed → Accepted → Sealed in block #n → Buried under k blocks, from `status`, `block_number` and the height. It is Buried once one block rests on its block.
  - A mining reward is never signed by a person. Its first steps read "Created · by the node that mined it" and "Accepted · with its block" (2026-10-21; the artboard has no reward example).
  - The bar fills once on mount, and each step reached pops. A screen reader hears each step with "done" or "not yet".
- **Header:** the kind, a title ("10.00 VL from d75a…511a to 3d40…660c", "A document notarized by …", "A document waiting to be sealed", "A mining reward of … to …"), the time, and a chip: "In block #n", "Waiting" or "Failed".
- **Details:** the full hash; From, To and the signature shortened; the document's hash for a notarization; amount, fee and nonce. "Copy link" copies the page's address.
- **Signature line:** verified in the browser with the API's canonical message (VLW-15), rebuilt from the stored fields with `toFixed(8)` and the nonce (`src/lib/transaction.ts`).
  - A signature that does not match says so in the danger colour; the artboard has only the checked state.
  - A mining reward has no signature: "the block's proof of work seals it".
  - A row from before VLA-16 has no nonce, so it cannot be checked, and the page says so.
- **Sealed in:** a card linking to `/?block=n`, with the block's hash and how many blocks are on top.
- **Certificate** (a sealed notarization, VLW-29b):
  - "This document existed on 21 October 2026 at 15:06:45 UTC." The moment is the block's seal from `GET /blocks/{block_hash}`, which the chain backs, not the time the node received the transaction. Until it loads, the heading says the document existed when block #n was sealed.
  - The fingerprint is in 8 groups of 8, in a grid that fits its container: four a row on a desktop, three at 360 px.
  - "Check a file against it": `crypto.subtle.digest('SHA-256', file)` is compared with `payload`. "Match" fades up and "No match" shakes. The file never leaves the browser.
  - A waiting notarization has no certificate yet.
- **Not found** (a 404): explains that rejected transactions leave no trace, with "Back to the tower". Any other failure shows a card with the API's `detail` and "Retry now" when `/health` answers; otherwise the shell's banner speaks.
- **Stories:** VLW-29 (with VLA-20).

### Sign and send — `/transact`

- **Artboard:** "E · Firmar y enviar". Tweaks: `keyState` (loaded, none), `serverReply` (accepted, invalid signature, insufficient funds, nonce used).
- **Data:** the key held in memory for the tab (`useKeyStore`, ADR-0002); balance `GET /wallets/{address}/balance`; nonce `GET /wallets/{address}/nonce` (VLA-16); `POST /transactions`.
- **The key** (VLW-30a):
  - The wallet page leaves the pair it creates in the tab's memory.
  - "Open a key file" reads the JSON the wallet saves, `{"public_key", "private_key"}` (VLW-31 writes the same format). The public key is derived again from the private one, and a file whose halves do not match is refused with the reason.
  - A reload forgets the key, and signing out clears it.
  - "Signing as" shows the identity cube, the address (8 characters on each side) and the balance.
- **Composing** (VLW-30b, `src/lib/compose.ts`):
  - The nonce is read from the node when the key is opened.
  - The checks match the API's. The address must be 64 hex characters, and the amount above 0 with at most 8 decimals. The fee is 0 or more. A notarization needs its document's hash.
  - The amount turns red when amount and fee exceed the balance. That is a hint; the API has the last word.
  - Red borders appear only once a field has text, so an empty form is not an error.
  - "What you are signing" lists the message key by key: addresses and payload shortened, the nonce in the accent colour, and the size in UTF-8 bytes. Once complete, the lines are exactly the signed message (tested).
  - Choosing the other kind starts without a document.
  - The background is `--color-vl-inset`.
- **Sending** (VLW-30c): "Send to the node" posts the signed fields and the signature (`src/services/ledger.ts`).
  - "Accepted by the node" shows the `tx_hash` and links to its page. "Send another" keeps the kind, the address and the fee, and reads the nonce and the balance again.
  - A refusal shows a card that shakes. Its title comes from the API's text: "The node refused the signature", "Not enough funds", "This nonce was already used", "The node did not answer", otherwise "The node refused the transaction". The API's own words follow it.
  - After a 409 the page reads the next nonce, says so, and asks to sign again; the signature is discarded.
- **Behaviour:**
  - the canonical message is rebuilt on every keystroke (`src/lib/signing.ts`, VLW-15);
  - editing after signing discards the signature;
  - a 409 for a used nonce reads the next nonce and asks to sign again (VLW-18);
  - a notarization hashes the chosen file in the browser.
- **Stories:** VLW-30 (with VLW-15, VLW-16, VLW-18).

### Wallet — `/wallet`

- **Artboard:** "E · Wallet". Tweaks: `start` (no wallet, existing wallet).
- **Data:** keys from `@noble/curves` in the browser (VLW-16); balance `GET /wallets/{address}/balance`; activity `GET /wallets/{address}/transactions` (*new*, VLA-34).
- **Behaviour:**
  - create or open a key file;
  - the identity cube drops in;
  - "Download .json" saves the key with a Blob download, then a checkbox confirms it was stored;
  - "Forget this key" asks inline, with no browser dialog;
  - looking up another address builds its cube as the person types.
- **Stories:** VLW-31 (with VLW-16, VLA-34).

### Network — `/network`

- **Artboard:** "E · Red". Tweaks: `role`, `resolveResult` (authoritative, replaced, failed), `registerResult` (ok, duplicate, private address), `startEmpty`.
- **Data:** `GET /nodes`, `POST /nodes/register` (admin; private addresses refused, VLA-19), `POST /nodes/resolve` (admin). The height before and after resolving comes from `GET /blocks` `total`.
- **Map:** this node in the centre, the registered peers evenly on a ring. Positions and the edges' rotation use `transform`, so adding a peer glides.
- **Stories:** VLW-32 (with VLA-19).

### Not found — any unknown route

- **Artboard:** "E · Estados del shell" (404 card).
- **Where:** inside the shell, as the catch-all child route.
  - Without a session, an unknown address leads to the login first, like any other page (AR-08).
  - The card's heading is the page's `h1`; on the artboard it is an `h2`, because it sits among other states.
- **Story:** VLW-33.

## What the design does not show

| Not shown | Why |
| --- | --- |
| A live nonce counter while mining | The API answers only when the block is sealed. The design shows elapsed time, measured in the browser. |
| Peers' heights, mempools or gossip between them | The API exposes only this node's peer list and the result of resolving. |
| An "ACTIVE" status for peers | Nothing checks it; the API stores the word at registration (audit). Peers are "registered". |
| A percentage while hashing a file | `crypto.subtle.digest` gives no progress. |
| A downloadable PDF certificate | Not planned; the page itself, its link and the browser's print are the certificate. |
| Sign-up with email, password reset | Visitors use one-click demo accounts (API ADR-0006); regular accounts are created by an admin; there is no mail server, so no reset. |
| Deleting a demo account's transactions | Confirmed transactions are immutable. The account expires; what it recorded stays on the chain, and the interface says so. |

## Design-only affordances

They exist in the canvas to review the design and are not built:

- the **Tweaks** panel of each artboard (roles, states, server replies);
- simulated latencies (the API's real timing replaces them);
- the "Signed in · open the tower" link on the login artboard (the app redirects by itself);
- the example buttons next to file pickers ("The original", "An edited copy", "Use an example file", "Use an example" address).

## Identity cube

An address is drawn as an isometric cube whose faces come from its first three bytes. `src/lib/identicon.ts` implements exactly this:

```ts
const PALETTE = ['#FFB547', '#7CC4FF', '#5AD19A', '#FF8A65', '#B79CFF', '#F2E56B', '#6FD3D8', '#E8EAEE'];
const shade = (hex: string, f: number) =>
  '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f).toString(16).padStart(2, '0')).join('');
export function addressCube(address: string) {
  const pick = (i: number) => PALETTE[parseInt(address.slice(i * 2, i * 2 + 2), 16) % 8];
  return { top: pick(0), left: shade(pick(1), 0.55), right: shade(pick(2), 0.75) };
}
```

The cube is decoration next to the address text, never instead of it.

## Responsive and accessibility

- **Layouts follow their container:** flex rows that wrap and `auto-fill` grids, no fixed breakpoints. At 360 px every view is one column.
- **The tower** is an SVG that scales with its card. **The network map** keeps its 860 × 440 geometry and scrolls sideways in its own box on narrow screens, because pulses follow fixed paths. The peer list below it carries the same information.
- **Labels:** every input has a `<label>`.
- **Live regions:** status changes (mining, hashing, results, toasts) are in `aria-live` regions; errors use `role="alert"`.
- **Interactive elements** are `<button>` or `<a>`, with a visible 2 px accent focus ring and a skip link.
- **Colour is never alone:** every status has text next to its dot or colour.
- VLW-24 checks all of it with axe-core and Playwright at 360 px.
