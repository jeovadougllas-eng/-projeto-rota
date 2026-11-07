import {test,expect} from 'playwright/test';
import {mkdir} from 'node:fs/promises';
import {prepare,ready} from './fixtures/browser.js';
import {records,fakeMap,services} from './fixtures/routing.js';
const mixed=records.map((c,i)=>({...c,...[
 {locationVerification:'manual_reviewed'}, {locationVerification:'automatic_housenumber'},
 {locationVerification:'imported_coordinates'}, {locationVerification:'approximate'},
 {lat:null,lon:null,locationVerification:'pending'}, {lat:0,lon:0,locationVerification:'manual_reviewed'},
 {locationVerification:'manual_reviewed'}
][i]}));
async function setup(page,info,{authenticated=true}={}){
 await prepare(page,{records:mixed,authenticated,theme:info.project.metadata.theme});
 await page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:ok=>ok({coords:{latitude:-5.8,longitude:-35.22,accuracy:8}}),watchPosition:()=>1,clearWatch(){}}}));
 await ready(page);await fakeMap(page);
}
test('metrics distinguish confirmed, approximate, imported and missing coordinates without modifying data',async({page},info)=>{
 await setup(page,info);await expect(page.locator('#total')).toHaveText('7');await expect(page.locator('#located')).toHaveText('3');await expect(page.locator('#pending')).toHaveText('4');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1')))).toEqual(mixed);
 await page.locator('#pendingShortcut').click();await expect(page.locator('#registryRows .client-link')).toHaveCount(4);await expect(page.locator('#confirmedPortfolioActions')).toBeHidden();
});
test('confirmed shortcut resets old filters and supports keyboard activation without losing selection',async({page},info)=>{
 await setup(page,info);await page.locator('.tabs [data-tab=clientes]').click();
 await page.locator('#registryRows input').first().check();await page.locator('#registryCity').selectOption('Natal');await page.locator('#registrySearch').fill('inexistente');
 await page.locator('.tabs [data-tab=painel]').click();await page.locator('#locatedShortcut').focus();await page.keyboard.press('Enter');
 await expect(page.locator('#registryLocation')).toHaveValue('confirmed');await expect(page.locator('#registryRows .client-link')).toHaveCount(3);await expect(page.locator('#registryRows input').first()).toBeChecked();
 await page.locator('#registryClear').click();await expect(page.locator('#registryRows .client-link')).toHaveCount(7);await expect(page.locator('#registryRows input').first()).toBeChecked();
});
test('confirmed-only route explicitly replaces earlier pending selections and renders an itinerary',async({page},info)=>{
 await setup(page,info);await services(page);await page.evaluate(()=>selectedIds.add(5));
 await page.locator('#locatedShortcut').click();await page.locator('#registryPlanConfirmed').click();
 expect(await page.evaluate(()=>[...selectedIds].sort())).toEqual(['1','2','7']);
 await page.locator('#origin').selectOption('gps');await page.locator('#calcRoute').click();
 await expect(page.locator('#plannerState')).toHaveText('Rota calculada');await expect(page.locator('#routeOrder .route-stop')).toHaveCount(3);await expect(page.locator('#liveStart')).toBeEnabled();
 expect(await page.evaluate(()=>window.traxioPendingTrip.distanceKm)).toBeGreaterThan(0);
});
test('confirmed suggestion uses city filters, exposes criteria and calculates only eligible clients',async({page},info)=>{
 await setup(page,info);await services(page);await page.locator('#locatedShortcut').click();await page.locator('#registryCity').selectOption('Natal');
 await expect(page.locator('#registryRows .client-link')).toHaveCount(2);await page.locator('#registrySuggestConfirmed').click();await expect(page.locator('#strategyPanel')).toBeVisible();
 expect(await page.evaluate(()=>[...selectedIds].sort())).toEqual(['1','2']);await page.locator('#origin').selectOption('gps');await page.locator('#generateSuggestion').click();
 await expect(page.locator('#plannerState')).toHaveText('Rota calculada');await expect(page.locator('#routeOrder .route-stop')).toHaveCount(2);
});
test('saved confirmation updates metrics and the filtered portfolio immediately and after reload',async({page},info)=>{
 await setup(page,info);await page.evaluate(()=>{openClientLocation(5,{lat:-5.812345,lon:-35.212345});setDraft(-5.812345,-35.212345);});
 await page.locator('#adjustPin').click();await page.locator('#backToClient').click();await page.locator('#clientEditDialog .close-client-editor').click();
 await page.locator('.tabs [data-tab=painel]').click();await expect(page.locator('#located')).toHaveText('4');await page.locator('#locatedShortcut').click();await expect(page.locator('#registryRows .client-link')).toHaveCount(4);
 await page.reload();await page.locator('body.traxio-ui-ready').waitFor();await expect(page.locator('#located')).toHaveText('4');
});
test('all tabs keep identical scenic sidebar, approved logo and shell geometry on desktop and tablet',async({page},info)=>{
 await setup(page,info);const capture=['desktop-light','tablet-portrait-light','tablet-landscape-dark'].includes(info.project.name);
 const path='docs/captures/portfolio-after';if(capture)await mkdir(path,{recursive:true});
 let baseline;
 for(const tab of ['painel','clientes','mapa','historico','dados']){
  await page.locator(`.tabs [data-tab="${tab}"]`).click();await expect(page.locator('body')).toHaveAttribute('data-screen',tab);
  const box=await page.locator('.tabs').boundingBox();if(!baseline)baseline=box;expect(box).toEqual(baseline);
  const art=page.locator('.nav-art');if(info.project.use.viewport.width>650){await expect(art).toBeVisible();await expect(art.locator('img')).toBeVisible();const rect=await art.boundingBox();expect(rect.height).toBeGreaterThan(100);}else await expect(art).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('.header-brand .traxelo-approved-brand')).toBeVisible();
  if(capture)await page.screenshot({path:`${path}/${info.project.name}-${tab}.png`});
 }
});
test('login shows approved Traxelo lettering with both OAuth providers preserved',async({page},info)=>{
 await setup(page,info,{authenticated:false});await expect(page.locator('#authScreen .traxelo-approved-brand')).toBeVisible();
 await expect(page.locator('#authScreen [data-provider=google]')).toBeVisible();await expect(page.locator('#authScreen [data-provider=azure]')).toBeVisible();
 for(const img of await page.locator('.traxelo-approved-brand img').all())expect(await img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
 if(['desktop-light','tablet-portrait-light','tablet-landscape-dark'].includes(info.project.name)){await mkdir('docs/captures/portfolio-after',{recursive:true});await page.screenshot({path:`docs/captures/portfolio-after/${info.project.name}-login.png`});}
});
