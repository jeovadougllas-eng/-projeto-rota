import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../assets/traxio-geolocation.js';
const geo=globalThis.TraxioGeo;
const query={street:'Rua Mira Mangue',house:'922',city:'Natal',state:'RN',district:'Planalto',zip:'59073230'};
const point={lat:-5.84,lon:-35.26,street:'Rua Mira Mangue',house:'922',city:'Natal',state:'Rio Grande do Norte',zip:'59073-230',country:'BR',provider:'test'};
test('imported columns preserve street, house number, neighborhood, city, state and CEP',()=>{
 const q=geo.parse({address:'RUA MIRA MANGUE, 922 LOTE 09 QUADRA 422, NATAL',cep:'59073230',importFields:[{label:'CIDADE',value:'NATAL'},{label:'ESTADO',value:'RN'},{label:'BAIRRO',value:'PLANALTO'}]});
 assert.equal(q.house,'922');assert.equal(q.street,'RUA MIRA MANGUE');assert.equal(q.city,'NATAL');assert.equal(q.state,'RN');assert.equal(q.district,'PLANALTO');
 const sp=geo.parse({address:'Avenida Paulista',city:'São Paulo',houseNumber:'1000',state:'SP'});assert.equal(sp.state,'SP');assert.equal(sp.house,'1000');
 assert.equal(geo.parse({address:'Rua 25 de Dezembro, LOTE 9, NATAL'}).house,'');
 assert.equal(geo.parse({address:'Rua Teste, nº 123 A, Recife, PE'}).house,'123 A');
 assert.equal(geo.parse({address:'Rua Teste, 123, Recife, PE'}).city,'Recife');
});
test('the latest edited address supersedes preserved spreadsheet fields',()=>{
 const q=geo.parse({address:'Rua Nova · nº 20',geocodingAddressOverride:'Rua Nova · nº 20',houseNumber:'20',city:'Natal',importFields:[{label:'Endereço',value:'Rua Antiga, 10'},{label:'Número',value:'10'}]});
 assert.equal(q.street,'Rua Nova');assert.equal(q.house,'20');
});
test('only matching country, municipality, street and house are accepted automatically',()=>{
 assert.equal(geo.rank([point],query).status,'matched');
 for(const change of [{city:'Parnamirim'},{state:'SP'},{country:'US'},{street:'Rua Mira Outra'},{lat:NaN}])assert.equal(geo.rank([{...point,...change}],query).status,'not_found');
 for(const change of [{house:''},{house:'923'},{zip:'59000000'},{interpolated:true},{city:''}])assert.notEqual(geo.rank([{...point,...change}],query).status,'matched');
 assert.notEqual(geo.rank([{...point,house:'922 B'}],{...query,house:'922 A'}).status,'matched');
});
test('street candidates remain reviewable; distant address matches remain ambiguous',()=>{
 assert.equal(geo.rank([{...point,house:''}],query).status,'review');
 assert.equal(geo.rank([point,{...point,lat:point.lat+0.003}],query).status,'review');
 assert.equal(geo.rank([point,{...point,lat:point.lat+0.00001}],query).status,'matched');
});
test('Geoapify interpolation and low building confidence cannot masquerade as precise addresses',()=>{
 const base={street:'Rua Mira Mangue',housenumber:'922',city:'Natal',state_code:'RN',postcode:'59073230',country_code:'br',lat:-5.84,lon:-35.26,result_type:'building',rank:{confidence_building_level:1}};
 assert.equal(geo.rank(geo.geoapify({features:[{properties:base}]}),query).status,'matched');
 assert.equal(geo.rank(geo.geoapify({features:[{properties:{...base,result_type:'street'}}]}),query).status,'review');
});
