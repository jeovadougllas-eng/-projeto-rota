import {test,expect} from 'playwright/test';
import {mkdir} from 'node:fs/promises';
import {prepare,ready} from './fixtures/browser.js';
import {records,fakeMap} from './fixtures/routing.js';

async function setup(page,info,rows=records){await prepare(page,{records:rows,theme:info.project.metadata.theme});await ready(page);await fakeMap(page);}
test('approved dashboard contains actual translucent actions and no duplicate customer list or search',async({page},info)=>{
 await setup(page,info);
 await expect(page.locator('#globalSearch,#dashboardSearch,#dashboardClients')).toHaveCount(0);
 await expect(page.locator('#painel .stat')).toHaveCount(3);await expect(page.locator('#painel .glass-action')).toHaveCount(4);
 const alpha=await page.locator('#painel .glass-action').first().evaluate(n=>getComputedStyle(n).backgroundColor);
 expect(alpha).toMatch(/rgba/);
 await page.getByRole('button',{name:'Importar clientes',exact:true}).click();await expect(page.locator('#sheetFile')).toBeFocused();
 await page.locator('.tabs [data-tab=painel]').click();await page.locator('#allClientsShortcut').click();await expect(page.locator('#registryRows .client-link')).toHaveCount(7);
});
test('five contextual scenes retain original icons and usable pages without horizontal overflow',async({page},info)=>{
 await setup(page,info);const icons=await page.locator('.tabs .kit-nav-icon').evaluateAll(nodes=>nodes.map(n=>n.innerHTML));
 const capture=['desktop-light','tablet-portrait-light','tablet-landscape-dark','phone-light'].includes(info.project.name);
 const dir='docs/captures/scenic-after';if(capture)await mkdir(dir,{recursive:true});
 for(const tab of ['painel','clientes','mapa','historico','dados']){
  await page.locator(`.tabs [data-tab=${tab}]`).click();
  await expect(page.locator('.app-scenery img')).toHaveAttribute('src',`assets/scenes/${tab}.webp`);
  await expect.poll(()=>page.locator('.app-scenery img').evaluate(n=>n.complete&&n.naturalWidth>0)).toBe(true);
  expect(await page.locator('.tabs .kit-nav-icon').evaluateAll(nodes=>nodes.map(n=>n.innerHTML))).toEqual(icons);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(capture)await page.screenshot({path:`${dir}/${info.project.name}-${tab}.png`});
 }
});
test('twenty existing unverified points remain visible and unchanged with an explicit review shortcut',async({page},info)=>{
 const rows=Array.from({length:157},(_,i)=>({...records[i%7],id:i+1,name:'Cliente '+(i+1),lat:i<20?-5.81:null,lon:i<20?-35.21:null,locationVerification:i<20?'imported_coordinates':'pending'}));
 await setup(page,info,rows);await expect(page.locator('#total')).toHaveText('157');await expect(page.locator('#located')).toHaveText('0');
 await expect(page.locator('#locationRecoveryText')).toContainText('20 clientes possuem pontos salvos');
 await page.locator('#reviewSavedLocations').click();await expect(page.locator('#registryLocation')).toHaveValue('saved');await expect(page.locator('#registryRows .client-link')).toHaveCount(20);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1')))).toEqual(rows);
});
test('independent evidence restores a legacy manual confirmation without promoting unknown coordinates',async({page},info)=>{
 const rows=records.map((c,i)=>({...c,locationVerification:undefined,...(i===0?{locationSource:'manual_confirmation',locationConfirmedAt:'2026-10-20T12:00:00.000Z'}:{})}));
 await setup(page,info,rows);await expect(page.locator('#located')).toHaveText('1');
 await page.locator('#locatedShortcut').click();await expect(page.locator('#registryRows .client-link')).toHaveCount(1);
 await page.evaluate(async()=>{TraxioGeo.locate=async()=>{throw Error('Must not query a saved manual point');};await queueClientGeocode([1],{force:true});});
 expect(await page.evaluate(()=>clients[0].lat)).toBe(rows[0].lat);
 await page.reload();await page.locator('body.traxio-ui-ready').waitFor();await expect(page.locator('#located')).toHaveText('1');
});
