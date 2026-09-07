#!/usr/bin/env bash
set -Eeuo pipefail
RELEASE="$(realpath "${1:?Pass a verified release directory}")"
KIT="$(cd "$(dirname "$0")/.." && pwd)"
CURRENT=/var/www/pinmoo-current
CONFIG=/etc/nginx/sites-enabled/pinmooconsulting.com
BACKUP="/var/backups/pinmoo-primary/$(date +%Y%m%d-%H%M%S)-$$"
case "$RELEASE" in /var/www/pinmoo-releases/*) ;; *) echo 'Release path outside allowed directory' >&2; exit 1;; esac
[ "$(id -u)" -eq 0 ] || { echo 'Run as root' >&2; exit 1; }
for file in index.html sitemap.xml site-build.json .deploy/events-http.conf; do [ -s "$RELEASE/$file" ]; done
openssl x509 -checkend 604800 -noout -in /etc/letsencrypt/live/pinmooconsulting.com-apex/fullchain.pem
nginx -t
if [ -e "$CURRENT" ] && [ ! -L "$CURRENT" ]; then echo 'Current path is not a symlink' >&2; exit 1; fi
install -d -m 700 "$BACKUP"
install -d -m 750 -o www-data -g adm /var/log/pinmoo-events
OLD_LINK="$(readlink "$CURRENT" || true)"
FILES=("$CONFIG" /etc/nginx/conf.d/pinmoo-events-http.conf /etc/nginx/snippets/pinmoo-events-location.conf /etc/logrotate.d/pinmoo-events)
for i in "${!FILES[@]}"; do
  if [ -e "${FILES[$i]}" ]; then cp -p "${FILES[$i]}" "$BACKUP/$i"; fi
done
printf '%s\n' "$OLD_LINK" > "$BACKUP/previous-link"
rollback() {
  trap - ERR INT TERM
  set +e
  for i in "${!FILES[@]}"; do
    if [ -f "$BACKUP/$i" ]; then cp -p "$BACKUP/$i" "${FILES[$i]}"; else rm -f "${FILES[$i]}"; fi
  done
  rm -f "$CURRENT.next"
  if [ -n "$OLD_LINK" ]; then ln -s "$OLD_LINK" "$CURRENT.next" && mv -Tf "$CURRENT.next" "$CURRENT"; else rm -f "$CURRENT"; fi
  nginx -t && systemctl reload nginx
  echo "Publication failed; restored previous configuration. Backup: $BACKUP" >&2
  exit 1
}
trap rollback ERR INT TERM
install -m 644 "$RELEASE/.deploy/events-http.conf" /etc/nginx/conf.d/pinmoo-events-http.conf
install -m 644 "$KIT/deploy/nginx/pinmoo-events-location.conf" /etc/nginx/snippets/pinmoo-events-location.conf
install -m 644 "$KIT/deploy/pinmoo-events.logrotate" /etc/logrotate.d/pinmoo-events
install -m 644 "$KIT/deploy/nginx/pinmooconsulting.com.conf.example" "$CONFIG"
ln -s "$RELEASE" "$CURRENT.next"
mv -Tf "$CURRENT.next" "$CURRENT"
nginx -t
systemctl reload nginx
CURL=(curl --silent --show-error --fail --max-time 20 --resolve pinmooconsulting.com:443:127.0.0.1)
# A graceful reload can briefly serve the previous worker's release.
READY=0
for attempt in 1 2 3 4 5; do
  if "${CURL[@]}" https://pinmooconsulting.com/site-build.json | cmp - "$RELEASE/site-build.json"; then READY=1; break; fi
  sleep 1
done
[ "$READY" = 1 ]
for route in / /services/ /services/geo-consulting/ /contact/ /en/ /insights/geo-seo-paid-media-coordination/ /sitemap.xml /robots.txt; do
  "${CURL[@]}" "https://pinmooconsulting.com$route" > /dev/null
done
STATUS="$(curl --silent --max-time 20 --resolve pinmooconsulting.com:443:127.0.0.1 -o /dev/null -w '%{http_code}' https://pinmooconsulting.com/not-a-pinmoo-page-404/)"
[ "$STATUS" = 404 ]
STATUS="$("${CURL[@]}" -H 'DNT: 1' -o /dev/null -w '%{http_code}' 'https://pinmooconsulting.com/_events?event=page_view&page=home&placement=body')"
[ "$STATUS" = 204 ]
trap - ERR INT TERM
printf 'Published: %s\nRollback backup: %s\n' "$RELEASE" "$BACKUP"
