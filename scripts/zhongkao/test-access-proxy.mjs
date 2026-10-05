import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {proxyAccess,validateProxyOrigin} from './access-proxy.mjs';
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return `http://127.0.0.1:${server.address().port}`;}
const close=server=>new Promise(resolve=>server.close(resolve));
test('local access bridge preserves server status and serial cookie, refuses admin/cross-site requests',async()=>{
 const seen=[];let asHTML=false;
 const upstream=http.createServer(async(req,res)=>{seen.push({path:req.url,origin:req.headers.origin,cookie:req.headers.cookie});
  if(asHTML){res.writeHead(200,{'Content-Type':'text/html'});return res.end('<html>not an API</html>');}
  res.setHeader('Content-Type','application/json');
  if(req.url==='/api/access/serial/redeem'){
   const chunks=[];for await(const part of req)chunks.push(part);
   const body=JSON.parse(Buffer.concat(chunks));
   if(body.code==='LIMIT'){res.statusCode=409;return res.end(JSON.stringify({code:'SERIAL_DEVICE_LIMIT',error:'设备已满'}));}
   res.setHeader('Set-Cookie','zk_serial_session=test-fixture-only; Path=/; HttpOnly; SameSite=Lax; Secure; Domain=example.test');
   return res.end(JSON.stringify({ok:true,entitled:true,deviceCount:1,maxDevices:2}));
  }
  res.end(JSON.stringify({authenticated:req.headers.cookie==='zk_serial_session=test-fixture-only',entitled:req.headers.cookie==='zk_serial_session=test-fixture-only'}));
 });
 const remote=await listen(upstream),local=http.createServer(async(req,res)=>{if(!await proxyAccess(req,res,remote)){res.writeHead(404);res.end();}}),base=await listen(local);
 try{
  const redeem=await fetch(base+'/api/access/serial/redeem',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({code:'FIXTURE'})});
  assert.equal(redeem.status,200);assert.equal((await redeem.json()).entitled,true);
  const cookie=redeem.headers.getSetCookie()[0];assert.match(cookie,/HttpOnly/);assert.doesNotMatch(cookie,/Secure|Domain=/i);assert.equal(seen[0].origin,remote);
  const session=await fetch(base+'/api/access/session',{headers:{Cookie:'unrelated=do-not-forward; '+cookie.split(';')[0]}});assert.equal((await session.json()).authenticated,true);assert.equal(seen[1].cookie,'zk_serial_session=test-fixture-only');
  const full=await fetch(base+'/api/access/serial/redeem',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({code:'LIMIT'})});assert.equal(full.status,409);assert.equal((await full.json()).code,'SERIAL_DEVICE_LIMIT');
  const before=seen.length;assert.equal((await fetch(base+'/api/serial-keys')).status,404);assert.equal(seen.length,before);
  assert.equal((await fetch(base+'/api/access/serial/redeem',{method:'POST',headers:{Origin:'https://other.test','Content-Type':'application/json'},body:'{}'})).status,403);assert.equal(seen.length,before);
  asHTML=true;const bad=await fetch(base+'/api/access/config');assert.equal(bad.status,502);assert.equal((await bad.json()).code,'ACCESS_PROXY_UNAVAILABLE');
 }finally{await close(local);await close(upstream);}
});
test('access proxy origin is HTTPS or loopback only, no embedded secret or path',()=>{
 assert.equal(validateProxyOrigin('https://zhongkao.pinmooconsulting.com'),'https://zhongkao.pinmooconsulting.com');
 for(const url of ['http://external.test','https://user:secret@example.test','https://example.test/path'])assert.throws(()=>validateProxyOrigin(url));
});
