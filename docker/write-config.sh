#!/bin/sh
# Writes the runtime config.json the app reads before rendering (ADR-0003), so one image serves any hostname.
# Usage: write-config.sh <target file>. API_BASE_URL defaults to /api, the API behind the same Caddy.
set -eu

target="${1:?usage: write-config.sh <target file>}"
api_base_url="${API_BASE_URL:-/api}"

# The value is written into JSON as is, so characters that would need escaping are refused.
case "$api_base_url" in
  *'"'* | *'\'* | *'
'*)
    echo "write-config: API_BASE_URL must not contain quotes, backslashes or newlines" >&2
    exit 1
    ;;
esac

printf '{"apiBaseUrl": "%s"}\n' "$api_base_url" > "$target"
