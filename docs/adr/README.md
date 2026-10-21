# Architecture Decision Records

One technical decision per file: context, options, decision and consequences. Any decision not covered by [SPEC.md](../SPEC.md) is recorded here with the next free number (`NNNN-title.md`). Decisions shared with the API (the signed message, the deployment) are made in `veriledger-api/docs/adr/`; the ADRs here adopt them and say what changes on this side.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-react-spa-with-vite.md) | A React single-page app built with Vite, Tailwind, Zustand and axios | Accepted (retroactive) |
| [0002](0002-keys-and-signing-only-in-the-browser.md) | Keys and signing only in the browser, with the API's canonical message | Accepted |
| [0003](0003-static-files-behind-the-api-caddy.md) | Static files behind the API's Caddy, with the API URL in a runtime `config.json` | Accepted |
| [0004](0004-design-direction-e.md) | Design direction E ("Network"), with motion the code reproduces exactly | Accepted |

Statuses: Proposed → Accepted → (Superseded by ADR-NNNN | Deprecated). "Retroactive" means the decision was taken in code on July 29, 2026 and written down on October 20, 2026.
