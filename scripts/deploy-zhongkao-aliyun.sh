#!/usr/bin/env bash
set -euo pipefail

archive_path="${1:?usage: deploy-zhongkao-aliyun.sh <archive.tgz> <version>}"
release_version="${2:?usage: deploy-zhongkao-aliyun.sh <archive.tgz> <version>}"
deploy_root="/var/www/zhongkao.pinmoo.top"
release_dir="$deploy_root/releases/$release_version"
current_link="$deploy_root/current"
public_origin="${ZHONGKAO_PUBLIC_ORIGIN:-https://zhongkao.pinmooconsulting.com}"
healthcheck_origin="${ZHONGKAO_HEALTHCHECK_ORIGIN:-$public_origin}"

case "$release_version" in
  *[!A-Za-z0-9._-]*|'') echo "Invalid release version" >&2; exit 2 ;;
esac

if [ ! -f "$archive_path" ]; then
  echo "Archive not found: $archive_path" >&2
  exit 2
fi

mkdir -p "$deploy_root/releases"
if [ -e "$release_dir" ]; then
  echo "Release already exists: $release_dir" >&2
  exit 2
fi
mkdir "$release_dir"
tar -xzf "$archive_path" -C "$release_dir"

chown -R root:root "$release_dir"
find "$release_dir" -type d -exec chmod 755 {} +
find "$release_dir" -type f -exec chmod 644 {} +

test -f "$release_dir/index.html"
test -f "$release_dir/data/manifest.json"
grep -q "$public_origin/" "$release_dir/index.html"
grep -q '本系统仅供参考' "$release_dir/index.html"

previous_target=""
if [ -L "$current_link" ]; then
  previous_target="$(readlink "$current_link")"
fi
ln -sfn "$release_dir" "$deploy_root/current.next"
mv -Tf "$deploy_root/current.next" "$current_link"

healthcheck_body="$(curl --fail --silent --show-error --max-time 20 "$healthcheck_origin/")"
if ! grep -q '广州中考志愿模拟助手' <<<"$healthcheck_body"; then
  if [ -n "$previous_target" ]; then
    ln -sfn "$previous_target" "$deploy_root/current.rollback"
    mv -Tf "$deploy_root/current.rollback" "$current_link"
  fi
  echo "Live health check failed; previous release restored." >&2
  exit 1
fi

echo "Deployed zhongkao.pinmooconsulting.com release $release_version"
