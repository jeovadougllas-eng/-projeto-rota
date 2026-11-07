import {_android as android} from 'playwright';
import {expect} from 'playwright/test';
import {prepare} from '../tests/fixtures/browser.js';
import {records} from '../tests/fixtures/routing.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const [device]=await android.devices();const dir='mobile/evidence';await mkdir(dir,{recursive:true});
const emit=()=>execFileSync('adb',['emu','geo','fix','-35.218','-5.84'],{stdio:'ignore'});emit();const timer=setInterval(emit,2000);
try{
 await device.shell('am force-stop app.traxio.mobile');await device.shell('am start -n app.traxio.mobile/.MainActivity');
 const view=await device.webView({pkg:'app.traxio.mobile'}),page=await view.page();
 await prepare(page,{records:records.map((c,i)=>i===6?{...c,lat:null,lon:null,locationVerification:'pending'}:c),liveMaps:true});
 await page.route('https://router.project-osrm.org/**',r=>r.continue());
 await page.reload();await page.locator('body.traxio-ui-ready').waitFor({timeout:60000});
 await page.locator('.tabs [data-tab="mapa"]').click();await expect.poll(()=>page.evaluate(()=>!!map?.isStyleLoaded()),{timeout:60000}).toBe(true);
 await page.locator('#selectEntirePortfolio').click();await page.locator('#origin').selectOption('gps');
 await page.locator('#routeConfirmedOnly').click();await page.locator('#confirmPartialRoute').click();
 await expect(page.locator('#plannerState')).toHaveText('Rota parcialmente calculada',{timeout:60000});await expect(page.locator('#routeOrder .route-stop')).toHaveCount(6);
 await page.locator('#routeResult').scrollIntoViewIfNeeded();
 await expect.poll(()=>page.evaluate(()=>map.isSourceLoaded('route')&&!map.isMoving()&&map.queryRenderedFeatures({layers:['route-line']}).length>0),{timeout:30000}).toBe(true);
 await page.waitForTimeout(1800);
 const evidence=await page.evaluate(()=>({phase:document.getElementById('plannerState').textContent,summary:document.getElementById('routeResult').textContent,stops:lastRoute.points.map(c=>c.id),excluded:lastRoute.excluded,renderedFeatures:map.queryRenderedFeatures({layers:['route-line']}).length,streetCoordinates:routeGeo.coordinates.length,moving:map.isMoving(),width:innerWidth,height:innerHeight}));
 await writeFile(dir+'/android-partial-confirmed-route.png',execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20000000}));
 await writeFile(dir+'/android-partial-visual.json',JSON.stringify({syntheticClients:true,physicalDevice:false,realMap:true,realRouter:true,capture:'ADB compositor after camera and paint settle',...evidence},null,2));console.log(JSON.stringify(evidence));
}finally{clearInterval(timer);await device.close();}
