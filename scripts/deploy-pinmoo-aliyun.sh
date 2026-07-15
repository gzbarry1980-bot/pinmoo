#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/pinmoo.top}"
SITE_ORIGIN="https://pinmoo.top"
SCRIPT_PATH="$APP_DIR/scripts/deploy-pinmoo-aliyun.sh"

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
npm run verify
npm run verify:agent

echo "==> Sync managed nginx protection snippets"
run_admin install -d -m 755 /etc/nginx/conf.d /etc/nginx/snippets
run_admin install -m 644 deploy/nginx/pinmoo-rate-limit-zones.conf /etc/nginx/conf.d/00-pinmoo-rate-limit-zones.conf
run_admin install -m 644 deploy/nginx/pinmoo-security-headers.conf /etc/nginx/snippets/pinmoo-security-headers.conf
run_admin install -m 644 deploy/nginx/pinmoo-server-protection.conf /etc/nginx/snippets/pinmoo-server-protection.conf

echo "==> Make pinmooconsulting.com the primary website"
run_admin env APP_DIR="$APP_DIR" bash scripts/install-primary-domain-redirect.sh

echo "==> Verify primary-domain pages, legacy redirects and the agent workspace"
node scripts/verify-domain-strategy.mjs

echo "==> Notify IndexNow"
if ! node scripts/submit-indexnow.mjs https://pinmooconsulting.com; then
  echo "Warning: IndexNow submission failed; deployment remains valid."
fi

echo "==> Done. Official site: https://pinmooconsulting.com/ (Chinese: /zh/). Agent: https://agent.pinmoo.top/"
