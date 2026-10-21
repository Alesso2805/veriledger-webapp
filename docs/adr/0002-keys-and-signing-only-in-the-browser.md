# ADR-0002: Keys and signing only in the browser, with the API's canonical message

- **Status:** Proposed
- **Date:** 2026-10-20
- **Related:** veriledger-api ADR-0003 and ADR-0004; SPEC.md › Signing contract; VLW-15, VLW-16, VLW-18; AR-02, AR-05, AR-06

## Context

The README promises that "the browser generates an Ed25519 cryptographic keypair locally. The Private Key never leaves the browser". The code does the opposite on the wallet page: it calls `POST /wallets/generate`, so the server creates the private key and sends it over the network. On the transact page the key does stay in the browser, but the message it signs (`JSON.stringify` of sorted keys) is not the one the API verifies, so the API rejects every transaction (audit 2026-10-20; the API's ADR-0004 shows both strings).

## Options

1. **Keep server-side generation** and fix only the message. Simple, but the promise of the README stays false and the server sees every private key.
2. **Generate and sign in the browser,** with the API's canonical message implemented once in `src/lib` and pinned by the API's golden vectors.

## Decision (proposed)

Option 2.

- `src/lib/keys.ts` generates the pair with `ed25519.utils.randomSecretKey()` and `ed25519.getPublicKey()` from `@noble/curves`, already a dependency.
- `src/lib/signing.ts` exports `buildSignedMessage(fields)` and `signTransaction(fields, privateKeyHex)`, following the API's ADR-0004: sorted keys, no whitespace, amounts as 8-decimal strings, `nonce` (VLW-18).
- The API's `docs/signing-vectors.json` is copied to `src/lib/__fixtures__/signing-vectors.json`; a Vitest test iterates it (AR-06). A change to the vectors comes from the API repository, never from here.
- Pages call `lib`; only `lib` imports `@noble/*` (AR-02). No request carries a private key (AR-05).
- The private key lives in component state for the session only; it is never persisted.

## Consequences

- `@noble/ed25519` and `@noble/hashes`, declared but unused, are removed (VLW-11).
- A user who closes the page without saving the key loses the wallet; the page says so, as it does today.
- The API's `POST /wallets/generate` becomes development-only (VLA-21).
