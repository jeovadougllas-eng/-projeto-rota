import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';
export const records=Array.from({length:7},(_,i)=>({id:i+1,name:'Visita de teste '+(i+1),address:'Avenida Prudente de Morais, '+(1000+i*100)+', Natal, RN',city:i===6?'Parnamirim':'Natal',neighborhood:i%2?'Tirol':'Lagoa Nova',lat:-5.805-i*.001,lon:-35.208-i*.001,locationVerification:'manual_reviewed',priority:i%3+1,importFields:[]}));
export async function fakeMap(page){
 await page.evaluate(()=>{
  const sources=new Map(),layers=new Set();window.maplibregl={LngLatBounds:class{extend(){return this;}},Marker:class{constructor(o){this.el=o?.element||document.createElement('div');}setLngLat(){return this;}setPopup(){return this;}addTo(){return this;}remove(){}on(){return this;}getElement(){return this.el;}},Popup:class{setText(){return this;}}};
  map={__traxioPalette:true,__traxioOrigin:true,isStyleLoaded:()=>true,getSource:id=>sources.get(id),getLayer:id=>layers.has(id),addSource:(id,o)=>sources.set(id,{...o,setData(data){this.data=data;}}),addLayer:o=>layers.add(o.id),removeLayer:id=>layers.delete(id),removeSource:id=>sources.delete(id),setPaintProperty(){},getStyle:()=>({layers:[]}),resize(){},fitBounds(){},flyTo(){},easeTo(){},jumpTo(){},on(){},once(){},off(){}};
 });
}
export async function services(page,{tableFail=false,roadFail=false,hold=null}={}){
 await page.route('https://router.project-osrm.org/**',async r=>{
  const url=new URL(r.request().url()),coords=url.pathname.split('/').at(-1).split(';').map(p=>p.split(',').map(Number));
  if(url.pathname.includes('/table/')){if(tableFail)return r.abort();return r.fulfill({json:{code:'Ok',distances:coords.map((_,i)=>coords.map((_,j)=>i===j?0:1000+Math.abs(i-j)*100))}});}
  if(hold)await hold;if(roadFail)return r.abort();await r.fulfill({json:{code:'Ok',routes:[{geometry:{type:'LineString',coordinates:coords},distance:7400,duration:1260}]}}).catch(()=>{});
 });
}
async function setup(page,theme,rows=records){
 await prepare(page,{records:rows,theme});
 await page.addInitScript(()=>{Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:ok=>ok({coords:{latitude:-5.8,longitude:-35.22,accuracy:8}}),watchPosition:()=>1,clearWatch(){}}});});
 await ready(page);await fakeMap(page);await page.locator('.tabs [data-tab="mapa"]').click();
}
async function select(page){await page.locator('#selectEntirePortfolio').click();await expect(page.locator('#selectedCount')).toContainText('7 selecionados');}
test('seven selected clients produce an itinerary, road geometry, distance and GPS navigation',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await services(page);await select(page);await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();
 await expect(page.locator('#plannerState')).toHaveText('Rota calculada');await expect(page.locator('#routeOrder .route-stop')).toHaveCount(7);
 await expect(page.locator('#routeResult')).toContainText('7.4 km');expect(await page.evaluate(()=>routeGeo.coordinates.length)).toBe(8);
 await expect(page.locator('#liveStopList .live-stop')).toHaveCount(7);await expect(page.locator('#liveStart')).toBeEnabled();
 expect(new URL(await page.locator('#openGoogleMaps').getAttribute('href')).searchParams.get('destination')).toBeTruthy();
});
test('selection persists through search, different cities, sync ID conversion and reload',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await select(page);
 await page.locator('#regionPicker summary').click();await page.locator('#regionCity').selectOption('parnamirim');await expect(page.locator('#mapClientList input')).toHaveCount(1);await expect(page.locator('#selectedCount')).toContainText('7 selecionados');
 await page.locator('#mapClientSearch').fill('inexistente');await expect(page.locator('#mapClientList input')).toHaveCount(0);await expect(page.locator('#selectedCount')).toContainText('7 selecionados');
 await page.evaluate(()=>{clients=clients.map(c=>({...c,id:String(c.id)}));render();});await expect(page.locator('#selectedCount')).toContainText('7 selecionados');
 await page.reload();await page.locator('body.traxio-ui-ready').waitFor();await page.locator('.tabs [data-tab="mapa"]').click();await expect(page.locator('#selectedCount')).toContainText('7 selecionados');
});
test('select filtered results respects text and adds instead of losing other cities',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await page.locator('#mapClientSearch').fill('Visita de teste 1');await page.locator('#selectAllClients').click();await expect(page.locator('#selectedCount')).toContainText('1 selecionado');
 await page.locator('#mapClientSearch').fill('Visita de teste 7');await page.locator('#selectAllClients').click();await expect(page.locator('#selectedCount')).toContainText('2 selecionados');
 await page.locator('#selectNoClients').click();await expect(page.locator('#selectedCount')).toContainText('0 selecionados');expect(await page.evaluate(()=>clients.length)).toBe(7);
});
test('missing coordinates require explicit partial confirmation and remain unchanged',async({page},info)=>{
 const rows=records.map((c,i)=>i===6?{...c,lat:null,lon:null}:c);
 await setup(page,info.project.metadata.theme,rows);await services(page);await select(page);await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();
 await expect(page.locator('#partialRouteDialog')).toBeVisible();await expect(page.locator('#routeReadiness')).toContainText('6 aptos');
 await page.locator('#confirmPartialRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota parcialmente calculada');await expect(page.locator('#liveStopList .live-stop')).toHaveCount(6);
 expect(await page.evaluate(()=>clients.find(c=>String(c.id)==='7').lat)).toBeNull();await expect(page.locator('#routeResult')).toContainText('1 clientes excluídos');
});
test('unverified coordinates are distinguished and need consent',async({page},info)=>{
 await setup(page,info.project.metadata.theme,records.map(c=>({...c,locationVerification:'imported_coordinates'})));await services(page);await select(page);await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();
 await expect(page.locator('#partialRouteMessage')).toContainText('7 com coordenadas não verificadas');await page.locator('#confirmPartialRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota calculada');await expect(page.locator('#routeResult')).toContainText('não verificadas');
});
test('GPS denial reports an actionable origin error',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await select(page);await page.evaluate(()=>navigator.geolocation.getCurrentPosition=(ok,fail)=>fail({message:'Permissão negada'}));await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();
 await expect(page.locator('#plannerState')).toHaveText('Aguardando origem');await expect(page.locator('#routeResult')).toContainText('Permissão negada');expect(await page.evaluate(()=>lastRoute)).toBeNull();
});
test('manual numbered origin is confirmed and used by the road request',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await services(page);await select(page);await page.locator('#origin').selectOption('manual');
 await page.locator('#routeOriginAddress').fill('Rua Exata, 10, Natal, RN');
 await page.evaluate(()=>TraxioGeo.locate=async()=>({status:'matched',best:{lat:-5.8,lon:-35.22}}));await page.locator('#findRouteOrigin').click();await page.locator('#confirmRouteOrigin').click();await page.locator('#calcRoute').click();
 await expect(page.locator('#plannerState')).toHaveText('Rota calculada');expect(await page.evaluate(()=>lastRoute.start.lat)).toBe(-5.8);
});
test('geocoding failure never invents coordinates and presents review actions',async({page},info)=>{
 await setup(page,info.project.metadata.theme,records.map(c=>({...c,lat:null,lon:null})));await select(page);await page.evaluate(()=>TraxioGeo.locate=async()=>{throw Error('CEP não encontrado');});await page.locator('#locationReview summary').click();await page.locator('#retrySelectedLocations').click();
 await expect(page.locator('#locationReviewList')).toContainText('CEP não encontrado');expect(await page.evaluate(()=>clients.every(c=>c.lat===null))).toBe(true);await page.locator('#calcRoute').click();await expect(page.locator('#confirmPartialRoute')).toBeDisabled();await page.locator('#cancelPartialRoute').click();expect(await page.evaluate(()=>lastRoute)).toBeNull();
});
for(const kind of ['table','road'])test(kind+' service failure does not report success or enable navigation',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await services(page,{tableFail:kind==='table',roadFail:kind==='road'});await select(page);await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();
 await expect(page.locator('#plannerState')).toHaveText('Falha de comunicação');await expect(page.locator('#liveNavigation')).toBeHidden();expect(await page.evaluate(()=>lastRoute)).toBeNull();await expect(page.locator('#calcRoute')).toBeEnabled();
});
test('origin change invalidates calculated route and clear cancels an in-flight result',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await services(page);await select(page);await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota calculada');
 await page.locator('#origin').selectOption('first');await expect(page.locator('#liveNavigation')).toBeHidden();expect(await page.evaluate(()=>routeGeo)).toBeNull();
 let release;const hold=new Promise(r=>release=r);await services(page,{hold});await page.locator('#calcRoute').click();await expect(page.locator('#plannerState')).toHaveText('Calculando rota');await page.locator('#clearRoute').click();release();await page.waitForTimeout(150);
 expect(await page.evaluate(()=>lastRoute)).toBeNull();expect(await page.evaluate(()=>routeGeo)).toBeNull();await expect(page.locator('#selectedCount')).toContainText('7 selecionados');
});
test('tablet controls, collapsing planner and reduced viewport retain values and fit width',async({page},info)=>{
 await setup(page,info.project.metadata.theme);const original=page.viewportSize();await page.locator('#mapClientSearch').fill('teste');
 await page.setViewportSize({width:original.width,height:Math.max(420,original.height-300)});await page.locator('#mapClientSearch').focus();await expect(page.locator('#mapClientSearch')).toHaveValue('teste');
 const size=await page.locator('#calcRoute').boundingBox();expect(size.height).toBeGreaterThanOrEqual(44);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.setViewportSize(original);await page.locator('#routePlannerPanel>summary').click();await expect(page.locator('#map')).toBeVisible();await page.locator('#routePlannerPanel>summary').click();await expect(page.locator('#mapClientSearch')).toHaveValue('teste');
 await page.screenshot({path:info.outputPath('tablet-after.png'),fullPage:true});
});
