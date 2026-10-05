# 模拟助手动态界面改版

参考：https://ecomengine.framer.website/。本次已在本地应用深墨色导航、暖橙色主操作、浅色阅读卡片及轻微渐显动效。

## 已落地

- 首页：生成家长与孩子规划升学的插画；搜索学校前置；第一、第二批图示；第三第四批志愿表示意；三个步骤说明。
- 主工作区：三个使用方式入口（估分、已有计划、目标校）；三步导航；桌面条件摘要；页面间返回入口。
- 评估：完整保留合理度、录取机会、调整建议和导出；重新评估显示实际评分与学校位置变化。
- 学校查询：侧边快速预览近期录取、区域、性质、住宿、费用；可选批次和位置带入方案；进入完整档案后可返回原筛选或方案位置。
- 其他资料页：共享导航、按钮、卡片、字号与动效规范，保留前一版表单对齐机制。
- 手机：单列操作、全屏学校预览、底部导航；减少动态效果设置和打印支持。

## 素材

`assets/family-planning-20261005.webp`，1536×1024。由内置图像生成工具生成，原始图位于 `E:/codex/.codex/generated_images/019f8773-1257-7141-a5b2-c6e443fffbe0/exec-5700637a-a90f-4459-8cc0-695176c586bb.png`，网页采用压缩WebP。插画为场景示意，并非真实学生、校区或录取结果。第一、第二批图示采用界面原生SVG；志愿与流程示意采用可阅读HTML。

生成提示：Create a premium website illustration for a Chinese Guangzhou high-school admission planning assistant. Wide landscape 3:2 composition. Right side: a Chinese parent and teenager sitting together calmly at a desk planning education, an abstract laptop with simple unlabeled cards and a small warm-lit architectural school campus model, notebooks. Left side has generous dark ink navy negative space suitable for real HTML copy overlay. Sophisticated editorial 3D clay illustration, soft matte textures, ivory paper, warm vivid orange accents, dark navy background, gentle amber glow, tasteful and reassuring, no cartoon childishness. No text, no numbers, no logos, no watermarks, no graphs implying outcomes. High quality web hero illustration.

## 验证

- 13个页面×3个宽度，共39次表单对齐和横向溢出检查通过。
- `scripts/zhongkao/ui-dynamic-upgrade.mjs` 验证主视觉加载、方案生成、偏好切换真实变化、目标校分析、学校预览与关闭、手机返回筛选、学校带入及已有计划编辑。
- 核心规则、学校数据服务和家长文案17项单元测试通过。
- 独立构建及构建校验通过，招生数据版本仍为20261005-defefb03。
- 证据目录：`docs/qa-20261005-dynamic/`。测试使用隔离解锁响应，不绑定真实序列号或设备。

当前为本地改版及构建产物，未部署公网。视觉改版不提高模型预测准确率；仍需通过数据和规则核对改进预测。
