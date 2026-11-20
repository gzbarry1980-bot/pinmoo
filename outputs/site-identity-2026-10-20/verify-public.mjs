import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SITE } from '../../src/data/site.js';
import { identityFiles } from '../../scripts/sync-site-identity.mjs';

const origin = SITE.primaryDomain;
const get = pathname => fetch(origin + pathname, {
  headers: { DNT: '1' }, redirect: 'manual', signal: AbortSignal.timeout(20000)
});
const digest = content => createHash('sha256').update(content).digest('hex');
const files = [...identityFiles, 'about/index.html', 'services/index.html', 'contact/index.html',
  'en/about/index.html', 'en/services/index.html', 'en/contact/index.html'];
const receipt = { checkedAt: new Date().toISOString(), origin, files: [], redirects: [], privacy: {} };
for (const file of files) {
  const pathname = file.endsWith('index.html') ? '/' + file.replace('index.html', '') : '/' + file;
  const response = await get(pathname);
  assert.equal(response.status, 200, pathname);
  const published = Buffer.from(await response.arrayBuffer());
  assert.equal(digest(published), digest(await fs.readFile('dist/' + file)), pathname + ': content differs');
  receipt.files.push({ path: pathname, status: response.status, hashMatched: true });
}
for (const pathname of ['/zh/about/', '/zh/contact/?source=identity-check']) {
  const response = await get(pathname);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), origin + pathname.replace('/zh', ''));
  receipt.redirects.push({ path: pathname, status: 301, location: response.headers.get('location') });
}
for (const pathname of ['/outputs/geo-native-baseline-2026-10-19/private/native-results.json', '/scripts/test-site-identity.mjs']) {
  const response = await get(pathname);
  assert.equal(response.status, 404, pathname);
  receipt.privacy[pathname] = response.status;
}
receipt.build = await (await get('/site-build.json')).json();
assert.deepEqual(receipt.build, JSON.parse(await fs.readFile('dist/site-build.json', 'utf8')));
receipt.status = 'published_identity_verified';
await fs.writeFile('outputs/site-identity-2026-10-20/identity-public-verification.json', JSON.stringify(receipt, null, 2));
console.log('Passed: five identity assets and six pages match; old /zh redirects, source/private 404 and public build verified.');
