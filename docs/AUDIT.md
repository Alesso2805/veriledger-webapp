# VeriLedger webapp architecture audit

Date: 2026-10-20 · Commit audited: `770f4f4` (branch `main`, clean working tree at the start). Compared against `docs/SPEC.md`, `docs/BACKLOG.md`, `CLAUDE.md`, `docs/ARCHITECTURE_RULES.md` and `docs/adr/`, written the same day from the code and the README, and against the API's contracts (`veriledger-api`, commit `c1f113a`).

## How this audit was done, and its limits

- **What I executed myself, on a fresh `git clone` in a scratch folder:** `npm ci`, `npm run build`, `npm run lint`, `npm audit`; the build again with the one failing import removed (in the scratch copy only), to see whether anything else fails; a probe file to check whether TypeScript runs in strict mode.
- **Cross-repository check:** a transfer signed exactly as `src/pages/Transaction.tsx` does (`@noble/curves`, `JSON.stringify` of sorted keys), verified by the API's `Ed25519ServiceImpl` against the message the API builds.
- **Second pass, same day (browser).** `vite` from the fresh clone, opened in Chrome at 1920 px against the API's node A (run from its working copy, on the API's Compose Postgres; see the API's audit). The flow:
  - sign out, then sign in;
  - generate a wallet and mine a block to it;
  - open a transaction from that block;
  - sign a transfer and a notarization;
  - open the network page.

  The width of 360 px was emulated by loading the app in a 360 px iframe inside the same tab, because the window could not be resized. Rows checked this way say "navegador". The test wallet and the session were removed from the browser afterwards.
- **What I did not execute:** the transaction detail of a confirmed transaction (no link to one works), real devices, and keyboard-only use.
- **Architecture tests:** they do not exist yet (VLW-13 waits for the tool proposed in ARCHITECTURE_RULES.md). There are no tests of any kind in this repository. Section 2 gives the evidence of a grep, a read or a command, and says which.

Status vocabulary: **Cumple** (meets), **Parcial** (partly), **No cumple** (does not), **No verificable / no verificado** (could not be confirmed by reading code or running something).

---

## 1. Repository structure

SPEC tree (`docs/SPEC.md` › Repository) against the real tree. The SPEC tree is the target: entries marked with a story are expected to be missing.

**Present as promised (18):** `src/pages` (the six pages), `src/components` (`Layout`), `src/services/api.ts`, `src/store/useAppStore.ts`, `src/types/ledger.ts`, `src/Router.tsx`, `src/main.tsx`, `src/index.css`, `public/favicon.svg`, `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `.oxlintrc.json`, `README.md`, `CLAUDE.md`, `docs/`.

**Missing**

| Item | Story |
| --- | --- |
| `src/lib/` (`signing.ts`, `keys.ts`) | VLW-15, VLW-16 |
| Test setup (Vitest config, `npm test`) | VLW-12 |
| `.github/workflows/ci.yml` | VLW-10 |
| `.dependency-cruiser.cjs` | VLW-13 |
| `.nvmrc` and `engines` | VLW-11 |
| `Dockerfile`, `docker/` | VLW-21, VLW-22 |
| `e2e/` | VLW-23 |
| `CHANGELOG.md` | VLW-26 |

**Extra**

| Item | Note |
| --- | --- |
| `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`, `public/icons.svg` | Vite template leftovers; nothing imports them (grep). VLW-11. |
| `@noble/ed25519`, `@noble/hashes` in `dependencies` | Never imported (grep); only `@noble/curves` is used. VLW-11. |

**Elsewhere**

| Item | Where it is | Where SPEC puts it |
| --- | --- | --- |
| Building and signing the message | `src/pages/Transaction.tsx:44-71` | `src/lib/signing.ts` (VLW-15) |
| Hex helpers `h2b`, `b2h` | `src/pages/Transaction.tsx:98-108` | `src/lib/` |
| The `Node` type | `src/pages/Network.tsx:5-9` | `src/types/` |

Section 1: 18 present · 8 missing (all with a story) · 2 extra · 3 elsewhere.

---

## 2. Architecture rules

### 2.1 Architecture tests: result

**No architecture test exists, so none could be run.** "lectura" means read in the code, "grep" a search, "ejecutado" a command I ran.

| Rule | Status | Evidence |
| --- | --- | --- |
| AR-01 only `src/services` imports axios | Cumple | grep: the only `from 'axios'` is `src/services/api.ts:1`. |
| AR-02 only `src/lib` imports `@noble/*` | No cumple | grep: `src/pages/Transaction.tsx:5`; `src/lib` does not exist. |
| AR-03 folder dependencies point inward; only `Router.tsx` imports pages | Cumple | grep: pages import `services`, `store`, `types`; `components/Layout.tsx` imports `store`; `services` imports `store`; `store` imports only `zustand`; `types` imports nothing; `src/Router.tsx:4-9` is the only importer of `pages`. |
| AR-04 no circular imports | Cumple | lectura: the graph is `main → Router → pages/components → services → store`, with no edge back. |
| AR-05 no request carries a private key; nothing calls `/wallets/generate` | No cumple | lectura: `src/pages/Wallet.tsx:32` calls `POST /wallets/generate` and receives the private key from the server. (The key typed on the transact page is not sent: `Transaction.tsx:74-81` posts only public fields.) |
| AR-06 the signed message reproduces the API's vectors | No cumple | ejecutado: a signature over `{"amount":10,"fee":0,...}` fails the API's verification of `{"amount": 10.0, "fee": 0.0, ...}` (`False`) and passes against the compact string (`True`). There are no vectors yet. |
| AR-07 no absolute URL in `src`; base URL from runtime configuration | No cumple | grep: `src/services/api.ts:5` `baseURL: 'http://127.0.0.1:8000'`. |
| AR-08 every route but `/login` needs a session | Cumple | lectura: `src/Router.tsx:34-47`, every child route sits under `ProtectedRoute`. |
| AR-09 response types generated from the API's OpenAPI | No cumple | lectura: `src/types/ledger.ts` is hand-written, and `status` is `'PENDING' \| 'CONFIRMED' \| 'REJECTED'` (`:6`) while the API's enum is `PENDING`, `CONFIRMED`, `FAILED`. |

### 2.2 Rules from CLAUDE.md

| Rule | Status | Evidence |
| --- | --- | --- |
| Stack: React 19, TypeScript strict, Vite, Tailwind 4, React Router 7, Zustand, axios, lucide-react, `@noble/curves` | Cumple | `package.json`. Strict mode comes from TypeScript 6's default, not from `tsconfig.app.json` (ejecutado: a probe file failed with TS7006 and TS2322). Making it explicit costs one line. |
| Stack: Vitest, Playwright, dependency-cruiser | No cumple | None installed. |
| Node 22 LTS | No cumple | No `.nvmrc` or `engines`; the README says "v18+", but Vite 8, `@vitejs/plugin-react` 6 and oxlint 1.76 need `^20.19.0 \|\| >=22.12.0`. |
| Folder rules, axios only in services, `@noble` only in lib | Parcial | AR-01, AR-03, AR-04 meet; AR-02 does not. |
| No request carries a private key; signatures match the vectors | No cumple | AR-05, AR-06. |
| No API URL in the code | No cumple | AR-07. |
| DoD: green CI (`tsc -b`, oxlint without warnings, architecture tests, Vitest, `vite build`) | No cumple | ejecutado: `tsc -b` fails (`TS6133`, `src/pages/Explorer.tsx:4`); oxlint exits 0 with 3 warnings (two unused `catch` parameters, the unused `Hash`); no tests; no CI. |
| DoD: `npm ci && npm run build` from a clean clone | No cumple | Section 8. |
| DoD: checked in a browser at 1280 and 360 px against a running API | No cumple | navegador: at 356 px of usable width the page is 716 px wide (horizontal scroll), and "Wallet", "Transact", "Network" and "Logout" sit outside the screen. The main flow fails against the API (section 3). |

Section 2: 5 Cumple · 1 Parcial · 12 No cumple · 0 No verificado.

---

## 3. Stories: acceptance criteria and their tests

The MVP as built is E0 (VLW-01 to VLW-06). **The repository has no tests, so every criterion is a criterion without a test.** The status comes from the browser where it says "navegador", and from reading the code otherwise.

### VLW-01 Sign in

| Criterion | Test | Status |
| --- | --- | --- |
| Posts the OAuth2 form, stores the token, opens `/` | — | Cumple (navegador) |
| An API error shows its `detail` | — | Cumple (navegador: "Could not validate credentials") |
| Every route but `/login` redirects without a token | — | Cumple (navegador after logout; AR-08) |
| Logout clears the token | — | Cumple (navegador) |

Not criteria, but found in the browser:
- The form starts filled with `admin@veriledger.com` and its password (`Login.tsx:8-9`), the API seed's admin.
- On opening the app, Chrome still held a token for `localhost:5173` that had **expired on July 29, 2026**. The app showed the explorer as signed in, with "Could not validate credentials", 0 blocks and "Network Status: Online", instead of returning to the login (VLW-17, VLW-20).

### VLW-02 Wallet and balance

| Criterion | Test | Status |
| --- | --- | --- |
| "Generate New Wallet" shows both keys, copy buttons, a warning | — | Cumple as written (navegador); the browser's network log shows `POST http://127.0.0.1:8000/wallets/generate` → 200: the private key comes from the server (AR-05) |
| "Query Ledger" shows the balance of any address | — | Parcial: a failed query is only logged to the console and nothing is shown (`Wallet.tsx:21-23`) |

### VLW-03 Transfer and notarization

| Criterion | Test | Status |
| --- | --- | --- |
| Two tabs | — | Cumple (navegador) |
| Amount > 0, fee ≥ 0, payload required for notarizations | — | Cumple (lectura, `Transaction.tsx:31-39`) |
| The message is signed in the browser with Ed25519 | — | No cumple (navegador): a transfer of 10 from a wallet holding 50 and a notarization from the same wallet both showed "Invalid transaction signature"; the API logged two `POST /transactions` → 400 (AR-06) |
| Success and error messages | — | Parcial: the error shows (navegador); the success message could not be reached |
| A notarization goes to the sender's own address | — | Cumple (lectura, `Transaction.tsx:42`) |

### VLW-04 Explorer and mining

| Criterion | Test | Status |
| --- | --- | --- |
| Latest blocks newest first, every 10 s and on demand | — | Cumple (navegador; `Explorer.tsx:61-65`, `:149`) |
| Totals of blocks and transactions | — | Parcial: computed from the first page of at most 100 blocks (`Explorer.tsx:67`, `:114`) |
| "Start Mining" with a miner address | — | Cumple (navegador: block #12 mined to the new wallet) |
| Search by transaction hash | — | Cumple (lectura, `Explorer.tsx:52`) |

### VLW-05 Transaction detail and certificate

| Criterion | Test | Status |
| --- | --- | --- |
| Status, hash, parties, value, fee, block or "Pending in Mempool" | — | Cumple (lectura) |
| Amount 0 with a payload shown as a certificate | — | Cumple (lectura, `TransactionDetail.tsx:45`, `:87-100`) |

### VLW-06 Peers

| Criterion | Test | Status |
| --- | --- | --- |
| Add a peer URL | — | Cumple (lectura; the API side en vivo) |
| List peers with their status | — | Cumple (navegador). But every peer shows "ACTIVE", including `http://169.254.169.254` and `http://10.0.0.1`: the status is a string the API stores at registration and never checks. A failed load is only logged (`Network.tsx:22-24`) |
| "Resolve Conflicts" says whether the chain was replaced | — | Cumple (lectura, `Network.tsx:51-55`) |

### Stories outside the built MVP

VLW-07 (this documentation) is in review. VLW-10 to VLW-26 are not started; none of their criteria has a test.

### Totals for section 3

20 criteria in VLW-01 to VLW-06: **0 with a test, 20 without a test**. 16 Cumple · 3 Parcial · 1 No cumple; 11 of the 20 checked in the browser.

---

## 4. Data

The webapp has no database: there are no tables, columns, indexes, constraints, roles or migrations to compare. What it stores and the shapes it expects from the API:

| Item | Status | Evidence |
| --- | --- | --- |
| The browser stores only the session token (`localStorage`, key `veriledger-storage`) | Cumple | lectura, `store/useAppStore.ts` |
| No private key is persisted | Cumple | lectura: keys live in component state only (`Wallet.tsx:7`, `Transaction.tsx:11`) |
| `Block`, `Paginated`, `Node` and the balance response match the API's DTOs | Cumple | lectura, against the API's `dto/block.py`, `dto/node.py`, `wallet_router.py:35` |
| `Transaction.status` matches the API's enum | No cumple | `REJECTED` here, `FAILED` there (AR-09) |
| Tables, columns, indexes, constraints, roles | No verificable | Not applicable to this repository. |

Section 4: 3 Cumple · 0 Parcial · 1 No cumple · 1 No verificable.

---

## 5. Decisions (ADRs)

| ADR | Exists | Matches the code | Status |
| --- | --- | --- | --- |
| 0001 React SPA with Vite, Tailwind, Zustand, axios | Yes | Except signing inside a page instead of `src/lib`, recorded in the ADR with its story | Parcial |
| 0002 Keys and signing only in the browser | Yes, Proposed | Not implemented: the server generates the wallet | No verificable (proposed) |
| 0003 Static files behind the API's Caddy, runtime `config.json` | Yes, Proposed | Not implemented | No verificable (proposed) |
| API ADR-0004 (canonical message) and ADR-0005 (deployment), adopted by 0002 and 0003 | Yes, in `veriledger-api` | Not implemented | No verificable (proposed) |

Section 5: 0 Cumple · 1 Parcial · 0 No cumple · 3 No verificable.

---

## 6. Deviations from SPEC.md and the README

| What the code does | What SPEC or the README says | ADR that justifies it |
| --- | --- | --- |
| The wallet page asks the server for the key pair (`Wallet.tsx:32`) | README: "The browser generates an Ed25519 cryptographic keypair locally. The Private Key never leaves the browser" | None (ADR-0002 proposes the fix) |
| Signs `JSON.stringify` of sorted keys with numeric amounts | The API's canonical message | None (API ADR-0004, ADR-0002) |
| A transaction inside a block links by its `id` (`Explorer.tsx:202`); the detail page looks it up as a hash (`TransactionDetail.tsx:17`) and the API searches `tx_hash`, so it opens "Not Found" (navegador: `/transaction/4c8a79e4-…` → "Transaction not found") | Every link opens what it shows | None (VLW-19, VLA-20) |
| "Network Status: Online" is a constant (`Explorer.tsx:131-135`) | The screens tell the truth | None (VLW-20) |
| The API URL is a constant (`api.ts:5`) | Runtime configuration | None (ADR-0003 proposed) |
| The login form is pre-filled with the admin's credentials (`Login.tsx:8-9`) | No credentials in the code | None (VLW-17) |
| No response interceptor: after the token's 30 minutes every call fails with 401 and the user stays on a broken page (navegador, with a token expired since July 29) | An expired session returns to the login | None (VLW-17) |
| Every peer is shown "ACTIVE", whether it answers or not (navegador) | The screens tell the truth | None (VLW-20; the API stores the string at registration) |
| At 360 px the navigation overflows: page 716 px wide, three links and Logout off screen (navegador) | Usable at 360 px with no horizontal scroll | None (VLW-24) |
| README: "Node.js v18+" | Vite 8 needs `^20.19.0 \|\| >=22.12.0` | None (VLW-11) |
| `<title>veriledger-webapp</title>` (`index.html:7`) | "VeriLedger" | None (VLW-26) |

11 deviations; none is justified by an ADR.

---

## 7. Scalability risks

- **Pages that do everything.** `Transaction.tsx` (291 lines) holds the form, the validation, the hex helpers, the message building and the signing; `Explorer.tsx` (264) the polling, the mining, the search and the stats. Changing the signing contract (VLW-15, VLW-18) means editing a page.
- **Duplicated code.** The error extraction `err.response?.data?.detail || '…'` is written 6 times; each page writes its API paths by hand (`api.get('/blocks')`), so a path change in the API (VLA-20) is a search across pages.
- **Colors written by hand.** About 180 hex literals inside `className` across the seven components (grep), next to theme tokens in `index.css` that the pages do not use. A palette or contrast change touches every file.
- **Types.** 11 explicit `any` (most in `catch (err: any)` and the signed payload).
- **Polling.** Every open Explorer tab fetches up to 100 blocks with their transaction ids every 10 s; fine for a demo, grows with the chain.
- **Bundle.** One JavaScript chunk of 360 kB (117 kB gzipped) with the build fixed (ejecutado in the scratch copy). Not a risk today; route-level splitting is available when it is.

---

## 8. Reproducibility

From a fresh clone, following the README:

| Step | Result | Evidence |
| --- | --- | --- |
| `git clone`, `npm ci` | Works | ejecutado; it reports 5 vulnerabilities (1 moderate, 4 high: `axios`, `follow-redirects`, `nanoid`, `source-map-js`; `vite` moderate). |
| `npm run build` | Fails | ejecutado: `src/pages/Explorer.tsx(4,15): error TS6133: 'Hash' is declared but its value is never read.` With that import removed (scratch copy only) the build passes. |
| `npm run lint` | Works with 3 warnings | ejecutado: exit code 0. |
| `npm run dev`, the app in a browser | Works | navegador: Vite serves the app despite the type error, because the dev server does not type-check. |
| The app against the API | Core flow fails | navegador: sign-in, wallet, mining and the peer list work; transfers and notarizations are rejected, and links from a block open "Not Found". The API itself only ran from a dev virtualenv, since its image does not start (API audit, section 8). |
| This machine's working copy | `npm run build` fails earlier: `'tsc' is not recognized` | `node_modules/.bin` has no `tsc`, `vite` or `oxlint` here; `npm ci` restores them. |

**Verdict:** the project does not build from a clean clone with the documented command. In development it runs, but its main flow fails against the current API (navegador).

---

## Summary

| Section | Cumple | Parcial | No cumple | No verificable |
| --- | :-: | :-: | :-: | :-: |
| 1. Structure (present / missing / extra / elsewhere) | 18 | — | 8 missing · 2 extra · 3 elsewhere | — |
| 2. Architecture rules (AR and CLAUDE.md) | 5 | 1 | 12 | 0 |
| 3. Story criteria (VLW-01 to 06) | 16 | 3 | 1 | 0 (all 20 without a test) |
| 4. Data | 3 | 0 | 1 | 1 |
| 5. ADRs | 0 | 1 | 0 | 3 |
| 6. Deviations | — | — | 11, none justified | — |
| 8. Reproducibility | 3 steps work | 0 | 3 | 0 |

## Corrections, by priority

### Blocking

1. **The build fails from a clean clone.** Remove the unused `Hash` import, make oxlint fail on warnings, and run both in CI. VLW-11, VLW-10.
2. **Every signed transaction is rejected by the API.** Implement the API's canonical message in `src/lib/signing.ts` with its vectors. VLW-15 (after VLA-15).
3. **The API URL is fixed to `127.0.0.1:8000`.** A deployed page would call the visitor's own machine. VLW-21.
4. **No production serving.** No image, and deep links answer 404 on a reload under a plain static server. VLW-22.
5. **The admin's credentials are pre-filled in the login form.** On a public demo anyone signs in as admin. VLW-17 (with the API's VLA-24).
6. **The server creates the private keys.** Contradicts the README's main promise. VLW-16.
7. **4 high-severity advisories**, `axios` among them (a runtime dependency). VLW-11.

### Important

1. No tests at all; no CI. VLW-12, VLW-10.
2. An expired session leaves the user on failing pages. VLW-17.
3. Transactions inside a block open "Not Found". VLW-19 (with VLA-20).
4. Replay protection needs the nonce on this side. VLW-18 (after VLA-16).
5. Swallowed errors on the wallet and network pages; a constant "Online". VLW-20.
6. The README's Node version is wrong; no `.nvmrc`. VLW-11.
7. The navigation overflows at 360 px (navegador); inputs have no associated labels (`<label>` with no `htmlFor` on every form). VLW-24.

### Minor

1. Unused dependencies and template assets. VLW-11.
2. Hand-written response types (`REJECTED`). VLW-19.
3. Page title `veriledger-webapp`. VLW-26.
4. 180 hex color literals instead of the theme tokens; 11 `any`. Proposals in ARCHITECTURE_RULES.md.
5. An unneeded `// @ts-ignore` on the `@noble/curves` import (`Transaction.tsx:4`): the types resolve without it (ejecutado). See the comment inventory, VLW-14.
6. Narrating comments ("Actually we don't have GET /blocks/{hash}…"). VLW-14.
