import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { events, placements, pageIds } from './event-schema.mjs';

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' });

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function aggregateEvents(texts, { from, to } = {}) {
  if ((from && !validDate(from)) || (to && !validDate(to)) || (from && to && from > to)) throw new Error('Use a valid inclusive YYYY-MM-DD date range.');
  const groups = new Map();
  const totals = Object.fromEntries(events.map(event => [event, 0]));
  const retainedDates = new Set();
  const observedDates = new Set();
  let skippedRows = 0;
  for (const text of texts) {
    for (const line of text.split('\n').filter(Boolean)) {
      let row;
      try { row = JSON.parse(line); } catch { skippedRows++; continue; }
      const time = typeof row?.time === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(row.time) ? new Date(row.time) : null;
      if (!time || !Number.isFinite(time.valueOf()) || !events.includes(row.event) || !placements.includes(row.placement) || !pageIds.includes(row.page)) { skippedRows++; continue; }
      const day = dayFormat.format(time);
      retainedDates.add(day);
      if ((from && day < from) || (to && day > to)) continue;
      observedDates.add(day);
      const key = [day, row.event, row.page, row.placement].join(',');
      groups.set(key, (groups.get(key) || 0) + 1);
      totals[row.event]++;
    }
  }
  return {
    timezone: 'Asia/Shanghai', from: from || null, to: to || null,
    retainedDates: [...retainedDates].sort(), observedDates: [...observedDates].sort(), skippedRows, totals,
    groups: [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([key, count]) => {
      const [date, event, page, placement] = key.split(',');
      return { date, event, page, placement, count };
    }),
    interpretation: 'Recorded actions only; no unique visitors, enquiries or sales inferred. Missing dates do not establish zero traffic; QA may be included.'
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const options = {};
  const files = [];
  let json = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--json') json = true;
    else if (arg === '--from' || arg === '--to') {
      const value = args[++index];
      if (!value || !validDate(value)) throw new Error(arg + ' requires YYYY-MM-DD.');
      options[arg.slice(2)] = value;
    } else if (arg.startsWith('--')) throw new Error('Unknown option: ' + arg);
    else files.push(arg);
  }
  if (!files.length) throw new Error('Pass event log files (plain text or .gz).');
  const texts = files.map(file => {
    const buffer = fs.readFileSync(file);
    return (file.endsWith('.gz') ? gunzipSync(buffer) : buffer).toString('utf8');
  });
  const result = { generatedAt: new Date().toISOString(), filesRead: files.length, ...aggregateEvents(texts, options) };
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('date,event,page,placement,count');
    for (const row of result.groups) console.log([row.date, row.event, row.page, row.placement, row.count].join(','));
  }
}
