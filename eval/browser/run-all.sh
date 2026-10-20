#!/bin/bash
# Full local console verification: fresh throwaway dev backend, seed, drive Desk, then Orders/Rates/Settings and all widths.
# Needs: Deno on PATH (npm i -g deno), PHOTOS=<dir with wedding.jpg and pound.jpg> (any two cake photos; not committed).
set -e
cd "$(dirname "$0")/../../app"
unset NODE_USE_ENV_PROXY HTTPS_PROXY HTTP_PROXY https_proxy http_proxy
export NO_PROXY=localhost,127.0.0.1 NODE_EXTRA_CA_CERTS=${NODE_EXTRA_CA_CERTS:-/root/.ccr/ca-bundle.crt} NODE_NO_WARNINGS=1 DENO_TLS_CA_STORE=system SSL_CERT_FILE=${NODE_EXTRA_CA_CERTS}
for p in $(pgrep -f "[b]in/base44 dev"; pgrep -f "[n]ode_modules/.bin/vite"); do kill "$p" 2>/dev/null || true; done
sleep 2
(setsid npx -y base44@latest dev -p 4400 > "${TMPDIR:-/tmp}/inspo-dev.log" 2>&1 &)
for i in $(seq 1 40); do curl -s --noproxy '*' -o /dev/null localhost:5173/ && break; sleep 1; done
PHOTOS="${PHOTOS:?set PHOTOS}" npx -y base44@latest exec --local < ../eval/seed-local.mjs 2>&1 | grep -e seeded -e rror
cd ..
node eval/browser/desk.mjs
node eval/browser/screens.mjs
