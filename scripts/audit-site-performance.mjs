import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const packages = process.env.LIGHTHOUSE_MODULES || 'C:/Users/Administrator/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules';
const { default: lighthouse } = await import(pathToFileURL(path.join(packages, 'lighthouse/core/index.js')));
const { launch } = await import(pathToFileURL(path.join(packages, 'chrome-launcher/dist/index.js')));
const origin = process.argv[2] || 'http://localhost:5188';
const label = process.argv[3] || 'local';
const runs = Number(process.argv[4] || 3);
const output = path.resolve('.qa/2026-09-07');
await fs.mkdir(output, { recursive: true });
const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox'], logLevel: 'error' });
const scores = [];
try {
  for (const route of ['/', '/services/geo-consulting/', '/contact/']) {
    for (let i = 0; i < runs; i++) {
      const result = await lighthouse(origin + route, { port: chrome.port, logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'seo'], formFactor: 'mobile', throttlingMethod: 'simulate' });
      const name = route.replace(/\W+/g, '-') || 'home';
      await fs.writeFile(path.join(output, `${label}-${name}-${i}.lighthouse.json`), JSON.stringify(result.lhr));
      const row = { route, run: i + 1, ...Object.fromEntries(Object.entries(result.lhr.categories).map(([key,value]) => [key, Math.round(value.score * 100)])), lcp: result.lhr.audits['largest-contentful-paint'].numericValue, cls: result.lhr.audits['cumulative-layout-shift'].numericValue, tbt: result.lhr.audits['total-blocking-time'].numericValue };
      scores.push(row); console.log(JSON.stringify(row));
    }
  }
} finally {
  await fs.writeFile(path.join(output, `${label}-performance.json`), JSON.stringify({ origin, conditions: 'Lighthouse mobile simulated throttling; laboratory data, not field INP', scores }, null, 2));
  try { await chrome.kill(); } catch (error) { console.warn('Chrome exited; temporary profile cleanup warning: ' + error.message); }
}
