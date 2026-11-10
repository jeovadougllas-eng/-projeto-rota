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
