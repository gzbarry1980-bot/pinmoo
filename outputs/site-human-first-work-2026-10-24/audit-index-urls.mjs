import fs from 'node:fs/promises';
const base = new URL('./', import.meta.url);
const source = JSON.parse(await fs.readFile(new URL('private/gsc-index-reasons.json', base)));
const rows = source.groups.flatMap(group => group.rows.slice(1).map(row => ({ reason: group.reason, url: row.match(/https:\/\/[^\s\uE000-\uF8FF]+/u)?.[0] })));
if (rows.length !== 79 || rows.some(row => !row.url)) throw Error('Incomplete URL capture');
let cursor = 0;
const results = [];
async function worker() {
  while (cursor < rows.length) {
    const item = rows[cursor++];
    try {
      const chain = [];
      let url = item.url;
      let html = '';
      for (let hop = 0; hop < 5; hop++) {
        const response = await fetch(url, { redirect: 'manual', headers: { DNT: '1' }, signal: AbortSignal.timeout(15000) });
        const location = response.headers.get('location');
        chain.push({ url, status: response.status, location });
        if (response.status >= 300 && response.status < 400 && location) url = new URL(location, url).href;
        else { html = await response.text(); break; }
      }
      const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
      results.push({ ...item, chain, canonical, finalStatus: chain.at(-1).status });
    } catch (error) { results.push({ ...item, error: error.message }); }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
await fs.writeFile(new URL('index-url-verification.json', base), JSON.stringify({ reportUpdated: source.reportUpdated, checkedAt: new Date().toISOString(), results }, null, 2));
console.log(JSON.stringify({ checked: results.length, failed: results.filter(item => item.error || item.finalStatus !== 200), groups: source.groups.map(group => ({reason:group.reason,count:group.count})) }, null, 2));
