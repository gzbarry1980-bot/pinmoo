import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { routeMeta } from '../src/data/seo.js';
import { insights } from '../src/data/insights.js';

const modulePath = process.env.PLAYWRIGHT_MODULE || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(modulePath));
const origin = process.env.QA_ORIGIN || 'http://localhost:5188';
const output = path.resolve('.qa/2026-09-07');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = { origin, checkedAt: new Date().toISOString(), layouts: [], errors: [], interactions: [] };
const routes = [...new Set(routeMeta.filter(route => !route.duplicate && !route.aiTool).map(route => route.path))];
const keyRoutes = ['/', '/services/', '/services/geo-consulting/', '/cases/', '/about/', '/contact/', '/insights/', '/en/', '/en/contact/', '/insights/geo-seo-paid-media-coordination/'];
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => results.errors.push(error.message));
  for (const width of [360, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const route of (width === 390 || width === 1440 ? routes : keyRoutes)) {
      const response = await page.goto(origin + route, { waitUntil: 'load' });
      assert.equal(response.status(), 200, route);
      const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, h1: document.querySelectorAll('main h1').length }));
      results.layouts.push({ width, route, ...dimensions });
      assert.equal(dimensions.h1, 1, `h1 ${route}`);
      assert.ok(dimensions.scrollWidth <= width + 1, `overflow ${width} ${route}: ${dimensions.scrollWidth}`);
      if (keyRoutes.includes(route) && [390, 1440].includes(width)) await page.screenshot({ path: path.join(output, `${width}-${route.replace(/\W+/g, '-') || 'home'}.png`), fullPage: true });
    }
  }
  await page.goto(origin + '/');
  await page.locator('[data-report-tab="1"]').click();
  assert.equal(await page.locator('#report-panel-1').isVisible(), true);
  assert.equal(await page.locator('#report-panel-0').isVisible(), false);
  await page.locator('[data-report-tab="1"]').press('ArrowRight');
  assert.equal(await page.locator('[data-report-tab="2"]').getAttribute('aria-selected'), 'true');
  results.interactions.push('report click and keyboard tabs');
  await page.goto(origin + '/insights/');
  await page.locator('#insightSearch').fill('不存在的内容xyz');
  assert.equal(await page.locator('#insightEmpty').isVisible(), true);
  await page.locator('#insightSearch').fill('GEO');
  assert.ok((await page.locator('.insight-card:visible').count()) >= 8);
  await page.locator('#insightSearch').fill('');
  assert.equal(await page.locator('.insight-card:visible').count(), insights.length);
  await page.locator('.insight-cluster-nav a[href="#operations"]').click();
  assert.equal(await page.locator('.insight-cluster:visible').count(), 1);
  results.interactions.push('article search, empty state and category filter');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '/');
  await page.locator('.mobile-menu-btn').click();
  assert.equal(await page.locator('.mobile-menu-btn').getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.mobile-menu-btn').getAttribute('aria-expanded'), 'false');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } }));
  await page.locator('.mobile-consult button').click();
  assert.match(await page.locator('.mobile-consult button').textContent(), /已复制/);
  results.interactions.push('mobile menu, Escape, successful clipboard');
  await page.goto(origin + '/contact/');
  assert.equal(await page.locator('.contact-grid > div').count(), 2);
  assert.equal(await page.locator('main footer').count(), 0);
  results.interactions.push('contact columns and document nesting');
  const tracked = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const received = [];
  await tracked.route('https://pinmooconsulting.com/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/_events') { received.push(Object.fromEntries(url.searchParams)); await route.fulfill({ status: 204 }); return; }
    const response = await route.fetch({ url: origin + url.pathname + url.search });
    await route.fulfill({ response });
  });
  const tp = await tracked.newPage();
  await tp.goto('https://pinmooconsulting.com/', { waitUntil: 'networkidle' });
  assert.ok(received.some(row => row.event === 'page_view'));
  await tp.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } }));
  await tp.locator('.mobile-consult button').click();
  await tp.waitForTimeout(150);
  assert.ok(received.some(row => row.event === 'wechat_copy' && row.placement === 'mobile'));
  assert.ok(received.every(row => Object.keys(row).sort().join(',') === 'event,page,placement'));
  const countBeforeFailure = received.length;
  await tp.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('blocked'); } } }));
  await tp.locator('.mobile-consult button').click();
  await tp.waitForTimeout(150);
  assert.equal(received.length, countBeforeFailure);
  await tracked.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true }));
  await tp.reload({ waitUntil: 'networkidle' });
  assert.equal(received.length, countBeforeFailure);
  results.interactions.push('analytics allowlist, copy failure and GPC opt-out (intercepted, no production events)');
  await tracked.close();
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const plain = await noJs.newPage();
  await plain.goto(origin + '/');
  assert.equal(await plain.locator('.geo-report-panel:visible').count(), 3);
  assert.ok(await plain.locator('a[href*="/contact/"]').count());
  results.interactions.push('no-JavaScript readable report and contact links');
  await noJs.close();
  const animated = await browser.newContext({ reducedMotion: 'no-preference' });
  const motion = await animated.newPage();
  await motion.goto(origin + '/');
  assert.equal(await motion.locator('html').evaluate(el => el.classList.contains('motion-ready')), true);
  await motion.waitForTimeout(2600);
  const opacities = await motion.locator('.geo-journey-step strong').evaluateAll(elements => elements.map(el => getComputedStyle(el).opacity));
  assert.deepEqual(opacities, ['1','1','1']);
  await motion.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await motion.locator('html').evaluate(el => el.classList.contains('motion-ready')), false);
  results.interactions.push('2.4-second sequence and reduced-motion');
  await animated.close();
  assert.deepEqual(results.errors, []);
  results.passed = true;
} catch (error) {
  results.passed = false; results.failure = error.stack;
  throw error;
} finally {
  await browser.close();
  await fs.writeFile(path.join(output, 'browser-results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ passed: results.passed, layouts: results.layouts.length, interactions: results.interactions, failure: results.failure }));
}
