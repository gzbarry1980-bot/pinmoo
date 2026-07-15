const INDEXNOW_KEY = '9f4d7e2a18c643b5a17e8d39f62b04c1';
const requestedOrigin = process.argv[2] || process.env.SITE_ORIGIN || 'https://pinmooconsulting.com';
const origin = new URL(requestedOrigin);
const allowedHosts = new Set(['pinmoo.top', 'pinmooconsulting.com']);

if (origin.protocol !== 'https:' || !allowedHosts.has(origin.host)) {
  throw new Error('Origin must be https://pinmoo.top or https://pinmooconsulting.com');
}

const sitemapUrl = new URL('/sitemap.xml', origin);

const sitemapResponse = await fetch(sitemapUrl, {
  headers: { 'user-agent': 'PINMOO-IndexNow/1.0' }
});

if (!sitemapResponse.ok) {
  throw new Error(`Could not read ${sitemapUrl}: HTTP ${sitemapResponse.status}`);
}

const sitemap = await sitemapResponse.text();
const urls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1])
  .filter((url) => new URL(url).host === origin.host);

if (!urls.length) {
  throw new Error(`No ${origin.host} URLs were found in ${sitemapUrl}`);
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: origin.host,
    key: INDEXNOW_KEY,
    keyLocation: new URL(`/${INDEXNOW_KEY}.txt`, origin).href,
    urlList: urls
  })
});

if (![200, 202].includes(response.status)) {
  const detail = await response.text();
  throw new Error(`IndexNow rejected the submission: HTTP ${response.status} ${detail}`);
}

console.log(`IndexNow accepted ${urls.length} URLs for ${origin.host} (HTTP ${response.status}).`);
