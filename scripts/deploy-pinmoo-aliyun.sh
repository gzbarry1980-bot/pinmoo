#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/pinmoo.top}"

cd "$APP_DIR"

echo "==> Pull latest code"
git pull --ff-only origin main

echo "==> Install dependencies"
npm install

echo "==> Build static site"
npm run build

echo "==> Reload nginx"
if command -v systemctl >/dev/null 2>&1; then
  systemctl reload nginx
else
  service nginx reload
fi

echo "==> Done. Verify: https://pinmoo.top/ai-diagnosis/"
