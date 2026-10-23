import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../assets/traxio-planner.js';
const P=globalThis.TraxioPlanner;
test('selection normalizes numeric and string IDs without changing records',()=>{const ids=new P.IdSet([7,'8']);assert(ids.has('7'));assert(ids.has(8));ids.delete(7);assert(!ids.has('7'));});
test('null blank infinite out-of-bounds and 0,0 are unavailable',()=>{for(const c of [{lat:null,lon:null},{lat:'',lon:''},{lat:Infinity,lon:2},{lat:91,lon:0},{lat:0,lon:0}])assert(!P.location(c).ready);});
test('verified numbers and numeric strings are routable, approximate and legacy require review',()=>{assert(P.location({lat:'-5.81',lon:'-35.21',locationVerification:'manual_reviewed'}).ready);assert(!P.location({lat:-5.81,lon:-35.21,locationVerification:'approximate'}).ready);assert(P.location({lat:-5.81,lon:-35.21}).consent);});
test('partition preserves seven selected records across ID conversion and missing cloud records',()=>{const rows=Array.from({length:7},(_,id)=>({id,lat:-5.81,lon:-35.21,locationVerification:'automatic_housenumber'}));const p=P.partition(rows,new P.IdSet(rows.map(c=>String(c.id))));assert.equal(p.ready.length,7);assert.equal(rows[0].id,0);assert.deepEqual(P.partition(rows.slice(1),[0,1]).unloaded,['0']);});
test('partial route explicitly reports blocked and unverified clients',()=>{const rows=[{id:1,lat:-5,lon:-35,locationVerification:'manual_reviewed'},{id:2,lat:null,lon:null},{id:3,lat:-5,lon:-35}];const p=P.partition(rows,[1,2,3]);assert.equal(p.ready.length,1);assert.equal(p.blocked.length,1);assert.equal(p.unverified.length,1);assert.equal(P.partition(rows,[1,2,3],{allowUnverified:true}).ready.length,2);assert.equal(rows[2].locationVerification,undefined);});
test('origin, coordinate and selection changes invalidate route fingerprint; filters do not',()=>{const rows=[{id:1,lat:-5,lon:-35,locationVerification:'manual_reviewed'}];const first=P.signature(rows,[1],'gps');assert.equal(first,P.signature(rows,['1'],'gps'));assert.notEqual(first,P.signature(rows,[1],'manual'));assert.notEqual(first,P.signature([{...rows[0],lat:-6}],[1],'gps'));});

test('explicit region correction overrides original import fields without modifying them',async()=>{
 await import('../assets/traxio-geolocation.js');const fields=[{label:'Cidade',value:'Cidade incorreta'},{label:'Bairro',value:'Bairro antigo'},{label:'UF',value:'SP'}];
 const c={address:'Rua Exata, 10',importFields:fields,geocodingRegionOverride:{city:'Natal',district:'Tirol',state:'RN'}};
 const point=globalThis.TraxioGeo.parse(c);assert.equal(point.city,'Natal');assert.equal(point.district,'Tirol');assert.equal(point.state,'RN');assert.equal(fields[0].value,'Cidade incorreta');
});

test('cities named São Paulo and Rio de Janeiro are not discarded as states',async()=>{
 await import('../assets/traxio-geolocation.js');
 for(const [city,state] of [['São Paulo','SP'],['Rio de Janeiro','RJ']])assert.equal(globalThis.TraxioGeo.parse({address:'Rua Exata, 10',city,state}).city,city);
});
