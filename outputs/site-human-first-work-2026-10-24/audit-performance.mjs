import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const modules = 'C:/Users/Administrator/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules';
const { default: lighthouse } = await import(pathToFileURL(modules + '/lighthouse/core/index.js'));
const { launch } = await import(pathToFileURL(modules + '/chrome-launcher/dist/index.js'));
const out = new URL(process.env.AUDIT_ORIGIN ? './performance-compressed/' : './performance/', import.meta.url);
await fs.mkdir(out, { recursive: true });
const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox'], logLevel: 'error' });
const results = [];
try {
  for (const [name, route] of [['home', '/'], ['services', '/services/'], ['insights', '/insights/']]) {
    if (process.argv[2] && name !== process.argv[2]) continue;
    for (let run = 1; run <= 3; run++) {
      const { lhr } = await lighthouse((process.env.AUDIT_ORIGIN || 'http://localhost:5191') + route, { port: chrome.port, logLevel: 'error', formFactor: 'mobile', throttlingMethod: 'simulate', onlyCategories: ['performance', 'seo', 'accessibility'] });
      await fs.writeFile(new URL(name + '-' + run + '.json', out), JSON.stringify(lhr));
      if (lhr.runtimeError) throw Error(JSON.stringify(lhr.runtimeError));
      const entry = { name, run, performance: lhr.categories.performance.score * 100, seo: lhr.categories.seo.score * 100, accessibility: lhr.categories.accessibility.score * 100, lcp: lhr.audits['largest-contentful-paint'].numericValue, cls: lhr.audits['cumulative-layout-shift'].numericValue };
      results.push(entry);
      console.log(JSON.stringify(entry));
    }
  }
} finally {
  await fs.writeFile(new URL('../performance-results' + (process.env.AUDIT_ORIGIN ? '-compressed' : '') + (process.argv[2] ? '-' + process.argv[2] : '') + '.json', out), JSON.stringify(results, null, 2));
  try { await chrome.kill(); } catch (error) { console.warn('Chrome cleanup: ' + error.code); }
}
