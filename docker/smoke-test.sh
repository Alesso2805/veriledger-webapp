#!/bin/sh
# Checks a running image (VLW-22): deep links, caching, config.json and the security headers.
# Usage: smoke-test.sh [base URL], http://127.0.0.1:8080 by default.
set -eu

base="${1:-http://127.0.0.1:8080}"

fail() {
  echo "smoke-test: $*" >&2
  exit 1
}
body() { curl -fsS "$base$1"; }
headers() { curl -fsS -D - -o /dev/null "$base$1"; }

for path in /wallet /transaction/0000abc /no/such/page; do
  body "$path" | grep -q '<div id="root">' || fail "$path does not answer index.html"
done

body /config.json | grep -q '"apiBaseUrl"' || fail "/config.json is missing"
for path in / /index.html /config.json; do
  headers "$path" | grep -qi '^cache-control: no-store' || fail "$path may be cached"
done

styles="$(body / | grep -o '/assets/[^"]*\.css' | head -n 1)"
[ -n "$styles" ] || fail "no stylesheet under /assets in index.html"
if body "$styles" | grep -q 'url(data:'; then fail "$styles inlines data: URIs, which the Content Security Policy blocks"; fi

asset="$(body / | grep -o '/assets/[^"]*\.js' | head -n 1)"
[ -n "$asset" ] || fail "no script under /assets in index.html"
headers "$asset" | grep -qi '^cache-control: public, max-age=31536000, immutable' || fail "$asset is not cached for a year"

page_headers="$(headers /)"
echo "$page_headers" | grep -qi "^content-security-policy: default-src 'self'" || fail "no Content-Security-Policy"
echo "$page_headers" | grep -qi '^x-content-type-options: nosniff' || fail "no X-Content-Type-Options"
echo "$page_headers" | grep -qi '^x-frame-options: deny' || fail "no X-Frame-Options"
echo "$page_headers" | grep -qi '^referrer-policy: no-referrer' || fail "no Referrer-Policy"
if echo "$page_headers" | grep -qi '^server:'; then fail "the Server header is still sent"; fi

echo "smoke-test: ok ($base)"
