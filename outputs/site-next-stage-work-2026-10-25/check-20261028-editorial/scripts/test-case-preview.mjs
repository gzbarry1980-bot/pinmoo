import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { previewCases } from '../src/components/consulting-upgrade.js';
import { cases } from '../src/data/cases.js';

for (const en of [false, true]) {
  test(`${en ? 'English' : 'Chinese'} case previews reuse the cropped media frame`, async () => {
    const html = previewCases(en);
    const images = [...html.matchAll(/<a class="([^"]+)" href="([^"]+)"><img src="([^"]+)"[^>]*>/g)];
    assert.equal(images.length, 3);
    assert.equal(new Set(images.map(match => match[3])).size, 3);
    for (const [tag, classes, href, image] of images) {
      assert.ok(classes.split(' ').includes('case-image'));
      assert.ok(classes.split(' ').includes('case-image-link'));
      assert.match(tag, /width="640" height="440"/);
      assert.ok(href.startsWith(en ? '/en/cases/' : '/cases/'));
      const item = cases.find(item => href.endsWith('/' + item.slug + '/'));
      assert.ok(item);
      assert.equal(image, item.image.replace(/\.png$/, '.webp'));
    }
    const built = await fs.readFile(en ? 'dist/en/index.html' : 'dist/index.html', 'utf8');
    assert.ok(built.includes(html), 'The active static renderer must use the shared preview');
  });
}

test('shared media CSS fixes the frame and crops without stretching', async () => {
  const css = await fs.readFile('src/styles.css', 'utf8');
  assert.match(css, /\.case-image\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*11;[^}]*overflow:\s*hidden/);
  assert.match(css, /\.case-image img\s*\{[^}]*object-fit:\s*cover/);
});
