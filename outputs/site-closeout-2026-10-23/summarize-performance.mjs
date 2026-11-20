import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const performance = path.join(directory, 'performance');
const read = name => fs.readFile(path.join(performance, name), 'utf8').then(JSON.parse);
const median = values => values.toSorted((a, b) => a - b)[1];
const valid = report => !report.runtimeError && ['performance', 'accessibility', 'seo']
  .every(key => Number.isFinite(report.categories[key]?.score))
  && ['largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift']
    .every(key => Number.isFinite(report.audits[key]?.numericValue));

const receipt = {
  checkedAt: new Date().toISOString(), siteVersion: '0de6e8ca8c',
  conditions: 'Mobile Lighthouse simulated throttling; three valid runs per route. Laboratory data, not field INP.',
  excludedRuns: [], before: [], after: [],
  fieldData: { status: 'INSUFFICIENT_DATA', source: 'https://pagespeed.web.dev/analysis/https-pinmooconsulting-com/fjvvw6hikc?form_factor=mobile',
    observation: 'PSI mobile real-user section showed no data on 2026-10-23. Its single lab result belongs to pre-fix version 4e56d1ac2a.' }
};
for (const prefix of ['published-20261023', 'after-20261023']) {
  for (const route of ['/', '/services/', '/contact/']) {
    const files = [0, 1, 2].map(index => `${prefix}-${route.replace(/\W+/g, '-')}-${index}.lighthouse.json`);
    const reports = [];
    for (const file of files) {
      const report = await read(file);
      if (valid(report)) reports.push(report);
      else receipt.excludedRuns.push({ file, reason: report.runtimeError?.code || 'MISSING_SCORE_OR_METRIC' });
    }
    if (prefix === 'after-20261023' && route === '/services/' && reports.length === 2) {
      const replacement = await read('service-replacement.lighthouse.json');
      assert.ok(valid(replacement));
      reports.push(replacement);
      files.push('service-replacement.lighthouse.json');
    }
    assert.equal(reports.length, 3, `${prefix} ${route}: requires three valid runs`);
    const row = { route, validRuns: reports.length, files,
      performance: median(reports.map(r => Math.round(r.categories.performance.score * 100))),
      accessibility: median(reports.map(r => Math.round(r.categories.accessibility.score * 100))),
      seo: median(reports.map(r => Math.round(r.categories.seo.score * 100))),
      lcpMs: Math.round(median(reports.map(r => r.audits['largest-contentful-paint'].numericValue))),
      tbtMs: median(reports.map(r => r.audits['total-blocking-time'].numericValue)),
      cls: median(reports.map(r => r.audits['cumulative-layout-shift'].numericValue)) };
    receipt[prefix === 'published-20261023' ? 'before' : 'after'].push(row);
  }
}
const image = await read('image-ratio.lighthouse.json');
assert.ok(valid(image));
assert.equal(image.audits['image-aspect-ratio'].score, 1);
receipt.imageAudit = { imageAspectRatio: 'PASSED', bestPractices: Math.round(image.categories['best-practices'].score * 100), runs: 1 };
await fs.writeFile(path.join(directory, 'performance-summary.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ after: receipt.after, excludedRuns: receipt.excludedRuns, imageAudit: receipt.imageAudit }, null, 2));
