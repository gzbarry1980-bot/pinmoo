#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/pinmoo.top}"
SOURCE_CONFIG="$APP_DIR/deploy/nginx/pinmoo.top.redirect.conf"
ENABLED_CONFIG="${ENABLED_CONFIG:-/etc/nginx/sites-enabled/pinmoo.top}"
AVAILABLE_CONFIG="${AVAILABLE_CONFIG:-/etc/nginx/sites-available/pinmoo.top}"
BACKUP_DIR="/var/backups/pinmoo-nginx"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this installer as root (or through sudo)." >&2
  exit 1
fi

if [ ! -f "$SOURCE_CONFIG" ]; then
  echo "Missing redirect configuration: $SOURCE_CONFIG" >&2
  exit 1
fi

target_config="$AVAILABLE_CONFIG"
if [ -e "$ENABLED_CONFIG" ] || [ -L "$ENABLED_CONFIG" ]; then
  target_config="$(readlink -f "$ENABLED_CONFIG")"
fi

install -d -m 700 "$BACKUP_DIR"

agent_config_found=0
for candidate in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
  [ -e "$candidate" ] || continue
  candidate_real="$(readlink -f "$candidate")"
  if [ "$candidate_real" != "$target_config" ] && grep -Eq 'server_name[^;]*agent\.pinmoo\.top' "$candidate"; then
    agent_config_found=1
    break
  fi
done

if [ "$agent_config_found" -ne 1 ]; then
  echo "Refusing to replace the legacy-domain config: agent.pinmoo.top is not configured in a separate Nginx file." >&2
  exit 1
fi

timestamp="$(date +%Y%m%d-%H%M%S)"
backup="$BACKUP_DIR/pinmoo.top-${timestamp}.conf"
if [ -f "$target_config" ]; then
  cp -a "$target_config" "$backup"
  echo "Backed up Nginx config to $backup"
fi

disabled_sources=()
disabled_targets=()
for candidate in /etc/nginx/sites-enabled/*; do
  [ -e "$candidate" ] || continue
  [ "$candidate" = "$ENABLED_CONFIG" ] && continue
  if ! grep -Eq 'server_name[[:space:]]+([^;]*[[:space:]])?(www\.)?pinmoo\.top([[:space:];]|$)' "$candidate"; then
    continue
  fi

  case "$(basename "$candidate")" in
    pinmoo.top.backup*|pinmoo.top.bak*|pinmoo.top.old*)
      disabled="$BACKUP_DIR/disabled-${timestamp}-$(basename "$candidate")"
      mv "$candidate" "$disabled"
      disabled_sources+=("$candidate")
      disabled_targets+=("$disabled")
      echo "Disabled stale Nginx backup: $candidate"
      ;;
    *)
      echo "Refusing to continue: another active Nginx file also declares pinmoo.top: $candidate" >&2
      echo "Review it with: bash $APP_DIR/scripts/audit-nginx-domain-conflicts.sh pinmoo.top" >&2
      exit 1
      ;;
  esac
done

rollback() {
  if [ -f "$backup" ]; then
    cp -a "$backup" "$target_config"
    nginx -t || true
  fi
  for index in "${!disabled_sources[@]}"; do
    if [ -e "${disabled_targets[$index]}" ]; then
      mv "${disabled_targets[$index]}" "${disabled_sources[$index]}"
    fi
  done
}
trap rollback ERR

install -d -m 755 "$(dirname "$target_config")" /etc/nginx/sites-enabled
install -m 644 "$SOURCE_CONFIG" "$target_config"
if [ ! -e "$ENABLED_CONFIG" ] && [ ! -L "$ENABLED_CONFIG" ]; then
  ln -s "$target_config" "$ENABLED_CONFIG"
fi

nginx -t
if command -v systemctl >/dev/null 2>&1; then
  systemctl reload nginx
else
  service nginx reload
fi

trap - ERR
echo "pinmoo.top now redirects page by page to pinmooconsulting.com; agent.pinmoo.top remains independent."
