import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { identityFiles } from '../../scripts/sync-site-identity.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const origin = 'https://pinmooconsulting.com';
const get = url => fetch(url, { headers: { DNT: '1' }, redirect: 'manual', signal: AbortSignal.timeout(20000) });
const hash = value => createHash('sha256').update(value).digest('hex');
const receipt = { checkedAt: new Date().toISOString(), files: [], redirects: [], privatePaths: [] };
for (const file of [...identityFiles, 'index.html', 'en/index.html']) {
  const pathname = file.endsWith('index.html') ? '/' + file.replace('index.html', '') : '/' + file;
  const response = await get(origin + pathname);
  assert.equal(response.status, 200, pathname);
  const actual = Buffer.from(await response.arrayBuffer());
  assert.equal(hash(actual), hash(await fs.readFile('dist/' + file)), pathname + ': wrong content');
  receipt.files.push({ path: pathname, status: response.status, hashMatched: true });
}
for (const [from, to] of [
  ['https://pinmoo.top/', origin + '/'],
  [origin + '/zh/contact/?source=closeout', origin + '/contact/?source=closeout']
]) {
  const response = await get(from);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), to);
  receipt.redirects.push({ from, to, status: response.status });
}
for (const pathname of ['/scripts/test-case-preview.mjs', '/outputs/geo-provider-baseline-2026-10-23/private/results.json']) {
  const response = await get(origin + pathname);
  assert.equal(response.status, 404);
  receipt.privatePaths.push({ path: pathname, status: response.status });
}
receipt.build = await (await get(origin + '/site-build.json')).json();
assert.equal(receipt.build.version, '0de6e8ca8c');
await fs.writeFile(path.join(directory, 'identity-and-compatibility.json'), JSON.stringify(receipt, null, 2));
console.log('Passed: five identity assets, two homepages, short-domain and legacy redirects, source/private 404.');
