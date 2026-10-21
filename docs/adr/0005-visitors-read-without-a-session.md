# ADR-0005: Visitors read without a session

- **Status:** Accepted on 2026-10-21 (product owner)
- **Date:** 2026-10-21
- **Related:** veriledger-api ADR-0006 and VLA-36; ADR-0001; SPEC.md › Architecture; VLW-34; AR-08

## Context

The API's ADR-0006 lets visitors look around without an account, and VLA-36 made its reads public: blocks, transactions, wallets and peers answer without a token, and every write still needs one. The webapp still sent anyone without a session to `/login` from every page (ADR-0001, AR-08), so a visitor could not see the tower the API was already serving them.

## Options

1. **Keep every page behind the login.** Simple, but it hides what the API now offers, and the one-click demo of VLW-34b would have nothing to show before it starts.
2. **Open the pages whose data is public:** the tower, a transaction, the network and the 404. The wallet and Sign and send stay behind the login, as VLW-34 lists.
3. **Open every page**, the wallet and Sign and send included. The wallet only reads public data, but sending needs a token, and the backlog does not ask for it.

## Decision

Option 2 (product owner, 2026-10-21, the 404 included).

- `src/Router.tsx` groups the routes under two pathless parents: `OpenRoute` (`/`, `/transaction/:hash`, `/network`, `*`) and `ProtectedRoute` (`/wallet`, `/transact`). The shell no longer sits inside a guard.
- Without a session the header shows "Sign in", which returns to the same page after signing in. "Try the demo" joins it in VLW-34b.
- The pages hide what needs a session: the tower says "Anyone can look. To mine, sign in." with "Sign in to mine" (VLW-34b offers the demo there instead), and the network is read-only, as it is for every role but admin.
- A session that ends on an open page still opens the login with "Your session expired" (VLW-17). The login takes the reason from its router state and the store forgets it, so a visitor who goes back to an open page stays there.
- AR-08 becomes "every route except the public ones renders only with a session", with the public ones listed in its test. A new route is protected unless someone adds it to that list.

## Consequences

- A visitor sees the chain, a transaction with its signature checked in the browser, and the peers without signing in.
- The shell renders before the guard of its page. The header and the user chip read the token through `useSessionToken`, so an expired token is never sent to `/auth/me`.
- ADR-0001's "a `ProtectedRoute` wrapper for every page but the login" no longer holds; this ADR replaces that line.
