# Evaluation Report

## Overall Verdict: PASS

## Dimension Scores

| Dimension | Weight | Score | Verdict | Notes |
|---|---:|---:|---|---|
| Evidence & grounding | 30% | 9/10 | PASS | 核心规则均为招考办来源，实际案例由官方PDF交叉核验 |
| Synthesis quality | 20% | 9/10 | PASS | 明确区分规则回归、边界校验和概率训练 |
| Coverage & limitations | 20% | 9/10 | PASS | 覆盖普通批次和名额分配，明确缺少逐人完整志愿 |
| Coherence & usability | 15% | 9/10 | PASS | 研究结论已转成案例库、模型字段和测试 |
| Calibration & insight | 15% | 9/10 | PASS | 未将低分名校个案直接外推为概率 |

Weighted score: 9.0/10

## Critical issues

无阻断问题。后续如获得匿名化完整志愿与录取结果，应新增独立数据同意和去标识流程。

自动来源评分器因多数权威材料集中在 `gz.gov.cn` 判定“域名多样性不足”，并单独降低广州日报评分。本研究未为追求域名数量引入低质量来源；广州日报只用于定位具名案例，所有入库分数均由招考办官方PDF再次核验。

## Spot-checks

| # | Claim | Citation | Registry match | Evidence support | Verdict |
|---|---|---|---|---|---|
| 1 | 638分案例高于最低分仍因末位分落选 | [3] | 是 | 官方逐志愿案例 | Supported |
| 2 | 名额分配先梯度、再志愿、最后分数 | [2] | 是 | 官方问答明确说明 | Supported |
| 3 | 2026年679分录入华附知识城 | [4][5] | 是 | 媒体披露并由官方PDF确认 | Supported |
| 4 | 16个实际实例可逐条核验 | [4][5][6][7] | 是 | 自动测试已通过 | Supported |
| 5 | 个案不应直接改变概率 | [4][6] | 是 | 属方法判断，且局限已说明 | Supported |

## Final recommendation

- Publish as-is
