# Pinmoo.top 阿里云部署

pinmoo.top 当前部署在阿里云服务器，线上目录默认是 `/var/www/pinmoo.top`。

## 推荐发布方式

在服务器终端执行：

```bash
cd /var/www/pinmoo.top
bash scripts/deploy-pinmoo-aliyun.sh
```

脚本会自动完成：

1. 拉取 GitHub 最新代码。
2. 安装依赖。
3. 构建静态站点。
4. 重载 nginx。

## 手动发布方式

如果脚本不可用，可以执行：

```bash
cd /var/www/pinmoo.top
git pull
npm install
npm run build
systemctl reload nginx
```

发布后访问：

```text
https://pinmoo.top/ai-diagnosis/
```

页面顶部版本号应与本地版本一致。
