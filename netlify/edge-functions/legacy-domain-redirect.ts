const LEGACY_HOSTS = new Set(['pinmoo.top', 'www.pinmoo.top']);
const PRIMARY_ORIGIN = 'https://pinmooconsulting.com';

export default async function legacyDomainRedirect(request: Request, context: { next: () => Promise<Response> }) {
  const url = new URL(request.url);

  if (!LEGACY_HOSTS.has(url.hostname.toLowerCase())) {
    return context.next();
  }

  const target = new URL(url.pathname || '/', PRIMARY_ORIGIN);
  target.search = url.search;
  return Response.redirect(target.toString(), 301);
}
