import {test,expect} from 'playwright/test';
import {mkdir} from 'node:fs/promises';
import {prepare} from './fixtures/browser.js';
import {records,fakeMap} from './fixtures/routing.js';
test('record the previous brand and confirmed scenic-sidebar defect',async({page},info)=>{
 test.skip(!process.env.TRAXIO_PORTFOLIO_BEFORE,'Explicit historical capture only');
 await prepare(page,{records,theme:info.project.metadata.theme});
 await page.goto('http://127.0.0.1:4174/');await page.locator('body.traxio-ui-ready').waitFor();await fakeMap(page);
 const path='docs/captures/portfolio-before';await mkdir(path,{recursive:true});
 for(const tab of ['painel','clientes','mapa','historico','dados']){
  await page.locator(`.tabs [data-tab="${tab}"]`).click();
  if(tab==='painel')await expect(page.locator('.nav-art')).toBeVisible();else await expect(page.locator('.nav-art')).toBeHidden();
  await page.screenshot({path:`${path}/${info.project.name}-${tab}.png`});
 }
});
