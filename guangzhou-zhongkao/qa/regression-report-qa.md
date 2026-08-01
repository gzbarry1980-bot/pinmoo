# 回归验证报告 —— 广州中考志愿模拟填报系统（UI/流程优化）

- 验证人：严过关（software-qa-engineer）
- 验证对象：`E:\pinmoo\guangzhou-zhongkao`
- 验证口径：本次优化只动 UI 与流程，**不得改动任何志愿填报/录取判断业务逻辑**（禁区：engine.js 与 data/*.json）
- 托管 node：`C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe`

---

## 一、核心结论

- **engine.js 字节级未变**（SHA256 一致、行数/字节一致）→ 志愿填报/录取判断逻辑**零改动**。
- **app.js 对 engine.js 的调用点与固定参数逐位一致**，无增删、无 seed/iterations 漂移。
- **确定性抽样（verify-engine.mjs）输出与基线逐位一致** → engine 纯函数可复现。
- 6 个文件语法检查全部通过；13 个建议生成函数仅做接线/渲染与排序筛选，未偷改 engine 调用；结构一致性（selected 概览卡、setWorkspaceMode、aria、移除 verify compact-back、保留 analysis→志愿表 链接）均通过。
- **路由判定：NoOne**（未发现业务逻辑 Bug）；存在 1 个观察项（data/ 新增未登记文件 first-batch-2026.json），不构成功逻辑回归，需团队确认是否允许。

---

## 二、逐项结果

### A. engine.js 字节级未变 —— ✅ PASS

```
certutil -hashfile "E:/pinmoo/guangzhou-zhongkao/engine.js" SHA256
SHA256 的 ...\engine.js 哈希:
fc8f643c936aa57bfbbe2926410e7592e877be4f7554743a637f6fedbfbebf60
```

- 实际 SHA256 = `fc8f643c936aa57bfbbe2926410e7592e877be4f7554743a637f6fedbfbebf60` == 期望 ✓
- `wc -l` = **388** ✓；`wc -c` = **22208** ✓
- 结论：engine.js 与基线完全一致，业务逻辑未改动（最硬指标通过）。

### B. data/ 未被改动 —— 基线文件 PASS；发现 1 个观察项 ⚠️

data/ 实际清单（15 文件）：
`admissions` · `allocations-2021…2026`(7) · `control-lines` · `first-batch-2026` · `manifest` · `schools` · `score-bands` · `sources` · `source-schools`

`docs/system_design.md` §1.1 基线清单（14 文件）：
`admissions / allocations-* / schools / score-bands / control-lines / sources / source-schools / manifest`

- 14 个基线文件**全部存在，无删除、无改名**。
- 14 个基线文件 mtime 均为 `Jul 22 11:43`，与项目其他未动文件一致，未被本次会话编辑。
- ⚠️ **观察项**：`first-batch-2026.json`（mtime `Jul 22 13:35`，与其余 11:43 不一致）**不在 §1.1 基线、也不在 data/manifest.json 的清单中**，属 data/ 目录的新增文件。经核查：
  - 仅被 `special/app.js`（allowed 区）消费：`const DATA_URL = '../data/first-batch-2026.json'`，fetch 于 L297；
  - **engine.js 不加载该文件**（engine.js 已字节级验证未变）；
  - 内容为“第一批录取结果”展示数据。
  - 因此该文件**不影响任何志愿填报/录取判断逻辑**，不构成业务逻辑回归。
- 处理建议：请团队/工程师确认 `first-batch-2026.json` 是否为 special/ 页面既有产品资产（设计文档未枚举），还是本次优化的意外新增。若在“data/ 一律不得修改”口径下要求零新增，则将其视为**流程偏差（非代码 Bug）**。

### C. app.js 调用点守恒 —— ✅ PASS

导入（L1，逐字一致）：
```js
import { BATCH_LIMITS, evaluatePlan, replayPlan, simulateOutcomes } from './engine.js';
```
导入清单 = 基线 `BATCH_LIMITS, evaluatePlan, replayPlan, simulateOutcomes`，无增删。

全文件 grep 到的 engine 调用点**仅 7 处**，逐位核对固定参数：

| 行 | 用途 | 调用 | 基线一致 |
|----|------|------|----------|
| L233 | 方向筛选 | `simulateOutcomes(profile, [slot], dataset, 20260722 + record.batch * 100 + position, 600)` | ✓ |
| L335 | 方向版主算 | `simulateOutcomes(profile, directionDraft, dataset, 20260722, 10000)` | ✓ |
| L336 | 方向评分 | `evaluatePlan(profile, directionDraft, directionAnalysis)` | ✓ |
| L450 | 目标校 | `simulateOutcomes(scoreProfile, [slot], dataset, 20260817, iterations)` | ✓ |
| L1040 | 求证 replay | `replayPlan(profile, plan, dataset)` | ✓ |
| L1041 | 求证主算 | `simulateOutcomes(profile, plan, dataset, 20260722, 10000)` | ✓ |
| L1042 | 求证评分 | `evaluatePlan(profile, plan, latestAnalysis)` | ✓ |

- 无任何额外/漂移的 engine 调用；seed 与 iterations 与 §1.3/C 基线逐位一致。
- `special/app.js`、`unlock/unlock.js` 均**未 import engine.js**（确认无绕过调用点）。

### D. 语法检查（node --check）—— ✅ PASS

```
== engine.js == OK
== app.js == OK
== navigation.js == OK
== special/app.js == OK
== unlock/unlock.js == OK
== qa/verify-engine.mjs == OK
```
6 个文件全部 0 错误。

### E. 确定性抽样 —— ✅ PASS

```
node E:/pinmoo/guangzhou-zhongkao/qa/verify-engine.mjs
[[3,1,5,"冲刺",5,20],[3,2,5,"冲刺",5,20],[4,1,5,"冲刺",5,20]]
```
- 实际输出与期望 sig **逐位一致** ✓
- 固定 seed 下 engine.js 纯函数输出可复现 → 逻辑未被改动。

### F. 建议生成函数结果集核查（code review）—— ✅ PASS

13 个函数均存在且定位明确：
`setWorkspaceMode`(137) · `getDirectionProfile`(157) · `directionScopeEligible`(187) · `directionPattern`(194) · `directionCandidates`(200) · `chooseDirectionSchool`(223) · `buildDirectionDraft`(246) · `getTargetProfile`(367) · `targetEligibleRecords`(396) · `targetChanceAtScore`(441) · `scoreForTargetChance`(453) · `targetVolunteerPosition`(466) · `targetSupportSchools`(473) · `buildTargetDraft`(488)

内部 engine 调用与基线一致：
- `chooseDirectionSchool` → `simulateOutcomes(..., 20260722 + batch*100 + position, 600)`（L233）
- `targetChanceAtScore` → `simulateOutcomes(..., 20260817, iterations)`（L450）
- `generateDirection` → `simulateOutcomes(..., 20260722, 10000)` + `evaluatePlan`（L335-336）
- 求证主算 → `replayPlan` / `simulateOutcomes(..., 20260722, 10000)` / `evaluatePlan`（L1040-1042）

函数体均为“过滤 / 排序 / 排名 / 构造草稿 / 渲染”类建议生成逻辑，**未对 engine 的 seed/iterations 做隐藏改动**。内部 Monte-Carlo 采样量（`scoreForTargetChance` 的 350、`targetChanceAtScore` 默认 800、主流程 1200）是 app.js 自身机会采样步数，作为第 5 参数传入 `simulateOutcomes`，属建议生成范畴，不改动录取判断；且 engine.js 字节级未变，真实模拟口径不变。

结论：建议生成函数仅接线/渲染/排序调整，未偷改业务逻辑。

### G. 结构一致性抽查 —— ✅ PASS

- `#selectedCount`（index.html L279）、`#selectedPreview`（L284）存在；常驻「已选 N 所」概览卡（`selected-overview`，L278-281）存在。
- `renderSelectedPreview`(L981)、`toggleSelectedPreview`(L990) 已定义，并在 L1395 绑定到 `#viewPlan`（`$('#viewPlan').addEventListener('click', toggleSelectedPreview)`）；`toggleSelectedPreview` 同步维护 `aria-expanded`（L995/998）。
- `window.setWorkspaceMode` 已在 L1445 暴露（`window.setWorkspaceMode = setWorkspaceMode`）。
- `navigation.js`：点击锚点时若目标隐藏且 `verifyWorkspace` 隐藏，先 `window.setWorkspaceMode('verify')` 再滚动（L60-64），逻辑正确（T02 锚点修复）。
- aria 属性完整（抽查 ≥15 处，举要）：
  - `nav` `aria-label`(L30)、`aria-current`(L31)
  - `workspace-tabs` `role="tablist"`(L72)；三 tab `role="tab"` + `aria-selected` + `aria-controls`(L73-75)；`setWorkspaceMode` 同步设置 `aria-selected`(L149-151)
  - 三 workspace `role="tabpanel"` + `aria-labelledby`(L79/138/185)
  - `selected-overview` `aria-expanded` + `aria-controls`(L278)；`toggleSelectedPreview` 维护 `aria-expanded`
  - `workflow-steps` `nav aria-label`(L192)；`data-direction-risk` 按钮 `aria-pressed`(L302)
  - `closeSources` `aria-label`(L363)；`toast` `role="status" aria-live`(L366)；`plan-coach` `aria-live`(L308)
  - 未发现 aria 属性丢失。
- verify 版冗余 compact-back 已删除：全文仅 2 处 `compact-back`（L123 direction、L172 target），均在非 verify 区；verify 区（L185-347）无 compact-back。
- analysis→志愿表 次要文字链保留：analysis 面板内 L324 `<a class="text-link-back" href="#volunteerForm" data-scroll-target="#volunteerForm">← 返回志愿表修改</a>` 存在。

---

## 三、路由判定

- **源码业务逻辑 Bug**：无（A/C/D/E 全 PASS，F/G PASS）。
- **测试/校验脚本自身 Bug**：无（verify-engine.mjs 正确产出基线 sig）。
- **→ 路由：NoOne。** 全部业务关键项通过，已知业务逻辑问题数 = 0。
- 观察项 1（非阻塞）：`data/first-batch-2026.json` 为 data/ 目录未登记新增文件，不影响录取判断，建议团队确认其是否属于 special/ 既有资产或需清理。

---

## 四、通过率与已知问题

- 业务关键验证项（A/C/D/E）：**100% 通过（4/4）**。
- 全量验证类目（A–G）：**7/7 通过**（核心要求），含 1 观察项（B 子项，非失败）。
- 已知业务逻辑问题：**0**。
