import fs from 'node:fs/promises';
const file = new URL('./index-url-verification.json', import.meta.url);
const record = JSON.parse(await fs.readFile(file));
for (const item of record.results.filter(entry => entry.finalStatus === 429)) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  item.initialAttempt = { chain: item.chain, finalStatus: item.finalStatus };
  const url = item.chain.at(-1).url;
  const response = await fetch(url, { redirect: 'manual', headers: { DNT: '1' }, signal: AbortSignal.timeout(15000) });
  const html = await response.text();
  item.chain[item.chain.length - 1] = { url, status: response.status, location: response.headers.get('location') };
  item.finalStatus = response.status;
  item.canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
}
record.recheckedAt = new Date().toISOString();
await fs.writeFile(file, JSON.stringify(record, null, 2));
console.log(JSON.stringify({checked:record.results.length,remaining:record.results.filter(item=>item.error || item.finalStatus!==200)}));
