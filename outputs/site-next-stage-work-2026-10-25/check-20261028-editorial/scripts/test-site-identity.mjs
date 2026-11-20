import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { SITE, HOME_FAQS } from '../src/data/site.js';
import { serviceFaqs } from '../src/data/services.js';
import { aboutContent, servicesContent, contactContent, escapeMarkup } from '../src/components/consulting-upgrade.js';
import { identityAssets, identityFiles, identityJson, identityText } from './sync-site-identity.mjs';

test('public identity mirrors and generated assets use the shared positioning and contact', async () => {
  const assets = await identityAssets('public');
  assert.equal(assets.size, 5);
  for (const [filename, content] of assets) {
    assert.equal((await fs.readFile('public/' + filename, 'utf8')).replaceAll('\r\n', '\n'), content);
    assert.ok(content.includes(SITE.positioning), filename);
    assert.ok(content.includes(SITE.positioningEn), filename);
    assert.ok(content.includes(SITE.phone), filename);
    assert.ok(content.includes(SITE.serviceBoundary.zh), filename);
    assert.ok(content.includes(SITE.serviceBoundary.en), filename);
    assert.ok(!content.includes('品牌 GEO 与电商增长咨询服务'), filename);
  }
});

test('generation does not rewrite historic evidence dates, customer limits or tool domains', async () => {
  for (const filename of identityFiles.filter(x => x.endsWith('.json'))) {
    const source = JSON.parse(await fs.readFile('public/' + filename, 'utf8'));
    const before = structuredClone(source);
    const result = identityJson(source, filename);
    assert.deepEqual(source, before);
    assert.deepEqual(result.evidenceSnapshot, before.evidenceSnapshot);
    assert.deepEqual(result.evidencePolicy, before.evidencePolicy);
    assert.equal(result.factsVerifiedOn, before.factsVerifiedOn);
    assert.equal(result.principal.experience, before.principal.experience);
    assert.ok(JSON.stringify(result).includes('https://agent.pinmoo.top/'));
  }
});

test('shared fact changes propagate without editing the public templates', async () => {
  const site = { ...SITE, phone: 'TEST-PHONE', company: 'TEST-COMPANY', companyEn: 'TEST-EN',
    address: 'TEST-ADDRESS', positioning: 'TEST-POSITION', positioningEn: 'TEST-EN-POSITION',
    primaryDomain: 'https://identity.example', contactLabel: 'TEST-CONTACT' };
  const assets = await identityAssets('public', site);
  for (const [filename, content] of assets) assert.ok(!content.includes(SITE.phone), filename + ': stale phone');
  for (const filename of ['pinmoo-profile.json', 'ai-context.json']) {
    const result = JSON.parse(assets.get(filename));
    assert.equal(result.company, site.company);
    assert.equal(result.entityDisambiguation.officialDomain, site.primaryDomain + '/');
    assert.equal(filename === 'pinmoo-profile.json' ? result.phone : result.contact.phone, site.phone);
  }
  for (const filename of identityFiles.filter(x => x.endsWith('.txt'))) {
    assert.ok(assets.get(filename).includes('TEST-PHONE'));
    assert.ok(assets.get(filename).includes('TEST-POSITION'));
  }
});

test('text generation is idempotent and retains evidence and resource sections', async () => {
  for (const filename of identityFiles.filter(x => x.endsWith('.txt'))) {
    const source = await fs.readFile('public/' + filename, 'utf8');
    const result = identityText(source, filename);
    assert.equal(identityText(result, filename), result);
    assert.ok(result.includes('GEO'));
    if (filename === 'llms-full.txt') assert.ok(result.includes('## Evidence policy'));
  }
  assert.throws(() => identityText('Missing section', 'llms.txt'), /missing retained section/);
});

test('visible Chinese and English service/about templates share the same scope', () => {
  for (const en of [false, true]) {
    const scope = escapeMarkup(en ? SITE.serviceBoundary.en : SITE.serviceBoundary.zh);
    assert.ok(aboutContent(en).includes(scope));
    assert.ok(servicesContent(en).includes(scope));
    assert.ok(contactContent(en).includes('tel:' + SITE.phone));
    assert.ok(contactContent(en).includes('data-copy-wechat="' + SITE.phone + '"'));
  }
  assert.ok(HOME_FAQS.some(x => x.a === SITE.serviceBoundary.zh));
  assert.ok(serviceFaqs.some(x => x.a === SITE.serviceBoundary.zh));
});

test('built pages, structured data and identity resources keep the same facts', async () => {
  for (const file of ['about/index.html', 'services/index.html', 'en/about/index.html', 'en/services/index.html']) {
    const html = await fs.readFile('dist/' + file, 'utf8');
    const en = file.startsWith('en/');
    assert.ok(html.includes(escapeMarkup(en ? SITE.serviceBoundary.en : SITE.serviceBoundary.zh)), file);
    assert.ok(html.includes('tel:' + SITE.phone), file);
    const jsonld = [...html.matchAll(/<script type="application\/ld\+json" data-seo-jsonld>([\s\S]*?)<\/script>/g)]
      .map(match => JSON.parse(match[1]));
    assert.ok(JSON.stringify(jsonld).includes(SITE.phone), file);
  }
  for (const [filename, content] of await identityAssets('public')) {
    const built = await fs.readFile('dist/' + filename, 'utf8');
    if (filename.endsWith('.json')) assert.equal(built, content, filename);
    else assert.ok(built.startsWith(content), filename);
  }
});
