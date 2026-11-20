import fs from 'node:fs/promises';
const origin = 'https://pinmooconsulting.com';
const routes = [['/zh/services', '/services/'], ['/zh/cases/womenswear-refund-optimization', '/cases/womenswear-refund-optimization/'], ['/zh/cases/personal-care-device-positioning', '/cases/personal-care-device-positioning/']];
const results = [];
for (const [source, target] of routes) {
  for (const query of ['', '?service=page-review&lang=zh']) {
    const first = await fetch(origin + source + query, { redirect: 'manual', headers: { DNT: '1' }, signal: AbortSignal.timeout(15000) });
    const expected = origin + target + query;
    const location = first.headers.get('location');
    const final = await fetch(expected, { redirect: 'manual', headers: { DNT: '1' }, signal: AbortSignal.timeout(15000) });
    const html = await final.text();
    results.push({ source: origin + source + query, status: first.status, location, expected, finalStatus: final.status, canonicalCorrect: html.includes('<link rel="canonical" href="' + origin + target + '"'), oneHop: first.status === 301 && location === expected && final.status === 200 });
    await new Promise(resolve => setTimeout(resolve, 350));
  }
}
const result = { checkedAt: new Date().toISOString(), results, failures: results.filter(item => !item.oneHop || !item.canonicalCorrect) };
await fs.writeFile(new URL('./redirect-verification.json', import.meta.url), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (result.failures.length) process.exitCode = 1;
