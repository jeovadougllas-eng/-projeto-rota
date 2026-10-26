import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';
import {fakeMap} from './fixtures/routing.js';

const geometry={type:'LineString',coordinates:[[-35.22,-5.81],[-35.21,-5.81],[-35.20,-5.81]]};
const stops=[{id:'a',name:'Cliente A',lat:-5.81,lon:-35.21},{id:'b',name:'Cliente B',lat:-5.81,lon:-35.20}];
async function setup(page,{records=[],liveMaps=false}={}){
 await prepare(page,{records,liveMaps});
 await page.addInitScript(()=>{
  const position=()=>({coords:{latitude:-5.81,longitude:-35.22,accuracy:10,heading:90},timestamp:Date.now()});
  Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:ok=>ok(position()),watchPosition:(ok,fail)=>{window.__gps=ok;window.__gpsError=fail;return 1;},clearWatch:()=>{window.__gps=null;}},configurable:true});
 });
 await ready(page);
}
async function navigation(page,{missingGeometry=false}={}){
 await page.locator('.tabs [data-tab="mapa"]').click();
 await page.evaluate(({stops,geometry,missingGeometry})=>{
  // Map rendering is independently covered with the real MapLibre/tile tests.
  // This adapter exercises the production GPS, routing requests and GeoJSON updates deterministically.
  const source={setData(data){window.__routeData=data;}};
  map={__traxioPalette:true,resize(){},easeTo(){},getZoom(){return 16;},getSource(){return source;},isStyleLoaded(){return true;},setPaintProperty(){},fitBounds(){},getStyle(){return {layers:[]};},on(){},once(){}};
  class Marker{constructor(options){this.el=options?.element||document.createElement('div');}setLngLat(){return this;}addTo(){return this;}remove(){}getElement(){return this.el;}setPopup(){return this;}}
  class Bounds{extend(){return this;}}
  window.maplibregl={Marker,LngLatBounds:Bounds};
  window.traxioBeginNavigation(stops,missingGeometry?null:geometry);
 },{stops,geometry,missingGeometry});
 await page.locator('#liveStart').click();
}
const emit=(page,lat,lon,accuracy=10)=>page.evaluate(({lat,lon,accuracy})=>window.__gps?.({coords:{latitude:lat,longitude:lon,accuracy,heading:90},timestamp:Date.now()}),{lat,lon,accuracy});
const routeReply=coords=>({code:'Ok',routes:[{geometry:{type:'LineString',coordinates:coords},distance:2400,duration:300}]});

test('CSV import geocodes a numbered address and keeps an approximate street pending for explicit review',async({page},info)=>{
 test.setTimeout(35000);await setup(page);page.on('dialog',d=>d.dismiss());let queries=[];
 await page.route(/^https:\/\/photon\.komoot\.io\/(?:api|structured)\/?(?:\?|$)/,async route=>{
  const u=new URL(route.request().url());queries.push(u);const street=(u.searchParams.get('q')||u.searchParams.get('street')||'').includes('Rua Exata')?'Rua Exata':'Rua Aproximada';
  await route.fulfill({json:{features:[{geometry:{type:'Point',coordinates:[-35.21,-5.81]},properties:{street,housenumber:street==='Rua Exata'?'10':undefined,city:'Natal',state:'Rio Grande do Norte',countrycode:'BR'}}]}});
 });
 await page.locator('.tabs [data-tab="dados"]').click();
 await page.locator('#sheetFile').setInputFiles({name:'enderecos.csv',mimeType:'text/csv',buffer:Buffer.from('Nome;Logradouro;Número;Cidade;Bairro;UF;CEP\nCLIENTE EXATO;Rua Exata;10;Natal;Tirol;RN;\nCLIENTE REVISAR;Rua Aproximada;20;Natal;Tirol;RN;')});
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1')).filter(c=>c.locationEvidence||c.locationCandidate).length),{timeout:15000}).toBe(2);
 const rows=await page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1')));
 expect(rows[0].lat).toBe(-5.81);expect(rows[0].locationVerification).toBe('automatic_housenumber');expect(rows[0].houseNumber).toBe('10');
 expect(rows[1].lat).toBeNull();expect(rows[1].locationCandidate.lat).toBe(-5.81);
 expect(queries.every(u=>u.searchParams.get('lang')==='default')).toBe(true);expect(queries.some(u=>(u.searchParams.get('q')||u.searchParams.get('housenumber')||'').includes('10'))).toBe(true);
 await page.reload();await page.locator('body.traxio-ui-ready').waitFor();
 await page.locator('.tabs [data-tab="mapa"]').click();await page.locator('#mapClientListDisclosure summary').click();
 await page.locator('#mapClientList .client-tile').filter({hasText:'CLIENTE REVISAR'}).getByRole('button',{name:'Confirmar pin no mapa',exact:true}).first().click();
 await expect(page.locator('#clientEditDialog')).not.toBeVisible();await expect(page.locator('#pinConfirmPanel')).toBeVisible();await expect(page.locator('#lat')).toHaveValue('-5.810000');
 await page.locator('#backToClient').click();await expect(page.locator('#pinConfirmPanel')).toBeHidden();
 const confirmed=await page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1'))[1]);expect(confirmed.locationVerification).toBe('manual_reviewed');expect(confirmed.lat).toBe(-5.81);expect(confirmed.locationCandidate).toBeUndefined();expect(confirmed.address).toBe(rows[1].address);expect(confirmed.importFields).toEqual(rows[1].importFields);
 await page.locator('.tabs [data-tab="mapa"]').click();
 await page.locator('#mapClientList input[type="checkbox"]').nth(0).check();await page.locator('#mapClientList input[type="checkbox"]').nth(1).check();
 await page.locator('#origin').selectOption('gps');
 await page.route('https://router.project-osrm.org/**',async route=>{
  const u=new URL(route.request().url());const coords=u.pathname.split('/').at(-1).split(';').map(p=>p.split(',').map(Number));
  if(u.pathname.includes('/table/'))await route.fulfill({json:{code:'Ok',distances:coords.map((_,i)=>coords.map((_,j)=>i===j?0:1000))}});
  else await route.fulfill({json:routeReply(coords)});
 });
 await fakeMap(page);await page.locator('#calcRoute').click();await expect(page.locator('#routeResult')).toContainText('Trajeto por ruas');await expect(page.locator('#liveStopList .live-stop')).toHaveCount(2);
 const path=info.outputPath('importacao-localizacao-rota.png');await page.screenshot({path});await info.attach('Importação, confirmação e rota',{path,contentType:'image/png'});
});

test('GPS recalculates after a sustained deviation, updates GeoJSON and preserves unvisited stop order',async({page},info)=>{
 await setup(page);let calls=[];
 await page.route('https://router.project-osrm.org/route/**',async route=>{const coords=new URL(route.request().url()).pathname.split('/').at(-1).split(';').map(p=>p.split(',').map(Number));calls.push(coords);await route.fulfill({json:routeReply(coords)});});
 await navigation(page);await page.clock.install();
 await emit(page,-5.81,-35.218);expect(calls).toHaveLength(0);
 await emit(page,-5.812,-35.218);expect(calls).toHaveLength(0);
 await page.clock.fastForward(3100);await emit(page,-5.812,-35.217);
 await expect(page.locator('#liveGPSState')).toContainText('Nova rota calculada');expect(calls).toHaveLength(1);expect(calls[0]).toEqual([[-35.217,-5.812],[-35.21,-5.81],[-35.20,-5.81]]);
 expect(await page.evaluate(()=>window.__routeData.geometry.coordinates)).toEqual(calls[0]);
 await page.screenshot({path:info.outputPath('gps-recalculo.png')});
});

test('GPS ignores poor accuracy, brief deviations and stale fixes',async({page})=>{
 await setup(page);let calls=0;await page.route('https://router.project-osrm.org/route/**',async route=>{calls++;await route.fulfill({json:routeReply(geometry.coordinates)});});
 await navigation(page);await page.clock.install();
 await emit(page,-5.82,-35.218,160);await page.clock.fastForward(7000);await emit(page,-5.82,-35.218,160);expect(calls).toBe(0);
 await emit(page,-5.812,-35.218);await page.clock.fastForward(2000);await emit(page,-5.81,-35.218);await page.clock.fastForward(4000);await emit(page,-5.812,-35.218);expect(calls).toBe(0);
 await page.evaluate(()=>window.__gps({coords:{latitude:-5.82,longitude:-35.21,accuracy:10},timestamp:Date.now()-30000}));await expect(page.locator('#liveGPSState')).toContainText('Sinal GPS antigo');expect(calls).toBe(0);
});

test('GPS builds missing geometry, retries a failed recalculation and cancels late results when the route ends',async({page})=>{
 await setup(page);let calls=0,lateResolve,lateFinished=false;const late=new Promise(r=>lateResolve=r);
 await page.route('https://router.project-osrm.org/route/**',async route=>{calls++;if(calls===1){await route.abort();return;}if(calls===3){await late;await route.fulfill({json:routeReply(geometry.coordinates)}).catch(()=>{});lateFinished=true;return;}await route.fulfill({json:routeReply(geometry.coordinates)});});
 await navigation(page,{missingGeometry:true});await page.clock.install();await emit(page,-5.812,-35.218);
 await expect(page.locator('#liveGPSState')).toContainText('Sem conexão');expect(calls).toBe(1);
 await page.clock.fastForward(15100);await emit(page,-5.812,-35.217);await expect(page.locator('#liveGPSState')).toContainText('Nova rota calculada');expect(calls).toBe(2);
 await page.clock.fastForward(15100);await emit(page,-5.82,-35.217);await page.clock.fastForward(3100);await emit(page,-5.82,-35.216);await expect.poll(()=>calls).toBe(3);
 page.on('dialog',d=>d.accept());await page.locator('#liveStop').click();await expect(page.locator('#routeResult')).toContainText('encerrada antecipadamente');lateResolve();await expect.poll(()=>lateFinished).toBe(true);
 await expect(page.locator('#liveNavigation')).toBeHidden();await expect(page.locator('#routeResult')).toContainText('encerrada antecipadamente');
});

test('arrival removes the visited stop from recalculation and preserves remaining destination',async({page})=>{
 await setup(page);let calls=[];await page.route('https://router.project-osrm.org/route/**',async route=>{const coords=new URL(route.request().url()).pathname.split('/').at(-1).split(';').map(p=>p.split(',').map(Number));calls.push(coords);await route.fulfill({json:routeReply(coords)});});
 await navigation(page);await page.clock.install();await emit(page,stops[0].lat,stops[0].lon);await page.clock.fastForward(30100);await emit(page,stops[0].lat,stops[0].lon);
 await expect(page.locator('#liveStopList .visited')).toHaveCount(1);await expect.poll(()=>calls.length).toBe(1);expect(calls[0]).toEqual([[-35.21,-5.81],[-35.20,-5.81]]);
});

test('Apple Maps handoff sends exact coordinates, keeps Traxio open and advances only after a confirmed visit',async({page})=>{
 await setup(page);await navigation(page);
 const link=page.locator('#openAppleMaps');await expect(link).toBeVisible();
 let url=new URL(await link.getAttribute('href'));expect(url.origin).toBe('https://maps.apple.com');expect(url.searchParams.get('daddr')).toBe('-5.81,-35.21');expect(url.searchParams.get('dirflg')).toBe('d');await expect(link).toHaveAttribute('target','_blank');
 const google=new URL(await page.locator('#openGoogleMaps').getAttribute('href'));expect(google.origin).toBe('https://www.google.com');expect(google.searchParams.get('api')).toBe('1');expect(google.searchParams.get('destination')).toBe('-5.81,-35.21');expect(google.searchParams.get('dir_action')).toBe('navigate');
 const waze=new URL(await page.locator('#openWaze').getAttribute('href'));expect(waze.origin).toBe('https://waze.com');expect(waze.searchParams.get('ll')).toBe('-5.81,-35.21');expect(waze.searchParams.get('navigate')).toBe('yes');
 const before=page.url();await page.context().route('https://maps.apple.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<p>Apple Maps handoff test</p>'}));
 const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;await popup.waitForLoadState();expect(new URL(popup.url()).searchParams.get('daddr')).toBe('-5.81,-35.21');await popup.close();expect(page.url()).toBe(before);
 const dismiss=dialog=>dialog.dismiss();page.once('dialog',dismiss);await page.locator('#confirmVisit').click();await expect(page.locator('#liveStopList .visited')).toHaveCount(0);
 page.once('dialog',d=>d.accept());await page.locator('#confirmVisit').click();await expect(page.locator('#liveStopList .visited')).toHaveCount(1);
 url=new URL(await link.getAttribute('href'));expect(url.searchParams.get('daddr')).toBe('-5.81,-35.2');await expect(page.locator('#liveNextStop')).toContainText('Cliente B');expect(new URL(await page.locator('#openGoogleMaps').getAttribute('href')).searchParams.get('destination')).toBe('-5.81,-35.2');expect(new URL(await page.locator('#openWaze').getAttribute('href')).searchParams.get('ll')).toBe('-5.81,-35.2');
});

