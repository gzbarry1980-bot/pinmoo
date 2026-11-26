import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const file = path => new URL(path, import.meta.url);
const read = path => readFileSync(file(path), 'utf8').replace(/^\uFEFF/, '');
const json = path => JSON.parse(read(path));
const current = json('./private/native-observations.json');
const octoberBrand = json('../geo-native-baseline-2026-10-19/private/native-results.json');
const octoberProvider = json('../geo-provider-baseline-2026-10-23/private/results.json');
const domestic = ['Doubao', 'DeepSeek', 'Yuanbao'];
const overseas = ['ChatGPT', 'Perplexity'];
const localQs = ['CN_B', 'PI02', 'PI01'];
const englishQs = ['EN_B', 'EN_LOCAL', 'EN_REFUND'];
const rows = current.rows;
const count = (items, condition) => items.filter(condition).length;
const names = s => /品沐|\bpinmoo\b/i.test(s);
const official = s => {
  try { return new URL(s).hostname === 'pinmooconsulting.com'; }
  catch { return false; }
};
const sample = (items, platform, questionId) => items.filter(x => x.platform === platform && x.questionId === questionId);
assert.equal(octoberBrand.length, 144);
assert.equal(octoberProvider.length, 36);
assert.equal(rows.length, 24);
assert.equal(new Set(rows.map(x => x.conversation)).size, 24);
assert.equal(new Set(rows.map(x => [x.platform, x.questionId, x.repeat].join(':'))).size, 24);
assert.deepEqual(current.blocked.map(x => [x.platform, x.attemptedQuestions, x.answers]), [['Gemini', 0, null]]);
for (const x of rows) {
  assert.equal(typeof x.answerNamesBrand, 'boolean');
  assert.ok(x.notes && x.officialUrls.every(official));
}
for (const p of [...domestic, ...overseas]) {
  const cn = domestic.includes(p);
  for (const q of cn ? localQs : englishQs)
    assert.deepEqual(sample(rows, p, q).map(x => x.repeat).sort(), cn ? [1, 2] : [1]);
}
const doc = read('./原生问答对照.md');
for (const q of Object.values(current.prompts)) assert.ok(doc.includes(q));
for (const x of octoberProvider.filter(x => ['PI01', 'PI02'].includes(x.questionId))) {
  assert.ok(x.complete && x.promptVerified);
  assert.equal(x.question, current.prompts[x.questionId]);
}
const oldBrand = octoberBrand.filter(x => x.probeId === 'Q-what-is-pinmoo-consulting');
assert.equal(oldBrand.length, 6);
assert.ok(oldBrand.every(x => x.promptVerified && x.question === current.prompts.CN_B));
const provider = {};
for (const q of ['PI02', 'PI01']) {
  const old = octoberProvider.filter(x => x.questionId === q);
  const now = rows.filter(x => x.questionId === q);
  assert.equal(old.length, 6);
  assert.equal(now.length, 6);
  provider[q] = [count(old, x => names(x.answer)), count(now, x => x.answerNamesBrand)];
}
const directBrand = [
  count(oldBrand.filter(x => x.platform === 'DeepSeek'), x => x.inlineCitations.some(c => official(c.url))),
  count(sample(rows, 'DeepSeek', 'CN_B'), x => x.sourceKind === 'inline-link' && x.officialUrls.length > 0),
];
const refundsWithSite = count(rows.filter(x => x.questionId === 'PI01'), x => x.officialUrls.length > 0);
assert.deepEqual(provider, { PI02: [5, 6], PI01: [1, 1] });
assert.deepEqual(directBrand, [0, 2]);
assert.equal(refundsWithSite, 4);
const english = Object.fromEntries(overseas.map(p => [p, englishQs.map(q => sample(rows, p, q)[0].answerNamesBrand)]));
assert.deepEqual(english, { ChatGPT: [true, true, false], Perplexity: [true, false, false] });

const reports = ['品沐GEO现况与下一阶段计划.md', '搜索与后台实测.md', '原生问答对照.md'];
for (const r of reports) {
  for (const match of read(r).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (!target.startsWith('https://') && !target.startsWith('#'))
      assert.ok(existsSync(file(target)), 'Missing report link in ' + r + ': ' + target);
  }
}
console.log(JSON.stringify({ date: current.auditDate, validAnswers: rows.length,
  domestic: count(rows, x => domestic.includes(x.platform)), overseas: count(rows, x => overseas.includes(x.platform)),
  octoberVsNovemberBodyMentions: provider, deepSeekSameBrandQuestionOfficialInline: directBrand,
  novemberDomesticRefundAnswersWithSiteURL: refundsWithSite, englishQuestions: englishQs, englishBodyMentions: english,
  unavailable: current.blocked.map(x => x.platform), checkedReports: reports.length }, null, 2));
