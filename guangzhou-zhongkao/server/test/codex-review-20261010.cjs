// Offline acceptance probes. No network, production credentials or production data.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cfgPath = require.resolve('../src/config.js');
const cfg = {apiV3Key:'01234567890123456789012345678901',appid:'fixture-app',mchid:'fixture-merchant',dataDir:fs.mkdtempSync(path.join(os.tmpdir(),'zk-review-')),tokenTTLDays:30,sessionCodeTTLSec:60};
require.cache[cfgPath]={id:cfgPath,filename:cfgPath,loaded:true,exports:cfg};
const wxpay=require('../src/wxpay.js');
const store=require('../src/store.js');
const access=require('../src/routes/access.js');
const pay=require('../src/routes/pay.js');
function response(){return {headers:{},statusCode:200,status(n){this.statusCode=n;return this;},setHeader(k,v){this.headers[k]=v;},cookie(k,v){this.headers['Set-Cookie']=`${k}=${v}`;return this;},json(v){this.body=v;return this;}};}
const results=[];
async function check(name,fn){try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,detail:e.message});}}
(async()=>{
 await check('Official-format raw UTF-8 nonce decrypts',()=>{
  const nonce='wCq51qZv4Yfg',aad='transaction',plaintext='official-format-fixture';
  const cipher=crypto.createCipheriv('aes-256-gcm',Buffer.from(cfg.apiV3Key),Buffer.from(nonce,'utf8'));
  cipher.setAAD(Buffer.from(aad));
  const encrypted=Buffer.concat([cipher.update(plaintext),cipher.final(),cipher.getAuthTag()]).toString('base64');
  assert.equal(wxpay.decryptResource(encrypted,nonce,aad),plaintext);
 });
 store.saveUser('fixture-user',{entitled:true,issueToken:true});
 await check('One-time exchange establishes renewable browser session',async()=>{
  const code=store.issueSessionCode('fixture-user');const first=response();
  await access.session({query:{code},headers:{}},first);assert.equal(first.body.entitled,true);
  assert(first.headers['Set-Cookie'],'Code consumed but no browser session cookie established');
 });
 // Lifecycle probes isolate state handling from the independently tested decryption issue.
 wxpay.verifyNotify=()=>true;wxpay.decryptResource=c=>c;
 const invoke=async(fn,payload)=>{const res=response();await fn({headers:{},rawBody:JSON.stringify({resource:{ciphertext:JSON.stringify(payload)}})},res);return res;};
 const paidPayload=no=>({appid:cfg.appid,mchid:cfg.mchid,out_trade_no:no,trade_state:'SUCCESS',transaction_id:'fixture-tx',payer:{openid:'fixture-user'},amount:{total:990,currency:'CNY'}});
 await check('Delayed payment callback cannot reactivate refunded order',async()=>{
  store.saveOrder('refund-test',{outTradeNo:'refund-test',openid:'fixture-user',amount:990,status:'REFUNDED'});
  store.saveUser('fixture-user',{entitled:false,orderNo:'refund-test'});
  await invoke(pay.notify,paidPayload('refund-test'));
  assert.equal(store.isEntitled('fixture-user'),false,'Refunded membership reactivated by old SUCCESS notification');
 });
 await check('Payment retry repairs interrupted entitlement grant',async()=>{
  store.saveOrder('interrupted-test',{outTradeNo:'interrupted-test',openid:'fixture-user',amount:990,status:'PAID'});
  store.saveUser('fixture-user',{entitled:false,orderNo:'interrupted-test'});
  await invoke(pay.notify,paidPayload('interrupted-test'));
  assert.equal(store.isEntitled('fixture-user'),true,'Order already PAID causes retry to skip missing entitlement');
 });
 await check('Partial refund does not silently apply full-refund rule',async()=>{
  store.saveOrder('partial-test',{outTradeNo:'partial-test',openid:'fixture-user',amount:990,status:'PAID'});
  store.saveUser('fixture-user',{entitled:true,orderNo:'partial-test'});
  await invoke(pay.refundNotify,{mchid:cfg.mchid,out_trade_no:'partial-test',refund_status:'SUCCESS',amount:{total:990,refund:1,currency:'CNY'}});
  assert.equal(store.isEntitled('fixture-user'),true,'One-fen partial refund revoked full membership');
 });
 console.log(JSON.stringify({scope:'offline, synthetic data only',results},null,2));
 process.exitCode=results.some(r=>!r.pass)?1:0;
})();
