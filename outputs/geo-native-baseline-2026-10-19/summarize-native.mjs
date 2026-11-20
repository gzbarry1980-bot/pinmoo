import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const root = path.dirname(fileURLToPath(import.meta.url));
const questions = JSON.parse(await fs.readFile(path.join(root, '../site-upgrade-2026-10-13/geo-probes.json'), 'utf8')).questions;
const records = JSON.parse(await fs.readFile(path.join(root, 'private/native-results.json'), 'utf8'));
const sessions = JSON.parse(await fs.readFile(path.join(root, 'private/session-status.json'), 'utf8').catch(() => '{}'));
const guest = JSON.parse(await fs.readFile(path.join(root, 'private/guest-exploratory.json'), 'utf8').catch(() => '{"records":[]}'));
const invalidated = JSON.parse(await fs.readFile(path.join(root, 'private/invalidated-observations.json'), 'utf8').catch(() => '[]'));
const platforms = ['Doubao', 'DeepSeek', 'Yuanbao'];
const keys = new Set();
const conversations = new Set();
const byId = new Map(questions.map(q => [q.id, q]));
const owned = url => {
  try { return ['pinmooconsulting.com', 'www.pinmooconsulting.com'].includes(new URL(url).hostname); }
  catch { return false; }
};

for (const record of records) {
  const q = byId.get(record.probeId);
  assert.ok(q, 'Unknown probe: ' + record.probeId);
  assert.equal(record.question, q.question, 'Frozen wording differs');
  assert.equal(record.group, q.group);
  assert.ok(platforms.includes(record.platform));
  assert.ok([1, 2].includes(record.repeat));
  assert.equal(record.status, 'COLLECTED_NATIVE_UI');
  assert.equal(record.auth, 'logged_in', 'Guest observations belong in the separate exploratory file');
  assert.ok(record.answer?.trim(), 'Missing full answer');
  assert.ok(Number.isFinite(Date.parse(record.capturedAt)));
  const key = [record.probeId, record.platform, record.repeat].join('|');
  assert.ok(!keys.has(key), 'Duplicate observation: ' + key);
  keys.add(key);
  assert.ok(record.screenshot, 'Missing screenshot path');
  const screenshot = path.resolve(root, record.screenshot);
  assert.ok(screenshot.startsWith(path.join(root, 'private') + path.sep), 'Screenshot outside evidence directory');
  await fs.access(screenshot);
  assert.equal(record.promptVerified, true, 'Original prompt must be checked');
  assert.equal(record.observedPrompt, q.question, 'Observed prompt differs');
  const conversation = new URL(record.conversationUrl);
  assert.equal(conversation.protocol, 'https:');
  assert.ok(!conversation.pathname.includes('/local_'), 'Pending local conversation is not final evidence');
  const conversationKey = record.platform + '|' + conversation.href;
  assert.ok(!conversations.has(conversationKey), 'Independent conversations required: ' + conversationKey);
  conversations.add(conversationKey);
}

const coverage = [];
for (const q of questions) for (const platform of platforms) for (const repeat of [1, 2]) {
  const r = records.find(row => row.probeId === q.id && row.platform === platform && row.repeat === repeat);
  coverage.push({
    probe_id: q.id, group: q.group, question: q.question, platform, repeat,
    status: r ? 'COLLECTED_NATIVE_UI' : sessions.platforms?.[platform]?.status === 'AUTH_REQUIRED' ? 'NOT_COLLECTED_AUTH_REQUIRED' : 'NOT_COLLECTED',
    captured_at: r?.capturedAt || '', mode: r?.mode || '', auth: r?.auth || '',
    brand_string_detected: r ? /品沐|pinmoo/i.test(r.answer) : '',
    owned_inline_citations: r ? (r.inlineCitations || []).filter(x => owned(x.url)).length : '',
    owned_reference_cards: r ? (r.referenceCards || []).filter(x => owned(x.url)).length : '',
    owned_label_widgets_unresolved: r ? (r.inlineCitationWidgets || []).filter(x => /pinmoocons/i.test(x.text) && !x.url).length : '',
    fact_accuracy: 'NOT_SCORED',
    conversation_url: r?.conversationUrl || '', evidence: r?.screenshot || '',
  });
}
const strata = new Map();
for (const r of records) {
  const key = [r.platform, r.auth, r.mode].join(' / ');
  const s = strata.get(key) || { key, count: 0, category: 0, brand: 0, categoryStringMentions: 0, ownedInlineAnswers: 0, ownedReferenceAnswers: 0, ownedLabelWidgetAnswers: 0 };
  s.count++;
  s[r.group]++;
  if (r.group === 'category' && /品沐|pinmoo/i.test(r.answer)) s.categoryStringMentions++;
  if ((r.inlineCitations || []).some(x => owned(x.url))) s.ownedInlineAnswers++;
  if ((r.referenceCards || []).some(x => owned(x.url))) s.ownedReferenceAnswers++;
  if ((r.inlineCitationWidgets || []).some(x => /pinmoocons/i.test(x.text) && !x.url)) s.ownedLabelWidgetAnswers++;
  strata.set(key, s);
}
const sourceCounts = new Map();
const captureDays = new Map();
const dayFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' });
for (const r of records) {
  const key = [dayFormatter.format(new Date(r.capturedAt)), r.platform, r.repeat].join('|');
  captureDays.set(key, (captureDays.get(key) || 0) + 1);
}
for (const r of records) for (const field of ['inlineCitations', 'referenceCards']) {
  for (const u of new Set((r[field] || []).map(x => x.url).filter(owned))) {
    const key = field + '|' + u;
    sourceCounts.set(key, { type: field, url: u, answers: (sourceCounts.get(key)?.answers || 0) + 1 });
  }
}
const summary = {
  generatedAt: new Date().toISOString(), plannedCells: coverage.length,
  collectedCells: records.length, notCollectedCells: coverage.length - records.length,
  observedPromptChecks: records.filter(r => r.promptVerified).length,
  screenshotFilesChecked: records.length,
  independentConversationsChecked: conversations.size,
  captureWindow: records.length ? {
    firstCapturedAt: records.map(r => r.capturedAt).sort()[0],
    lastCapturedAt: records.map(r => r.capturedAt).sort().at(-1),
    timezone: 'Asia/Shanghai',
    byDayPlatformRepeat: [...captureDays].map(([key, count]) => {
      const [date, platform, repeat] = key.split('|');
      return { date, platform, repeat: Number(repeat), count };
    }),
    restoredPreviousDayConversations: records.filter(r => r.recoveryNote).length,
  } : null,
  guestExploratoryExcluded: guest.records.length,
  invalidatedObservationsExcluded: invalidated.length,
  platformCoverage: platforms.map(platform => ({
    platform, expectedCells: questions.length * 2,
    collectedCells: records.filter(r => r.platform === platform).length,
    completeQuestionPairs: questions.filter(q => [1, 2].every(repeat => records.some(r => r.platform === platform && r.probeId === q.id && r.repeat === repeat))).length,
    status: sessions.platforms?.[platform]?.status || 'UNKNOWN',
  })),
  partialSourceCapture: records.filter(r => r.sourceCaptureLimit).map(r => ({ probeId: r.probeId, platform: r.platform, repeat: r.repeat, limitation: r.sourceCaptureLimit })),
  strata: [...strata.values()], ownedSources: [...sourceCounts.values()],
  limits: [
    'Brand-string detection requires entity review; lookalike companies may be false positives.',
    'Explicit-brand prompts are not evidence of unsolicited recommendations.',
    'Reference cards are not equivalent to inline citations.',
    'Unresolved citation widgets are reported separately; zero parsed inline links does not mean no visible citation label.',
    'No fact-accuracy score, before/after gain or business outcome inferred.',
    'Missing answers are excluded, not filled with zero.',
  ],
};
const sheet = XLSX.utils.json_to_sheet(coverage);
const csvPath = path.join(root, 'private/coverage-144.csv');
await fs.writeFile(csvPath, '\ufeff' + XLSX.utils.sheet_to_csv(sheet));
const csvText = (await fs.readFile(csvPath, 'utf8')).replace(/^\ufeff/, '');
const roundtripBook = XLSX.read(csvText, { type: 'string', FS: ',' });
const roundtripRows = XLSX.utils.sheet_to_json(roundtripBook.Sheets[roundtripBook.SheetNames[0]]);
assert.equal(roundtripRows.length, coverage.length, 'CSV row count differs');
assert.equal(roundtripRows.filter(r => r.status === 'COLLECTED_NATIVE_UI').length, records.length);
for (const row of roundtripRows) assert.equal(row.question, byId.get(row.probe_id)?.question, 'UTF-8 question roundtrip differs');
summary.csvRoundtrip = 'passed: decoded UTF-8 text, frozen questions and row counts';
await fs.writeFile(path.join(root, 'private/summary.json'), JSON.stringify(summary, null, 2));
const beijing = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
const lines = [
  '# 官网原生AI实测覆盖表', '',
  `生成时间：${beijing}（北京时间）。冻结题库24题、3个平台、每题2次，共144个计划组合。`, '',
  `当前取得${records.length}条原生回答，${coverage.length - records.length}个组合未采集；未采集不填成0次提及。截图文件存在检查${records.length}份通过，${summary.observedPromptChecks}条已增加实际题目配对核对。`, '',
  `另外保留${guest.records.length}条访客探索回答及${invalidated.length}条隔离记录，均不进入主基线分母；分组前快照及隔离截图仍在private目录。`, '',
  '采集跨日期时按实际保存时间分层；恢复昨日原会话不等于今日重新生成。模式、个人账号及搜索结果可能随时间变化，不将跨日样本说成同一时刻的对照。', '',
  '| 保存日期（北京时间） | 平台 | 轮次 | 回答数 |',
  '| --- | --- | ---: | ---: |',
  ...summary.captureWindow.byDayPlatformRepeat.map(s => `| ${s.date} | ${s.platform} | ${s.repeat} | ${s.count} |`), '',
  '## 计划完成度', '',
  '| 平台 | 已取得 / 计划回答 | 两次均完成的题目数 / 24 | 当前状态 |',
  '| --- | ---: | ---: | --- |',
  ...summary.platformCoverage.map(s => `| ${s.platform} | ${s.collectedCells} / ${s.expectedCells} | ${s.completeQuestionPairs} / 24 | ${s.status === 'AUTH_REQUIRED' ? '待用户登录后补齐' : s.status === 'COLLECTION_COMPLETE_48' ? '回答采集完成' : s.status} |`), '',
  '## 按条件分组', '',
  '| 平台 / 登录 / 可见模式 | 回答数 | 类别题 | 品牌题 | 类别题含品牌字样 | 官网正文链接可解析 | 官网样式标签URL未解析 | 参考列表含官网 |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...summary.strata.map(s => `| ${s.key} | ${s.count} | ${s.category} | ${s.brand} | ${s.categoryStringMentions} | ${s.ownedInlineAnswers} | ${s.ownedLabelWidgetAnswers} | ${s.ownedReferenceAnswers} |`), '',
  '正文标签按可见DOM记录；缩略标签不凭文字猜目标URL，也不直接映射到参考列表某一页。其他平台未额外计数的非链接标签不按0解释。', '',
  '“含品牌字样”只是文本检查，需要排除近似名称主体；品牌题显式给出了品沐，不等于自然推荐。各模式、登录状态分组解释，不汇总成跨平台效果提升率。', '',
  '本组多数类别题在问经营方法，部分为文章标题式措辞，并非直接要求推荐服务商；结果只解释本组已测问题，不外推全部商业搜索场景。扩展服务商推荐题须另建版本与基线。', '',
  '## 官网来源', '',
  ...summary.ownedSources.map(s => `- ${s.type === 'inlineCitations' ? '正文链接' : '参考列表'}：${s.url}，出现在${s.answers}条回答中。`), '',
  '原始回答、会话地址和截图仅内部保存。参考列表不等于每个具体论断都有对应正文引用。没有核算事实准确率、业务转化或前后提升比例。', '',
  '## 后续边界', '',
  '- DeepSeek与豆包遇到登录要求时停止对应请求，不绕过；未取得的组合继续留空。',
  '- 登录前访客回答作为探索组留存；若重新建立登录后完整基线，应移至独立探索文件，不混算。',
  '- 隔离的错配记录不进入本表；正确回答须按原会话实际题目重新核对。',
  '- 本次是首次基线及重复采样，不是官网改版的前后效果对照。',
  '- 以人为本的正文、可抓取页面和清晰来源仍优先于继续增加专用AI文件；Google官方说明不要求此类特殊文件，但该说明不能代替对国内AI平台的实际测量。',
  '  来源：[Google官方说明](https://developers.google.com/search/docs/appearance/ai-features)', '',
];
await fs.writeFile(path.join(root, 'private/实测覆盖与观察.md'), lines.join('\n'));
console.log(JSON.stringify(summary, null, 2));
