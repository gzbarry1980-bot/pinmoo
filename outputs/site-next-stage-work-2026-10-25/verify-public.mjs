import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { routeMeta } from '../../src/data/seo.js';
const origin = 'https://pinmooconsulting.com';
const buildDir = process.argv[2] || 'dist';
const results = [];
const hash = body => createHash('sha256').update(body).digest('hex');
for (const route of routeMeta.filter(item => !item.aiTool && !item.duplicate)) {
  await new Promise(resolve => setTimeout(resolve, 450));
  const response = await fetch(origin + route.path, { redirect: 'manual', headers: { DNT: '1' }, signal: AbortSignal.timeout(20000) });
  const body = Buffer.from(await response.arrayBuffer());
  const expected = await fs.readFile(buildDir + '/' + route.file);
  results.push({ path: route.path, status: response.status, hashMatched: hash(body) === hash(expected) });
}
const build = await (await fetch(origin + '/site-build.json')).json();
const record = { checkedAt: new Date().toISOString(), build, pages: results.length, failures: results.filter(item => item.status !== 200 || !item.hashMatched), results };
const output = process.argv[3] || './public-verification.json';
await fs.writeFile(new URL(output, import.meta.url), JSON.stringify(record, null, 2));
console.log(JSON.stringify({ build, pages: record.pages, failures: record.failures }));
if (record.failures.length) process.exitCode = 1;
