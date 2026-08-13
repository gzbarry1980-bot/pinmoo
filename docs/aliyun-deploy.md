# Pinmoo 阿里云部署

## 域名边界

- `https://pinmooconsulting.com/`：品沐咨询官网主站，部署在阿里云，由 GitHub 更新后通过命令助手发布。
- `https://pinmoo.top/`：短域名，部署在 Netlify；额度不足时可以暂缓更新，不影响 `.com` 主站。
- `https://agent.pinmoo.top/`、`https://sjmj.pinmoo.top/` 等：独立工具或业务子域名，不由官网主站脚本改写。

服务器上的项目目录历史名称仍为 `/var/www/pinmoo.top`，这只是目录名，不代表主站继续使用 `.top` 域名。

## 一键部署主站

在阿里云“命令助手”中使用 `root` 用户执行：

```bash
git config --global --add safe.directory /var/www/pinmoo.top
cd /var/www/pinmoo.top
bash scripts/deploy-pinmoo-aliyun.sh
```

脚本会自动完成：

1. 从 GitHub 拉取最新代码。
2. 以 `https://pinmooconsulting.com` 为主域构建中文首页、英文页面和 SEO/GEO 资源。
3. 检查 canonical、sitemap、robots、JSON-LD、文章质量和站内链接。
4. 同步主站 Nginx 安全、限流和压缩配置。
5. 安装或更新 `pinmooconsulting.com` 的 Nginx 配置并平滑重载 Nginx。
6. 检查 `.com` 主站状态、响应头、404、robots 和 sitemap。
7. 向 IndexNow 提交 `.com` 主站 URL。

脚本不会安装 `.top` 跳转配置，也不会删除或覆盖 `agent.pinmoo.top`、`sjmj.pinmoo.top` 等独立工具配置。

## HTTPS 证书

主站配置默认使用：

```text
/etc/letsencrypt/live/pinmooconsulting.com-wildcard/fullchain.pem
/etc/letsencrypt/live/pinmooconsulting.com-wildcard/privkey.pem
```

如果服务器实际证书目录不同，请先修改 `deploy/nginx/pinmooconsulting.com.conf.example` 中的证书路径，再执行部署。不要把 `.top` 的 Netlify 证书复制到阿里云主站。

## 部署后检查

```bash
cd /var/www/pinmoo.top
node scripts/verify-live.mjs https://pinmooconsulting.com
```

重点确认：

```text
https://pinmooconsulting.com/
https://pinmooconsulting.com/about/
https://pinmooconsulting.com/services/geo-consulting/
https://pinmooconsulting.com/insights/
https://pinmooconsulting.com/sitemap.xml
```

如需单独检查工具子域名，应使用其自己的 Nginx 配置和部署流程；不要用官网主站脚本替代工具发布。
