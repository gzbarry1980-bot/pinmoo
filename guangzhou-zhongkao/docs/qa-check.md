# QA 回归校验清单（engine.js 与 data/ 不得改动）

> 本文件由架构师提供，供 QA 在 UI/流程优化后验证「业务逻辑未变」。
> 核心原则：engine.js 校验和、调用点、建议结果集三者全部守恒。

## 0. engine.js 基线（改前已记录，改后必须一致）
```
SHA256: fc8f643c936aa57bfbbe2926410e7592e877be4f7554743a637f6fedbfbebf60
行数: 388   字节: 22208
```
```bash
certutil -hashfile engine.js SHA256        # Windows
sha256sum engine.js                        # Linux/Mac
wc -l engine.js && wc -c engine.js
```
> 校验和任一变化 = 违规，立即回滚。

## 1. 语法检查（改后所有 JS）
```bash
node --check engine.js
node --check app.js
node --check navigation.js
node --check special/app.js
node --check unlock/unlock.js
```

## 2. 调用点守恒（grep，须与基线一致）
```bash
grep -n "from './engine.js'" app.js
grep -n "simulateOutcomes\|evaluatePlan\|replayPlan\|BATCH_LIMITS" app.js
```
期望命中（行号可能随重构微移，但调用形态与参数必须一致）：
- `simulateOutcomes(profile, directionDraft, dataset, 20260722, 10000)`   （方向版主算）
- `simulateOutcomes(profile, [slot], dataset, 20260722 + batch*100 + position, 600)`  （方向筛选）
- `simulateOutcomes(scoreProfile, [slot], dataset, 20260817, iterations)`  （目标校）
- `simulateOutcomes(profile, plan, dataset, 20260722, 10000)`   （求证主算）
- `replayPlan(profile, plan, dataset)`   （历史复盘）
- `evaluatePlan(profile, directionDraft, directionAnalysis)` / `evaluatePlan(profile, plan, latestAnalysis)`

## 3. 确定性抽样（纯函数 + 固定 seed）
`qa/verify-engine.mjs`（仅验证用，不入生产）：
```js
import { simulateOutcomes, evaluatePlan } from '../engine.js';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../data/admissions.json', import.meta.url)));
const schools = JSON.parse(readFileSync(new URL('../data/schools.json', import.meta.url)));
const bands = JSON.parse(readFileSync(new URL('../data/score-bands.json', import.meta.url)));
const lines = JSON.parse(readFileSync(new URL('../data/control-lines.json', import.meta.url)));
const manifest = JSON.parse(readFileSync(new URL('../data/manifest.json', import.meta.url)));

// 取 3 所真实学校构造 15 槽
const pick = ['华南师范大学附属中学（石牌校区）','广州市第二中学','广州市第六中学（海珠校区）']
  .map(n => schools.find(s => s.name === n)?.id).filter(Boolean);
const plan = [
  { key:'b3-1', batch:3, position:1, schoolId:pick[0], schoolName:'A' },
  { key:'b3-2', batch:3, position:2, schoolId:pick[1], schoolName:'B' },
  { key:'b4-1', batch:4, position:1, schoolId:pick[2], schoolName:'C' },
];
const profile = { mode:'forecast', targetYear:2027, score:710, scoreLow:700, scoreHigh:720,
  tieRank:null, candidateType:'户籍生', admissionDistrict:'天河区', householdDistrict:'天河区',
  schoolDistrict:'天河区', sourceSchoolId:'', referenceGrade:'C', riskPreference:'均衡',
  ownershipPreference:'不限', boardingPreference:'不限', maxAnnualFee:null,
  preferredDistricts:['天河区'], excludedSchools:[], crossDistrict:false,
  quotaEligible:false, notAdmittedFirstBatch:true };

const ds = { admissions:data, allocations:[], bands, lines, manifest,
  schools, sourceSchools:[], sources:[] };
const out = simulateOutcomes(profile, plan, ds, 20260722, 10000);
// 稳定序列化关键结果
const sig = out.slotResults.map(r => [r.batch, r.position, r.chance, r.tier, r.interval[0], r.interval[1]]);
console.log(JSON.stringify(sig));
```
> 改前/改后各跑一次，`sig` 必须逐位一致（seed 固定 → 可复现）。

## 4. 建议结果集守恒（方向/目标校最终学校集合）
`qa/snapshot-direction.mjs`：用相同输入分别调用 `buildDirectionDraft(getDirectionProfile())` 与 `buildTargetDraft(...)`，导出 `plan.map(s=>[s.batch,s.position,s.schoolId])` 的 JSON 快照。改前/改后 diff 比对，须逐位一致。
> 这些函数在 app.js 可重构结构，但最终 `schoolId` 集合不得变化。

## 5. 全站功能冒烟 + 文案/无障碍守恒
- [ ] 三入口（方向/目标校/求证）各走通
- [ ] 求证四步 profile→school→plan→analysis 走通，步骤器状态正确
- [ ] 导出/导入/打印可用
- [ ] special/、unlock/ 主流程可用
- [ ] 对照 `assets/previews/*.webp` 真实截图人工比对
- [ ] diff 核对：所有 `aria-label`/`role`/`aria-selected`/`aria-controls`/`aria-current` 未丢失或错配
- [ ] global-nav「学校筛选/模拟志愿表」在非 verify 模式点击可正确跳转
```
