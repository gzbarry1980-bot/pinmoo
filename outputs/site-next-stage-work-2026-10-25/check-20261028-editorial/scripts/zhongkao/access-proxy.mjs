// Local-only serial access bridge. No admin routes, credentials or entitlement bypass.
const allowed = new Set(['GET /api/access/config','GET /api/access/session','GET /api/access/health','POST /api/access/serial/redeem']);
const json = (res,status,payload) => {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(payload));};
export function validateProxyOrigin(value) {
  const url=new URL(value);
  const loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if(url.username||url.password||url.pathname!=='/'||url.search||url.hash||(url.protocol!=='https:'&&!(url.protocol==='http:'&&loopback)))throw new Error('Access proxy requires a HTTPS origin or loopback test server');
  return url.origin;
}
export async function proxyAccess(req,res,origin) {
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!pathname.startsWith('/api/'))return false;
  const localHost=new URL('http://'+req.headers.host).hostname;
  if(!['localhost','127.0.0.1','[::1]'].includes(localHost)){json(res,403,{error:'本地验证服务仅接受回环地址。',code:'LOCAL_HOST_REJECTED'});return true;}
  if(!allowed.has(`${req.method} ${pathname}`)){json(res,404,{error:'本地预览不提供此接口。',code:'LOCAL_API_NOT_ALLOWED'});return true;}
  if(!origin){json(res,503,{error:'本地尚未连接序列号服务。',code:'LOCAL_API_NOT_CONFIGURED'});return true;}
  // Refuse cross-site activation against a loopback service.
  if(req.method==='POST'&&req.headers.origin!==`http://${req.headers.host}`){json(res,403,{error:'请从当前本地网页提交验证。',code:'LOCAL_ORIGIN_REJECTED'});return true;}
  try {
    const headers={Accept:'application/json'};
    const cookieName=process.env.ZK_SERIAL_COOKIE_NAME||'zk_serial_session';
    const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(cookieName+'=')).join('; ');
    if(cookie)headers.Cookie=cookie;
    let body;
    if(req.method==='POST'){
      if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'请求格式必须为JSON。'});return true;}
      const chunks=[];let bytes=0;
      for await(const chunk of req){bytes+=chunk.length;if(bytes>16384){json(res,413,{error:'请求内容过大。'});return true;}chunks.push(chunk);}
      body=Buffer.concat(chunks);headers['Content-Type']='application/json';headers.Origin=origin;
    }
    const upstream=await fetch(origin+pathname,{method:req.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(10000)});
    if(!upstream.headers.get('content-type')?.includes('application/json'))throw new Error('Invalid access response');
    const payload=await upstream.json();
    const responseHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
    const cookies=upstream.headers.getSetCookie().filter(c=>c.startsWith(cookieName+'='));
    // Only the loopback bridge strips Secure/Domain. The production cookie is untouched.
    if(cookies.length)responseHeaders['Set-Cookie']=cookies.map(c=>c.replace(/;\s*Secure\b/ig,'').replace(/;\s*Domain=[^;]*/ig,''));
    res.writeHead(upstream.status,responseHeaders);res.end(JSON.stringify(payload));
  }catch{json(res,502,{error:'无法连接正式序列号服务，请稍后重试。',code:'ACCESS_PROXY_UNAVAILABLE'});}
  return true;
}
