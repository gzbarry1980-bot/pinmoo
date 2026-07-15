# Pinmoo 阿里云部署

## 域名边界

- `https://pinmooconsulting.com/`：唯一官网主域名，由 Netlify 从 GitHub 自动部署。
- `https://pinmooconsulting.com/zh/`：中文官网首页。
- `https://pinmoo.top/`：历史域名，由阿里云 Nginx 逐页 301 跳转到 `.com` 对应页面。
- `https://agent.pinmoo.top/`：独立电商经营报告工作台，不跳转。

## 一键部署

在阿里云“命令助手”中使用 `root` 用户执行：

```bash
git config --global --add safe.directory /var/www/pinmoo.top
cd /var/www/pinmoo.top
git pull --ff-only origin main
bash scripts/deploy-pinmoo-aliyun.sh
```

脚本会自动完成：

1. 从 GitHub 拉取最新代码。
2. 构建站点和 `agent.pinmoo.top` 工作台。
3. 检查 canonical、sitemap、robots、JSON-LD 和站内链接。
4. 确认 `agent.pinmoo.top` 使用独立 Nginx 配置。
5. 备份旧配置到 `/var/backups/pinmoo-nginx/`。
6. 安装 `.top` 到 `.com` 的逐页 301 跳转并重载 Nginx。
7. 在线检查 `.com` 主站、`.top` 跳转和 Agent 工作台。
8. 向 IndexNow 提交 `.com` sitemap 中的 URL。

## 单独安装域名跳转

```bash
cd /var/www/pinmoo.top
bash scripts/install-primary-domain-redirect.sh
node scripts/verify-domain-strategy.mjs
```

如果脚本提示 `agent.pinmoo.top` 没有独立 Nginx 配置，应先按 `docs/agent-subdomain-deploy.md` 完成工作台配置，不要强行覆盖。

## 验收地址

```text
https://pinmooconsulting.com/
https://pinmooconsulting.com/zh/
https://pinmooconsulting.com/zh/services/store-diagnosis/
https://pinmooconsulting.com/sitemap.xml
https://agent.pinmoo.top/
```

`https://pinmoo.top/` 应返回 301 并跳转到 `https://pinmooconsulting.com/zh/`。
