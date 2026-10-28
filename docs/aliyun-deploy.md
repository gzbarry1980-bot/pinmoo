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
4. 为独立发布目录生成当前页面的咨询事件白名单，更新对应统计配置。
5. 保留线上主站路由、证书、安全、限流和压缩配置，切换静态目录并平滑重载 Nginx；异常时回退。
6. 检查 `.com` 主站状态、响应头、404、robots 和 sitemap。

脚本不会安装 `.top` 跳转配置，也不会删除或覆盖 `agent.pinmoo.top`、`sjmj.pinmoo.top` 等独立工具配置。

## HTTPS 证书

主站配置默认使用：

```text
/etc/letsencrypt/live/pinmooconsulting.com-apex/fullchain.pem
/etc/letsencrypt/live/pinmooconsulting.com-apex/privkey.pem
```

普通发布不会重新安装示例主站配置。首次搭建或证书路径改变时，应单独核对并应用主站配置，确认事件位置已接入后再发布内容；不要用模板覆盖当前可用路由，也不要把 `.top` 的 Netlify 证书复制到阿里云主站。构建的`.deploy/events-http.conf`必须随每次发布同步，新增文章和分页才能继续记账。部署校验使用DNT，避免生成正常访问计数；任何额外日志验收请求须单独记录测试时间窗。

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

若其他任务正在使用共享`dist`目录，应从已验收发布包提取独立快照，再执行`node scripts/verify-international-build.mjs <快照目录>`。不要删除其他工具产物来让主站扫描通过，也不要把工具目录打进官网发布包。
