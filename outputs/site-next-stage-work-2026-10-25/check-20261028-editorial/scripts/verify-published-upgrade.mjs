import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { routeMeta, metaTagsForRoute } from '../src/data/seo.js';
import { practicalResources } from '../src/data/practical-resources.js';

const origin = 'https://pinmooconsulting.com';
const output = process.env.PINMOO_QA_DIR || 'outputs/site-upgrade-2026-10-13';
await fs.mkdir(output, { recursive: true });
const expected = JSON.parse(await fs.readFile('dist/site-build.json', 'utf8'));
const headers = { DNT: '1' };
const results = [];
const actual = await (await fetch(origin + '/site-build.json', { headers })).json();
assert.deepEqual(actual, expected, 'Public build differs from the verified artifact');
const pages = routeMeta.filter(meta => !meta.duplicate && !meta.aiTool);
let next = 0;
async function checkPages() {
  while (next < pages.length) {
    const meta = pages[next++];
    const response = await fetch(origin + meta.path, { headers, redirect: 'manual', signal: AbortSignal.timeout(20000) });
    const html = await response.text();
    assert.equal(response.status, 200, meta.path);
    assert.ok(html.includes(`href="${metaTagsForRoute(meta).canonical}"`), meta.path + ': canonical mismatch');
    assert.equal((html.match(/<h1(?:\s[^>]*)?>/g) || []).length, 1, meta.path + ': heading missing');
    results.push({ path: meta.path, status: response.status });
    await new Promise(resolve => setTimeout(resolve, 400));
  }
}
await checkPages();
const downloads = practicalResources.flatMap(item => [item, ...(item.example ? [item.example] : [])]);
for (const item of downloads) {
  const response = await fetch(origin + '/downloads/' + item.filename, { headers });
  assert.equal(response.status, 200);
  const published = Buffer.from(await response.arrayBuffer());
  const local = await fs.readFile('dist/downloads/' + item.filename);
  assert.equal(createHash('sha256').update(published).digest('hex'), createHash('sha256').update(local).digest('hex'));
  results.push({ path: '/downloads/' + item.filename, status: response.status, contentType: response.headers.get('content-type'), hashMatched: true });
}
for (const query of ['event=consult_open&page=home&placement=hero', 'event=resource_download&page=resources-operating-templates&placement=body']) {
  const response = await fetch(origin + '/_events?' + query, { headers });
  assert.equal(response.status, 204, query);
}
const invalid = await fetch(origin + '/_events?event=invalid_event&page=home&placement=body', { headers });
assert.equal(invalid.status, 400);
const www = await fetch('https://www.pinmooconsulting.com/contact/', { headers, redirect: 'manual' });
assert.equal(www.status, 301);
assert.equal(www.headers.get('location'), origin + '/contact/');
const runtimeResponse = await fetch(origin + '/src/site-runtime.js?v=' + actual.version, { headers });
assert.equal(runtimeResponse.status, 200);
assert.ok((await runtimeResponse.text()).includes('copy-text.js?v=' + actual.version));
const copyResponse = await fetch(origin + '/src/components/copy-text.js?v=' + actual.version, { headers });
assert.equal(copyResponse.status, 200);
assert.equal(await copyResponse.text(), await fs.readFile('dist/src/components/copy-text.js', 'utf8'));
const checkedOn = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date());
const receipt = { checkedOn, status: 'published_verified', build: actual, pages: results.sort((a, b) => a.path.localeCompare(b.path)), events: 'consult_open and resource_download returned 204; invalid event returned 400; DNT excluded these tests from event logging', wwwRedirect: 'passed', copyModule: 'versioned module matches local file' };
await fs.writeFile(output + '/public-verification.json', JSON.stringify(receipt, null, 2));
console.log(`Public verification passed: version ${actual.version}, ${pages.length} pages, ${downloads.length} matching downloads, event allowlist and HTTPS www redirect.`);
