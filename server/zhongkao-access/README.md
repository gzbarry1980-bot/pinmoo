# Guangzhou Zhongkao access service

This Node.js 22 service stores verified accounts, orders, sessions and durable product entitlements in SQLite. The browser cookie contains only a random session token; purchase rights remain in the server database.

## 序列号解锁与设备上限

- 序列号由服务端签发，浏览器不能再用 `localStorage` 自行生成或授予权限。
- 首次在一个浏览器设备激活时会绑定匿名设备标识；同一序列号最多绑定 **2 台**，第三台会收到 `SERIAL_DEVICE_LIMIT`。
- 设置至少 32 位随机值 `SERIAL_ADMIN_API_KEY`，序列号生成器管理端以 `X-API-Key` 调用 `/api/serial-keys/*`。该密钥不得写入前端代码、Git 或公开页面。
- `SERIAL_SESSION_DAYS` 默认 180；到期后可在已绑定设备重新输入同一序列号。浏览器清除站点数据或恶意伪造设备标识不能被纯网页绝对防止；若需物理设备级强约束，应恢复账号登录或引入设备证明。

## Safety state

- `ACCESS_MODE=preview` leaves the existing tool accessible while account and payment flows are tested.
- `OTP_PROVIDER=disabled` refuses login-code requests.
- `PAYMENT_PROVIDER=disabled` refuses order creation and can never grant a paid entitlement.
- Production enforcement must not be enabled until a real SMS provider and a verified WeChat Pay callback are tested end to end.

## Local checks

```powershell
npm run test:zhongkao-access
```

For local UI testing, set `STATIC_DIR` to `dist/zhongkao` and run `npm run dev:zhongkao-access`.

## Production data

- Application releases: `/opt/zhongkao-access/releases/<version>`
- Active symlink: `/opt/zhongkao-access/current`
- Environment file: `/etc/zhongkao-access.env` (`0600`, never committed)
- Database: `/var/lib/zhongkao-access/access.sqlite`

The database and WAL files require encrypted daily off-server backups before payment is enabled.
