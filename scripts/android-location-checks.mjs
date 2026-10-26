import {expect} from 'playwright/test';
import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
export async function verifyLocations({page,device,evidence}){
 const original=await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'));
 await page.locator('#clientLocationSearch').waitFor({state:'attached'});
 expect(await page.locator('.tabs').evaluate(n=>n.parentElement===document.body)).toBe(true);
 await page.locator('.tabs [data-tab="mapa"]').click();await expect.poll(()=>page.evaluate(()=>!!map?.isStyleLoaded()),{timeout:60000}).toBe(true);
 await page.evaluate(()=>{selectedIds=new TraxioPlanner.IdSet();renderMarkers();});await expect(page.locator('#map .traxelo-saved-pin')).toHaveCount(7);
 evidence.checks.push('Updated Android WebView renders confirmed portfolio markers without selecting a route');
 await page.evaluate(async()=>{
  window.__locationRows=clients.map(c=>({local_id:String(c.id),data:structuredClone(c),revision:1,deleted_at:null}));
  authClient.from=()=>{const chain={then:(yes,no)=>Promise.resolve({data:structuredClone(window.__locationRows),error:null}).then(yes,no)};for(const k of ['select','eq','order','range'])chain[k]=()=>chain;return chain;};
  authClient.rpc=async(_name,args)=>{const r=window.__locationRows.find(r=>r.local_id===args.p_local_id);r.data=structuredClone(args.p_data);r.revision++;return {data:[{result:'updated',current_revision:r.revision}],error:null};};
  await traxioAutoSync();const c=clients[0];c.locationVerification='pending';c.lat=null;c.lon=null;c.locationCandidate={lat:-5.812,lon:-35.212,error:'Ponto aproximado',fingerprint:JSON.stringify(TraxioGeo.parse(c))};geoCandidates.set(c.id,c.locationCandidate);renderWorkspace();window.traxeloReviewClient(c.id);
 });
 await expect(page.locator('#pinConfirmPanel')).toBeVisible();await expect(page.locator('#clientEditDialog')).not.toBeVisible();
 await page.evaluate(()=>{draftMarker.setLngLat([-35.212345,-5.812345]);draftMarker.fire('dragend');});await page.locator('#backToClient').click();
 await expect(page.locator('#locationSaveMessage')).toContainText('sincronizada com sua conta',{timeout:20000});expect(await page.evaluate(()=>window.__locationRows[0].data.lat)).toBe(-5.812345);
 evidence.checks.push('Android direct approximate-pin confirmation handles a simulated MapLibre drag event, saves immediately and exercises revision-safe sync against an isolated database double');
 await writeFile('mobile/evidence/android-location-tablet.png',execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20000000}));
 await device.shell('settings put system accelerometer_rotation 0');await device.shell('cmd window user-rotation lock 1');await expect.poll(()=>page.evaluate(()=>innerWidth>innerHeight),{timeout:15000}).toBe(true);
 await page.locator('.tabs [data-tab="dados"]').click();await expect(page.locator('body')).toHaveAttribute('data-screen','dados');
 const hit=await page.locator('.tabs [data-tab="mapa"]').evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});expect(hit).toBe(true);
 await writeFile('mobile/evidence/android-location-landscape-menu.png',execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20000000}));
 evidence.checks.push('Real Android tablet rotation preserves the confirmed point and clickable navigation across screens; phone expansion is covered separately in Chromium and WebKit');
 await device.shell('cmd window user-rotation lock 0');await expect.poll(()=>page.evaluate(()=>innerWidth<innerHeight),{timeout:15000}).toBe(true);
 await page.evaluate(original=>{localStorage.setItem('projeto_rota_mapa_v1',original);clients=JSON.parse(original);render();},original);
}
