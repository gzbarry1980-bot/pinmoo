#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-pinmoo.top}"
TMP_FILE="$(mktemp /tmp/pinmoo-nginx-audit.XXXXXX)"
trap 'rm -f "$TMP_FILE"' EXIT

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root so nginx can read every included configuration file."
  exit 1
fi

nginx -T >"$TMP_FILE" 2>&1

echo "== Nginx files that mention $DOMAIN =="
awk -v domain="$DOMAIN" '
  /^# configuration file / { file=$4; sub(/:$/, "", file) }
  $0 ~ "server_name" && $0 ~ domain { print file "\n  " $0 }
' "$TMP_FILE"

echo
echo "== Effective warnings =="
grep -F 'conflicting server name' "$TMP_FILE" || echo "No conflicting server_name warnings."

echo
echo "Read-only audit complete. Review every listed file before disabling it."
