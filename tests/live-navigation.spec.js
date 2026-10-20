import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';

test('real MapLibre and OSRM redraw the road route after simulated GPS deviation',async({page},info)=>{
 test.setTimeout(90000);
 await prepare(page,{records:[],liveMaps:true,theme:info.project.metadata.theme});
 await page.addInitScript(()=>{
  const originalNow=Date.now.bind(Date);window.__gpsTimeOffset=0;Date.now=()=>originalNow()+window.__gpsTimeOffset;
  Object.defineProperty(navigator,'geolocation',{value:{watchPosition:ok=>{window.__liveGps=ok;return 1;},clearWatch:()=>{window.__liveGps=null;}},configurable:true});
 });
 const statuses=[];
 await page.route('https://router.project-osrm.org/**',r=>r.continue());
 page.on('response',r=>{if(r.url().startsWith('https://router.project-osrm.org/route/'))statuses.push(r.status());});
 await ready(page);await page.locator('.tabs [data-tab="mapa"]').click();
 await expect.poll(()=>page.evaluate(()=>map?.isStyleLoaded()&&map?.areTilesLoaded()),{timeout:40000}).toBe(true);
 await page.evaluate(async()=>{
  const destination={id:'synthetic-live-destination',name:'Destino do teste GPS',lat:-5.81,lon:-35.20};
  const road=await fetchRoadRoute([{lat:-5.81,lon:-35.22},destination]);
  displayRoadGeometry(road.geometry);window.traxioBeginNavigation([destination],road.geometry);
 });
 await page.locator('#liveStart').click();
 await page.evaluate(()=>window.__liveGps({coords:{latitude:-5.84,longitude:-35.218,accuracy:10,heading:90},timestamp:Date.now()}));
 await expect(page.locator('#liveGPSState')).toContainText('verificando desvio');
 await page.evaluate(()=>{window.__gpsTimeOffset=3200;window.__liveGps({coords:{latitude:-5.84,longitude:-35.217,accuracy:10,heading:90},timestamp:Date.now()});});
 await expect(page.locator('#liveGPSState')).toContainText('Nova rota calculada',{timeout:30000});
 await expect(page.locator('#map .traxio-car-marker')).toBeVisible();
 expect(statuses.length).toBe(2);expect(statuses.every(s=>s===200)).toBe(true);
 expect(await page.evaluate(()=>routeGeo.coordinates.length)).toBeGreaterThan(2);
 const first=await page.evaluate(()=>routeGeo.coordinates[0]);expect(Math.abs(first[0]+35.217)).toBeLessThan(0.002);expect(Math.abs(first[1]+5.84)).toBeLessThan(0.002);
 const path=info.outputPath('gps-mapa-real.png');await page.screenshot({path});await info.attach('MapLibre e OSRM reais; deslocamento GPS simulado',{path,contentType:'image/png'});
});
