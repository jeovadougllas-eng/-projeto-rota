import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateQuery,classify,combine,tomtomCandidates,geoapifyCandidates,compareProvider} from '../lib/geolocation-benchmark.mjs';
import handler from '../api/geolocation-benchmark.js';
const q={name:'Farmácia Exemplo',street:'Rua Exemplo',house:'123',city:'Natal',district:'Lagoa Nova',state:'RN',zip:'59000000'};
const t=(over={})=>({results:[{type:'address',title:'Rua Exemplo 123',position:{type:'Point',coordinates:[-35.2,-5.8]},address:{street:q.street,houseNumber:q.house,municipality:q.city,municipalitySubdivision:q.district,countryCodeIso2:'BR',countrySubdivisionCodeIso:'BR-RN',postalCode:q.zip},...over}]});
const g=()=>({features:[{geometry:{coordinates:[-35.2,-5.8]},properties:{lat:-5.8,lon:-35.2,street:q.street,housenumber:q.house,city:q.city,suburb:q.district,state_code:'RN',postcode:q.zip,country_code:'br',result_type:'building',rank:{confidence_building_level:.99}}}]});
const candidate=()=>tomtomCandidates(t(),'address')[0];
test('query validation refuses arbitrary endpoints, malformed fields, missing locality and invalid CEP',()=>{
 assert.throws(()=>validateQuery({...q,street:123}));assert.throws(()=>validateQuery({...q,city:''}));assert.throws(()=>validateQuery({...q,zip:'123'}));assert.throws(()=>validateQuery({...q,name:'x'.repeat(251)}));assert.equal(validateQuery({...q,url:'https://untrusted.example'}).url,undefined);
});
test('both documented provider schemas produce comparable address records',()=>{
 assert.equal(classify(tomtomCandidates(t(),'address'),q).status,'compatible');assert.equal(classify(geoapifyCandidates(g(),'address'),q).status,'compatible');
});
test('city/street centroids and absent/wrong house number are never compatible',()=>{
 for(const change of [{house:''},{house:'124'},{interpolated:true},{city:'Mossoró'},{country:'US'},{lat:null},{lon:NaN},{lat:91},{lat:0,lon:0}])assert.notEqual(classify([{...candidate(),...change}],q).status,'compatible');
});
test('postcode, state and neighborhood mismatches require review',()=>{
 for(const change of [{zip:'59000001'},{state:'PB'},{state:''},{district:'Outro bairro'}])assert.equal(classify([{...candidate(),...change}],q).status,'review');
});
test('name alone cannot confirm a branch at the wrong address',()=>{
 assert.equal(classify([{...candidate(),method:'name',name:q.name,house:'999'}],q).status,'review');assert.equal(classify([{...candidate(),method:'name',name:'Outra farmácia'}],q).status,'review');assert.equal(classify([{...candidate(),method:'name',name:q.name}],q).status,'compatible');
});
test('spatial ambiguities within a provider and between providers remain unconfirmed',()=>{
 const a=candidate(),b={...a,lat:-5.85};assert.equal(classify([a,b],q).status,'review');assert.equal(combine({a:{status:'compatible',best:a},b:{status:'compatible',best:b}}),'conflict');assert.equal(combine({a:{status:'compatible',best:a}}),'compatible');
});
test('address success stops without additional POI calls and secrets never enter results',async()=>{
 const urls=[];const result=await compareProvider('tomtom',q,'fake-private-key',async(url,opts)=>{urls.push(String(url));assert.equal(opts.headers['TomTom-Api-Key'],'fake-private-key');return {ok:true,json:async()=>t()};});
 assert.equal(result.requests,1);assert.equal(result.status,'compatible');assert.equal(urls.length,1);assert.ok(!JSON.stringify(result).includes('fake-private-key'));assert.ok(!urls[0].includes('fake-private-key'));
});
test('name fallback uses Places Discover v3, complete address and country restriction',async()=>{
 const calls=[];const result=await compareProvider('tomtom',q,'fake-private-key',async(url,opts)=>{calls.push({url:String(url),opts});return {ok:true,json:async()=>calls.length===1?{results:[]}:t({type:'poi',title:q.name})};});
 assert.equal(result.status,'compatible');assert.equal(calls.length,2);assert.match(calls[1].url,/\/places\/discover$/);assert.equal(calls[1].opts.method,'POST');assert.equal(calls[1].opts.headers['TomTom-Api-Version'],'3');assert.ok(JSON.parse(calls[1].opts.body).query.includes(q.name));assert.deepEqual(JSON.parse(calls[1].opts.body).filters.countryCodesIso2,['BR']);
});
test('Geoapify address and name requests remain server-side and bounded',async()=>{
 const calls=[];const result=await compareProvider('geoapify',q,'fake-private-key',async(url)=>{calls.push(new URL(url));return {ok:true,json:async()=>({features:[]})};});
 assert.equal(result.status,'not_found');assert.equal(calls.length,2);assert.equal(calls[0].searchParams.get('housenumber'),'123');assert.match(calls[1].searchParams.get('text'),/Farmácia Exemplo/);assert.ok(!JSON.stringify(result).includes('fake-private-key'));
});
test('provider denial, quota exhaustion, network failure and schema errors are explicit, never retried endlessly',async()=>{
 for(const status of [401,403,429]){const result=await compareProvider('tomtom',q,'fake',async()=>({ok:false,status}));assert.equal(result.requests,1);assert.equal(result.status,'error');assert.equal(result.attempts[0].httpStatus,status);}
 const failed=await compareProvider('geoapify',q,'fake',async()=>{throw Error('https://secret.example/?key=private');});assert.equal(failed.status,'error');assert.equal(failed.requests,2);assert.ok(!JSON.stringify(failed).includes('private'));
 const invalid=await compareProvider('tomtom',q,'fake',async()=>({ok:true,json:async()=>({invalid:true})}));assert.equal(invalid.status,'error');
});
const response=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(data){this.data=data;return this;}});
test('public status exposes only configured flags and POST always requires validated nonanonymous auth',async()=>{
 let res=response();await handler({method:'GET',headers:{}},res);assert.equal(res.code,200);assert.equal(res.data.readOnly,true);assert.deepEqual(Object.keys(res.data),['readOnly','configured']);assert.equal(res.headers['Cache-Control'],'no-store');
 res=response();await handler({method:'POST',headers:{},body:q},res);assert.equal(res.code,401);
 res=response();await handler({method:'POST',headers:{origin:'https://evil.example',authorization:'Bearer fake'},body:q},res);assert.equal(res.code,403);
 const original=globalThis.fetch;try{
  globalThis.fetch=async()=>({ok:false});res=response();await handler({method:'POST',headers:{authorization:'Bearer fake'},body:q},res);assert.equal(res.code,401);
  globalThis.fetch=async()=>({ok:true,json:async()=>({id:'anonymous',is_anonymous:true})});res=response();await handler({method:'POST',headers:{authorization:'Bearer fake'},body:q},res);assert.equal(res.code,401);
 }finally{globalThis.fetch=original;}
});
test('API performs only auth and provider calls; no database writes or original provider activation',async()=>{
 const oldFetch=globalThis.fetch,a=process.env.GEO_BENCH_GEOAPIFY_KEY,b=process.env.GEO_BENCH_TOMTOM_KEY;process.env.GEO_BENCH_GEOAPIFY_KEY='geo-test';process.env.GEO_BENCH_TOMTOM_KEY='tom-test';
 try{
  const calls=[];globalThis.fetch=async(url,opts)=>{calls.push({url:String(url),opts});return {ok:true,json:async()=>String(url).includes('/auth/v1/user')?{id:'readonly-unit-user'}:String(url).includes('geoapify')?g():t()};};
  const res=response();await handler({method:'POST',headers:{authorization:'Bearer fake'},body:q},res);assert.equal(res.code,200);assert.equal(res.data.combined,'compatible');assert.equal(calls.length,3);assert.ok(calls.every(c=>!c.url.includes('/rest/v1/')));assert.ok(!JSON.stringify(res.data).includes('geo-test'));
 }finally{globalThis.fetch=oldFetch;for(const [key,value]of [['GEO_BENCH_GEOAPIFY_KEY',a],['GEO_BENCH_TOMTOM_KEY',b]])if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
