import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';
import {records} from './fixtures/routing.js';
test('published app: seven selected clients yield a real street route without production database writes',async({page},info)=>{
 test.skip(!process.env.TRAXIO_PUBLISHED);
 await prepare(page,{records,theme:info.project.metadata.theme||'light',liveMaps:true});
 await page.route('https://traxio-preview.vercel.app/**',r=>r.continue());
 await page.route('https://router.project-osrm.org/**',r=>r.continue());
 await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:ok=>ok({coords:{latitude:-5.8,longitude:-35.22,accuracy:8}}),watchPosition:()=>1,clearWatch(){}}}));
 await ready(page);await expect(page).toHaveTitle(/Traxelo.IA/);await page.locator('.tabs [data-tab="mapa"]').click();
 await expect.poll(()=>page.evaluate(()=>!!map?.isStyleLoaded()),{timeout:45000}).toBe(true);
 await page.locator('#selectEntirePortfolio').click();await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();
 await expect(page.locator('#plannerState')).toHaveText('Rota calculada',{timeout:60000});await expect(page.locator('#routeOrder .route-stop')).toHaveCount(7);await expect(page.locator('#map .traxio-route-pin')).toHaveCount(7);
 expect(await page.evaluate(()=>routeGeo.coordinates.length)).toBeGreaterThan(8);expect(await page.evaluate(()=>!!map.getLayer('route-line'))).toBe(true);
 await page.screenshot({path:info.outputPath('public-route.png'),fullPage:true});
 console.log(JSON.stringify({project:info.project.name,url:page.url(),summary:await page.locator('#routeResult').textContent(),syntheticClients:true,realMap:true,realRouter:true,productionWrites:false}));
});
