import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { insights } from '../src/data/insights.js';
import { nextStageInsights, nextStageUpdates } from '../src/data/insights-next-stage.js';
import { caseDeliverableMarkup } from '../src/components/case-deliverable.js';
import { servicesContent } from '../src/components/consulting-upgrade.js';
import { pageIds } from './event-schema.mjs';
import { readingPaths } from '../src/data/reading-paths.js';

test('new articles and old updates retain separate URLs and factual boundaries', () => {
  assert.equal(nextStageInsights.length, 4);
  assert.equal(Object.keys(nextStageUpdates).length, 5);
  for (const source of nextStageInsights) {
    const matches = insights.filter(item => item.slug === source.slug);
    assert.equal(matches.length, 1);
    const item = matches[0];
    assert.equal(item.authorType, 'Organization');
    assert.equal(item.faqs.length, 0);
    assert.ok(item.disclosure.includes('AI参与'));
    assert.equal(item.updated, '2026-10-25');
    assert.ok(pageIds.includes('insights-' + item.slug));
    for (const slug of readingPaths[item.slug]) assert.ok(insights.some(entry => entry.slug === slug));
  }
  for (const [slug, change] of Object.entries(nextStageUpdates)) {
    const item = insights.find(entry => entry.slug === slug);
    for (const section of change.sections) assert.equal(item.sections.filter(entry => entry.id === section.id).length, 1);
    assert.equal(item.updated, '2026-10-25');
    assert.equal(new Set(item.sections.map(entry => entry.id)).size, item.sections.length);
  }
  assert.ok(nextStageInsights[0].directAnswer.includes('并非品沐已推出的固定套餐'));
});

test('case explanations and support links are localised in the shared renderer', () => {
  for (const slug of ['womenswear-refund-optimization', 'personal-care-device-positioning', 'chenpi-brand-geo-diagnosis']) {
    const zh = caseDeliverableMarkup(slug);
    const en = caseDeliverableMarkup(slug, true);
    assert.ok(zh.includes('为什么先做这些工作'));
    assert.ok(zh.includes('并非客户原始交付文件'));
    assert.ok(zh.includes('相关服务与方法'));
    assert.ok(en.includes('Why start with this work?'));
    assert.ok(!/[\u3400-\u9fff]/u.test(en));
    assert.ok(en.includes('/en/services/'));
  }
  assert.ok(servicesContent().includes('/resources/operating-templates/#geo-facts'));
  assert.ok(servicesContent(true).includes('/en/cases/personal-care-device-positioning/'));
});

test('ordinary deployment preserves the primary config and installs the generated event map', () => {
  const script = fs.readFileSync(new URL('./publish-primary-release.sh', import.meta.url), 'utf8');
  assert.ok(script.includes('install -m 644 "$RELEASE/.deploy/events-http.conf"'));
  assert.ok(!script.includes('install -m 644 "$KIT/deploy/nginx/pinmooconsulting.com.conf.example"'));
  assert.ok(script.includes('cmp "$BACKUP/0" "$CONFIG"'));
  assert.ok(script.includes("-H 'DNT: 1'"));
});
