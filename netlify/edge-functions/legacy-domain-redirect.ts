const LEGACY_HOSTS = new Set(['pinmoo.top', 'www.pinmoo.top']);
const PRIMARY_ORIGIN = 'https://pinmooconsulting.com';
const AGENT_ORIGIN = 'https://agent.pinmoo.top';

export default async function legacyDomainRedirect(request: Request, context: { next: () => Promise<Response> }) {
  const url = new URL(request.url);

  if (!LEGACY_HOSTS.has(url.hostname.toLowerCase())) {
    return context.next();
  }

  let pathname = url.pathname || '/';
  if (pathname === '/ai-diagnosis' || pathname.startsWith('/ai-diagnosis/')) {
    const suffix = pathname.slice('/ai-diagnosis'.length) || '/';
    const agentTarget = new URL(suffix, AGENT_ORIGIN);
    agentTarget.search = url.search;
    return Response.redirect(agentTarget.toString(), 301);
  }
  if (pathname === '/zh' || pathname === '/zh/') {
    pathname = '/';
  } else if (pathname.startsWith('/zh/')) {
    pathname = pathname.slice(3) || '/';
  }
  const target = new URL(pathname, PRIMARY_ORIGIN);
  target.search = url.search;
  return Response.redirect(target.toString(), 301);
}
