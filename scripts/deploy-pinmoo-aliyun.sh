#!/usr/bin/env bash
set -Eeuo pipefail
APP_DIR="${APP_DIR:-/var/www/pinmoo.top}"
export SITE_ORIGIN=https://pinmooconsulting.com
cd "$APP_DIR"
[ "$(id -u)" -eq 0 ] || { echo 'Run with sudo or as root' >&2; exit 1; }
if [ "${PINMOO_SKIP_PULL:-0}" != 1 ]; then
  BEFORE="$(sha256sum scripts/deploy-pinmoo-aliyun.sh)"
  git pull --ff-only origin main
  if [ "$BEFORE" != "$(sha256sum scripts/deploy-pinmoo-aliyun.sh)" ]; then
    exec env PINMOO_SKIP_PULL=1 APP_DIR="$APP_DIR" bash scripts/deploy-pinmoo-aliyun.sh
  fi
fi
# Build separately from the live root, retaining failed builds for inspection.
install -d /var/www/pinmoo-builds /var/www/pinmoo-releases
BUILD="$(mktemp -d /var/www/pinmoo-builds/build-XXXXXXXX)"
tar --exclude=.git --exclude=node_modules --exclude=dist --exclude='.tmp-*' --exclude=output --exclude=.qa -cf - . | tar -xf - -C "$BUILD"
cd "$BUILD"
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm run verify
npm run verify:content
npm run verify:international
node --test scripts/test-site-events.mjs
RELEASE="/var/www/pinmoo-releases/$(date +%Y%m%d-%H%M%S)-$(basename "$BUILD")"
mv "$BUILD/dist" "$RELEASE"
bash scripts/publish-primary-release.sh "$RELEASE"
node scripts/verify-live.mjs https://pinmooconsulting.com
echo 'Main site published. Netlify, DNS and tool subdomains were not changed.'
