import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { routeMeta } from '../src/data/seo.js';

const origin = 'https://pinmooconsulting.com';
const paths = routeMeta.filter(meta => !meta.duplicate && !meta.aiTool && !meta.path.startsWith('/en/'));
const results = [];
for (const meta of paths) {
  const path = '/zh' + meta.path;
  const response = await fetch(origin + path, {
    redirect: 'manual', headers: { DNT: '1' }, signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, 301, path);
  assert.equal(response.headers.get('location'), origin + meta.path, path);
  results.push({ path, status: response.status, location: response.headers.get('location') });
  await new Promise(resolve => setTimeout(resolve, 150));
}
for (const path of ['/zh?source=legacy', '/zh/contact/?service=geo-report']) {
  const response = await fetch(origin + path, { redirect: 'manual', headers: { DNT: '1' } });
  assert.equal(response.status, 301, path);
  assert.equal(response.headers.get('location'), origin + path.replace(/^\/zh\/?/, '/'), path);
}
for (const path of ['/not-a-pinmoo-page-404/', '/zh/not-a-pinmoo-page-404/']) {
  const response = await fetch(origin + path, { headers: { DNT: '1' } });
  assert.equal(response.status, 404, path);
}
const receipt = {
  checkedAt: new Date().toISOString(), status: 'published_verified',
  scope: 'Legacy /zh prefix only; destination content was verified by the full public route scan.',
  results, queryPreservation: 'passed', missingPages: '404 after following legacy redirect',
};
const output = process.env.PINMOO_QA_DIR || 'outputs/site-phase2-work-2026-10-18';
await fs.writeFile(output + '/legacy-route-verification.json', JSON.stringify(receipt, null, 2));
console.log(`Legacy Chinese routes passed: ${results.length} permanent redirects; query strings retained; unknown routes remain 404.`);
