#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/pinmoo.top}"
SITE_CONFIG="${SITE_CONFIG:-/etc/nginx/sites-enabled/pinmoo.top}"
CONF_D_TARGET="/etc/nginx/conf.d/00-pinmoo-rate-limit-zones.conf"
HEADERS_TARGET="/etc/nginx/snippets/pinmoo-security-headers.conf"
PROTECTION_TARGET="/etc/nginx/snippets/pinmoo-server-protection.conf"
PERFORMANCE_TARGET="/etc/nginx/snippets/pinmoo-performance.conf"
BACKUP_DIR="$(mktemp -d /tmp/pinmoo-nginx-backup.XXXXXX)"
INSTALLED=()

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script as root, for example from Alibaba Cloud Command Assistant."
  exit 1
fi

for source in \
  "$APP_DIR/deploy/nginx/pinmoo-rate-limit-zones.conf" \
  "$APP_DIR/deploy/nginx/pinmoo-security-headers.conf" \
  "$APP_DIR/deploy/nginx/pinmoo-server-protection.conf" \
  "$APP_DIR/deploy/nginx/pinmoo-performance.conf" \
  "$SITE_CONFIG"; do
  if [ ! -f "$source" ]; then
    echo "Missing required file: $source"
    exit 1
  fi
done

backup_target() {
  local target="$1"
  local name
  name="$(echo "$target" | sed 's#^/##; s#/#__#g')"
  if [ -f "$target" ]; then
    cp -a "$target" "$BACKUP_DIR/$name"
  else
    : > "$BACKUP_DIR/$name.absent"
  fi
  INSTALLED+=("$target")
}

restore_previous() {
  local target name
  echo "Protection install failed. Restoring the previous nginx configuration."
  for target in "${INSTALLED[@]}"; do
    name="$(echo "$target" | sed 's#^/##; s#/#__#g')"
    if [ -f "$BACKUP_DIR/$name" ]; then
      cp -a "$BACKUP_DIR/$name" "$target"
    elif [ -f "$BACKUP_DIR/$name.absent" ]; then
      rm -f "$target"
    fi
  done
  nginx -t && systemctl reload nginx || true
}

trap restore_previous ERR

install -d -m 755 /etc/nginx/conf.d /etc/nginx/snippets

for target in "$CONF_D_TARGET" "$HEADERS_TARGET" "$PROTECTION_TARGET" "$PERFORMANCE_TARGET" "$SITE_CONFIG"; do
  backup_target "$target"
done

install -m 644 "$APP_DIR/deploy/nginx/pinmoo-rate-limit-zones.conf" "$CONF_D_TARGET"
install -m 644 "$APP_DIR/deploy/nginx/pinmoo-security-headers.conf" "$HEADERS_TARGET"
install -m 644 "$APP_DIR/deploy/nginx/pinmoo-server-protection.conf" "$PROTECTION_TARGET"
install -m 644 "$APP_DIR/deploy/nginx/pinmoo-performance.conf" "$PERFORMANCE_TARGET"

python3 - "$SITE_CONFIG" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()

security_include = "include /etc/nginx/snippets/pinmoo-security-headers.conf;"
protection_include = "include /etc/nginx/snippets/pinmoo-server-protection.conf;"
performance_include = "include /etc/nginx/snippets/pinmoo-performance.conf;"

if security_include not in text:
    anchor = "index index.html;"
    if anchor not in text:
        raise SystemExit("Could not find the site index directive")
    text = text.replace(anchor, f"{anchor}\n\n    {security_include}", 1)

if protection_include not in text:
    text = text.replace(
        security_include,
        f"{security_include}\n    {protection_include}",
        1,
    )

if performance_include not in text:
    text = text.replace(
        protection_include,
        f"{protection_include}\n    {performance_include}",
        1,
    )

if "limit_except GET" not in text:
    anchor = "try_files $uri $uri/ =404;"
    if anchor not in text:
        raise SystemExit("Could not find the hardened try_files directive")
    text = text.replace(
        anchor,
        f"{anchor}\n        limit_except GET {{\n            deny all;\n        }}",
        1,
    )

path.write_text(text)
PY

nginx -t
systemctl reload nginx

trap - ERR
echo "Nginx request limiting and connection protection are active."
echo "Backup retained at: $BACKUP_DIR"

cd "$APP_DIR"
node scripts/verify-domain-strategy.mjs
