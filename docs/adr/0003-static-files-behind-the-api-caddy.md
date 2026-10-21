# ADR-0003: Static files behind the API's Caddy, with the API URL in a runtime `config.json`

- **Status:** Proposed
- **Date:** 2026-10-20
- **Related:** veriledger-api ADR-0005; SPEC.md › Deployment; VLW-21, VLW-22, VLW-25; AR-07

## Context

The API's ADR-0005 proposes one server with Caddy and one hostname: `/` for the webapp and `/api` for the API. Today the webapp cannot be deployed anywhere but `localhost`: the API URL `http://127.0.0.1:8000` is written in `src/services/api.ts`, there is no Dockerfile, and nothing answers `index.html` for `/wallet` or `/transaction/<hash>` on a reload.

## Options

1. **The URL at build time** (`VITE_API_URL`). One build per hostname; the image cannot be reused.
2. **The URL at run time:** the container writes `/config.json` from its environment when it starts, and the app reads it before rendering. One image for any hostname (willay does this, its ADR-0010).
3. **A relative URL** (`/api`) only. Works behind Caddy, but not in development, where Vite and the API run on different ports.

## Decision (proposed)

Option 2, with option 3 as its production value.

- `docker/` holds the static server's configuration and a start script that writes `{"apiBaseUrl": "<API_BASE_URL>"}` to `/config.json`; `API_BASE_URL` defaults to `/api`.
- `src/main.tsx` fetches `/config.json` before mounting the router; `src/services/api.ts` takes its base URL from it. In development, `VITE_API_URL` or `http://127.0.0.1:8000`.
- The static server answers `index.html` for unknown paths, caches hashed assets for a year and never caches `index.html` or `config.json`, and sends a Content Security Policy (`connect-src 'self'` in production).
- The image is built for amd64 and arm64, like the API's.

## Consequences

- One extra request before the first render (a few hundred bytes, same origin).
- In production the browser sees one origin, so the API needs no CORS for it.
- If the product owner chooses a static host instead (the API's ADR-0005, option 1), only the static server's configuration moves to that host's format; `config.json` keeps working.
