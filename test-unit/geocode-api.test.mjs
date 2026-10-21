import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/geocode.js';
const response=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(data){this.data=data;return this;}});
test('optional provider requires a secret, a valid session and a bounded address payload',async()=>{
 const originalFetch=globalThis.fetch,originalKey=process.env.GEOAPIFY_API_KEY;delete process.env.GEOAPIFY_API_KEY;
 try{
  let res=response();await handler({method:'POST',headers:{}},res);assert.equal(res.code,503);
  process.env.GEOAPIFY_API_KEY='test-only-not-a-real-secret';res=response();await handler({method:'POST',headers:{}},res);assert.equal(res.code,401);
  globalThis.fetch=async()=>({ok:false});res=response();await handler({method:'POST',headers:{authorization:'Bearer invalid'}},res);assert.equal(res.code,401);
  globalThis.fetch=async()=>({ok:true,json:async()=>({id:'isolated-test-user'})});res=response();await handler({method:'POST',headers:{authorization:'Bearer test'},body:{street:'X'.repeat(251),city:'Natal'}},res);assert.equal(res.code,400);
  const calls=[];globalThis.fetch=async(url,options)=>{calls.push({url:String(url),options});return {ok:true,json:async()=>calls.length===1?{id:'isolated-test-user'}:{features:[]}};};
  res=response();await handler({method:'POST',headers:{authorization:'Bearer test'},body:{street:'Rua Teste',house:'10',city:'Natal',state:'RN'}},res);
  assert.equal(res.code,200);assert.ok(calls[0].url.endsWith('/auth/v1/user'));assert.equal(calls[0].options.headers.Authorization,'Bearer test');assert.equal(new URL(calls[1].url).searchParams.get('housenumber'),'10');assert.equal(res.headers['Cache-Control'],'no-store');assert.ok(!JSON.stringify(res.data).includes(process.env.GEOAPIFY_API_KEY));
 }finally{globalThis.fetch=originalFetch;if(originalKey===undefined)delete process.env.GEOAPIFY_API_KEY;else process.env.GEOAPIFY_API_KEY=originalKey;}
});
