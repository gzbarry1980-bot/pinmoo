#!/usr/bin/env bash
set -euo pipefail

archive_path="${1:?usage: deploy-zhongkao-access.sh <archive.tgz> <version>}"
release_version="${2:?usage: deploy-zhongkao-access.sh <archive.tgz> <version>}"
deploy_root="/opt/zhongkao-access"
release_dir="$deploy_root/releases/$release_version"
current_link="$deploy_root/current"

case "$release_version" in
  *[!A-Za-z0-9._-]*|'') echo "Invalid release version" >&2; exit 2 ;;
esac

test -f "$archive_path"
mkdir -p "$deploy_root/releases" /var/lib/zhongkao-access
test ! -e "$release_dir"
mkdir "$release_dir"
tar -xzf "$archive_path" -C "$release_dir"
test -f "$release_dir/server.mjs"
test -f "$release_dir/config.mjs"
test -f "$release_dir/db.mjs"

previous_target=""
if [ -L "$current_link" ]; then previous_target="$(readlink "$current_link")"; fi
ln -sfn "$release_dir" "$deploy_root/current.next"
mv -Tf "$deploy_root/current.next" "$current_link"
chown -R root:root "$release_dir"
chmod -R go-w "$release_dir"
chown -R www-data:www-data /var/lib/zhongkao-access
chmod 700 /var/lib/zhongkao-access

systemctl restart zhongkao-access.service
healthy=false
for _attempt in $(seq 1 15); do
  if curl --fail --silent --max-time 2 http://127.0.0.1:8787/api/access/health | grep -q '"ok":true'; then
    healthy=true
    break
  fi
  sleep 1
done
if [ "$healthy" != true ]; then
  if [ -n "$previous_target" ]; then
    ln -sfn "$previous_target" "$deploy_root/current.rollback"
    mv -Tf "$deploy_root/current.rollback" "$current_link"
    systemctl restart zhongkao-access.service
  fi
  echo "Access service health check failed; previous release restored." >&2
  exit 1
fi

echo "Deployed zhongkao-access release $release_version"
