# 广州中考志愿模拟系统 — 长期项目笔记

## 部署架构（务必牢记）
- 生产机：阿里云广州 8.138.23.88，SSH 密钥 `C:/Users/Administrator/.ssh/pinmoo_aliyun_deploy`
- 域名关系：`.top` 仅做 301 跳板 → `.com`；**`.com` 的 nginx root 直接指向 `.top` 的 `current` 软链**（`/var/www/zhongkao.pinmoo.top/current`）。两个域名共用同一份代码，升级只需切 `.top` 的 `current`。
- 站点根：`/var/www/zhongkao.pinmoo.top/`（含 `releases/` 与各版 `current` 软链）。`.com` 的 `/var/www/zhongkao.pinmooconsulting.com/releases/20260725-refresh1` 是无用孤儿目录，别动。
- 付费后端 `/api/access/*` 代理到 127.0.0.1:8787，目前该后端不存在，解锁走本地测试 + `access-config.json` 开关兜底。（2026-10-10 已更正：8787 **存在且在运行**，是老序列号后端）

## 支付/会员后端（2026-10-10 P0 上线后，**架构已变，以此节为准**）
- 三套后端并存：
  - **8787** `/opt/zhongkao-access/current/server.mjs`（www-data, pid 627）＝老序列号后端，SQLite，负责 `/api/access/serial/*`、`/api/serial-keys` 管理。**永不关停，老用户权益靠它**。
  - **8799** `/opt/zhongkao-pay-server/`（systemd `zhongkao-pay.service`，Restart=always，日志 `/var/log/zhongkao-pay-server.log`）＝新会员/支付后端，**只监听 127.0.0.1**（公网直连已封）。
  - **mock.js** 仅本地/隔离用，默认 8801 + BIND 127.0.0.1 + MOCK_KEY 保护，nginx **不代理**。
- nginx 路由（`/etc/nginx/sites-available/zhongkao.pinmooconsulting.com`，备份 `.bak-p0deploy`）：
  - `^~ /api/access/serial/` → **8787**（老序列号兑换；这条缺失会导致老用户兑换 404，务必保留）
  - `~ ^/api/access/` → 8799（config/session）
  - `/api/{auth,pay,membership}` → 8799
- 权益来源区分：`accessSource = 'serial' | 'membership'`。8799 的 `/api/access/session` 服务端代理 8787（转发 Cookie，GET 无 Origin 校验所以能过）。
- **响应字段铁律**：前端 `unlock/validation.js` 要求 `authenticated` + `entitled` + **`accessSource`（不是 source）** + `serial{deviceCount,maxDevices}`。8787 真实响应里**没有顶层 entitled**，要靠 `entitlement.status==='active'` 判断——曾因此踩坑导致老用户会被全部误判未授权。
- 8787 兑换的 `deviceId` 必须是 **UUID 格式**（`normalizeDeviceId` 正则校验），随手字符串会被 400 `INVALID_SERIAL_INPUT`。
- 真实支付未联调：`paymentConfigured=false`（缺商户号/证书/密钥），下单返回 503。**mock 支付成功不算验收通过**。
- **微信回调解密协议口径（踩过坑，别再改错）**：只有 ciphertext 是 Base64；`resource.nonce` 是原始随机串，必须用 `Buffer.from(nonce,'utf8')` 作 GCM IV。曾误改成 base64 并当成「修复」，被独立复验打回。
- **H5 网页会话**：`/api/access/exchange` 消费一次性码 → 下发 `zk_web_session`（HttpOnly/SameSite=Lax/Secure），`access-gate.js` 交换后 `replaceState` 清掉 URL 里的 `zk_code`。刷新/跳页靠这个 Cookie 保持权益。
- **订单状态机**：`REFUNDED` 是终态，迟到付款通知不得重开；退款按 `out_refund_no/refund_id` 幂等累积，只有累计≥订单额才撤销权益；权益按全部有效订单重算。
- **依赖**：Express 5.3.0 + `package-lock.json`，`npm audit` 0 漏洞。

## 前端发布（release 目录规范）
- 站点：`/var/www/zhongkao.pinmoo.top/`，`current` 是**软链**，指向 `releases/<name>`。
- **建新 release 必须用 `cp -a releases/<旧>/. releases/<新>/`**（带 `/.` 复制目录内容）。直接 `cp -a current <新>` 会把 current 这个软链本身复制过去，新 release 变成指向旧目录的软链，后续上传文件会写进旧目录 —— 已踩过一次，导致旧 release 被就地覆盖。
- 发布后必须：`readlink -f current` 确认指向新目录（只看 `ls -l` 不够），并对线上文件做 `sha256sum` 与本地逐一比对。
- 改前端 JS 要同步改各页面 HTML 的 `?v=` 缓存号（当前 `access-gate.js?v=20261010-r2session`、`unlock.js?v=20261010b`）。
- **业务域名校验文件 `1KnDJHz96q.txt` 在站点根，发布时必须保留**，删了会导致小程序业务域名校验失败。
- 回滚基线：完整旧 release `ui-20261009-zkpay`（含校验文件）；后端快照 `/opt/zhongkao-pay-server.snapshot-20261010`。
- **回滚禁令（硬性）**：不得恢复公网 mock 支付。降级=移除支付配置让下单返回 503 + 保持 8787 可用。

## 真实支付联调通道（2026-10-10 建立）
- 商户凭证走 `EnvironmentFile=-/etc/zhongkao-pay/env`（600，root）。**PEM 只能写文件路径**（systemd EnvironmentFile 不支持多行值），config.js 检测不到 `-----BEGIN` 时按路径读文件。模板 `server/deploy/zhongkao-pay.env.template`，安装 `bash server/deploy/install-wxpay-env.sh <输入文件>`（装 PEM → 更新 unit → 重启 → 自动自检）。凭证禁止进 Git。
- **nginx 回调 exempt 限流**：`location = /api/pay/notify` 与 `= /api/pay/refund-notify` 精确匹配、不挂 `limit_req`。微信 15s 未收到 200 会阶梯重试，被 429 会拖慢开通。其余 `/api/(auth|pay|membership)/` 仍限流。
- 联调入口：`node scripts/check-wxpay-config.cjs`（自检三层：格式/自洽/在线探针，含「平台公钥指纹 ≠ 商户证书指纹」判错）；`LIVE=1 ... node test/wxpay-live.cjs --mode=order|watch|close|full`（未设 LIVE=1 直接 SKIP 退出 0）。
- 事件日志 `events.jsonl` 中 `order_paid` 的 `via=notify` 才是「微信回调开通」的证据，`via=query` 表示查单补单；另有 `notify_received` 证明回调真的到达。
- 商户平台侧**必须先关联 AppID**（产品中心→AppID账号管理），否则下单 `APPID_MCHID_NOT_MATCH`；小程序需企业主体已认证并开通微信支付。
- 服务端金额由 `PAY_PRICE_FEN` 固定（正式 990），忽略客户端传参；联调改 1 分后**必须改回**。

## PowerShell 调用 ssh/scp 的坑（本机）
- **`scp` 不要用 `| Out-File` 之类的管道**，会静默失败（exit 1、输出为空）；单独调用即可。需要留证就让远程脚本 `exec > /tmp/xxx.log`，再 `scp` 取回后读。
- 远程命令输出经 PowerShell 转存会中文乱码（二次编码），所以一律走「写远程日志 → scp 取回 → Read」。
- `cmd /c` 组合命令被拦截；`$(...)` 命令替换在远程命令里会被 PowerShell 安全策略挡掉，用固定文件名代替。

## 沙箱部署限制（踩坑记录）
- **沙箱没有 rsync**，部署用 `tar czf - -C <本地根> . | ssh ... "tar xzf - -C <release>"` 管道方式（排除 `.workbuddy`/`docs`/`qa`）。
- 沙箱出站 HTTPS 被限制：直连 `8.138.23.88:443` 和 `zhongkao.pinmoo.top` 域名都超时（DNS 解析到 198.18.0.x 保留段）。**健康检查只能走 SSH 登录服务器本机 loopback**，且必须用 `curl -k --http1.1 -H "Host: zhongkao.pinmoo.top"`（不带 Host 头会命中默认站点 404；http→https 有 301 重定向，跟 `-L` 即可）。
- SSH 命令要带 `-o ConnectTimeout=12 -o BatchMode=yes -o StrictHostKeyChecking=no`，避免交互卡死。

## 硬约束（贯穿所有改动）
- `engine.js` 与 `data/*.json` 为禁区，字节级不得改动。每次部署后用 `sha256sum` 校验 engine.js = `fc8f643c936aa57bfbbe2926410e7592e877be4f7554743a637f6fedbfbebf60`（22208 字节）。
- `app.js` 对 engine 的调用点（seed/iterations/import）必须原样保留。
- 静态资源加 `?v=版本号` 缓存破坏（版本号随每次改动滚动递增，当前 `k`）。

## 子页资源/数据加载铁律（踩坑两次）
- `direction/`、`target/`、`verify/`、`special/` 是**子目录路由**。页面内任何 `fetch('./data/...')` 会解析成 `/target/data/...` 之类 → 404。
- **所有数据/资源 fetch 必须用以域名根的绝对路径**：`/data/manifest.json`、`/data/allocations-2026.json`、`/api/access/*`、`/access-config.json`。app.js 的 `json()` 已统一改为 `/data/`。
- 特例：`special/app.js` 用 `../data/first-batch-2026.json` 是对的（它位于 `/special/` 一级目录，`../data/` 正确回到根 `/data/`）。不要把子页的共享 app.js 也写成 `../data/`。
- HTML 里跨页链接/脚本：子页用 `../app.js`、`../styles.css`、`../access-gate.js`、`../navigation.js`（回退一级到根）；首页用 `./`。导航互跳用 `../direction/` 等。

## 页面架构（2026-07-25 pages1 起）
- SPA 已重构为独立页：`index.html` 首页三卡改为 `<a href="./direction/">` 等链接；`direction/`、`target/`、`verify/` 为独立路由，各带 `.site-nav` 顶部导航（子页用 `../` 相对路径）。`special/`、`unlock/` 同享导航。

## 序列号生成器模块（2026-07-26 起）
- 独立功能模块，本地路径 `serial-key/`（即 `E:\pinmoo\guangzhou-zhongkao\serial-key\`）；生产作为 `pages1` release 的子目录，路由 `/serial-key/`。
- 纯原生 HTML/CSS/JS（无框架），localStorage 持久化（key `zk_serial_keys`，记录 `{code, status:'active'|'invalid', createdAt, invalidatedAt}`）。
- 序列号：10 位，安全字符集 `2345679ABCDEFGHJKMNPQRSTUVWXYZ`（排除易混 0/O/1/I/L），生成时查重保证唯一。
- 三功能：①生成（一键复制，clipboard 优先降级 execCommand）②作废（输入/选择 + confirm 二次确认，标记 invalid）③系统占位入口（链接 `/`，注释 TODO 待对接）。
- 此模块**完全独立，不依赖 engine.js/data**，与主程序解耦；改动时不必遵守主程序禁区约束，但仍只改 `serial-key/` 内文件。
