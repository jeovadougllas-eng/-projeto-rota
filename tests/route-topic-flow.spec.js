import {test,expect} from 'playwright/test';
import {setupLinks} from './fixtures/links.js';
import {fakeMap,services} from './fixtures/routing.js';
test.setTimeout(60000);
const records=[{id:'natal-a',name:'Farmácia Natal',city:'Natal',state:'RN',neighborhood:'Planalto',lat:-5.81,lon:-35.21,locationVerification:'manual_reviewed'},{id:'outside-b',name:'Farmácia Parnamirim',city:'Parnamirim',state:'RN',neighborhood:'Centro',lat:-5.91,lon:-35.25,locationVerification:'manual_reviewed'}];
test('new route filters first, excludes previous selection, offers four strategies and calculates from GPS',async({page})=>{
 await setupLinks(page,{records,beforeReady:async()=>page.addInitScript(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:ok=>ok({coords:{latitude:-5.8,longitude:-35.2,accuracy:8},timestamp:Date.now()}),watchPosition:()=>1,clearWatch:()=>{}}}))});
 await fakeMap(page);await services(page);
 await page.evaluate(()=>{selectedIds.add('outside-b');syncRouteChoices();renderWorkspace();RotaMapaTopics.go('painel');});
 await page.locator('#painel [data-rm-open=planejar]').click();
 expect(await page.evaluate(()=>[...selectedIds])).toEqual([]);
 const order=await page.evaluate(()=>{const a=document.getElementById('regionPicker'),b=document.getElementById('priorityFilters');return !!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);});expect(order).toBe(true);
 await page.locator('#regionCity').selectOption('natal');await page.locator('#regionZone').selectOption('oeste');
 await expect(page.locator('#regionNeighborhoods')).toContainText('Planalto');await expect(page.locator('#regionNeighborhoods')).toContainText('Bom Pastor');
 await page.locator('#selectAllClients').click();expect(await page.evaluate(()=>[...selectedIds])).toEqual(['natal-a']);
 await page.locator('#suggestToggle').click();await expect(page.locator('#routeSuggestionWizard')).toBeVisible();await expect(page.locator('#routeSuggestionWizard input[name=routeStrategy]')).toHaveCount(4);
 await page.locator('#generateSuggestion').click();await expect(page.locator('#origin')).toHaveValue('gps');await page.locator('#routeWizardCalculate').click();
 await expect(page.locator('#plannerState')).toHaveText('Rota calculada');await expect(page.locator('#map')).toBeVisible();await expect(page.locator('#liveStart')).toBeVisible();expect(await page.evaluate(()=>[...selectedIds])).toEqual(['natal-a']);await page.locator('#liveStart').click();await expect(page.locator('#traxioNavOverlay')).toBeVisible();
});
