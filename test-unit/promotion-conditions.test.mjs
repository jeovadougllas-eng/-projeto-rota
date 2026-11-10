import{test}from'node:test';import assert from'node:assert/strict';
await import('../assets/rotamapa-commerce-model.js');await import('../assets/rotamapa-commissions-model.js');await import('../assets/rotamapa-promotion-model.js');
const M=RotaMapaPromotionModel,p={id:'p',name:'Produto sintético 20 mg 30 cápsulas',code:'001',priceCents:2000},entry={code:'001',validFrom:'2026-11-01',validTo:'2026-11-30',minimum:6,priceCents:1500,discountBps:null,region:'',stock:'',restrictions:''},context={date:'2026-11-10'};
test('conditions respect date, quantities and one selected tier without stacking discounts',()=>{
 assert.equal(M.quote(p,5,[entry],context).unitCents,2000);assert.equal(M.quote(p,6,[entry],context).unitCents,1500);
 assert.equal(M.quote(p,12,[entry,{...entry,minimum:12,priceCents:1200}],context).unitCents,1200);
 assert.equal(M.quote(p,12,[entry],{date:'2026-12-01'}).notice,M.fallback);
 assert.equal(M.quote(p,12,[entry,{...entry,priceCents:1300}],context).applied,false);
});
test('regional, time, stock and unrecognized restrictions require confirmed context',()=>{
 for(const condition of [{region:'RN'},{stock:'4'},{stock:'sob consulta'},{restrictions:'Somente rede credenciada'},{startTime:'09:00',endTime:'10:00'}])assert.equal(M.quote(p,6,[{...entry,...condition}],context).applied,false);
 assert.equal(M.quote(p,6,[{...entry,region:'RN',startTime:'09:00',endTime:'10:00',stock:'10'}],{...context,region:'rn',time:'09:30'}).applied,true);
});
test('compatible imports reuse existing calculator semantics and retain immutable snapshots',()=>{
 const c=M.legacyCampaign([entry],p,{id:'c',name:'Campanha sintética'});assert.equal(c.type,'acelera');assert.equal(RotaMapaCommerceModel.line(p,6,c,'2026-11-10').unitCents,1500);
 for(const e of [{...entry,validFrom:'2026-11-02'},{...entry,region:'RN'},{...entry,restrictions:'Revisar'}])assert.throws(()=>M.legacyCampaign([e],p,{id:'c',name:'Teste'}));
 const r=M.quote(p,6,[entry],context);r.snapshot.priceCents=1;assert.equal(entry.priceCents,1500);
});
test('imported regional and dated conditions round-trip through a saved sale with an immutable source snapshot',()=>{
 const record={id:'a'.repeat(64),sourceHash:'b'.repeat(64),data:{entries:[{...entry,productId:p.id,validFrom:'2026-11-05',validTo:'2026-12-05',region:'São Gonçalo',startTime:'09:00',endTime:'10:00',stock:'30'}]}};
 const c=M.importedCampaign(record,p,{id:'campaign',name:'Oferta regional'}),l=RotaMapaCommerceModel.line(p,6,c,'2026-11-10',{region:'sao goncalo',time:'09:30'}),sale={id:'sale',clientId:'client',date:'2026-11-10',status:'confirmed',lines:[l],totalCents:9000};
 assert.equal(l.unitCents,1500);assert.equal(l.minQty,6);assert.equal(l.campaign.imported.documentId,record.id);assert.deepEqual(RotaMapaCommerceModel.sale(sale),sale);
 const tampered=structuredClone(sale);tampered.lines[0].promotionContext.region='Outra região';assert.throws(()=>RotaMapaCommerceModel.sale(tampered),/cálculo/);
 const inactive=RotaMapaCommerceModel.line(p,6,c,'2026-12-10',{region:'sao goncalo',time:'09:30'});assert.equal(inactive.unitCents,2000);assert.equal(inactive.minQty,0);assert.equal(M.quote(p,6,c.imported.entries,{date:'2026-12-10'}).notice,M.fallback);
 l.campaign.imported.entries[0].priceCents=1;assert.equal(record.data.entries[0].priceCents,1500);
});
test('imported campaigns refuse ambiguous catalog matches and keep quantity, stock and time restrictions at calculation',()=>{
 assert.throws(()=>M.importedCampaign({id:'a'.repeat(64),sourceHash:'b'.repeat(64),data:{entries:[entry]}},p,{id:'c',name:'Teste',products:[p,{...p,id:'other'}]}));
 const c=M.importedCampaign({id:'a'.repeat(64),sourceHash:'b'.repeat(64),data:{entries:[{...entry,productId:p.id,startTime:'09:00',endTime:'10:00',stock:'8'}]}},p,{id:'c',name:'Teste'});
 for(const [quantity,clock]of [[5,'09:30'],[9,'09:30'],[6,'08:00']])assert.equal(RotaMapaCommerceModel.line(p,quantity,c,'2026-11-10',{time:clock}).unitCents,2000);
 assert.equal(RotaMapaCommerceModel.line(p,6,c,'2026-11-10',{time:'09:30'}).unitCents,1500);
});
