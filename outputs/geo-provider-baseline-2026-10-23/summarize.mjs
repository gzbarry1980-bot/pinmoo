import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const evidence = path.join(directory, 'private');
const frozen = JSON.parse(await fs.readFile(path.resolve(directory, '../geo-native-baseline-2026-10-19/provider-intent-extension-v1.json'), 'utf8'));
const rows = JSON.parse(await fs.readFile(path.join(evidence, 'results.json'), 'utf8'));
const platforms = ['DeepSeek', 'Doubao', 'Yuanbao'];
const keys = new Set();
const conversations = new Set();
const officialHost = url => {
  try { return ['pinmooconsulting.com', 'www.pinmooconsulting.com'].includes(new URL(url).hostname); }
  catch { return false; }
};
for (const row of rows) {
  const question = frozen.questions.find(q => q.id === row.questionId);
  assert.ok(question && platforms.includes(row.platform));
  assert.equal(row.question, question.question);
  assert.ok([1, 2].includes(row.round));
  assert.equal(row.key, `${row.platform}-${row.questionId}-r${row.round}`);
  assert.ok(row.loggedIn && row.promptVerified && row.promptVisible && row.complete);
  assert.equal(row.siteVersion, '0de6e8ca8c');
  assert.ok(row.answer.length >= 150 && Number.isFinite(Date.parse(row.capturedAt)));
  const url = new URL(row.conversationUrl);
  const host = { DeepSeek: 'chat.deepseek.com', Doubao: 'www.doubao.com', Yuanbao: 'yuanbao.tencent.com' }[row.platform];
  assert.equal(url.hostname, host);
  assert.ok(url.pathname.includes('/chat/') && !url.pathname.endsWith('/chat/'));
  assert.ok(!keys.has(row.key) && !conversations.has(row.conversationUrl));
  keys.add(row.key); conversations.add(row.conversationUrl);
  assert.ok([row.key + '.png', row.key + '.jpg'].includes(row.screenshot));
  const bytes = await fs.readFile(path.join(evidence, row.screenshot));
  assert.ok(bytes.length > 1000);
  assert.equal(row.screenshot.endsWith('.png') ? bytes.subarray(0, 8).toString('hex') : bytes.subarray(0, 3).toString('hex'),
    row.screenshot.endsWith('.png') ? '89504e470d0a1a0a' : 'ffd8ff');
}
const groups = platforms.map(platform => {
  const selected = rows.filter(row => row.platform === platform);
  return { platform, valid: selected.length, target: 12,
    brandMentionKeys: selected.filter(row => /品沐|pinmoo/i.test(row.answer)).map(row => row.key),
    officialUrlKeys: selected.filter(row => [...row.inlineLinks, ...row.renderedExternalLinks].some(link => officialHost(link.url))).map(row => row.key),
    officialDomainCardKeys: selected.filter(row => row.sourceCards.some(card => /pinmooconsulting\.com/i.test(card.cardText))).map(row => row.key),
    personalizationKeys: selected.filter(row => /你茶叶|你之前|你此前|你做的|你的.*陈皮/.test(row.answer)).map(row => row.key),
    missing: frozen.questions.flatMap(question => [1, 2].filter(round => !keys.has(`${platform}-${question.id}-r${round}`)).map(round => ({ questionId: question.id, round }))) };
});
const summary = { checkedAt: new Date().toISOString(), protocol: frozen.version, siteVersion: '0de6e8ca8c',
  status: rows.length === 36 ? 'COLLECTION_COMPLETE_36' : 'PARTIAL', valid: rows.length, target: 36,
  firstCapture: rows.map(row => row.capturedAt).toSorted()[0], lastCapture: rows.map(row => row.capturedAt).toSorted().at(-1),
  groups,
  boundaries: ['Independent extension, not an uplift comparison with the original 144 answers.',
    'Logged-in accounts may personalize answers; a new conversation is not an anonymous test.',
    'Mention, visible URL and non-link source cards are separate observations, not endorsements or overall accuracy scores.',
    'Supplier names and claims in generated answers are not verified company facts.'] };
await fs.writeFile(path.join(evidence, 'summary.json'), JSON.stringify(summary, null, 2));
const table = groups.map(group => `| ${group.platform} | ${group.valid}/12 | ${group.brandMentionKeys.length} | ${group.officialUrlKeys.length} | ${group.officialDomainCardKeys.length} |`).join('\n');
await fs.writeFile(path.join(directory, '采样进度.md'), `# 独立扩展采样进度\n\n2026-10-23，北京时间。状态：${summary.status}，有效${rows.length}/36。题文、独立会话、截图文件格式及版本检查已通过。\n\n| 平台 | 有效组合 | 回答正文出现品沐 | 可见链接含官网URL | 非链接来源卡含官网域名 |\n| --- | --- | --- | --- | --- |\n${table}\n\n以上四列不能相加当作推荐率。元宝的来源卡没有暴露目标URL，不推测对应具体页面。豆包出现结合账号茶叶/陈皮背景的回答，保留个性化影响；未据此计算自然推荐或增长幅度。未运行的组合只列为缺失，不记零分。原始回答、具体会话地址和逐条结果均在private内，不公开。\n`);
console.log(JSON.stringify({ status: summary.status, valid: summary.valid, groups: groups.map(group => ({ ...group, missing: group.missing.length })) }, null, 2));
