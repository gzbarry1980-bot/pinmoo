#!/usr/bin/env bash
# 安装真实微信支付凭证并重启支付服务。
# 用法：
#   1) 准备输入文件（key=value，见 zhongkao-pay.env.template）
#   2) bash install-wxpay-env.sh [输入文件路径，默认 /root/wxpay-secrets.env]
# 输出同时写入 /tmp/wxpay-install.log
set -uo pipefail

SRC="${1:-/root/wxpay-secrets.env}"
DIR=/etc/zhongkao-pay
UNIT=/etc/systemd/system/zhongkao-pay.service
APP=/opt/zhongkao-pay-server
LOG=/tmp/wxpay-install.log
: > "$LOG"

log() { echo "$*" | tee -a "$LOG"; }
fail() { echo "FAIL: $*" | tee -a "$LOG"; exit 1; }

log "=== 微信支付凭证安装 ==="
log "输入文件: $SRC"

[ -f "$SRC" ] || fail "输入文件不存在: $SRC"

mkdir -p "$DIR"
chmod 700 "$DIR"
cp "$SRC" "$DIR/env.raw"
chmod 600 "$DIR/env.raw"

# 解析出各字段（去掉可能的引号与行尾 CR）
get() {
  sed -n "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" "$DIR/env.raw" | tail -1 \
    | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

APPID=$(get WX_APPID)
APPSECRET=$(get WX_APPSECRET)
MCHID=$(get WX_MCHID)
SERIAL=$(get WX_MCH_SERIAL)
KEY_SRC=$(get WX_MCH_PRIVATE_KEY)
V3KEY=$(get WX_API_V3_KEY)
PUB_SRC=$(get WX_PLATFORM_PUBLIC_KEY)

log "appid=${APPID:-<空>}  mchid=${MCHID:-<空>}  serial=${SERIAL:-<空>}"
log "私钥源=${KEY_SRC:-<空>}  平台公钥源=${PUB_SRC:-<空>}"
log "appsecret长度=${#APPSECRET}  apiv3key长度=${#V3KEY}"

# 空值检查
missing=()
[ -n "$APPID" ]      || missing+=("WX_APPID")
[ -n "$APPSECRET" ]  || missing+=("WX_APPSECRET")
[ -n "$MCHID" ]      || missing+=("WX_MCHID")
[ -n "$SERIAL" ]     || missing+=("WX_MCH_SERIAL")
[ -n "$KEY_SRC" ]    || missing+=("WX_MCH_PRIVATE_KEY")
[ -n "$V3KEY" ]      || missing+=("WX_API_V3_KEY")
[ -n "$PUB_SRC" ]    || missing+=("WX_PLATFORM_PUBLIC_KEY")
if [ ${#missing[@]} -gt 0 ]; then
  fail "缺少必填项: ${missing[*]}"
fi

# 安装密钥文件（复制为固定路径，避免指向临时目录）
[ -f "$KEY_SRC" ] || fail "商户私钥文件不存在: $KEY_SRC"
[ -f "$PUB_SRC" ] || fail "平台公钥文件不存在: $PUB_SRC"
install -m 600 "$KEY_SRC" "$DIR/apiclient_key.pem"
install -m 644 "$PUB_SRC" "$DIR/wechatpay_platform_pubkey.pem"
log "密钥文件已安装: $DIR/apiclient_key.pem (600), $DIR/wechatpay_platform_pubkey.pem (644)"

# 生成最终 env：密钥路径改写为固定路径，其余沿用
{
  echo "# 由 install-wxpay-env.sh 生成于 $(date '+%Y-%m-%d %H:%M:%S') — 权限 600，禁止进 Git"
  echo "WX_APPID=$APPID"
  echo "WX_APPSECRET=$APPSECRET"
  echo "WX_MCHID=$MCHID"
  echo "WX_MCH_SERIAL=$SERIAL"
  echo "WX_MCH_PRIVATE_KEY=$DIR/apiclient_key.pem"
  echo "WX_API_V3_KEY=$V3KEY"
  echo "WX_PLATFORM_PUBLIC_KEY=$DIR/wechatpay_platform_pubkey.pem"
  # 其余业务参数从输入继承（有则保留，无则用默认值）
  for k in PUBLIC_BASE_URL PAY_PRICE_FEN PAY_PRODUCT_NAME TOKEN_TTL_DAYS WEB_SESSION_TTL_DAYS COOKIE_SECURE SESSION_CODE_TTL_SEC DEMO_ENABLED SERIAL_BACKEND_URL; do
    v=$(get "$k")
    [ -n "$v" ] && echo "$k=$v"
  done
} > "$DIR/env"
chmod 600 "$DIR/env"
rm -f "$DIR/env.raw"
log "env 已写入 $DIR/env (600)"

# 安装 systemd unit（带 EnvironmentFile）
if [ -f "$APP/deploy/zhongkao-pay.service" ]; then
  install -m 644 "$APP/deploy/zhongkao-pay.service" "$UNIT"
  log "systemd unit 已更新（EnvironmentFile=-$DIR/env）"
else
  log "WARN: 未找到 $APP/deploy/zhongkao-pay.service，跳过 unit 更新"
fi

systemctl daemon-reload
systemctl restart zhongkao-pay
sleep 2
log "=== 服务状态 ==="
systemctl is-active zhongkao-pay | tee -a "$LOG"
log "=== healthz ==="
curl -s -m 5 http://127.0.0.1:8799/healthz | tee -a "$LOG"
echo | tee -a "$LOG"

log "=== 配置自检 ==="
cd "$APP" && node scripts/check-wxpay-config.cjs 2>&1 | tee -a "$LOG"
CHECK_EXIT=${PIPESTATUS[0]}
log "CHECK_EXIT=$CHECK_EXIT"

log "=== DONE ==="
exit "$CHECK_EXIT"
