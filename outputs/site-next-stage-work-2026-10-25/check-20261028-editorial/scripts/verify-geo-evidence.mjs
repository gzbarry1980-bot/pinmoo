import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GEO_EVIDENCE_HOOKS, SITE } from '../src/data/site.js';
import { cases } from '../src/data/cases.js';
import { geoServiceModules, serviceFaqs } from '../src/data/services.js';
import { insights } from '../src/data/insights.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

function compactLength(value) {
  return Array.from(String(value || '').replace(/\s/g, '')).length;
}

function requireText(value, label) {
  if (!value || !String(value).trim()) fail(`${label}: 缺少内容`);
}

if (SITE.primaryDomain !== 'https://pinmooconsulting.com') {
  fail('primaryDomain 必须保持 pinmooconsulting.com');
}

if (geoServiceModules.length !== 6) {
  fail(`GEO 服务模块应为 6 个，当前 ${geoServiceModules.length} 个`);
}

for (const module of geoServiceModules) {
  const label = module.title || module.code;
  for (const field of ['text', 'evidence', 'boundary', 'action', 'deliverable']) {
    requireText(module[field], `${label}.${field}`);
  }
  if (['evidence', 'boundary', 'action'].some((field) => /待补|占位|示例/.test(module[field]))) {
    fail(`${label}: CEBA 字段包含占位内容`);
  }
}

if (GEO_EVIDENCE_HOOKS.length < 4) {
  fail(`引用事实句至少需要 4 条，当前 ${GEO_EVIDENCE_HOOKS.length} 条`);
}

for (const hook of GEO_EVIDENCE_HOOKS) {
  const label = hook.title || '(missing title)';
  requireText(hook.title, `${label}.title`);
  requireText(hook.text, `${label}.text`);
  const length = compactLength(hook.text);
  if (length < 40 || length > 180) fail(`${label}: 引用事实句长度 ${length}，应在 40-180 字之间`);
  if (/待补|占位|示例|平均提升|行业领先/.test(hook.text)) fail(`${label}: 引用事实句包含未核验表达`);
}

const geoFaqs = serviceFaqs.filter((item) => /GEO|AI 推荐|搜索排名/.test(item.q + item.a));
if (geoFaqs.length < 2) fail('服务页至少需要 2 条 GEO 相关 FAQ');
for (const faq of geoFaqs) {
  if (compactLength(faq.a) < 40) fail(`FAQ 答案过短：${faq.q}`);
}

const serializedCases = JSON.stringify(cases);
const forbiddenClaims = [
  '【待补',
  '[待补',
  '8 个消费品牌',
  '平均使品牌',
  '样本 8 家',
  '行业领先'
];
for (const claim of forbiddenClaims) {
  if (serializedCases.includes(claim)) fail(`案例数据包含未核验占位或业绩表达：${claim}`);
}

for (const article of insights) {
  const serialized = JSON.stringify(article);
  if (/【待补|\[待补|样本 8 家|8 个消费品牌|平均使品牌/.test(serialized)) {
    fail(`洞察文章包含未核验占位：${article.slug}`);
  }
}

const aiContext = JSON.parse(await fs.readFile(path.join(root, 'public', 'ai-context.json'), 'utf8'));
const profile = JSON.parse(await fs.readFile(path.join(root, 'public', 'pinmoo-profile.json'), 'utf8'));
if (!aiContext.evidencePolicy || aiContext.publicEvidenceHooks?.length !== GEO_EVIDENCE_HOOKS.length) fail('public/ai-context.json 缺少完整证据政策或事实句');
if (!profile.evidencePolicy) fail('public/pinmoo-profile.json 缺少 evidencePolicy');
if (aiContext.canonicalDomain !== SITE.primaryDomain) fail('ai-context.json 的 canonicalDomain 与主域名不一致');
if (aiContext.evidenceSnapshot?.verifiedFormalGeoDiagnoses !== 1) fail('ai-context.json 缺少已核验正式 GEO 诊断基线');
if (profile.evidenceSnapshot?.verifiedFormalGeoDiagnoses !== 1) fail('pinmoo-profile.json 缺少已核验正式 GEO 诊断基线');

const geoCase = cases.find((item) => item.slug === 'chenpi-brand-geo-diagnosis');
if (!geoCase?.evidence?.boundary || !/尚未|不发布|不得|未经|不属于/.test(geoCase.evidence.boundary)) fail('新会陈皮 GEO 案例缺少明确结果边界');
if (!insights.some((item) => item.slug === 'geo-evidence-ledger-publication-rules')) fail('缺少 GEO 证据台账公开规则文章');

const llms = await fs.readFile(path.join(root, 'public', 'llms-full.txt'), 'utf8');
if (!llms.includes('## Evidence policy') || !llms.includes('CEBA')) fail('public/llms-full.txt 缺少证据政策');

if (failures.length) {
  console.error(`GEO 证据门禁失败，共 ${failures.length} 项：`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`GEO 证据门禁通过：${geoServiceModules.length} 个服务模块，${GEO_EVIDENCE_HOOKS.length} 条引用事实句，${insights.length} 篇洞察文章已检查。`);
