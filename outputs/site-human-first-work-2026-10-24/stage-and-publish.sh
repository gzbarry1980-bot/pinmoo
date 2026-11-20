#!/usr/bin/env bash
set -Eeuo pipefail
cd /tmp
printf '%s\n' '8e8b4b47034750bbcb31c56a069c9bbdb45784a3a61f86b5d8099175e7720517  release.tar.gz' | sha256sum -c -
SOURCE=/var/www/pinmoo.top
[ -z "$(git -C "$SOURCE" status --porcelain)" ]
git -C "$SOURCE" pull --ff-only origin main
[ "$(git -C "$SOURCE" rev-parse --short HEAD)" = 962cb09 ]
RELEASE=/var/www/pinmoo-releases/20261024-human-419102dd02
[ ! -e "$RELEASE" ]
install -d -m 755 "$RELEASE"
tar -xzf /tmp/release.tar.gz -C "$RELEASE"
node -e "const x=require('$RELEASE/site-build.json'); if(x.version!=='419102dd02'||x.articleCount!==76)process.exit(1)"
bash /tmp/publish-content.sh "$RELEASE"
