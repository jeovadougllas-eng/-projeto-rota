import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';
import {records,fakeMap} from './fixtures/routing.js';
const rows=records.map((c,i)=>({...c,...(i===3?{lat:null,lon:null,locationVerification:'pending'}:{})}));
async function setup(page,{denied=false}={}){
 await prepare(page,{records:rows});
 if(process.env.TRAXELO_LOCATIONS_BASE)await page.route(process.env.TRAXELO_LOCATIONS_BASE+'/**',r=>r.continue());
 await page.addInitScript(({denied})=>{
  window.__gpsDenied=denied;
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,fail){
   if(window.__gpsDenied)fail({code:1,message:'Permissão negada'});
   else ok({coords:{latitude:-5.81,longitude:-35.22,accuracy:123},timestamp:Date.now()});
  }}});
 },{denied});
 await ready(page);await fakeMap(page);
 await page.evaluate(()=>{
  const Marker=maplibregl.Marker;
  maplibregl.Marker=class extends Marker{
   constructor(o){super(o);this.handlers={};if(o?.draggable)window.__draftPin=this;}
   setLngLat([lng,lat]){this.point={lng,lat};return this;}
   getLngLat(){return this.point;}
   on(event,fn){this.handlers[event]=fn;return this;}
  };
  openClientLocation(4);
 });
 await expect(page.locator('#clientEditDialog')).toBeVisible();
}
test('missing CEP and approximate GPS open a draggable pin; only confirmation persists the location',async({page})=>{
 await setup(page);
 await page.route('https://viacep.com.br/**',r=>r.fulfill({json:{erro:true}}));
 await page.locator('#cep').fill('59000-000');await page.locator('#cepBtn').click();
 await expect(page.locator('#cepStatus')).toContainText('CEP não encontrado');
 await expect(page.locator('#gpsBtn')).toBeEnabled();await page.locator('#gpsBtn').click();
 await expect(page.locator('#pinConfirmPanel')).toBeVisible();await expect(page.locator('#clientEditDialog')).toBeHidden();
 expect(await page.evaluate(()=>window.__draftPin.getLngLat())).toEqual({lat:-5.81,lng:-35.22});
 expect(await page.evaluate(()=>clients[3].lat)).toBeNull();
 await page.evaluate(()=>{window.__draftPin.setLngLat([-35.225,-5.815]);window.__draftPin.handlers.dragend();});
 await page.locator('#backToClient').click();
 await expect(page.locator('#clientEditDialog')).toBeVisible();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1'))[3]);
 expect(saved.lat).toBe(-5.815);expect(saved.lon).toBe(-35.225);expect(saved.locationVerification).toBe('manual_reviewed');expect(saved.address).toBe(rows[3].address);
});
test('cancel leaves original coordinates unchanged and the GPS action available',async({page})=>{
 await setup(page);await page.locator('#gpsBtn').click();await expect(page.locator('#pinConfirmPanel')).toBeVisible();
 await page.locator('#cancelClientPin').click();await expect(page.locator('#gpsBtn')).toBeEnabled();
 expect(await page.evaluate(()=>clients[3].lat)).toBeNull();expect(await page.locator('#lat').inputValue()).toBe('');
});
test('permission refusal permits retry without changing the address or saving coordinates',async({page})=>{
 await setup(page,{denied:true});const address=await page.locator('#address').inputValue();
 await page.locator('#gpsBtn').click();await expect(page.locator('#saveStatus')).toContainText('Permita o acesso');await expect(page.locator('#gpsBtn')).toBeEnabled();
 expect(await page.locator('#address').inputValue()).toBe(address);expect(await page.evaluate(()=>clients[3].lat)).toBeNull();
 await page.evaluate(()=>window.__gpsDenied=false);await page.locator('#gpsBtn').click();await expect(page.locator('#pinConfirmPanel')).toBeVisible();
});
test('manual pin accepts approximate GPS without weakening route-origin accuracy validation',async({page})=>{
 await setup(page);
 const result=await page.evaluate(async()=>{
  let error;try{await requestGPS();}catch(e){error=e.message;}
  const initial=gps,point=await requestGPS({forPin:true});return {error,accuracy:point.accuracy,unchanged:gps===initial};
 });
 expect(result.error).toContain('Sinal GPS impreciso');expect(result.accuracy).toBe(123);expect(result.unchanged).toBe(true);
});
test('a search still in flight cannot replace the GPS pin after a failed CEP lookup',async({page})=>{
 await setup(page);
 await page.evaluate(()=>{TraxioGeo.locate=()=>new Promise(resolve=>window.__finishSearch=resolve);});
 await page.locator('#searchBtn').click();await expect(page.locator('#suggestions')).toContainText('Buscando');
 await page.locator('#gpsBtn').click();await expect(page.locator('#pinConfirmPanel')).toBeVisible();
 await page.evaluate(()=>window.__finishSearch({candidates:[{lat:0,lon:0,label:'Obsoleto'}]}));
 expect(await page.locator('#lat').inputValue()).toBe('-5.810000');expect(await page.locator('#lon').inputValue()).toBe('-35.220000');
 await expect(page.locator('#suggestions')).not.toContainText('Obsoleto');
});
