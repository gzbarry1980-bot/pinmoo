#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/pinmoo.top}"
REPORT_DIR="${REPORT_DIR:-/var/log/pinmoo-crawlers}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root, for example from Alibaba Cloud Command Assistant."
  exit 1
fi

install -d -m 750 "$REPORT_DIR"

cat > /etc/systemd/system/pinmoo-crawler-report.service <<EOF
[Unit]
Description=Generate Pinmoo AI crawler report
After=nginx.service

[Service]
Type=oneshot
ExecStart=/bin/bash -c '$APP_DIR/scripts/report-ai-crawlers.sh > $REPORT_DIR/latest.txt.tmp && mv $REPORT_DIR/latest.txt.tmp $REPORT_DIR/latest.txt && cp $REPORT_DIR/latest.txt $REPORT_DIR/report-\$(date +%%F).txt'
EOF

cat > /etc/systemd/system/pinmoo-crawler-report.timer <<'EOF'
[Unit]
Description=Run Pinmoo AI crawler report every Monday

[Timer]
OnCalendar=Mon *-*-* 08:10:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now pinmoo-crawler-report.timer
systemctl start pinmoo-crawler-report.service

echo "Crawler monitoring installed."
systemctl list-timers pinmoo-crawler-report.timer --no-pager
echo "Latest report: $REPORT_DIR/latest.txt"
