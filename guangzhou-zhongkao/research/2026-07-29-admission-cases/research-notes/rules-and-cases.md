---
task_id: rules-and-cases
role: 广州中考规则研究
objective: 收集可复演的逐志愿官方案例
status: complete
confidence: high
sources_found: 3
acceptance_met: yes
---

## Sources

[1] 广州中考填报志愿简明指引 | https://gzzk.gz.gov.cn/gkmlpt/content/10/10831/post_10831970.html | Aut:10 Rec:10 Rel:10 Dep:9 = 9.8 | OFFICIAL | 2026-05
[2] 2026年广州市普通高中名额分配招生问答 | https://gzzk.gz.gov.cn/zkzz/zkxx/zkzx/content/post_10787238.html | Aut:10 Rec:10 Rel:10 Dep:10 = 10 | OFFICIAL | 2026-04
[3] 2024年广州市中考志愿填报问答 | https://gzzk.gz.gov.cn/zkzz/zkxx/zkzx/content/post_10257438.html | Aut:10 Rec:8 Rel:10 Dep:10 = 9.5 | OFFICIAL | 2024

## Findings (facts only)

- 官方建议结合校内排名变化判断考生处于哪一梯度和梯度内位置，不应只盯最低分；第一志愿重要，最后志愿应可兜底。[1]
- 2024年官方710分案例依次演示了低于第一志愿最低分、第二志愿晚于末位志愿序号、第三志愿受梯度保护录取。[3]
- 2024年官方638分案例还演示了“达到学校最低分但低于该志愿末位考生分数”仍落选，随后第四志愿受梯度保护录取。[3]
- 第二批名额分配同校竞争的比较顺序是先梯度、再志愿、最后分数；高分考生若高一梯度，第三志愿仍可先于低一梯度第一志愿，若处于同一梯度则第一志愿优先。[2]

## Analysis

- 系统必须同时判断梯度、志愿序号、学校最低分、末位考生分数和同分序号，单一“分差模型”不能复现官方案例。[2][3]
- “冲刺/匹配/保底”只能作为机会风险标签，不应让用户误解为平行志愿；具体建议必须落到每一梯度和志愿位置。[1][2]

## Support snippets / paraphrases for top claims

- Claim: 同梯度内第一志愿可能胜过分数更高的后续志愿。
  Source: [2]
  Support: 官方名额分配案例明确区分同梯度与不同梯度；同梯度时先处理第一志愿。
- Claim: 达到学校最低分不一定能录取。
  Source: [3]
  Support: 638分案例的第三志愿学校最低分622分，但第三志愿末位考生为642分，考生仍落选。

## Conflicts / unresolved issues

- 公开规则案例是教学用假设，并非匿名真实考生记录；适合规则回归，不适合概率校准。

## Gaps

- 官方未公开全体考生逐人志愿表，无法复原完整竞争队列。

