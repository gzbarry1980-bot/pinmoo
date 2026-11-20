#!/usr/bin/env bash
set -Eeuo pipefail
CURRENT=/var/www/pinmoo-current
PREVIOUS=/var/www/pinmoo-releases/20261025-next-6a64630a41
RELEASE=/var/www/pinmoo-releases/20261028-editorial-f9a4d54cc9
ARCHIVE=/tmp/pinmoo-editorial-20261028-f9a4d54cc9/release.tar.gz
[[ "$(readlink "$CURRENT")" = "$PREVIOUS" ]]
[[ "$(git -C /var/www/pinmoo.top rev-parse HEAD)" = b8242a2ce4c1c37d6da7c67592282f62400ada1a ]]
[[ -z "$(git -C /var/www/pinmoo.top status --porcelain)" ]]
[[ ! -e "$RELEASE" ]]
printf '%s  %s\n' 7f03f6a9e263009b8d4653c64afb1b14b913624bed63191769da88ef8326ab1b "$ARCHIVE" | sha256sum -c -
install -d -m 755 "$RELEASE"
tar -xzf "$ARCHIVE" -C "$RELEASE"
node -e "const x=require('$RELEASE/site-build.json'); if(x.version!=='f9a4d54cc9'||x.articleCount!==88||x.primaryDomain!=='https://pinmooconsulting.com')process.exit(1)"
bash /var/www/pinmoo.top/scripts/publish-primary-release.sh "$RELEASE"
printf 'Previous: %s\n' "$PREVIOUS"
