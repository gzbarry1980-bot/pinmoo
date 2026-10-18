import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateEvents } from './report-site-events.mjs';

const row = (time, event = 'consult_open', extra = {}) => JSON.stringify({ time, event, page: 'home', placement: 'hero', ...extra });

test('inclusive reporting dates use Beijing time across UTC midnight', () => {
  const report = aggregateEvents([[
    row('2026-10-17T15:59:59Z'), row('2026-10-17T16:00:00Z'),
    row('2026-10-18T15:59:59Z'), row('2026-10-18T16:00:00Z')
  ].join('\n')], { from: '2026-10-18', to: '2026-10-18' });
  assert.equal(report.totals.consult_open, 2);
  assert.deepEqual(report.observedDates, ['2026-10-18']);
  assert.equal(report.groups[0].date, '2026-10-18');
});

test('malformed and unapproved records are excluded and arbitrary fields never exported', () => {
  const report = aggregateEvents([[
    'bad json', 'null', row('invalid'), row('2026-10-18T01:00:00Z', 'private-text'),
    row('2026-10-18T01:00:00Z', 'page_view', { ip: 'private-input', note: 'private-input' })
  ].join('\n')]);
  assert.equal(report.skippedRows, 4);
  assert.equal(report.totals.page_view, 1);
  assert.ok(!JSON.stringify(report).includes('private-input'));
});

test('invalid date ranges are rejected instead of producing an empty healthy report', () => {
  assert.throws(() => aggregateEvents([], { from: '2026-02-30' }));
  assert.throws(() => aggregateEvents([], { from: '2026-10-20', to: '2026-10-18' }));
});
