# pinmoo.top 免备案访问方案

## 目标

`pinmoo.top` 只作为短域名入口，所有页面永久跳转到主站：

```text
https://pinmoo.top/*       -> 301 -> https://pinmooconsulting.com/*
https://www.pinmoo.top/*  -> 301 -> https://pinmooconsulting.com/*
```

主站继续使用 Netlify 的 `pinmooconsulting.com` 项目，搜索引擎和 GEO 内容以 `.com` 为唯一主域名。

## 为什么不能继续指向阿里云大陆 ECS

未备案域名解析到中国内地服务器时，阿里云可能在请求到达 Nginx 前返回 403 或中断 TLS。服务器上的 301 配置无法绕过这一层拦截。因此，短域名的 `@` 和 `www` 记录必须改为指向 Netlify，不能继续使用 `8.138.23.88`。

## 已完成的代码配置

- `netlify/edge-functions/legacy-domain-redirect.ts`：识别 `pinmoo.top` 和 `www.pinmoo.top`，保留路径和查询参数后返回 301。
- `netlify.toml`：将 Edge Function 应用到所有路径。
- `.com` 站点继续使用 `SITE_ORIGIN=https://pinmooconsulting.com` 构建。

## 发布后需要在 Netlify 做一次配置

在现有 `pinmooconsulting.com` 项目中：

1. 打开 `Domain management`，添加 `pinmoo.top` 为 domain alias。
2. 按 Netlify 显示的 DNS 目标完成域名验证。
3. 确认 Netlify 已为 `pinmoo.top` 配置 HTTPS 证书。

不需要新建 Netlify 项目，也不需要把 `.com` 项目迁移到阿里云。

## AliDNS 记录

完成 Netlify alias 后再调整 DNS：

| 主机记录 | 类型 | 值 | 说明 |
| --- | --- | --- | --- |
| `@` | `A` | `75.2.60.5` | 以 Netlify 控制台实际显示值为准 |
| `www` | `CNAME` | Netlify 控制台显示的 `*.netlify.app` 主机名 | 不再指向 `8.138.23.88` |

如果控制台提供 `ALIAS` 或 `ANAME`，优先使用控制台给出的配置。删除重复的旧 `@` A/AAAA 记录，避免 DNS 轮询到阿里云。

## 工具域名边界

本次只迁移根域名和 `www`，以免影响现有工具。以下记录仍指向阿里云时，仍属于“未备案域名访问大陆 ECS”的风险范围：

- `agent.pinmoo.top`
- `sjmj.pinmoo.top`
- `talasa.pinmoo.top`
- `admin.pinmoo.top`
- `shs-agent.pinmoo.top`

工具迁移完成前不要删除这些记录。长期免备案方案是把工具迁移到海外/Netlify 等非中国内地入口，或使用已备案的 `.com` 二级域名；仓库已有对应命名规划，见 `docs/pinmooconsulting-portal-domain-move.md`。

## 验收

DNS 和 Netlify 生效后，在普通网络执行：

```powershell
curl.exe -I https://pinmoo.top/
curl.exe -I "https://pinmoo.top/about/?check=1"
```

预期结果：状态码为 `301`，`location` 分别为：

```text
https://pinmooconsulting.com/
https://pinmooconsulting.com/about/?check=1
```

根域名切换完成后，不再需要通过阿里云命令助手维护 `pinmoo.top` 根域名的 Nginx 站点；阿里云服务器只继续承载尚未迁移的工具服务。
