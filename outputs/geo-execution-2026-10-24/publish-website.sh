#!/usr/bin/env bash
set -Eeuo pipefail
ARCHIVE=/tmp/pinmoo-geo-20261024-7458354c1c.tar.gz
RELEASE=/var/www/pinmoo-releases/20261024-geo-7458354c1c
CURRENT=/var/www/pinmoo-current
EXPECTED=/var/www/pinmoo-releases/20261024-human-419102dd02
[ "$(id -u)" -eq 0 ]
[ -L "$CURRENT" ] && [ "$(readlink "$CURRENT")" = "$EXPECTED" ]
[ ! -e "$RELEASE" ]
printf '%s\n' 'fd7a4b72411137452f05c4cad7bb76b33939cbb86a7cd589a928efd8fd9d5c64  /tmp/pinmoo-geo-20261024-7458354c1c.tar.gz' | sha256sum -c -
install -d -m 755 "$RELEASE"
tar -xzf "$ARCHIVE" -C "$RELEASE"
node -e "const x=require('$RELEASE/site-build.json');if(x.version!=='7458354c1c'||x.articleCount!==84||x.primaryDomain!=='https://pinmooconsulting.com')process.exit(1)"
for file in index.html sitemap.xml robots.txt insights/page/7/index.html insights/pinmoo-quarterly-review-resource-decisions/index.html insights/product-bundle-contribution-cost-review/index.html; do
  [ -s "$RELEASE/$file" ]
done
openssl x509 -checkend 604800 -noout -in /etc/letsencrypt/live/pinmooconsulting.com-apex/fullchain.pem
nginx -t
BACKUP="/var/backups/pinmoo-primary/$(date +%Y%m%d-%H%M%S)-geo"
install -d -m 700 "$BACKUP"
printf '%s\n' "$EXPECTED" > "$BACKUP/previous-link"
sha256sum /etc/nginx/sites-enabled/pinmooconsulting.com > "$BACKUP/nginx.sha256"
NEXT=/var/www/pinmoo-current.geo-$$
SWITCHED=0
rollback() {
  trap - ERR INT TERM
  set +e
  rm -f "$NEXT"
  if [ "$SWITCHED" = 1 ]; then
    ln -s "$EXPECTED" "$NEXT" && mv -Tf "$NEXT" "$CURRENT"
    nginx -t && systemctl reload nginx
  fi
  echo "Rolled back; backup=$BACKUP" >&2
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
for route in / /services/ /about/ /en/ /insights/ /insights/page/7/ /insights/pinmoo-quarterly-review-resource-decisions/ /insights/pinmoo-diagnosis-data-minimization/ /insights/ecommerce-consulting-procurement-brief/ /insights/ecommerce-project-acceptance-beyond-gmv/ /insights/tmall-jd-same-product-conversion-diagnosis/ /insights/traditional-brand-first-ecommerce-channel-products/ /insights/product-bundle-contribution-cost-review/ /insights/customer-language-to-article-keywords/ /insights/what-is-pinmoo-consulting/ /insights/ecommerce-consulting-pricing-factors/ /insights/guangzhou-ecommerce-consulting-selection/ /insights/ecommerce-consulting-vs-operation-coaching-vs-agency/ /insights/sku-choice-overload-and-product-differences/ /sitemap.xml; do
  "${CURL[@]}" "https://pinmooconsulting.com$route" > /dev/null
  sleep 0.4
done
STATUS="$(curl --silent --max-time 20 --resolve pinmooconsulting.com:443:127.0.0.1 -o /dev/null -w '%{http_code}' https://pinmooconsulting.com/geo-batch-not-a-page/)"
[ "$STATUS" = 404 ]
sha256sum --check "$BACKUP/nginx.sha256"
trap - ERR INT TERM
printf 'Published: %s\nBackup: %s\nPrevious: %s\n' "$RELEASE" "$BACKUP" "$EXPECTED"
cat "$RELEASE/site-build.json"
