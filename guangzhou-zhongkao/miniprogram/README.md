# 广州中考志愿模拟助手｜微信小程序

面向**初三学生家长**的广州中考志愿**模拟填报**小程序。核心志愿模拟能力沿用网页版（web-view 承载），并新增**原生会员与支付层**：用户支付 **¥9.9** 开通会员后解锁完整功能。

> 志愿模拟、评分、录取机会等重逻辑运行在网页版（`webBaseUrl`），小程序负责壳、导航、登录态、支付与会员权益。

## 目录

```
miniprogram/
├── app.js / app.json / app.wxss      # 全局配置（含 payPriceFen 等）
├── sitemap.json / project.config.json
├── utils/embed.js                    # 为 web-view 注入一次性会话码（zk_code），长期令牌不进 URL
├── scripts/assert-env.cjs            # 生产构建防呆：检出 payMock / mock 路径 / 长期令牌透传即失败
├── services/membership.js            # 会员与微信支付服务（登录/下单/支付/激活/刷新）
├── pages/
│   ├── home/ schools/ plans/ special/ direction/ target/  # web-view 承载网页版
│   ├── webview/                      # 通用 web-view 深链页
│   ├── my/                           # 原生「我的」会员中心
│   ├── pay/                          # 原生 9.9 元付费解锁流程
│   └── privacy/                      # 原生隐私政策页
└── README.md
```

## 付费解锁流程（9.9 元）

1. 用户在「我的」或网页版付费墙点击「立即开通 ¥9.9」。
2. 小程序 `wx.login` 换取 `openid` 与会员 `token`（后端 `/api/auth/login`）。
3. 调用 `/api/pay/create` 创建 JSAPI 订单，拿到 `payParams`。
4. 调起 `wx.requestPayment` 完成支付。
5. 微信回调 `/api/pay/notify` 验签 + 解密，标记订单 `PAID` 并开通会员（`entitled=true`）。
6. 前端支付成功后乐观激活并刷新状态；网页版 web-view 只注入**一次性会话码** `zk_code`，由 `/api/access/exchange`
   消费并下发 HttpOnly 网页会话 Cookie，`/api/access/session` 认该 Cookie 后解除内容打码（刷新/跳页不丢权益）。

## 环境分离（R5）

`app.js` 顶部 `BUILD_ENV` 取值 `production | test | development`，三套 profile 互不复用：

| 环境 | 后端 | 存储命名空间 | 支付 |
|---|---|---|---|
| production | `https://zhongkao.pinmooconsulting.com` | `zk_prod_*` | 仅真实 `wx.requestPayment` |
| test / development | `http://127.0.0.1:8799`（独立后端） | `zk_test_*` / `zk_dev_*` | 仅真实 `wx.requestPayment` |

- 任何环境都**没有** mock 支付通道；`/api/pay/mock-pay` 在正式后端返回 404。
- 商户配置缺失时 `/api/pay/create` 返回 503，前端统一提示「暂未开放购买，请稍后再来」。
- 上传前跑 `node scripts/assert-env.cjs`，检出 `payMock`、`mock` 路径或 `zk_token` 透传即以非 0 退出。

## 导入与本地体验

1. 微信开发者工具导入 `miniprogram/` 目录。
2. `app.js` 的 `dataBaseUrl / webBaseUrl` 为已备案域名，需同时在小程序后台配置为 **request 合法域名** 与 **业务域名**。
3. 本地无后端时，可在 `access-config.json` 将 `enforce` 设为 `false` 关闭闸门以便调试 UI；上线须保持 `true` 并由后端 `/api/access/*` 放行。
4. 真实支付需部署 `../server/` 后端并填好微信支付配置（见 `server/README.md`）。

## 与网页版的关系

- 网页版 `access-gate.js` 已改造：付费墙文案改为「9.9 元开通会员」，小程序内点击跳原生 `/pages/pay/pay`；`/api/access/exchange` 认 `zk_code` 并下发网页会话。
- `engine.js`、`data/*.json` 为规则引擎禁区，本改造未改动。

## 上架准备

见同目录 `上架清单.md`（类目、主体资质、隐私协议、支付商户、测试账号、提审截图、灰度发布）。
