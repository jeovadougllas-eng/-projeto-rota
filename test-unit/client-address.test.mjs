import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../assets/traxio-geolocation.js';
const geo=globalThis.TraxioGeo;
test('legacy imported and company address fields recover all editor boxes without changing evidence or pin',()=>{
 const c={id:'old',address:'RUA DOS VIOLEIROS · nº 929',lat:-5.81,lon:-35.21,locationVerification:'manual_reviewed',locationConfirmedAt:'2026-10-26',importFields:[{label:'BAIRRO',value:'Planalto'}],companyData:{fields:[['Município','Natal'],['UF','RN'],['CEP','59138-390'],['Complemento','Casa 2']]}};
 const before=structuredClone(c),p=geo.addressParts(c);assert.deepEqual(p,{street:'RUA DOS VIOLEIROS',house:'929',complement:'Casa 2',city:'Natal',district:'Planalto',state:'RN',zip:'59138390',country:'BR'});assert.deepEqual(c,before);
 const saved=geo.structured(c);for(const k of ['lat','lon','locationVerification','locationConfirmedAt','address','importFields','companyData'])assert.deepEqual(saved[k],c[k]);assert.deepEqual(geo.structured(saved),saved);
});
test('spreadsheet number, complement and state remain separate; named street dates never become house numbers',()=>{
 const p=geo.addressParts({address:'Rua Mira Mangue, 922 LOTE 09 QUADRA 422, NATAL',importFields:[{label:'ESTADO',value:'Rio Grande do Norte'}]});assert.equal(p.street,'Rua Mira Mangue');assert.equal(p.house,'922');assert.equal(p.complement,'LOTE 09 QUADRA 422');assert.equal(p.city,'NATAL');assert.equal(p.state,'RN');
 const minimal=geo.addressParts({address:'Rua 25 de Dezembro'});assert.equal(minimal.house,'');assert.equal(minimal.city,'');
 const sn=geo.addressParts({address:'Rua X, S/N, Loja 5, Alecrim, Natal/RN, Brasil'});assert.equal(sn.house,'S/N');assert.equal(sn.complement,'Loja 5');assert.equal(sn.district,'Alecrim');assert.equal(sn.state,'RN');assert.equal(geo.parse({address:'Rua X, S/N, Natal'}).house,'');
});
test('manual fields and intentionally cleared optional boxes outrank old spreadsheet and official data',()=>{
 const c={addressFieldsVersion:1,street:'Rua Corrigida',houseNumber:'20',complement:'',city:'Natal',neighborhood:'Tirol',state:'RN',address:'Rua Corrigida · nº 20',geocodingAddressOverride:'Rua Antiga · nº 10',importFields:[{label:'Número',value:'10'},{label:'Complemento',value:'Casa 2'},{label:'Cidade',value:'Recife'}],companyData:{fields:[['Complemento','Loja 4'],['UF','PE']]},pharmacyNetwork:'Santa Fé'};
 const p=geo.addressParts(c);assert.equal(p.street,'Rua Corrigida');assert.equal(p.house,'20');assert.equal(p.complement,'');assert.equal(p.city,'Natal');assert.equal(p.state,'RN');assert.equal(geo.structured(c).pharmacyNetwork,'Santa Fé');
});
