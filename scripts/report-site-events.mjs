import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { events, placements, pageIds } from './event-schema.mjs';

const groups = new Map();
for (const file of process.argv.slice(2)) {
  const buffer = fs.readFileSync(file);
  const text = (file.endsWith('.gz') ? gunzipSync(buffer) : buffer).toString('utf8');
  for (const line of text.split('\n').filter(Boolean)) {
    let row;
    try { row = JSON.parse(line); } catch { continue; }
    if (!events.includes(row.event) || !placements.includes(row.placement) || !pageIds.includes(row.page) || !/^\d{4}-\d{2}-\d{2}T/.test(row.time)) continue;
    const key = [row.time.slice(0, 10), row.event, row.page, row.placement].join(',');
    groups.set(key, (groups.get(key) || 0) + 1);
  }
}
console.log('date,event,page,placement,count');
for (const [key, count] of [...groups].sort(([a], [b]) => a.localeCompare(b))) console.log(key + ',' + count);
