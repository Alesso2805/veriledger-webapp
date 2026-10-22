# Security policy

VeriLedger is a portfolio project, and its public demo runs a ledger whose coins are worth nothing. Even so, if you find a vulnerability, please report it privately rather than in a public issue or pull request.

## How to report

Use GitHub's private vulnerability reporting: the repository's **Security** tab, then **Report a vulnerability**. Say what you found, how to reproduce it and what an attacker could do with it.

You will get an answer within a week. Fixes go to `main`, and the public demo is redeployed from it.

## In scope

- A private key leaving the browser: in a request, in storage that outlives the tab, in a log or in a URL.
- A signature over something other than the message the page shows as "What you are signing".
- A certificate's check that says "Match" for a file that is not the certified document, or a signature the page calls checked when it is not.
- Anything a person types, opens or receives from the API that runs as code, or a way around the Content Security Policy.
- Reaching a page or an action beyond your role, or without signing in.
- Secrets in the repository or its history.

## Out of scope

- The demo accounts: anyone can start one with a click, on purpose.
- The demo's ledger and its coins: they have no value.
- Denial of service against the demo server, and load tests against it.
- Reports from automated scanners without a way to exploit the finding.
- The API's own vulnerabilities: report them in [veriledger-api](https://github.com/Alesso2805/veriledger-api/security).

Please do not access data that is not yours.
