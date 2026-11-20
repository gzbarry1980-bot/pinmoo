#!/usr/bin/env bash
set -Eeuo pipefail
RELEASE="$(realpath "${1:?Release required}")"
CURRENT=/var/www/pinmoo-current
EXPECTED=/var/www/pinmoo-releases/20261023-closeout-0de6e8ca8c
case "$RELEASE" in /var/www/pinmoo-releases/20261024-human-419102dd02) ;; *) exit 1;; esac
[ "$(id -u)" -eq 0 ]
[ -L "$CURRENT" ] && [ "$(readlink "$CURRENT")" = "$EXPECTED" ]
for file in site-build.json index.html sitemap.xml insights/page/7/index.html; do [ -s "$RELEASE/$file" ]; done
openssl x509 -checkend 604800 -noout -in /etc/letsencrypt/live/pinmooconsulting.com-apex/fullchain.pem
nginx -t
BACKUP="/var/backups/pinmoo-primary/$(date +%Y%m%d-%H%M%S)-human"
install -d -m 700 "$BACKUP"
printf '%s\n' "$EXPECTED" > "$BACKUP/previous-link"
sha256sum /etc/nginx/sites-enabled/pinmooconsulting.com > "$BACKUP/nginx.sha256"
NEXT="/var/www/pinmoo-current.human-$$"
SWITCHED=0
rollback() {
  trap - ERR INT TERM
  set +e
  rm -f "$NEXT"
  if [ "$SWITCHED" = 1 ]; then
    ln -s "$EXPECTED" "$NEXT" && mv -Tf "$NEXT" "$CURRENT"
    nginx -t && systemctl reload nginx
  fi
  echo "Rolled back. Backup: $BACKUP" >&2
  exit 1
}
trap rollback ERR INT TERM
ln -s "$RELEASE" "$NEXT"
mv -Tf "$NEXT" "$CURRENT"
SWITCHED=1
systemctl reload nginx
CURL=(curl --silent --show-error --fail --max-time 20 --resolve pinmooconsulting.com:443:127.0.0.1 -H 'DNT: 1')
READY=0
for attempt in 1 2 3 4 5; do
  if "${CURL[@]}" https://pinmooconsulting.com/site-build.json | cmp - "$RELEASE/site-build.json"; then READY=1; break; fi
  sleep 1
done
[ "$READY" = 1 ]
for route in / /en/ /services/ /about/ /contact/ /en/services/ /en/about/ /en/contact/ /insights/ /insights/page/7/ /insights/topic/ai-geo/ /sitemap.xml; do
  "${CURL[@]}" "https://pinmooconsulting.com$route" > /dev/null
done
STATUS="$(curl --silent --max-time 20 --resolve pinmooconsulting.com:443:127.0.0.1 -o /dev/null -w '%{http_code}' https://pinmooconsulting.com/human-verification-not-a-page/)"
[ "$STATUS" = 404 ]
sha256sum --check "$BACKUP/nginx.sha256"
trap - ERR INT TERM
printf 'Published: %s\nBackup: %s\n' "$RELEASE" "$BACKUP"
