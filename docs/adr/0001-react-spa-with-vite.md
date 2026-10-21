# ADR-0001: A React single-page app built with Vite, Tailwind, Zustand and axios

- **Status:** Accepted (retroactive)
- **Date:** 2026-07-29, written down on 2026-10-20
- **Related:** SPEC.md › Architecture; ARCHITECTURE_RULES.md AR-01 to AR-04; commit `d96901f`

## Context

The webapp is a dashboard for one API: six screens, one piece of shared state (the session token), and cryptography that must run in the browser. It has no SEO needs and no content that a server should render.

## Options

1. **A framework with server rendering** (Next.js, Remix). A server to run and deploy for no benefit: every page needs the user's token and the API's data.
2. **A single-page app built into static files,** served by any web server.

## Decision

Option 2, with:

- **React 19 and TypeScript,** built and served in development by **Vite**.
- **Tailwind CSS 4** through `@tailwindcss/vite`, with the theme's colors as tokens in `src/index.css`.
- **React Router 7** in library mode (`BrowserRouter`, `Routes`); a `ProtectedRoute` wrapper for every page but the login.
- **Zustand** with `persist` for the session token, in `localStorage` under `veriledger-storage`.
- **axios** with one instance in `src/services/api.ts` and a request interceptor that adds the bearer token.
- **oxlint** for lint, instead of ESLint, for speed.
- **`@noble/curves`** for Ed25519 (ADR-0002).

## Consequences

- The build is static files: any server can host them, which ADR-0003 relies on.
- A token in `localStorage` survives reloads but is readable by any script on the page; the Content Security Policy of VLW-22 is the mitigation. Moving it to memory would log the user out on every reload; ARCHITECTURE_RULES.md lists it as a proposal.
- Deep links need the server to answer `index.html` for unknown paths (VLW-22).
- oxlint has no import-boundary rules, so the folder rules are checked with dependency-cruiser (ARCHITECTURE_RULES.md, pending confirmation).
- **What the code does differently today** (audit 2026-10-20): the page `Transaction.tsx` imports `@noble/curves` and builds the signed message itself; there is no `src/lib`. VLW-15 moves it (AR-02).
