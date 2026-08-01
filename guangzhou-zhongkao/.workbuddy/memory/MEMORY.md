# 广州中考志愿模拟系统 — 长期项目笔记

## 部署架构（务必牢记）
- 生产机：阿里云广州 8.138.23.88，SSH 密钥 `C:/Users/Administrator/.ssh/pinmoo_aliyun_deploy`
- 域名关系：`.top` 仅做 301 跳板 → `.com`；**`.com` 的 nginx root 直接指向 `.top` 的 `current` 软链**（`/var/www/zhongkao.pinmoo.top/current`）。两个域名共用同一份代码，升级只需切 `.top` 的 `current`。
- 站点根：`/var/www/zhongkao.pinmoo.top/`（含 `releases/` 与各版 `current` 软链）。`.com` 的 `/var/www/zhongkao.pinmooconsulting.com/releases/20260725-refresh1` 是无用孤儿目录，别动。
- 付费后端 `/api/access/*` 代理到 127.0.0.1:8787，目前该后端不存在，解锁走本地测试 + `access-config.json` 开关兜底。

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
