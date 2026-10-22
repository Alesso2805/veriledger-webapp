# Changelog

What changes in the VeriLedger webapp, release by release. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/). Version 1.0.0 is the first release (VLW-26); until then everything is under Unreleased. The stories (VLW-NN) are in [docs/BACKLOG.md](docs/BACKLOG.md).

## [Unreleased]

### Added

- **An MIT license** and **a security policy**: vulnerabilities are reported privately, through GitHub (VLW-49).
- **A README for visitors**, with the live demo and what to try (VLW-49).

- **Design E** ("Network") on every page: the tokens, the fonts, and the shell with its search, the API's status, the user chip, a skip link and toasts. Routes fade in, and reduced motion is respected (VLW-27, VLW-33).
- **Sign in.** It says when a session has expired and returns to the page you were on (VLW-17, VLW-33).
- **The block tower.**
  - The newest 10 blocks are drawn as a tower, older blocks are listed below, and the selected block shows its transactions.
  - What waits for the next block is listed too, and everything refreshes every 10 s.
  - Mining, for the trader and admin roles (VLW-28).
- **Sign and send.**
  - Keys are made in the browser and held only in the tab.
  - The API's canonical message is signed in the browser with Ed25519 and the sender's nonce.
  - It sends transfers and notarizations, and handles the API's refusals (VLW-15, VLW-16, VLW-18, VLW-30).
- **A transaction's page.** Its journey, its details with the signature checked in the browser, and a notarization's certificate with "Check a file against it" (VLW-29).
- **The wallet.** Create a key or open a key file, the address's identity cube, saving the key file, the address's activity, and a look-up of any address (VLW-31).
- **Search** by block number or full hash (VLW-19).
- **The network.** The peers on a ring, adding a peer, and resolving conflicts (VLW-32).
- **Visitors and the demo.** Visitors browse the tower, transactions and peers without an account, and start a 24-hour demo account with one click (VLW-34).
- **"no database".** Shown when the API answers but its database does not (the API's VLA-26).
- **The production image.**
  - One image for any hostname, with `/config.json` written at start and strict security headers (VLW-21, VLW-22).
  - Published to GHCR for amd64 and arm64 (VLW-25).
- **Checks in CI:**
  - unit and component tests;
  - the architecture rules;
  - types generated from the API's OpenAPI document;
  - accessibility with axe at 1280 and 360 px;
  - the main flows end to end against the API (VLW-10 to VLW-13, VLW-19, VLW-23, VLW-24).
- **The page title "VeriLedger"**, and the logo as the favicon (VLW-26).

### Changed

- Transactions are signed over the API's canonical message, so the API accepts them. The first version signed `JSON.stringify` of numbers, and the API rejected every transaction (VLW-15).
- Key pairs are made in the browser, never by the server (VLW-16).

### Removed

- The neon styles of the first version (VLW-27, VLW-32).
