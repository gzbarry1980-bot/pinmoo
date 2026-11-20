import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const directory = 'outputs/site-identity-2026-10-20/private';
const read = async file => JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
const raw = await read(directory + '/events-first-seven-days.json');
const qa = await read('outputs/site-phase2-work-2026-10-18/event-ui-verification.json');
assert.equal(raw.from, '2026-10-13');
assert.equal(raw.to, '2026-10-19');
const totals = { ...raw.totals };
const deductions = [];
const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });
for (const action of qa.uiChecks.filter(row => row.testedAt)) {
  const date = day.format(new Date(action.testedAt));
  const group = raw.groups.find(row => row.date === date && row.event === action.event && row.page === action.page && row.placement === action.placement);
  assert.ok(group?.count >= 1, 'Previously documented QA action not found: ' + action.event);
  assert.ok(totals[action.event] >= 1);
  totals[action.event]--;
  deductions.push({ date, event: action.event, page: action.page, placement: action.placement, count: 1, basis: 'Documented native UI QA action; server-event observation recorded in previous receipt' });
}
assert.equal(deductions.length, 4);
const result = {
  generatedAt: new Date().toISOString(), from: raw.from, to: raw.to, timezone: raw.timezone,
  rawTotals: raw.totals, knownQaDeductions: deductions, adjustedRecordedActions: totals,
  limits: [
    'Page views and other actions may still contain QA, repeated or automated accesses.',
    'Daily aggregates cannot identify all QA page views, and no user identifier exists for deduplication.',
    'The remainder is not a verified count of customers, leads or unique visitors.',
    'Today is not included in this seven-complete-day window.'
  ]
};
await fs.writeFile(directory + '/events-known-qa-adjusted.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ raw: result.rawTotals, deducted: deductions.length, remainingRecordedActions: totals }, null, 2));
