# Comment review

Oct 20, 2026 · VLW-14 · @Alessandro David

This is the record of the comment cleanup on `chore/comment-cleanup`. It lists the comments that were kept, removed and left for later, and the reason for each.

## The rules applied

**Kept:**
- why something is done;
- references to an ADR, a rule or a story;
- warnings;
- documentation of a public API;
- a TODO with an issue;
- licenses.

**Removed:**
- commented-out code;
- comments that restate the code;
- narration;
- outdated comments;
- decorative separators;
- TODOs without an owner.

**Never touched:**
- directives (`/// <reference>`, `@ts-ignore`, `eslint-disable`…). A directive without a reason gets one on the same line;
- generated files;
- configuration comments that explain values.

## Scope

**In scope:** the files that survive design E. That means everything under `src/` except the five old pages, plus the configuration files.

**Out of scope, by decision of 2026-10-20** (BACKLOG › VLW-14 and "Redesign early, in order"):

| File | Comment lines | Replaced by |
| --- | --- | --- |
| `src/pages/Explorer.tsx` | 8 | VLW-28 |
| `src/pages/Transaction.tsx` | 10 | VLW-15, VLW-30 |
| `src/pages/TransactionDetail.tsx` | 6 | VLW-29 |
| `src/pages/Wallet.tsx` | 2 | VLW-31 |
| `src/pages/Network.tsx` | 1 | VLW-32 |
| `src/legacy.css` | its header | deleted by VLW-32 |

Their replacements are written under the rules above from the start.

## Inventory and decisions

| Where | Comment | Decision |
| --- | --- | --- |
| `src/components`, `src/pages/Login.tsx`, `src/pages/NotFound.tsx`, `src/store`, `src/services`, `src/lib`, `src/types`, `src/Router.tsx`, `src/setupTests.ts`, the tests and `src/architecture` | 30 comments | **Kept.** Each says why, warns, or points to a rule (AR-NN), to DESIGN.md or to a story (VLW-NN). They were written in Sprint 1 under these rules. |
| `vite.config.ts:1` | `/// <reference types="vitest/config" />` | **Not touched:** a directive. |
| `vite.config.ts` | `// Vitest returns '' for CSS unless it is listed here; AR-10 reads index.css as text.` | **Kept:** it explains a configuration value. |
| `vite.config.ts` | `// https://vite.dev/config/` | **Removed** (`85e2e7a`): a link left by the Vite template that explains no value. Decided by the product owner. |
| `.dependency-cruiser.cjs` | the header and the `@type` JSDoc | **Kept:** the header names the rules and how to run them; the JSDoc types the configuration. |
| `tsconfig.app.json`, `tsconfig.node.json` | `/* Bundler mode */`, `/* Linting */` | **Not touched:** configuration comments. |
| `.gitignore` | `# Logs`, `# Editor directories and files` | **Not touched:** configuration comments. |

## Left for later

**`src/pages/Transaction.tsx:4`: `// @ts-ignore` above `import { ed25519 } from '@noble/curves/ed25519.js'`.**

- **What the rule asks:** a directive without a reason would get one on the same line.
- **Why it waits:** the file is out of scope, so the product owner chose to leave it for VLW-15.
- **What was found:** the directive is not needed. `tsc -b` passes without it, because `@noble/curves` 2 ships its own types.
- **What VLW-15 does:** it moves signing to `src/lib` and must not carry the directive over. BACKLOG › VLW-15 says so.
