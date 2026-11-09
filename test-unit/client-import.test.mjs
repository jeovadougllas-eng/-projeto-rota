import{test}from'node:test';import assert from'node:assert/strict';
await import('../assets/rotamapa-client-identity.js');await import('../assets/rotamapa-client-import.js');const M=RotaMapaClientImportModel;
const rows=[['Razão social','Nome fantasia','CNPJ','Endereço','Cidade','Latitude','Longitude','Extra'],['Cliente','Loja','04.252.011/0001-10','Rua Um','Natal','-5.8','-35.2','preservada']];
test('deterministic import preserves CNPJ zeros, all columns and identical duplicate detection',async()=>{
 const original=JSON.stringify(rows),stage=M.stage([...rows,rows[1]],[],'sintetica.csv');assert.equal(stage.canApply,true);assert.equal(stage.added.length,1);assert.equal(stage.duplicates.length,1);assert.equal(stage.added[0].cnpj,'04252011000110');assert.equal(stage.added[0].importFields.at(-1).value,'preservada');assert.equal(RotaMapaClientIdentity.fantasy(stage.added[0]),'Loja');
 const result=await M.materialize(stage,{newId:()=> 'stable'});assert.equal(result[0].id,'stable');assert.equal(JSON.stringify(rows),original);
});
test('retries are idempotent and never change existing data, manually confirmed pins or IDs',()=>{
 const existing={...M.stage(rows).added[0],id:'original',name:'Nome revisado',lat:1,lon:2,locationVerification:'manual_reviewed'},before=JSON.stringify(existing),plan=M.stage(rows,[existing]);assert.equal(plan.added.length,0);assert.equal(plan.unchanged.length,1);assert.equal(plan.canApply,true);assert.equal(JSON.stringify(existing),before);
 assert.equal(M.stage(rows,[]).added.length,1,'another portfolio has an independent import');
});
test('ambiguous duplicates and malformed documents block application rather than overwriting data',()=>{
 const ambiguous=[...rows,[...rows[1]]];ambiguous[2][0]='Outro nome';assert.equal(M.stage(ambiguous).canApply,false);
 for(const cnpj of ['12345678901','4252011000110','4.252011e+13']){const broken=structuredClone(rows);broken[1][2]=cnpj;assert.equal(M.stage(broken).canApply,false);}
 const missing=structuredClone(rows);missing[1][2]='';assert.equal(M.stage(missing).canApply,true);assert.equal(M.stage(missing).warnings.length,1);
});
test('cancellation before or between batches leaves the caller untouched',async()=>{
 const controller=new AbortController(),plan=M.stage(rows);controller.abort();await assert.rejects(M.materialize(plan,{signal:controller.signal}),/cancelada/);assert.equal(plan.added[0].id,undefined);
 const many=[rows[0],...Array.from({length:53},(_,i)=>['Cliente '+i,'','','Rua '+i,'Natal'])],prepared=M.stage(many);let progress=0;
 const result=await M.materialize(prepared,{newId:()=>String(++progress),batchSize:10,onProgress:n=>{if(n===10)controller.abort();}});assert.equal(result.length,53);
 const cancel=new AbortController();await assert.rejects(M.materialize(prepared,{signal:cancel.signal,batchSize:10,onProgress:n=>{if(n===10)cancel.abort();}}),/cancelada/);
});
