#!/usr/bin/env bash
set -Eeuo pipefail
cd /var/www/pinmoo.top
EXPECTED=663d0a97e0c3353297b665c4ea0e1d6b7e365e0d
[ "$(git branch --show-current)" = main ]
[ -z "$(git status --porcelain)" ] || { echo 'Server source has local changes; stopped.' >&2; exit 1; }
git fetch origin main
git cat-file -e "$EXPECTED^{commit}"
git merge-base --is-ancestor "$EXPECTED" origin/main
git merge --ff-only "$EXPECTED"
[ "$(git rev-parse HEAD)" = "$EXPECTED" ]
[ -z "$(git status --porcelain)" ]
printf 'Source synchronized: %s\n' "$(git rev-parse HEAD)"
