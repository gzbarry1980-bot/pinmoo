#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="${LOG_DIR:-/var/log/nginx}"
PATTERN='OAI-SearchBot|ChatGPT-User|GPTBot|Claude-SearchBot|Claude-User|ClaudeBot|PerplexityBot|Perplexity-User|Bytespider|Baiduspider-render|Baiduspider|PetalBot|Applebot|Amazonbot|CCBot|Google-Extended|bingbot|Googlebot|360Spider|Sogou'
TMP_FILE="$(mktemp /tmp/pinmoo-crawlers.XXXXXX)"

cleanup() {
  rm -f "$TMP_FILE"
}
trap cleanup EXIT

echo "Generated at: $(date -Is)"
echo "Log directory: $LOG_DIR"
echo

shopt -s nullglob
files=("$LOG_DIR"/access.log "$LOG_DIR"/access.log.* "$LOG_DIR"/*access*.log "$LOG_DIR"/*access*.log.*)
declare -A seen_files=()

if [ "${#files[@]}" -eq 0 ]; then
  echo "No nginx access logs found under $LOG_DIR"
  exit 1
fi

for file in "${files[@]}"; do
  [ -f "$file" ] || continue
  [ -n "${seen_files[$file]:-}" ] && continue
  seen_files[$file]=1
  case "$file" in
    *.gz) gzip -cd -- "$file" 2>/dev/null || true ;;
    *) cat -- "$file" 2>/dev/null || true ;;
  esac
done | grep -Ei "$PATTERN" > "$TMP_FILE" || true

echo "== AI and search crawler counts =="
if [ ! -s "$TMP_FILE" ]; then
  echo "No matching crawler visits were found in the retained nginx logs."
  exit 0
fi

grep -oEi "$PATTERN" "$TMP_FILE" | tr '[:upper:]' '[:lower:]' | sort | uniq -c | sort -nr

echo
echo "== Most requested paths =="
awk '{print $7}' "$TMP_FILE" | sort | uniq -c | sort -nr | head -n 30

echo
echo "Total matching requests: $(wc -l < "$TMP_FILE")"

echo
echo "== Most recent 50 matching requests =="
tail -n 50 "$TMP_FILE"
