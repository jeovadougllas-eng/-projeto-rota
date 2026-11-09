import {test} from 'node:test';import assert from 'node:assert/strict';
await import('../assets/traxelo-visits-model.js');await import('../assets/traxelo-premium-model.js');await import('../assets/traxelo-visit-store.js');
const M=TraxeloVisitsModel,client={id:'a',name:'Cliente sintético'},base={clientId:'a',client,visitDate:'2026-11-02',status:'confirmed',recordedAt:'2026-11-02T12:00:00Z'};
const remote={...base,id:'r',outcome:'Pedido remoto',attendanceType:'remote',source:'remote_order',channel:'whatsapp',notes:'Solicitação sintética',routeId:null};
test('remote orders remain auditable but never inflate physical visit metrics or recommendations',()=>{
 const before=JSON.stringify(remote),options={month:'2026-11',asOf:'2026-11-03T12:00:00Z'};
 const alone=M.report([remote],[client],options);assert.equal(alone.summary.visits,0);assert.equal(alone.summary.coverage,0);assert.equal(alone.remoteOrders[0].channel,'whatsapp');assert.equal(alone.history.length,1);
 const mixed=M.report([remote,{...base,id:'v'}],[client],options);assert.equal(mixed.summary.visits,1);assert.equal(mixed.summary.revisits,0);assert.equal(mixed.summary.uniquePdvs,1);assert.equal(mixed.remoteOrders.length,1);assert.equal(mixed.history.length,2);
 assert.equal(TraxeloPremiumModel.recommendations([client],[remote],{}, {today:'2026-11-03'})[0].last,null);assert.equal(JSON.stringify(remote),before);
});
test('offline remote records preserve the existing key, survive reload and remain account scoped',()=>{
 const saved=new Map(),storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
 const store=TraxeloVisitStore.create('synthetic-owner',storage);store.add(remote);assert.equal(store.key,'traxelo.visits.v1:synthetic-owner');
 const restored=TraxeloVisitStore.create('synthetic-owner',storage);assert.equal(restored.events()[0].channel,'whatsapp');assert.equal(restored.snapshot().outbox.length,1);assert.equal(TraxeloVisitStore.create('other-owner',storage).events().length,0);
});
