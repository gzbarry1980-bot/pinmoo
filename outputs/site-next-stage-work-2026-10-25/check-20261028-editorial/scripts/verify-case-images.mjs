import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { cases } from '../src/data/cases.js';

const origin = 'https://pinmooconsulting.com';
const output = process.env.PINMOO_QA_DIR || 'outputs/case-images-2026-10-13';
await fs.mkdir(output, { recursive: true });
const headers = { DNT: '1' };
const receipt = { checkedAt: new Date().toISOString(), origin, pages: [], images: [] };
const expected = JSON.parse(await fs.readFile('dist/site-build.json', 'utf8'));
async function read(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, url);
  const bytes = Buffer.from(await response.arrayBuffer());
  await new Promise(resolve => setTimeout(resolve, 400));
  return bytes;
}
receipt.build = JSON.parse((await read(origin + '/site-build.json')).toString('utf8'));
assert.deepEqual(receipt.build, expected, 'Published release must match the tested build');
for (const lang of ['', '/en']) {
  for (const route of ['/', '/cases/', ...cases.map(item => '/cases/' + item.slug + '/')]) {
    const url = origin + lang + route;
    const html = (await read(url)).toString('utf8');
    assert.ok(!html.includes('/assets/visuals/contact-diagnosis-flow.webp'), url + ': contact visual used as case image');
    if (route === '/' || route === '/cases/') {
      assert.ok(html.includes('/assets/cases/chenpi-brand-geo-diagnosis.webp'), url + ': chenpi preview missing');
    } else {
      const item = cases.find(item => route === '/cases/' + item.slug + '/');
      assert.ok(html.includes(item.image), url + ': wrong case image');
      assert.ok(html.includes('content="' + origin + item.image + '"'), url + ': wrong share image');
      if (item.imageIllustration) assert.ok(html.includes(lang ? 'AI-generated category illustration' : 'AI 生成的品类场景示意'), url + ': illustration disclosure missing');
    }
    receipt.pages.push({ url, passed: true });
  }
}
for (const item of cases) {
  const image = item.image.replace(/\.png$/, '.webp');
  const actual = await read(origin + image);
  const local = await fs.readFile('dist' + image);
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash(actual), hash(local), image + ': published image differs');
  receipt.images.push({ slug: item.slug, image, hashMatched: true });
}
await fs.writeFile(output + (process.env.PINMOO_QA_DIR ? '/case-images-public.json' : '/public-verification.json'), JSON.stringify(receipt, null, 2));
console.log(`Case images verified: ${receipt.pages.length} pages, ${receipt.images.length} distinct images, release ${receipt.build.version}.`);
