import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';
import {records,fakeMap,services} from './fixtures/routing.js';
async function setup(page,info,rows=records){
 await prepare(page,{records:rows,theme:info.project.metadata.theme});
 await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:ok=>ok({coords:{latitude:-5.8,longitude:-35.22,accuracy:8}}),watchPosition:()=>1,clearWatch(){}}}));
 await ready(page);await fakeMap(page);await page.locator('.tabs [data-tab="mapa"]').click();
}
async function confirmPoint(page){
 await page.evaluate(()=>{openClientLocation(1,{lat:-5.812345,lon:-35.212345});setDraft(-5.812345,-35.212345);});
 await page.locator('#adjustPin').click();await page.locator('#backToClient').click();
}
test('confirming a map position saves immediately and survives reload without another Save click',async({page},info)=>{
 await setup(page,info,records.map((c,i)=>i?c:{...c,lat:null,lon:null,locationVerification:'pending'}));
 await confirmPoint(page);
 const c=await page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1')).find(c=>String(c.id)==='1'));
 expect(c.lat).toBe(-5.812345);expect(c.lon).toBe(-35.212345);expect(c.locationVerification).toBe('manual_reviewed');
 expect(c.importFields).toEqual(records[0].importFields);expect(c.locationConfirmedAt).toBeTruthy();
 await page.reload();await page.locator('body.traxio-ui-ready').waitFor();
 expect(await page.evaluate(()=>clients.find(c=>String(c.id)==='1').lat)).toBe(-5.812345);
});
test('forced lookup cannot overwrite a manually confirmed location, including an in-flight result',async({page},info)=>{
 await setup(page,info);
 await page.evaluate(async()=>{TraxioGeo.locate=async()=>({status:'matched',best:{lat:-6,lon:-36,provider:'test'},candidates:[]});await queueClientGeocode([1],{force:true});});
 expect(await page.evaluate(()=>clients[0].lat)).toBe(records[0].lat);
 await page.evaluate(()=>{clients[0].lat=null;clients[0].lon=null;clients[0].locationVerification='pending';geoCandidates.delete(1);TraxioGeo.locate=()=>new Promise(resolve=>window.__releaseGeo=()=>resolve({status:'matched',best:{lat:-6,lon:-36,provider:'test'},candidates:[]}));window.__lookup=geocodeOneSelected(clients[0],{force:true});});
 await expect.poll(()=>page.evaluate(()=>typeof window.__releaseGeo)).toBe('function');
 await confirmPoint(page);await page.evaluate(async()=>{window.__releaseGeo();await window.__lookup;});
 expect(await page.evaluate(()=>clients[0].lat)).toBe(-5.812345);
});
test('after a suggested sequence, failed street service leaves Trace enabled and retries only the approved subset',async({page},info)=>{
 await setup(page,info,records.map((c,i)=>i===6?{...c,lat:null,lon:null,locationVerification:'pending'}:c));
 await services(page,{roadFail:true});await page.locator('#selectEntirePortfolio').click();await page.locator('#origin').selectOption('gps');
 await page.locator('#suggestToggle').click();await page.locator('#generateSuggestion').click();await page.locator('#confirmPartialRoute').click();
 await expect(page.locator('#plannerState')).toHaveText('Falha de comunicação');await expect(page.locator('#roadRoute')).toBeEnabled();await expect(page.locator('#liveNavigation')).toBeHidden();
 expect(await page.evaluate(()=>lastRoute)).toBeNull();
 await services(page);await page.locator('#roadRoute').click();await expect(page.locator('#partialRouteDialog')).not.toBeVisible();
 await expect(page.locator('#plannerState')).toHaveText('Rota parcialmente calculada');await expect(page.locator('#routeOrder .route-stop')).toHaveCount(6);await expect(page.locator('#liveStart')).toBeEnabled();
});
test('confirmed clients can start a partial route while other lookups continue, and completion preserves navigation',async({page},info)=>{
 await setup(page,info,records.map((c,i)=>i===6?{...c,lat:null,lon:null,locationVerification:'pending'}:c));await services(page);
 await page.evaluate(()=>TraxioGeo.locate=()=>new Promise(resolve=>window.__finishLookup=()=>resolve({status:'review',reason:'Confira o número',best:{lat:-5.82,lon:-35.22},candidates:[]})));
 await page.locator('#selectEntirePortfolio').click();await page.locator('#origin').selectOption('gps');await page.locator('#locationReview summary').click();await page.locator('#retrySelectedLocations').click();
 await expect.poll(()=>page.evaluate(()=>typeof window.__finishLookup)).toBe('function');await expect(page.locator('#routeConfirmedOnly')).toBeVisible();await expect(page.locator('#routeConfirmedOnly')).toBeEnabled();
 await page.locator('#routeConfirmedOnly').click();await page.locator('#confirmPartialRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota parcialmente calculada');
 await page.evaluate(()=>window.__finishLookup());await expect(page.locator('#retrySelectedLocations')).toBeEnabled();await expect(page.locator('#plannerState')).toHaveText('Rota parcialmente calculada');await expect(page.locator('#liveStart')).toBeEnabled();
});
test('local-storage failure does not report a confirmed point as saved',async({page},info)=>{
 await setup(page,info);await page.evaluate(()=>{const native=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='projeto_rota_mapa_v1')throw new DOMException('Quota exceeded','QuotaExceededError');return native.call(this,k,v);};});
 await confirmPoint(page);await expect(page.locator('#mapStatus')).toContainText('Não foi possível salvar');
 expect(await page.evaluate(()=>clients[0].lat)).toBe(records[0].lat);
});

async function installCloudDouble(page){
 await page.evaluate(async()=>{
  window.__serverRows=clients.map(c=>({local_id:String(c.id),data:structuredClone(c),revision:1,deleted_at:null}));window.__rpcWrites=[];
  authClient.from=()=>{
   const chain={then:(ok,fail)=>Promise.resolve({data:structuredClone(window.__serverRows),error:null}).then(ok,fail)};
   for(const name of ['select','eq','order','range'])chain[name]=()=>chain;
   return chain;
  };
  authClient.rpc=async(name,args)=>{
   const row=window.__serverRows.find(r=>r.local_id===args.p_local_id);window.__rpcWrites.push({name,args});
   if(row.revision!==args.p_expected_revision)return {data:[{result:'conflict',current_revision:row.revision}],error:null};
   row.data=structuredClone(args.p_data);row.revision++;
   return {data:[{result:'updated',current_revision:row.revision}],error:null};
  };
  localStorage.removeItem('traxio_sync_baseline_v29_00000000-0000-4000-8000-000000000001');
  await traxioAutoSync();
 });
 await expect.poll(()=>page.evaluate(()=>Object.keys(traxioReadBase('00000000-0000-4000-8000-000000000001')).length)).toBe(7);
}
test('confirmed coordinates are uploaded through revision-safe RPC and stale cloud reads cannot undo them',async({page},info)=>{
 await setup(page,info);await installCloudDouble(page);await confirmPoint(page);
 await expect.poll(async()=>{await page.evaluate(()=>traxioAutoSync());return page.evaluate(()=>window.__serverRows[0].data.lat);}).toBe(-5.812345);
 expect(await page.evaluate(()=>window.__rpcWrites.every(w=>w.name==='traxio_update_client_safe'&&Number.isSafeInteger(w.args.p_expected_revision)))).toBe(true);
 await page.reload();await page.locator('body.traxio-ui-ready').waitFor();await page.evaluate(()=>traxioAutoSync());
 expect(await page.evaluate(()=>clients[0].lat)).toBe(-5.812345);
});
test('newer automatic cloud data cannot downgrade a manually confirmed location',async({page},info)=>{
 await setup(page,info);await installCloudDouble(page);
 await page.evaluate(async()=>{const row=window.__serverRows[0];row.revision=2;row.data.lat=-6;row.data.lon=-36;row.data.locationVerification='automatic_housenumber';await traxioAutoSync();});
 expect(await page.evaluate(()=>clients[0].lat)).toBe(records[0].lat);expect(await page.evaluate(()=>clients[0].locationVerification)).toBe('manual_reviewed');
});
test('tracing after manually reordering stops produces a road route and re-enables navigation',async({page},info)=>{
 await setup(page,info);await services(page);await page.locator('#selectEntirePortfolio').click();await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota calculada');
 await page.locator('#routeOrderDisclosure>summary').click();await page.locator('#routeOrder .route-stop').first().getByTitle('Descer visita').click();
 await expect(page.locator('#roadRoute')).toBeEnabled();await expect(page.locator('#liveNavigation')).toBeHidden();expect(await page.evaluate(()=>lastRoute)).toBeNull();
 await page.locator('#roadRoute').click();await expect(page.locator('#plannerState')).toHaveText('Rota calculada');await expect(page.locator('#liveStart')).toBeEnabled();
});
