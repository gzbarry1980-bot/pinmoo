# 品沐门户域名迁移

## 域名映射

- `admin.pinmoo.top` → `admin.pinmooconsulting.com`
- `sjmj.pinmoo.top` → `sjmj.pinmooconsulting.com`
- `talasa.pinmoo.top` → `talasa.pinmooconsulting.com`
- `agent.pinmoo.top` → `agent.pinmooconsulting.com`
- `shs-agent.pinmoo.top` → `shs-agent.pinmooconsulting.com`

旧域名在新加坡服务器执行永久 301 跳转，并保留请求路径和查询参数。新域名的 A 记录指向广州服务器 `8.138.23.88`。

## 广州服务器

- Nginx 示例：`deploy/nginx/pinmooconsulting-portals.conf.example`
- 通配符证书：`/etc/letsencrypt/live/pinmooconsulting.com-wildcard/`
- 证书有效期：2026-10-22
- 任务系统须同时信任 `pinmoo.top` 和 `pinmooconsulting.com` 两个根域名。

由于备案放行前 HTTP-01 校验被外部入口返回 403，本次证书通过 DNS-01 签发。备案通过后应重新签发五域名 HTTP-01 证书，恢复无人值守自动续期，并再次执行国内运营商访问测试。

## 回滚

- 广州备份：`/root/migration-backups/20260724-portal-domain-move/`
- 新加坡备份：`/root/migration-backups/20260724-portal-redirect/`

回滚前先恢复对应 Nginx 文件，执行 `nginx -t`，仅在配置校验通过后 reload。
