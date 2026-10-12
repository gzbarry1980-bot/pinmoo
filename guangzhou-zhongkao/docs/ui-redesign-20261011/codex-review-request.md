# Codex 复验包（交 Codex 独立验收）

> 本文件为「UI Designer（像素君）+ WorkBuddy」完成的改版交付物，按任务书 D-4「交 Codex 复验后再正式发布」整理。  
> 复验范围：UI 改版（2026-10-11）。**复验通过前请勿上生产。**

---

## 一、交付物清单（均在本目录 `docs/ui-redesign-20261011/`）

| 文件 | 内容 |
|---|---|
| `interaction-inventory.md` | A 节：全站 11+ 页面点击区域真实盘点（含 P1–P5 问题分类与截图证据路径） |
| `design-system.md` | B 节：统一设计令牌（色彩/字号/按钮/入口卡/学校卡/折叠/触控/返回规则） |
| `mockups/mobile-all.html` | C 节：手机 6 屏高保真稿（首页/求证版 3 步/学校列表/学校详情） |
| `mockups/desktop-all.html` | C 节：电脑 2 屏高保真稿（首页 4 入口/工作区） |
| `mockups/index.html` | 高保真稿索引 |
| `expert-review.md` | 像素君复核记录：三痛点解决逐项比对 + 自动化证据 |
| `acceptance-checklist.md` | E 节 11 项验收打勾 + 证据 + 待验收标注 |
| `screenshots/` | 22 张真实渲染截图（11 页面 × 手机 390/桌面 1440） |
| `_verify.mjs` / `_overflow-check.mjs` / `_capture.mjs` | 回归/溢出/截图脚本（可复跑） |
| `verify-log.txt` / `overflow-log.txt` | 最近一次自动化结果 |

核心样式文件：`ui-redesign-20261011.css`（站点根目录，由 `site-shell.js` 在 `experience.css` 之后注入，无 `!important`）。

---

## 二、Codex 需独立复验的事项

### 三痛点（用户原话）
1. **文字像入口却不能点** —— 确认：首页入口卡整卡同链接、学校卡主资料区与操作按钮分离、批次卡/招生卡整卡同入口、折叠 summary 去伪按钮。
2. **按钮位置不清楚** —— 确认：三步步骤栏三态清晰、verify 无重复主按钮（仅 1 个主 CTA）、`.form-actions` 左返回右主 CTA。
3. **流程返回困难** —— 确认：学校详情返回按钮存在且从 verify 进入时动态改文案/去向、底部导航当前页高亮、返回不丢草稿。

### E 节 11 项（逐项独立确认，不要只信本文件结论）
- ① 入口卡四区域同去向　② 学校卡动作不串　③ 四入口流程顺序　④ 返回不丢草稿
- ⑤ 单一主 CTA + 反馈　⑥ 无横向溢出（含 200% 缩放）　⑦ 触控尺寸 + 键盘焦点
- ⑧ 键盘不遮挡 + 无双底部导航　⑨ 返回原位置 + 首页回首页　⑩ 三态隔离验证
- ⑪ **真机/小程序预览（当前待验收，必须真实补测，浏览器参数不可替代）**

### 关键约束复核（任务书范围）
- 未改算法评分 / 录取规则 / 招生数据 / 支付后端（`engine.js`、`data/*.json` 为禁区，字节级未动）。
- 保留序列号与会员兼容；解锁/会员页仅调呈现，未改价格/收款/授权判断。
- 复用现有引擎、数据契约、路由、草稿存储。

---

## 三、Codex 可复跑的验证命令（项目根目录执行）

```bash
# 交互回归（需本机 Chrome + playwright-core，结果写入 verify-log.txt）
node docs/ui-redesign-20261011/_verify.mjs

# 响应式溢出（360/390/430/1440 × 4 页面，结果写入 overflow-log.txt）
node docs/ui-redesign-20261011/_overflow-check.mjs

# 重拍真实截图（22 张，写入 screenshots/）
node docs/ui-redesign-20261011/_capture.mjs
```

> 运行环境：本机 `C:/Program Files/Google/Chrome/Application/chrome.exe`；`playwright-core` 位于 `C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules/`。脚本内已硬编码路径与端口（8137 截图 / 8138 回归 / 8139 溢出），不冲突。

---

## 四、当前已知待办（复验前后必须处理）

1. **⑪ 真机/小程序预览**：本轮仅浏览器 + `zk_inmini` 参数，未完成真机实操。Codex 复验时若环境允许，请在微信开发者工具/真机打开 `/verify/`、`/schools/`、`/my/`，确认无双底部导航、键盘不遮挡、入口卡点击准确，并回填 `acceptance-checklist.md` 第 ⑪ 项。
2. **3 位真实家长体验**：开发者自测已单独标注，未编造家长结果；发布前需补真实体验记录。
3. **非致命 404**：控制台 1 条 404（favicon/图标类），建议补资源或忽略，避免噪声。
4. **正式发布**：复验通过后，由负责人按现有部署流程上线（当前为本地预览，未上生产）。

---

## 五、诚实声明

- 本交付由 WorkBuddy 落地代码 + 自动化回归，UI Designer（像素君）做结构/交互复核；**所有调用记录与证据均为真实产物，未虚构专家参与或测试结果**。
- 模型不可直接读取 PNG 像素，截图由真实 Chrome 渲染存档供人工/Codex 做视觉比对；像素君的逐项比对以「自动化断言 + 落地 DOM 结构 + 设计令牌」为准，已在 `expert-review.md` 透明说明。
- 真机预览与家长体验两项在 `acceptance-checklist.md` 明确标注「待验收」，未以浏览器模拟冒充真机证据。
