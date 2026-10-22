# Changelog

What changes in the VeriLedger webapp, release by release. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/). The stories (VLW-NN) are in [docs/BACKLOG.md](docs/BACKLOG.md).

## [Unreleased]

## [1.0.0] - 2026-10-22

The first release: design C, in English and Spanish and in light and dark themes. It is live at [veriledger.duckdns.org](https://veriledger.duckdns.org), with the API's 1.0.0.

### Added

- **Design C ("Fingerprint")** on every page (VLW-37 to VLW-47, ADR-0006 to ADR-0008):
  - every hash and address is drawn as a fingerprint: coloured bars, one per byte;
  - light and dark themes, which follow the system or your choice and are set before the first paint;
  - English and Spanish, from typed dictionaries, with the API's known errors translated;
  - the shell: search, the API's status, the user chip, the theme and language switches, tabs, a skip link, toasts, and the offline and no-database banners.
- **Sign in.** It says when a session or a demo has ended, and returns to the page you were on. **Try the demo** starts a 24-hour account with one click (VLW-17, VLW-34, VLW-42).
- **The chain:**
  - the newest 10 blocks as a ribbon of fingerprints; pointing at one lights the fingerprint it links to;
  - the selected block and older blocks;
  - what waits for the next block;
  - mining, for the trader and admin roles (VLW-28, VLW-43).
- **Sign and send** (VLW-15, VLW-16, VLW-18, VLW-30, VLW-45):
  - keys made in the browser and held only in the tab;
  - the API's canonical message, shown before it is signed with Ed25519 and the sender's nonce;
  - transfers and notarizations, with the document hashed in the browser;
  - the API's refusals explained.
- **A transaction's page.** Its journey, its signature checked in the browser, and the block that seals it. A notarization also gets its certificate, which checks a file in the browser (VLW-29, VLW-44).
- **The wallet:**
  - create a key, or open a key file, and save the file;
  - the address's fingerprint, balance and activity;
  - a look-up of any address (VLW-31, VLW-46).
- **Search** by block number or full hash (VLW-19).
- **The network.** This node and its peers on a ring map; adding a peer and resolving conflicts, for the admin (VLW-32, VLW-47).
- **Visitors** browse the chain, transactions and peers without an account (VLW-34).
- **No blank pages.** A page that throws while drawing shows a fallback with "Try again" (VLW-35).
- **The production image** (VLW-21, VLW-22, VLW-25):
  - one image for any hostname, with `/config.json` written at start;
  - strict security headers;
  - built for amd64 and arm64 and published to GHCR.
- **Checks in CI** (VLW-10 to VLW-13, VLW-19, VLW-23, VLW-24, VLW-36, VLW-48):
  - unit and component tests;
  - the architecture rules AR-01 to AR-11;
  - types generated from the API's OpenAPI document;
  - accessibility and robustness in a real browser at 1280 and 360 px, in light in English and in dark in Spanish;
  - the main flows end to end against the API, and again behind its production Caddy.
- **The page title "VeriLedger"**, and the logo as the favicon (VLW-26, VLW-41).
- **An MIT license, a security policy, and a README for visitors** with screenshots of the live demo (VLW-26, VLW-49).

### Changed

- Transactions are signed over the API's canonical message, so the API accepts them. The first version signed `JSON.stringify` of numbers, and the API rejected every transaction (VLW-15).
- Key pairs are made in the browser, never by the server (VLW-16).

### Removed

- The neon styles of the first version (VLW-27, VLW-32).

[Unreleased]: https://github.com/Alesso2805/veriledger-webapp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Alesso2805/veriledger-webapp/releases/tag/v1.0.0
