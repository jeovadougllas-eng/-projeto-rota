import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';
import {records,fakeMap,services} from './fixtures/routing.js';
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
 await expect(page.locator('#partialRouteDialog')).toBeVisible();await page.screenshot({path:info.outputPath('location-review.png')});await expect(page.locator('#routeReadiness')).toContainText('6 aptos');
 await page.locator('#confirmPartialRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota parcialmente calculada');await expect(page.locator('#liveStopList .live-stop')).toHaveCount(6);
 expect(await page.evaluate(()=>clients.find(c=>String(c.id)==='7').lat)).toBeNull();await expect(page.locator('#routeResult')).toContainText('1 clientes excluídos');
});
test('unverified coordinates are distinguished and need consent',async({page},info)=>{
 await setup(page,info.project.metadata.theme,records.map(c=>({...c,locationVerification:'imported_coordinates'})));await services(page);await select(page);await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();
 await expect(page.locator('#partialRouteMessage')).toContainText('7 com coordenadas não verificadas');await expect(page.locator('#confirmPartialRoute')).toBeDisabled();await page.locator('#includeUnverifiedLocations').check();await page.locator('#confirmPartialRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota calculada');await expect(page.locator('#routeResult')).toContainText('não verificadas');
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
 await setup(page,info.project.metadata.theme,records.map(c=>({...c,lat:null,lon:null})));await page.evaluate(()=>TraxioGeo.locate=async()=>{throw Error('CEP não encontrado');});await select(page);await page.locator('#locationReview summary').click();await page.locator('#retrySelectedLocations').click();
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

test('selected customer used as origin is labeled separately from numbered route stops',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await services(page);await select(page);await page.locator('#calcRoute').click();
 await expect(page.locator('#plannerState')).toHaveText('Rota calculada');
 await expect(page.locator('#routeOrder .route-stop')).toHaveCount(6);
 const labels=await page.evaluate(()=>markers.map(m=>m.getElement().textContent));
 expect(labels).toEqual(['O','1','2','3','4','5','6']);
});

test('suggestion exposes criteria and both planning commands honor the chosen criterion',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await services(page);await select(page);await page.locator('#origin').selectOption('gps');
 await page.locator('#suggestToggle').click();await expect(page.locator('#strategyPanel')).toBeVisible();await expect(page.locator('#suggestToggle')).toHaveAttribute('aria-expanded','true');
 await page.locator('input[name="routeStrategy"][value="priority"]').check();await page.locator('#generateSuggestion').click();await expect(page.locator('#plannerState')).toHaveText('Rota calculada');
 const priorities=await page.evaluate(()=>lastRoute.points.map(c=>c.priority));expect(priorities).toEqual([...priorities].sort((a,b)=>b-a));
 await page.locator('input[name="routeStrategy"][value="balanced"]').check();expect(await page.evaluate(()=>lastRoute)).toBeNull();
 await page.locator('#calcRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota calculada');expect(await page.evaluate(()=>lastRoute.strategy)).toBe('balanced');
});
test('route waits for style.load and clearing while the style loads cancels drawing',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await services(page);await select(page);await page.locator('#origin').selectOption('gps');
 await page.evaluate(()=>{window.__styleEvents={};map.isStyleLoaded=()=>false;map.once=(event,fn)=>window.__styleEvents[event]=fn;map.off=(event,fn)=>{if(window.__styleEvents[event]===fn)delete window.__styleEvents[event];};});
 await page.locator('#calcRoute').click();await expect.poll(()=>page.evaluate(()=>!!window.__styleEvents['style.load'])).toBe(true);
 await page.evaluate(()=>{map.isStyleLoaded=()=>true;window.__styleEvents['style.load']();});
 await expect(page.locator('#plannerState')).toHaveText('Rota calculada');
 await page.locator('#clearRoute').click();await page.evaluate(()=>{map.isStyleLoaded=()=>false;});await page.locator('#calcRoute').click();await expect.poll(()=>page.evaluate(()=>!!window.__styleEvents['style.load'])).toBe(true);
 await page.locator('#clearRoute').click();expect(await page.evaluate(()=>lastRoute)).toBeNull();expect(await page.evaluate(()=>routeGeo)).toBeNull();
});

test('correct city, district and state, geocode again and preserve original commercial fields',async({page},info)=>{
 const rows=records.map((c,i)=>i?c:{...c,city:'São Paulo',neighborhood:'Bairro antigo',state:'SP',importFields:[{label:'Cidade',value:'São Paulo'},{label:'Bairro',value:'Bairro antigo'},{label:'UF',value:'SP'},{label:'CNPJ',value:'00.000.000/0001-00'}]});
 await setup(page,info.project.metadata.theme,rows);await select(page);
 await page.evaluate(()=>{TraxioGeo.locate=async c=>({status:'matched',query:TraxioGeo.parse(c),best:{lat:-5.81,lon:-35.21,provider:'photon_osm',confidence:'address'},candidates:[]});openClientLocation(1);});
 await expect(page.locator('#clientEditDialog')).toBeVisible();await page.locator('#clientRegionCorrection').evaluate(n=>n.open=true);
 await page.locator('#clientCity').fill('Natal');await page.locator('#clientNeighborhood').fill('Tirol');await page.locator('#clientState').fill('RN');await page.locator('#saveClient').click();
 await expect.poll(()=>page.evaluate(()=>clients.find(c=>String(c.id)==='1').locationVerification)).toBe('automatic_housenumber');
 const c=await page.evaluate(()=>clients.find(c=>String(c.id)==='1'));
 expect(c.geocodingRegionOverride).toEqual({city:'Natal',district:'Tirol',state:'RN'});expect(c.originalRegion.city).toBe('São Paulo');expect(c.importFields).toEqual(rows[0].importFields);expect(c.locationEvidence.query.city).toBe('Natal');
});

test('ad hoc navigation remains available without selecting or adding clients and clear cancels it',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await services(page);await page.locator('#adHocDisclosure summary').click();
 await page.evaluate(()=>window.traxioAvulsoSet(-5.81,-35.21));await page.locator('#avulsoRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota calculada');
 await expect(page.locator('#routeResult')).toContainText('Destino avulso');await expect(page.locator('#liveStopList .live-stop')).toHaveCount(1);expect(await page.evaluate(()=>clients.length)).toBe(7);expect(await page.evaluate(()=>selectedIds.size)).toBe(0);
 let release;const hold=new Promise(r=>release=r);await services(page,{hold});await page.locator('#avulsoRoute').click();await expect(page.locator('#plannerState')).toHaveText('Calculando rota');await page.locator('#clearRoute').click();release();await page.waitForTimeout(100);
 expect(await page.evaluate(()=>routeGeo)).toBeNull();await expect(page.locator('#liveNavigation')).toBeHidden();expect(await page.evaluate(()=>clients.length)).toBe(7);
});

test('partial route excludes unverified coordinates by default and only includes confirmed clients',async({page},info)=>{
 await setup(page,info.project.metadata.theme,records.map((c,i)=>i===6?{...c,locationVerification:'unverified'}:c));await services(page);await select(page);await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();
 await expect(page.locator('#includeUnverifiedLocations')).not.toBeChecked();await page.locator('#confirmPartialRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota parcialmente calculada');await expect(page.locator('#liveStopList .live-stop')).toHaveCount(6);await expect(page.locator('#routeResult')).not.toContainText('Coordenadas não verificadas incluídas');
});

test('a late location update of an excluded client preserves the confirmed partial itinerary',async({page},info)=>{
 await setup(page,info.project.metadata.theme,records.map((c,i)=>i===6?{...c,lat:null,lon:null}:c));await page.evaluate(()=>TraxioGeo.locate=()=>new Promise(()=>{}));await services(page);await select(page);await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();await page.locator('#confirmPartialRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota parcialmente calculada');
 await page.evaluate(()=>{const c=clients.find(c=>String(c.id)==='7');c.lat=-5.81;c.lon=-35.21;c.locationVerification='automatic_housenumber';render();});
 await expect(page.locator('#plannerState')).toHaveText('Rota parcialmente calculada');await expect(page.locator('#liveStopList .live-stop')).toHaveCount(6);expect(await page.evaluate(()=>routeGeo!==null)).toBe(true);await expect(page.locator('#routeReadiness')).toContainText('7 aptos');
});
test('selected client geocoding is prioritized ahead of the rest of the imported portfolio',async({page},info)=>{
 await setup(page,info.project.metadata.theme,records.map(c=>({...c,lat:null,lon:null})));
 await page.evaluate(()=>{window.__geoOrder=[];TraxioGeo.locate=async c=>{window.__geoOrder.push(String(c.id));if(String(c.id)==='1')await new Promise(resolve=>window.__releaseFirstGeo=resolve);return {status:'not_found',reason:'Número não cadastrado no teste',candidates:[]};};queueClientGeocode(clients.map(c=>c.id));});
 await expect.poll(()=>page.evaluate(()=>window.__geoOrder.length)).toBe(1);
 await page.evaluate(()=>{selectedIds.add(7);queueSelectedGeocode();window.__releaseFirstGeo();});await expect.poll(()=>page.evaluate(()=>window.__geoOrder[1])).toBe('7');
});

test('a parsed map style remains usable while viewport tiles are loading',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await services(page);await select(page);await page.locator('#origin').selectOption('gps');
 await page.evaluate(()=>{map.isStyleLoaded=()=>false;map.getStyle=()=>({layers:[{id:'background',type:'background'}]});});
 await page.locator('#calcRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota calculada');expect(await page.evaluate(()=>!!map.getSource('route'))).toBe(true);
});
test('GPS origin rejects coarse or stale fixes instead of routing from an unreliable position',async({page},info)=>{
 await setup(page,info.project.metadata.theme);await select(page);await page.locator('#origin').selectOption('gps');
 await page.evaluate(()=>navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:-5.8,longitude:-35.22,accuracy:350},timestamp:Date.now()}));await page.locator('#calcRoute').click();await expect(page.locator('#routeResult')).toContainText('GPS impreciso');
 await page.evaluate(()=>navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:-5.8,longitude:-35.22,accuracy:10},timestamp:Date.now()-60000}));await page.locator('#calcRoute').click();await expect(page.locator('#routeResult')).toContainText('GPS antigo');expect(await page.evaluate(()=>lastRoute)).toBeNull();
});

test('large Android portrait viewport uses map-first layout and keeps the single action bar visible',async({page},info)=>{
 await page.setViewportSize({width:1200,height:1920});await setup(page,info.project.metadata.theme);
 const mapBox=await page.locator('.workspace-map').boundingBox(),planBox=await page.locator('#routePlannerPanel').boundingBox();expect(mapBox.y).toBeLessThan(planBox.y);
 const action=await page.locator('#routeActionBar').boundingBox();expect(action.y+action.height).toBeLessThanOrEqual(1921);
 await page.setViewportSize({width:1920,height:1200});const landscapeMap=await page.locator('.workspace-map').boundingBox(),landscapePlan=await page.locator('#routePlannerPanel').boundingBox();expect(landscapeMap.x).toBeGreaterThan(landscapePlan.x);
});

