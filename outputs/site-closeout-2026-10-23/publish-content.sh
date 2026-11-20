#!/usr/bin/env bash
set -Eeuo pipefail
RELEASE="$(realpath "${1:?Verified release directory required}")"
CURRENT=/var/www/pinmoo-current
EXPECTED=/var/www/pinmoo-releases/20261020-identity-4e56d1ac2a
case "$RELEASE" in /var/www/pinmoo-releases/20261023-closeout-0de6e8ca8c) ;; *) exit 1;; esac
[ "$(id -u)" -eq 0 ]
[ -L "$CURRENT" ] && [ "$(readlink "$CURRENT")" = "$EXPECTED" ]
for file in site-build.json index.html ai-context.json pinmoo-profile.json sitemap.xml; do [ -s "$RELEASE/$file" ]; done
openssl x509 -checkend 604800 -noout -in /etc/letsencrypt/live/pinmooconsulting.com-apex/fullchain.pem
nginx -t
BACKUP="/var/backups/pinmoo-primary/$(date +%Y%m%d-%H%M%S)-closeout"
install -d -m 700 "$BACKUP"
printf '%s\n' "$EXPECTED" > "$BACKUP/previous-link"
sha256sum /etc/nginx/sites-enabled/pinmooconsulting.com > "$BACKUP/nginx.sha256"
NEXT="/var/www/pinmoo-current.closeout-$$"
SWITCHED=0
rollback() {
  trap - ERR INT TERM
  set +e
  rm -f "$NEXT"
  if [ "$SWITCHED" = 1 ]; then
    ln -s "$EXPECTED" "$NEXT" && mv -Tf "$NEXT" "$CURRENT"
    nginx -t && systemctl reload nginx
  fi
  echo "Publication failed; previous release retained. Backup: $BACKUP" >&2
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
for route in / /en/ /about/ /services/ /contact/ /en/about/ /en/services/ /en/contact/ /sitemap.xml /robots.txt /ai-context.json /pinmoo-profile.json /llms.txt /llms-full.txt /ai.txt; do
  "${CURL[@]}" "https://pinmooconsulting.com$route" > /dev/null
done
STATUS="$(curl --silent --max-time 20 --resolve pinmooconsulting.com:443:127.0.0.1 -o /dev/null -w '%{http_code}' https://pinmooconsulting.com/closeout-verification-not-a-page/)"
[ "$STATUS" = 404 ]
sha256sum --check "$BACKUP/nginx.sha256"
trap - ERR INT TERM
printf 'Published: %s\nRollback backup: %s\nNginx configuration unchanged.\n' "$RELEASE" "$BACKUP"
