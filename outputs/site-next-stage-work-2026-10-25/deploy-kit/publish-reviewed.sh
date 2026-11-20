#!/usr/bin/env bash
set -Eeuo pipefail
KIT="$(cd "$(dirname "$0")" && pwd)"
ARCHIVE="$KIT/release.tar.gz"
PACKAGE_HASH="${1:?Package hash}"
CONFIG_HASH="${2:?Expected existing config hash}"
VERSION="${3:?Build version}"
[[ "$PACKAGE_HASH" =~ ^[a-f0-9]{64}$ && "$CONFIG_HASH" =~ ^[a-f0-9]{64}$ && "$VERSION" =~ ^[a-f0-9]{10}$ ]]
[ "$(id -u)" -eq 0 ]
CURRENT=/var/www/pinmoo-current
EXPECTED=/var/www/pinmoo-releases/20261024-geo-7458354c1c
RELEASE="/var/www/pinmoo-releases/20261025-next-$VERSION"
CONFIG=/etc/nginx/sites-enabled/pinmooconsulting.com
[ -L "$CURRENT" ] && [ "$(readlink "$CURRENT")" = "$EXPECTED" ]
[ ! -e "$RELEASE" ]
printf '%s  %s\n' "$PACKAGE_HASH" "$ARCHIVE" | sha256sum -c -
printf '%s  %s\n' "$CONFIG_HASH" "$CONFIG" | sha256sum -c -
openssl x509 -checkend 604800 -noout -in /etc/letsencrypt/live/pinmooconsulting.com-apex/fullchain.pem
nginx -t
BACKUP="/var/backups/pinmoo-primary/$(date +%Y%m%d-%H%M%S)-next"
install -d -m 700 "$BACKUP"
printf '%s\n' "$EXPECTED" > "$BACKUP/previous-link"
FILES=("$CONFIG" /etc/nginx/conf.d/pinmoo-events-http.conf /etc/nginx/snippets/pinmoo-events-location.conf /etc/logrotate.d/pinmoo-events)
for i in "${!FILES[@]}"; do cp -p "${FILES[$i]}" "$BACKUP/$i"; done
find /etc/nginx/sites-enabled -maxdepth 1 \( -type l -o -type f \) ! -name pinmooconsulting.com -exec sha256sum {} + > "$BACKUP/other-sites.sha256"
rollback() {
  trap - ERR INT TERM
  set +e
  for i in "${!FILES[@]}"; do cp -p "$BACKUP/$i" "${FILES[$i]}"; done
  NEXT="/var/www/pinmoo-current.restore-$$"
  ln -s "$EXPECTED" "$NEXT" && mv -Tf "$NEXT" "$CURRENT"
  nginx -t && systemctl reload nginx
  echo "Restored previous release and configuration; backup=$BACKUP" >&2
  exit 1
}
trap rollback ERR INT TERM
install -d -m 755 "$RELEASE"
tar -xzf "$ARCHIVE" -C "$RELEASE"
node -e "const x=require('$RELEASE/site-build.json');if(x.version!=='$VERSION'||x.articleCount!==88||x.primaryDomain!=='https://pinmooconsulting.com')process.exit(1)"
install -m 644 "$KIT/primary-next.conf" "$CONFIG"
bash "$KIT/scripts/publish-primary-release.sh" "$RELEASE"
cmp "$KIT/primary-next.conf" "$CONFIG"
sha256sum -c "$BACKUP/other-sites.sha256"
trap - ERR INT TERM
printf 'Published=%s\nPrevious=%s\nOuterBackup=%s\n' "$RELEASE" "$EXPECTED" "$BACKUP"
cat "$RELEASE/site-build.json"
