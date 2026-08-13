# GEO 报告优化实施记录

日期：2026-08-13  
主站：<https://pinmooconsulting.com/>

## 本轮已落地到源码

- 在关于页、Organization JSON-LD、`ai-context.json`、`pinmoo-profile.json`、`llms.txt` 和 `llms-full.txt` 中统一“广州品沐咨询有限公司 / PINMOO / 品沐咨询”的实体关系。
- 明确说明本官网的“品沐咨询”不等同于品沐家居、品沐瑜伽、江苏品慕或其他近似名称主体，降低品牌消歧错误。
- 新增两个垂直服务主题页：茶叶电商顾问、新会陈皮电商顾问。页面包含直接回答、判断依据、适用范围、限制条件、FAQ、Service/FAQ 结构化数据和内部链接。
- 新增两篇垂直经营洞察：茶叶品牌 GEO 内容框架、新会陈皮可信表达方法。文章采用“直接回答—证据依据—适用范围—限制条件—行动建议—FAQ”的 CEBA 结构，并加入茶叶/陈皮主题簇。
- 将两个垂直主题同步进核心 URL、服务清单、列表页清单、`ai.txt`、站点机器可读资源和构建生成的 sitemap。
- 将两篇洞察同步进 `ai-context.json`、`pinmoo-profile.json`、`llms.txt` 和 `llms-full.txt`，避免正文已发布但 AI 入口没有索引。
- 对茶叶、陈皮相关内容明确证据边界，不补写未经确认的功效、产地、年份、检测或案例结果。

## 仍需要站外完成的工作

- 企查查、爱企查、天眼查、百科或行业目录：需要在真实账号中补充官方域名，并确保主体名称、地址和联系电话一致。
- 亿邦动力、36 氪、人人都是产品经理、刀法等第三方内容：需要真实投稿、联合案例或公开采访后再把已发布链接作为引用信号；不能用自建页面替代第三方背书。
- GEO 监测：按月保存固定探测题、提及率、引用页面、事实准确率和询盘来源，区分直接归因、辅助影响和未知。
- 生产发布：当前只完成源码和本地构建验证；Netlify 额度恢复前不执行生产部署。

## 验收方式

```text
npm run verify:international
npm run verify:content
git diff --check
```

验收通过后，再由生产部署渠道发布到 `pinmooconsulting.com`，并在 Google Search Console 提交 sitemap 和重点新页面。
