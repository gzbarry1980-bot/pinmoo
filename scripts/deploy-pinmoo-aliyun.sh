#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/pinmoo.top}"
SITE_ORIGIN="https://pinmoo.top"

run_admin() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

cd "$APP_DIR"
export SITE_ORIGIN

echo "==> Pull latest code"
git pull --ff-only origin main

echo "==> Install dependencies"
npm ci --ignore-scripts --no-audit --no-fund

echo "==> Build static site"
npm run build

echo "==> Verify SEO, GEO and internal links"
npm run verify

echo "==> Sync managed nginx protection snippets"
run_admin install -d -m 755 /etc/nginx/conf.d /etc/nginx/snippets
run_admin install -m 644 deploy/nginx/pinmoo-rate-limit-zones.conf /etc/nginx/conf.d/00-pinmoo-rate-limit-zones.conf
run_admin install -m 644 deploy/nginx/pinmoo-security-headers.conf /etc/nginx/snippets/pinmoo-security-headers.conf
run_admin install -m 644 deploy/nginx/pinmoo-server-protection.conf /etc/nginx/snippets/pinmoo-server-protection.conf

echo "==> Reload nginx"
if command -v systemctl >/dev/null 2>&1; then
  run_admin nginx -t
  run_admin systemctl reload nginx
else
  run_admin nginx -t
  run_admin service nginx reload
fi

echo "==> Verify live canonical, crawler access, 404 and security headers"
node scripts/verify-live.mjs https://pinmoo.top

echo "==> Done. Verify: https://pinmoo.top/ and https://pinmoo.top/insights/"
