import { test, expect } from 'playwright/test';
import { prepare, ready } from './fixtures/browser.js';

test('live OpenFreeMap tiles render in both desktop themes',async({page},testInfo)=>{
  test.skip(!testInfo.project.name.startsWith('desktop-'),'External map smoke check runs in the two desktop themes.');
  test.setTimeout(60000);
  await prepare(page,{theme:testInfo.project.metadata.theme,liveMaps:true});await ready(page);
  await page.locator('.tabs [data-tab="mapa"]').click();
  await expect(page.locator('#map canvas.maplibregl-canvas')).toBeVisible({timeout:20000});
  await expect.poll(()=>page.evaluate(()=>map?.isStyleLoaded() && map?.areTilesLoaded()),{timeout:40000}).toBe(true);
  await expect(page.locator('#mapStatus')).toContainText('Mapa renderizado');
  const path=testInfo.outputPath('mapa-real.png');
  await page.screenshot({path,animations:'disabled'});await testInfo.attach('Mapa real — '+testInfo.project.metadata.theme,{path,contentType:'image/png'});
});
