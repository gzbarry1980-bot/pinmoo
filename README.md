# PINMOO 品沐咨询官网

广州品沐咨询有限公司品牌展示型官网，包含首页、服务介绍、项目经验、案例详情、关于品沐和联系我们页面。项目为无数据库静态站，内容数据集中在 JS 文件中，方便后续维护。

## 本地启动

无需安装依赖：

```bash
npm run dev
```

打开终端输出的地址，通常是 `http://localhost:5173/`。

如需重新处理 Logo 和案例图片：

```bash
npm run assets
```

## 构建

```bash
npm run build
npm run preview
```

构建产物在 `dist` 目录。

## 部署到 Vercel

1. 将项目导入 Vercel。
2. Framework Preset 选择 `Other`。
3. Build Command 使用 `npm run build`。
4. Output Directory 使用 `dist`。
5. 绑定正式域名 `pinmooconsulting.com`。

## 部署到 Netlify

1. 将项目导入 Netlify。
2. Build command 使用 `npm run build`。
3. Publish directory 使用 `dist`。
4. 项目已包含 `public/_redirects`，构建后会复制到 `dist/_redirects`。
5. 绑定正式域名 `pinmooconsulting.com`。

## 内容维护

- 公司名称、电话、域名等常量：`src/data/site.js`
- 服务内容：`src/data/services.js`
- 案例内容：`src/data/cases.js`
- 页面组件与交互：`src/static-main.js`
- 视觉样式：`src/styles.css`

## 表单邮件通知

当前联系表单已兼容 Netlify Forms。部署到 Netlify 后，在项目后台进入 Forms，找到 consultation 表单，再添加 Email notification，收件人填写：gzbarry@139.com。

本地 localhost 环境会模拟提交成功，不会真实发送邮件。部署到 Netlify 后，客户提交会进入 Netlify Forms 后台，并按通知设置发送到指定邮箱。

## SEO / GEO 优化

项目构建时会自动把每个页面预渲染成真实 HTML，并注入 Schema.org JSON-LD 结构化数据，包含 Organization / ProfessionalService / WebSite / WebPage / BreadcrumbList / Service / FAQPage / Article / ContactPage 等信息。

已新增 AI 友好文件：

- `/llms.txt`：给 AI 搜索和大模型摘要使用的品牌说明
- `/ai.txt`：同样的 AI 摘要入口备用
- `/pinmoo-profile.json`：机器可读的品牌、服务、案例、联系方式资料
- `/sitemap.xml`：含 lastmod、changefreq、priority
- `/robots.txt`：允许主流搜索引擎和常见 AI 抓取器访问，并指向 sitemap 与 llms.txt

部署前请运行：

```bash
npm run build
```

部署目录使用 `dist`。
