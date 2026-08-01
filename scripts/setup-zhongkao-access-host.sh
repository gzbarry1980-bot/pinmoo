#!/usr/bin/env bash
set -euo pipefail

unit_source="${1:?usage: setup-zhongkao-access-host.sh <systemd-unit-file>}"
backup_unit_source="${2:-}"
backup_timer_source="${3:-}"
environment_file="/etc/zhongkao-access.env"

test -f "$unit_source"

if [ ! -f "$environment_file" ]; then
  session_secret="$(openssl rand -hex 32)"
  identity_pepper="$(openssl rand -hex 32)"
  temporary_file="$(mktemp /etc/zhongkao-access.env.XXXXXX)"
  chmod 600 "$temporary_file"
  {
    printf '%s\n' 'NODE_ENV=production'
    printf '%s\n' 'HOST=127.0.0.1'
    printf '%s\n' 'PORT=8787'
    printf '%s\n' 'PUBLIC_ORIGIN=https://zhongkao.pinmooconsulting.com'
    printf '%s\n' 'ALLOWED_ORIGINS=https://zhongkao.pinmooconsulting.com'
    printf '%s\n' 'DB_PATH=/var/lib/zhongkao-access/access.sqlite'
    printf '%s\n' 'ACCESS_MODE=preview'
    printf '%s\n' 'OTP_PROVIDER=disabled'
    printf '%s\n' 'PAYMENT_PROVIDER=disabled'
    printf '%s\n' 'ZHONGKAO_PRICE_FEN=999'
    printf '%s\n' 'ZHONGKAO_PRODUCT_CODE=guangzhou-zhongkao-lifetime'
    printf '%s\n' 'SESSION_DAYS=30'
    printf '%s\n' 'COOKIE_SECURE=true'
    printf '%s\n' 'TRUST_PROXY=true'
    printf 'SESSION_SECRET=%s\n' "$session_secret"
    printf 'IDENTITY_PEPPER=%s\n' "$identity_pepper"
  } > "$temporary_file"
  install -o root -g root -m 600 "$temporary_file" "$environment_file"
  rm -f "$temporary_file"
fi

install -o root -g root -m 644 "$unit_source" /etc/systemd/system/zhongkao-access.service
if [ -n "$backup_unit_source" ] || [ -n "$backup_timer_source" ]; then
  test -f "$backup_unit_source"
  test -f "$backup_timer_source"
  install -d -o www-data -g www-data -m 700 /var/backups/zhongkao-access
  install -o root -g root -m 644 "$backup_unit_source" /etc/systemd/system/zhongkao-access-backup.service
  install -o root -g root -m 644 "$backup_timer_source" /etc/systemd/system/zhongkao-access-backup.timer
fi
systemctl daemon-reload
systemctl enable zhongkao-access.service >/dev/null
if [ -n "$backup_unit_source" ]; then
  systemctl enable zhongkao-access-backup.timer >/dev/null
fi

echo 'Zhongkao access host configuration installed in preview mode.'
