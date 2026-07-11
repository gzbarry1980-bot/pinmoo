# Pinmoo.top 阿里云部署

pinmoo.top 当前部署在阿里云服务器，线上目录默认是 `/var/www/pinmoo.top`。

## 域名与平台边界

- `pinmoo.top`：部署在阿里云服务器，通过 GitHub 拉取更新。
- `pinmooconsulting.com`：部署在 Netlify，通过 GitHub 更新。
- `gzbarry1980@gmail.com`：只用于更新 `pinmooconsulting.com` 官网，Netlify 额度保留给官网发布。
- `barrybao1980@gmail.com`：可用于其他 Netlify 项目、测试站、预览站或非官网用途。
- 后续如需使用 Netlify 承载非官网项目，优先使用 `barrybao1980@gmail.com` 或其他账号，不使用 `gzbarry1980@gmail.com`。

## 推荐发布方式

在服务器终端执行：

```bash
cd /var/www/pinmoo.top
bash scripts/deploy-pinmoo-aliyun.sh
```

脚本会自动完成：

1. 拉取 GitHub 最新代码。
2. 安装依赖并关闭第三方安装脚本。
3. 按 `https://pinmoo.top` 构建静态站点。
4. 检查 canonical、sitemap、robots、JSON-LD、站内链接和 404 页面。
5. 验证 nginx 配置后重载。
6. 在线复核 canonical、抓取权限、404 状态码和安全响应头。

## 首次启用 Nginx 防护

本次升级新增了四份防护配置：

- `deploy/nginx/pinmoo-security-headers.conf`：安全响应头。
- `deploy/nginx/pinmoo-rate-limit-zones.conf`：单 IP 请求频率和并发连接共享区。
- `deploy/nginx/pinmoo-server-protection.conf`：限速、慢连接超时和静态文件缓存。
- `deploy/nginx/pinmoo.top.conf.example`：静态站点、正确 404、敏感路径拦截和缓存示例。

推荐在阿里云“命令助手”中以 `root` 用户执行一键安装。脚本会备份现有配置，运行 `nginx -t`，失败时自动回滚：

```bash
cd /var/www/pinmoo.top
bash scripts/install-pinmoo-nginx-protection.sh
```

默认保护策略允许每个 IP 短时突发 60 个请求，持续速率限制为每秒 10 个请求，同时最多保留 30 个活动连接。超限返回 `429`，正常网页首屏加载和搜索引擎抓取可使用突发额度。

先查看当前生效配置和证书路径：

```bash
sudo nginx -T | less
```

备份当前站点配置，并安装安全响应头：

```bash
SITE_CONFIG="$(readlink -f /etc/nginx/sites-enabled/pinmoo.top)"
sudo cp "$SITE_CONFIG" "${SITE_CONFIG}.backup-$(date +%Y%m%d-%H%M%S)"
sudo cp /var/www/pinmoo.top/deploy/nginx/pinmoo-rate-limit-zones.conf /etc/nginx/conf.d/00-pinmoo-rate-limit-zones.conf
sudo cp /var/www/pinmoo.top/deploy/nginx/pinmoo-security-headers.conf /etc/nginx/snippets/pinmoo-security-headers.conf
sudo cp /var/www/pinmoo.top/deploy/nginx/pinmoo-server-protection.conf /etc/nginx/snippets/pinmoo-server-protection.conf
```

对照 `deploy/nginx/pinmoo.top.conf.example` 修改当前 `pinmoo.top` 的 HTTPS `server`，重点确认：

```nginx
root /var/www/pinmoo.top/dist;
include /etc/nginx/snippets/pinmoo-security-headers.conf;
include /etc/nginx/snippets/pinmoo-server-protection.conf;

location / {
    try_files $uri $uri/ =404;
    limit_except GET {
        deny all;
    }
}

error_page 404 /404.html;
```

不要直接覆盖证书路径。修改完成后执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
cd /var/www/pinmoo.top
node scripts/verify-live.mjs https://pinmoo.top
```

线上检查通过时，不存在的网址会返回真正的 `404`，首页会带有 CSP、HSTS、X-Frame-Options 等安全响应头。

## 手动发布方式

如果脚本不可用，可以执行：

```bash
cd /var/www/pinmoo.top
git pull
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm run verify
sudo nginx -t
sudo systemctl reload nginx
node scripts/verify-live.mjs https://pinmoo.top
```

发布后访问：

```text
https://pinmoo.top/
https://pinmoo.top/insights/
```

页面顶部版本号应与本地版本一致。
