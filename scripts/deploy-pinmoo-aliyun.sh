#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/pinmoo.top}"
SITE_ORIGIN="https://pinmooconsulting.com"
SCRIPT_PATH="$APP_DIR/scripts/deploy-pinmoo-aliyun.sh"
SOURCE_CONFIG="$APP_DIR/deploy/nginx/pinmooconsulting.com.conf.example"
SITE_CONFIG="${SITE_CONFIG:-/etc/nginx/sites-enabled/pinmooconsulting.com}"

run_admin() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

cd "$APP_DIR"
export SITE_ORIGIN
script_hash_before="$(sha256sum "$SCRIPT_PATH" | awk '{print $1}')"

echo "==> Pull latest code"
git pull --ff-only origin main
script_hash_after="$(sha256sum "$SCRIPT_PATH" | awk '{print $1}')"
if [ "$script_hash_before" != "$script_hash_after" ] && [ "${PINMOO_DEPLOY_REEXEC:-0}" != "1" ]; then
  echo "==> Deployment script was updated; restart with the new version"
  exec env PINMOO_DEPLOY_REEXEC=1 APP_DIR="$APP_DIR" bash "$SCRIPT_PATH"
fi

echo "==> Install dependencies"
npm ci --ignore-scripts --no-audit --no-fund

echo "==> Build static site"
npm run build

echo "==> Verify SEO, GEO and internal links"
npm run verify:international
npm run verify:content
npm run verify
npm run verify:agent

if [ ! -f "$SOURCE_CONFIG" ]; then
  echo "Missing primary-site Nginx template: $SOURCE_CONFIG" >&2
  exit 1
fi

echo "==> Sync managed nginx protection snippets"
run_admin install -d -m 755 /etc/nginx/conf.d /etc/nginx/snippets
run_admin install -m 644 deploy/nginx/pinmoo-rate-limit-zones.conf /etc/nginx/conf.d/00-pinmoo-rate-limit-zones.conf
run_admin install -m 644 deploy/nginx/pinmoo-security-headers.conf /etc/nginx/snippets/pinmoo-security-headers.conf
run_admin install -m 644 deploy/nginx/pinmoo-server-protection.conf /etc/nginx/snippets/pinmoo-server-protection.conf
run_admin install -m 644 deploy/nginx/pinmoo-performance.conf /etc/nginx/snippets/pinmoo-performance.conf

echo "==> Install pinmooconsulting.com primary-site Nginx configuration"
run_admin install -d -m 755 /etc/nginx/sites-available /etc/nginx/sites-enabled
run_admin install -m 644 "$SOURCE_CONFIG" "$SITE_CONFIG"
run_admin nginx -t
if command -v systemctl >/dev/null 2>&1; then
  run_admin systemctl reload nginx
else
  run_admin service nginx reload
fi

echo "==> Verify the live .com primary site"
node scripts/verify-live.mjs https://pinmooconsulting.com

echo "==> Notify IndexNow"
if ! node scripts/submit-indexnow.mjs https://pinmooconsulting.com; then
  echo "Warning: IndexNow submission failed; deployment remains valid."
fi

echo "==> Done. Official site: https://pinmooconsulting.com/ (Chinese default, English: /en/)."
echo "==> Netlify short domain pinmoo.top and independent tool subdomains were not changed."
