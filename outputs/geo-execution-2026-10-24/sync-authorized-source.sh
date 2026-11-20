#!/usr/bin/env bash
set -Eeuo pipefail
SOURCE=/var/www/pinmoo.top
EXPECTED=f11e7430957b92112d80d8780eaaf855d0a118ac
[ -z "$(git -C "$SOURCE" status --porcelain)" ]
[ "$(readlink /var/www/pinmoo-current)" = /var/www/pinmoo-releases/20261024-geo-7458354c1c ]
git -C "$SOURCE" pull --ff-only origin main
[ "$(git -C "$SOURCE" rev-parse HEAD)" = "$EXPECTED" ]
node --input-type=module -e "const {insights}=await import('/var/www/pinmoo.top/src/data/insights.js'); if(insights.length!==84)process.exit(1);console.log(JSON.stringify({sourceArticles:insights.length}));"
git -C "$SOURCE" show --format=fuller --stat HEAD
git -C "$SOURCE" status --porcelain
curl --silent --show-error --fail --max-time 20 -H 'DNT: 1' https://pinmooconsulting.com/site-build.json
