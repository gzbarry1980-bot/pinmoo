import test from 'node:test';
import assert from 'node:assert/strict';
import {readAccessJSON,validRedemption,validSerialSession} from '../../guangzhou-zhongkao/unlock/validation.js';
test('HTML 200 or malformed JSON cannot be a successful activation',async()=>{
 await assert.rejects(readAccessJSON(new Response('<html>home</html>',{headers:{'Content-Type':'text/html'}})));
 await assert.rejects(readAccessJSON(new Response('bad json',{headers:{'Content-Type':'application/json'}})));
 assert.equal(validRedemption({}),false);
 assert.equal(validRedemption({entitled:true,deviceCount:1,maxDevices:2}),false);
});
test('activation requires explicit server success and valid 2-device counts',()=>{
 assert.equal(validRedemption({ok:true,entitled:true,deviceCount:1,maxDevices:2}),true);
 for(const counts of [{deviceCount:3,maxDevices:2},{deviceCount:0,maxDevices:2},{deviceCount:1,maxDevices:3},{deviceCount:'1',maxDevices:2}])assert.equal(validRedemption({ok:true,entitled:true,...counts}),false);
});
test('restoration requires an authenticated serial session, not just activation response',()=>{
 const session={authenticated:true,entitled:true,accessSource:'serial',serial:{deviceCount:2,maxDevices:2,remainingDevices:0}};
 assert.equal(validSerialSession(session),true);
 assert.equal(validSerialSession({...session,authenticated:false}),false);
 assert.equal(validSerialSession({...session,serial:null}),false);
 assert.equal(validSerialSession({...session,accessSource:'other'}),false);
});
