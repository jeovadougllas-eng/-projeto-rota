import {test,expect} from 'playwright/test';
import {prepare} from './fixtures/browser.js';
import {records} from './fixtures/routing.js';
import {mkdir,writeFile} from 'node:fs/promises';
test('before: reproduce filtered-selection replacement and capture tablet layout',async({page},info)=>{
 test.skip(!process.env.TRAXIO_CAPTURE_BEFORE);
 await prepare(page,{records,theme:info.project.metadata.theme,liveMaps:true});
 await page.goto('http://127.0.0.1:4174/');await page.locator('body.traxio-ui-ready').waitFor();await page.locator('.tabs [data-tab="mapa"]').click();
 await page.locator('#selectAllClients').click();await expect(page.locator('#selectedCount')).toContainText('7 selecionados');
 await page.locator('#regionPicker summary').click();await page.locator('#regionCity').selectOption('parnamirim');await page.locator('#selectAllClients').click();
 await expect(page.locator('#selectedCount')).toContainText('1 selecionado');
 const before={confirmed:'Selecting filtered city results replaces seven previously selected IDs with one',selected:await page.locator('#selectedCount').textContent(),viewport:page.viewportSize()};
 await page.locator('#regionCity').selectOption('all');await page.locator('#selectAllClients').click();await page.locator('#regionPicker').evaluate(n=>n.open=false);
 const dir='docs/captures/routes-before';await mkdir(dir,{recursive:true});await page.screenshot({path:dir+'/'+info.project.name+'.png',fullPage:true});await page.screenshot({path:dir+'/'+info.project.name+'.jpg',type:'jpeg',quality:80,fullPage:true});await writeFile(dir+'/'+info.project.name+'.json',JSON.stringify(before,null,2));
});
