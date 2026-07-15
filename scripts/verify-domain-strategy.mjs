const primaryOrigin = 'https://pinmooconsulting.com';
const legacyOrigin = 'https://pinmoo.top';
const agentOrigin = 'https://agent.pinmoo.top';
const userAgent = 'PINMOO-Domain-Migration-Check/1.0';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchResponse(url, options = {}, attempts = 1) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { 'user-agent': userAgent, ...(options.headers || {}) }
      });
      if (response.status < 500) return response;
      lastError = new Error(`${url} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await sleep(10000);
  }
  throw lastError;
}

async function expectRedirect(pathname, expectedLocation) {
  const response = await fetchResponse(legacyOrigin + pathname, { redirect: 'manual' });
  const location = response.headers.get('location');
  if (response.status !== 301 || location !== expectedLocation) {
    throw new Error(`${legacyOrigin + pathname} expected 301 to ${expectedLocation}, got ${response.status} to ${location || '(none)'}`);
  }
}

async function expectPrimaryPage(pathname) {
  const url = primaryOrigin + pathname;
  const response = await fetchResponse(url, { redirect: 'follow' }, 12);
  const html = await response.text();
  if (response.status !== 200) throw new Error(`${url} returned HTTP ${response.status}`);
  if (!html.includes(`<link rel="canonical" href="${url}"`)) throw new Error(`${url} has an incorrect canonical`);
  if (/<meta name="robots" content="[^"]*(?:noindex|nofollow)/i.test(html)) throw new Error(`${url} contains noindex or nofollow`);
}

const redirectChecks = [
  ['/', `${primaryOrigin}/zh/`],
  ['/about/', `${primaryOrigin}/zh/about/`],
  ['/services/store-diagnosis/', `${primaryOrigin}/zh/services/store-diagnosis/`],
  ['/insights/ecommerce-weekly-report-review-framework/', `${primaryOrigin}/zh/insights/ecommerce-weekly-report-review-framework/`],
  ['/en/', `${primaryOrigin}/`],
  ['/en/about/', `${primaryOrigin}/about/`],
  ['/china-ecommerce-consulting/', `${primaryOrigin}/china-ecommerce-consulting/`],
  ['/ai-diagnosis/', `${agentOrigin}/`],
  ['/sitemap.xml', `${primaryOrigin}/sitemap.xml`]
];

for (const [pathname, location] of redirectChecks) await expectRedirect(pathname, location);

for (const pathname of [
  '/',
  '/zh/',
  '/zh/about/',
  '/zh/services/store-diagnosis/',
  '/zh/services/tmall-business-weekly-report/',
  '/zh/insights/',
  '/zh/resources/ecommerce-metrics-dictionary/',
  '/china-ecommerce-consulting/'
]) {
  await expectPrimaryPage(pathname);
}

const sitemapResponse = await fetchResponse(`${primaryOrigin}/sitemap.xml`, {}, 12);
const sitemap = await sitemapResponse.text();
const sitemapUrls = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
if (sitemapResponse.status !== 200 || sitemapUrls.length < 20) throw new Error('Primary sitemap is unavailable or incomplete');
if (sitemapUrls.some((url) => !url.startsWith(`${primaryOrigin}/`))) throw new Error('Primary sitemap contains a non-primary domain');
if (sitemap.includes('pinmoo.top')) throw new Error('Primary sitemap still contains pinmoo.top');

const agentResponse = await fetchResponse(`${agentOrigin}/`, { redirect: 'follow' });
const agentHtml = await agentResponse.text();
if (agentResponse.status !== 200 || !agentHtml.includes(`<link rel="canonical" href="${agentOrigin}/"`)) {
  throw new Error('agent.pinmoo.top is unavailable or has an incorrect canonical');
}

console.log(`Domain strategy verified: ${redirectChecks.length} redirects, ${sitemapUrls.length} primary sitemap URLs, and the agent workspace.`);
