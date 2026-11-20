import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { insights } from '../src/data/insights.js';
import { indexArticles, insightIndexRoutes, INSIGHT_PAGE_SIZE } from '../src/data/insight-index.js';

test('ordinary pagination covers each article exactly once without the search template', async () => {
  const slugs = [];
  for (const route of insightIndexRoutes.filter(item => item.topic === 'all')) {
    const html = await fs.readFile('dist' + route.path + 'index.html', 'utf8');
    const grid = html.match(/id="insightResults"[\s\S]*?<template/)[0];
    const hrefs = [...grid.matchAll(/<h3><a href="\/insights\/([^/]+)\//g)].map(match => match[1]);
    assert.ok(hrefs.length > 0 && hrefs.length <= INSIGHT_PAGE_SIZE);
    slugs.push(...hrefs);
    assert.ok(html.includes('rel="canonical" href="https://pinmooconsulting.com' + route.path + '"'));
  }
  assert.equal(slugs.length, insights.length);
  assert.deepEqual(new Set(slugs), new Set(insights.map(article => article.slug)));
});

test('every topic is reachable and lists only matching articles', async () => {
  const home = await fs.readFile('dist/insights/index.html', 'utf8');
  for (const route of insightIndexRoutes.filter(item => item.topic !== 'all')) {
    if (route.page === 1) assert.ok(home.includes('href="' + route.path + '"'));
    const html = await fs.readFile('dist' + route.path + 'index.html', 'utf8');
    const expected = indexArticles(route.topic).slice((route.page - 1) * INSIGHT_PAGE_SIZE, route.page * INSIGHT_PAGE_SIZE);
    const grid = html.match(/id="insightResults"[\s\S]*?<template/)[0];
    for (const article of expected) assert.ok(grid.includes('/insights/' + article.slug + '/'));
    assert.equal((grid.match(/class="insight-card reveal"/g) || []).length, expected.length);
  }
});
