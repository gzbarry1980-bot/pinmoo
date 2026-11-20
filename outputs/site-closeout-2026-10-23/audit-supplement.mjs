import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const modules = process.env.LIGHTHOUSE_MODULES || 'C:/Users/Administrator/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules';
const { default: lighthouse } = await import(pathToFileURL(path.join(modules, 'lighthouse/core/index.js')));
const { launch } = await import(pathToFileURL(path.join(modules, 'chrome-launcher/dist/index.js')));
const directory = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const output = path.join(directory, 'performance');
const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox'], logLevel: 'error' });
try {
  for (const [label, route] of [['image-ratio', '/'], ['service-replacement', '/services/']]) {
    const result = await lighthouse('https://pinmooconsulting.com' + route, {
      port: chrome.port, logLevel: 'error', formFactor: 'mobile', throttlingMethod: 'simulate',
      onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'], extraHeaders: { DNT: '1' }
    });
    await fs.writeFile(path.join(output, label + '.lighthouse.json'), JSON.stringify(result.lhr));
    assert.ok(!result.lhr.runtimeError, JSON.stringify(result.lhr.runtimeError));
    for (const category of ['performance', 'accessibility', 'seo']) {
      assert.ok(Number.isFinite(result.lhr.categories[category].score), category + ': missing score');
    }
    assert.equal(result.lhr.audits['image-aspect-ratio'].score, 1, 'Images are stretched');
    console.log(JSON.stringify({ route, performance: result.lhr.categories.performance.score,
      imageAspectRatio: 'passed', bestPractices: result.lhr.categories['best-practices'].score }));
  }
} finally {
  try { await chrome.kill(); } catch (error) { console.warn('Chrome cleanup: ' + error.message); }
}
