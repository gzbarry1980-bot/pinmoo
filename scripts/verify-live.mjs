const origin = String(process.argv[2] || 'https://pinmooconsulting.com').replace(/\/+$/, '');
const failures = [];

function fail(message) {
  failures.push(message);
}

async function get(pathname) {
  const response = await fetch(origin + pathname, { redirect: 'manual' });
  return { response, text: await response.text() };
}

const primaryPages = origin.includes('pinmooconsulting.com')
  ? ['/', '/zh/about/', '/zh/insights/']
  : ['/', '/about/', '/insights/'];

for (const pathname of primaryPages) {
  const { response, text } = await get(pathname);
  if (response.status !== 200) fail(`${pathname} 状态码为 ${response.status}`);
  const expectedCanonical = origin + pathname;
  if (!text.includes(`<link rel="canonical" href="${expectedCanonical}"`)) fail(`${pathname} canonical 不正确`);
}

const root = await get('/');
for (const header of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy']) {
  if (!root.response.headers.get(header)) fail(`首页响应缺少 ${header}`);
}

const missing = await get('/site-check-not-found-20260710');
if (missing.response.status !== 404) fail(`不存在路径应返回 404，实际为 ${missing.response.status}`);
if (!missing.text.includes('noindex')) fail('404 页面缺少 noindex');

const robots = await get('/robots.txt');
if (robots.response.status !== 200 || !robots.text.includes('User-agent: OAI-SearchBot')) fail('robots.txt 未允许 OAI-SearchBot');
if (!robots.text.includes(`Sitemap: ${origin}/sitemap.xml`)) fail('robots.txt sitemap 域名不正确');

const sitemap = await get('/sitemap.xml');
if (sitemap.response.status !== 200) fail(`sitemap 状态码为 ${sitemap.response.status}`);
const otherDomain = origin.includes('pinmooconsulting.com') ? 'pinmoo.top' : 'pinmooconsulting.com';
if (sitemap.text.includes(otherDomain)) fail(`sitemap 出现其他域名 ${otherDomain}`);

if (failures.length) {
  console.error(`线上检查失败，共 ${failures.length} 项：`);
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`线上检查通过：${origin}`);
