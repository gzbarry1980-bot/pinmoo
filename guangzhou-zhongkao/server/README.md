# 微信支付与会员服务（后端）

广州中考志愿模拟助手小程序的 **9.9 元会员付费解锁后端**。基于微信支付 v3（JSAPI）实现下单、回调验签解密、会员开通；并提供 H5 内容闸门所需的 `/api/access/*` 接口。纯 Node.js + Express，无重依赖。

## 目录

```
server/
├── package.json
├── .env.example          # 环境变量模板（推荐）
├── config.example.json   # 配置模板（二选一）
├── src/
│   ├── index.js          # 入口，监听 8787
│   ├── config.js         # 配置加载（env > config.json）
│   ├── store.js          # JSON 文件存储（用户 / 订单 / 会员态）
│   ├── wxpay.js          # v3 签名 / 验签 / 回调解密
│   └── routes/
│       ├── auth.js       # /api/auth/login（wx.login 换 openid）
│       ├── pay.js        # /api/pay/create、/api/pay/notify
│       ├── membership.js # /api/membership/status、/api/membership/activate
│       └── access.js     # /api/access/config、/api/access/session（H5 闸门）
└── data/                 # 运行时自动生成 store.json
```

## 接口一览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/login` | `{code}` → `{openid, token, entitled, vipExpireAt, orderNo}` |
| POST | `/api/pay/create` | `{openid, amount, description}` + `Authorization: Bearer <token>` → `{orderNo, prepayId, payParams}` |
| POST | `/api/pay/notify` | 微信支付回调（验签 + 解密 + 开通会员） |
| GET  | `/api/membership/status?openid=` | 会员状态 |
| POST | `/api/membership/activate` | 乐观开通（下单后前端调用，最终以回调为准） |
| GET  | `/api/access/config` | `{accessMode:'enforce', priceFen, productName}`（H5 闸门） |
| GET  | `/api/access/session?token=` | `{authenticated, entitled}`（H5 闸门） |

`payParams` 直接传给小程序 `wx.requestPayment`（字段：`timeStamp/nonceStr/package/signType/paySign`）。

## 配置

二选一：复制 `.env.example` 为 `.env` 并填值，或复制 `config.example.json` 为 `config.json`。
必填：`WX_APPID`、`WX_APPSECRET`、`WX_MCHID`、`WX_MCH_SERIAL`、`WX_MCH_PRIVATE_KEY`、`WX_API_V3_KEY`、`WX_PLATFORM_PUBLIC_KEY`。

> 私钥与平台公钥可用「文件路径」配置（如 `WX_MCH_PRIVATE_KEY=/path/to/apiclient_key.pem`），程序会自动读取内容。

## 部署（阿里云 8.138.23.88）

```bash
cd server
npm install --production
# 填入 .env 后
node src/index.js &
# 或用 pm2：pm2 start src/index.js --name zk-pay
```

### Nginx（在已有站点配置中追加，将整个 /api/ 代理到 8787）

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

> 现有 nginx 仅代理 `/api/access/*`，需扩为 `/api/`（本后端同时提供 `/api/pay`、`/api/auth`、`/api/membership`）。

## 微信侧前置条件

1. 小程序已认证，且 **微信支付商户号** 已绑定该 AppID（商户平台「AppID 账号管理」）。
2. 已申请 **APIv3 密钥** 与 **API 证书**（拿到序列号 `serialNo` 与 `apiclient_key.pem`）。
3. 已下载 **微信支付平台公钥**（用于回调验签），填入 `WX_PLATFORM_PUBLIC_KEY`。
4. 小程序后台配置 **request 合法域名** 为 `https://zhongkao.pinmooconsulting.com`，**业务域名** 同。

## 回调与开通链路

```
小程序 wx.requestPayment
  → 用户支付成功
  → 微信 POST /api/pay/notify（带 Wechatpay-Signature 等头）
  → 验签 + AES-GCM 解密 resource
  → trade_state=SUCCESS 时标记订单 PAID 并开通会员（entitled=true, vipExpireAt=null 表示长期有效）
前端支付成功后也会调用 /api/membership/activate 做乐观开通，最终以回调为准。
```

## 故障排查

- 下单报 401：检查 `Authorization` 头与 token 是否有效（登录接口返回）。
- 下单报 502：检查商户号 / 证书序列号 / 私钥是否匹配，以及 AppID 与商户号绑定关系。
- 回调 401：检查 `WX_PLATFORM_PUBLIC_KEY` 是否为「微信支付公钥」（非 API 证书）。
- 开通但未生效：查 `data/store.json` 中该 openid 的 `entitled` 与订单 `status`。

## 说明

`store.js` 使用 JSON 文件存储，适合轻量 / 单实例。多实例或高并发请替换为数据库（MySQL/Redis），接口契约不变。
