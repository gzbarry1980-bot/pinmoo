# agent.pinmoo.top 部署说明

`agent.pinmoo.top` 用于独立承载 Pinmoo AI 电商经营智能体。域名根路径直接打开应用，原地址 `https://pinmoo.top/ai-diagnosis/` 使用 301 跳转到该独立域名。

## 当前状态

- DNS A 记录已解析到阿里云服务器 `47.237.186.156`。
- 构建命令会自动生成 `/var/www/pinmoo.top/dist/agent`。
- 当前线上 HTTP 仍返回 404，HTTPS 证书尚未覆盖 `agent.pinmoo.top`，需要完成以下 Nginx 和证书步骤。

## 本地与服务器构建

```bash
cd /var/www/pinmoo.top
git pull --ff-only origin main
npm ci --ignore-scripts --no-audit --no-fund
npm run build
npm run verify:agent
```

校验通过后应看到：

```text
Agent 构建检查通过：dist/agent
```

## 首次申请 HTTPS 证书

先启用临时 HTTP 配置，让 Certbot 能验证域名：

```bash
sudo cp deploy/nginx/agent.pinmoo.top.http.conf.example /etc/nginx/sites-available/agent.pinmoo.top
sudo ln -sfn /etc/nginx/sites-available/agent.pinmoo.top /etc/nginx/sites-enabled/agent.pinmoo.top
sudo nginx -t
sudo systemctl reload nginx
```

如果服务器尚未安装 Certbot：

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

申请证书：

```bash
sudo certbot certonly --nginx -d agent.pinmoo.top
```

## 启用正式 HTTPS 配置

证书签发成功后替换为正式配置：

```bash
sudo cp deploy/nginx/agent.pinmoo.top.conf.example /etc/nginx/sites-available/agent.pinmoo.top
sudo nginx -t
sudo systemctl reload nginx
```

## 上线复核

```bash
curl -I https://agent.pinmoo.top/
curl -s https://agent.pinmoo.top/ | grep 'https://agent.pinmoo.top/'
```

最终应满足：

- `http://agent.pinmoo.top/` 自动跳转到 HTTPS。
- `https://agent.pinmoo.top/` 返回 200。
- canonical 和 `og:url` 都是 `https://agent.pinmoo.top/`。
- 页面内“返回品沐官网”跳转到 `https://pinmooconsulting.com/`。
