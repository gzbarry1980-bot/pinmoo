# zhongkao.pinmooconsulting.com 部署与自动更新

## 一次性准备

1. 将 `zhongkao.pinmooconsulting.com` 的 DNS A 记录指向阿里云广州服务器 `8.138.23.88`。
2. 先安装 `deploy/nginx/zhongkao.pinmooconsulting.com.http.conf.example`，再用 Certbot 申请证书：

```bash
sudo certbot certonly --nginx -d zhongkao.pinmooconsulting.com
```

3. 换用 `deploy/nginx/zhongkao.pinmooconsulting.com.conf.example`，执行 `sudo nginx -t && sudo systemctl reload nginx`。
4. 在 GitHub 仓库配置 `ALIYUN_HOST=8.138.23.88`、`ALIYUN_USER=root` 和广州服务器对应的 `ALIYUN_SSH_KEY` 三个 Actions secrets。迁移后不要再把 `ALIYUN_HOST` 指向新加坡服务器。

当前证书由 Certbot 自动续期。中国大陆服务器对外提供网站前，仍须以阿里云备案系统的最终审核结果为准。

## 自动更新

`.github/workflows/zhongkao-data.yml` 在招考季每日、其余月份每周检查官方资料。只有数据校验、规则测试、站点构建和构建验收全部通过，才会创建数据 Release 并部署。

服务器暂沿用 `/var/www/zhongkao.pinmoo.top/releases/<version>` 内部版本目录和 `current` 原子软链接，以避免迁移时移动线上文件；该目录名不影响公开域名。线上健康检查失败时部署脚本恢复上一个链接。

## 本地验收

```powershell
npm run data:zhongkao
npm run build
npm run verify:zhongkao
npm run preview
```

然后访问 `http://localhost:5173/zhongkao/`，完成一次预测、一次历史复盘和一次匿名 JSON 导出。
