# 独立复验与下一轮指示

日期：2026-10-10。结论：**部分通过，P0不能整体验收，不宜直接进入真实收款。**

## 已确认的进展

- 线上zhongkao-pay服务active，健康检查paymentConfigured=false。未配置真实支付时保持关闭是正确的。
- 正式config返回demoEnabled=false、priceFen=990；GET mock-pay返回404。服务端源码未注册mock-pay，且正式入口采用新的服务。
- 当前下单身份由有效token决定，金额从服务端配置读取；会员状态不再仅凭openid授权。
- 已加入旧序列号会话代理；WorkBuddy给出了隔离8787实例的两设备测试记录。本次未创建真实序列号，旧用户完整浏览器回归仍需补交证据。

## 阻塞项及返工要求

### R1 高：回调nonce被错误Base64解码

位置：server/src/wxpay.js:54、60；server/test/p0.test.cjs:73。

当前将resource.nonce按base64解码。微信官方SDK使用nonce原始UTF-8字节，Base64解码的是ciphertext。WorkBuddy测试夹具也把nonce转Base64，因而测试与实现共同偏离协议。

本次用12字符nonce、UTF-8字节加密的独立数据测试，实际解密报认证失败。线上wxpay.js SHA256与本地一致，说明问题已在已部署后端中。

要求：恢复nonce UTF-8；修正测试夹具和报告中“修复真实缺陷”的错误描述；采用官方固定向量或独立构造的协议数据验证。测试不能通过改夹具迁就错误实现。

依据：[微信支付官方SDK测试](https://github.com/wechatpay-apiv3/wechatpay-java/blob/main/core/src/test/java/com/wechat/pay/java/core/cipher/AeadAesCipherTest.java)。

### R2 高：一次性码消费后没有建立H5会话

位置：server/src/routes/access.js:24-29；access-gate.js:76-78。

接口消费code后只返回JSON，不发网页会话Cookie；网页也未建立替代的持久授权通道。首次打开可能解锁，刷新复用已消费code会失败，无code同域跳页又只剩旧序列号Cookie查询。URL里的code也没有及时清理。

要求：使用专用交换接口消费短码并建立Secure、HttpOnly等属性正确的服务端网页会话；普通session接口查询此会话；交换后清理URL；过期、退出、撤销行为完整。授权必须在服务端验证。若采用其他方案，需同样证明连续导航和刷新稳定。

验收：已付费会员首次打开、刷新、学校详情、返回、进入解锁页均保持权益；分享已消费链接不能复制身份；过期会话可重新登录恢复。

### R3 高：订单状态和权益缺少可靠一致性

位置：server/src/routes/pay.js:166-174、193-195、249-257；server/src/store.js:read/write。

离线复现三项：

1. REFUNDED订单收到旧SUCCESS付款通知后重新成为PAID并恢复会员。
2. 模拟订单已写PAID但开通会员前进程中断，重试通知因已PAID跳过，权益仍缺失；query的PAID分支也直接返回。
3. 只退1分钱的成功退款也撤销全部会员，与代码声称的全额退款规则不一致；退款回调未核对商户、金额、币种和对应退款记录。

要求：实现明确的订单状态迁移和付款/退款事件幂等；使用事务或可恢复日志保证订单与权益一致；根据有效订单重新计算权益，避免一张退款单覆盖其他有效权益；补退款字段校验和已确认的部分退款规则。不能用恢复旧mock服务作为支付服务回滚。

验收：退款后旧通知不重新开通；中断重试可恢复；重复/乱序付款退款回调不会改变最终正确权益；退款与金额不符不处理。

### R4 高：前端没有随P0后端完整发布

本次SSH只读核查current仍指向ui-20261009-layoutfix。线上文件内容明确仍有：

- access-gate.js读取zk_token，而本地已改为zk_code。
- unlock/unlock.js仍通过config.accessMode==='enforce'显示演示，而本地已改demoEnabled。

SHA256（本地/线上）：

- access-gate.js：cac18d9a17ff8050355ea47b895f8c7559a3342b3d146d03783b86e94b4ef79f / cc784a40439bca25011509c1cbd654dc59af08ec797897ac8a7579df73a079ea
- unlock/unlock.js：2cc88901a45c32705453f9b6e8697bf89f47113dceda603661ab34269494ef50 / b969f5c94d58f50aa4efccd856dc806998e4a3d842b3016f54ebe5b2be85cd3f

要求：R1-R3修复后制作完整发布包，前端/后端/小程序约定一致；保留域名校验文件及原序列号入口保护；对发布文件做哈希核对并提交线上浏览器证据。先修逻辑再发布，不能仅更新缓存号。

### R5 高：小程序仍为连接正式域名的payMock模式

位置：miniprogram/app.js:4-16；utils/webpage.js:isPreview/open。

LOCAL_PREVIEW=true且PREVIEW仍指向正式HTTPS域名。预览分支继续将长期token放URL，并尝试已关闭的mock支付；注释声称仅回环地址，与实际配置不符。

要求：明确分离开发/测试/生产配置。生产构建发现payMock、mock路径或长期token URL时失败。缺商户配置时显示“暂未开放购买”，不要让用户沿不可完成的链路付款。测试环境不能复用生产会员数据。

## 后续补项

- pay/query请求需按微信官方查询接口补商户号参数，并验证HTTP状态、响应签名和订单一致性；当前路径只有out-trade-no。补单功能须在独立桩测试及真实联调分别验证。
- 创建订单在网络请求后才落本地记录，并发请求可同时越过“最近订单”检查；补原子订单占位和并发测试。
- 正式Express实际安装4.19.2，后续官方已有安全修复。升级到当前受支持修复版本，保存lockfile并跑npm audit，按实际使用路径评估影响。不能简单把旧版安装成功作为依赖验收。
- 日志/URL凭证脱敏、会话与限流记录清理、回调失败HTTP语义、签名时间与密钥标识策略均需纳入上线检查。
- 报告所述回滚会恢复公网mock，应删除此方案，改为保持旧序列号服务可用且关闭新购买入口的已知可用版本。

依赖依据：[Express官方安全更新](https://expressjs.com/en/advanced/security-updates.html)。本次未完成依赖树npm audit，不声称所有已列安全问题均可在当前路由利用。

## 可直接给WorkBuddy的执行指示

> 先修R1-R5，不继续扩展UI或直接接正式收款。以这份独立复验为准修正“P0全部完成”的报告。先运行server/test/codex-review-20261010.cjs，修到5项通过，再补真实协议回调、并发/乱序/重启恢复、H5跳页会话、生产构建和旧序列号的回归。不要删测试或弱化断言。发布前后核对前后端哈希，保留业务域名校验文件。回滚不能恢复公网mock。完成后提交测试日志、release、哈希、网页/真机证据和仍受商户配置阻塞的事项，再交Codex复验。

## 本次验证范围

新增离线复验脚本：server/test/codex-review-20261010.cjs。5项全部失败，结果是已复现缺陷，不是测试环境连接失败。测试使用系统临时目录、虚构身份与订单，不访问微信网络或生产数据。订单生命周期测试隔离验签解密，以单独检查状态处理逻辑。

线上仅SSH/HTTP只读检查，未创建用户、订单、序列号、退款或修改服务。未重跑原测试脚本（其中含对真实微信域名的假配置请求），未做完整依赖树扫描、真实支付、真机或旧用户浏览器验收。本次没有改业务实现，仅添加测试和验收文档。
