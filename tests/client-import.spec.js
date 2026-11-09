import{test,expect}from'playwright/test';import{prepare,ready}from'./fixtures/browser.js';
const rows=[['Razão social','Nome fantasia','CNPJ','Endereço','Cidade','Extra'],['Cliente sintético','Loja sintética','04.252.011/0001-10','Rua Um','Natal','coluna preservada']];
async function setup(page){await prepare(page,{records:[],lockAuthFixture:true});await ready(page);await page.evaluate(()=>{queueClientGeocode=async()=>{};});}
test('preview can be cancelled and duplicate imports preserve IDs and reviewed pins',async({page})=>{
 await setup(page);await page.evaluate(rows=>{window.__preview=RotaMapaClientImport.preview(rows,'sintetica.csv');},rows);
 await expect(page.locator('#clientImportPreview')).toBeVisible();await expect(page.locator('#clientImportPreviewRows')).toContainText('04252011000110');await page.locator('#clientImportCancel').click();expect(await page.evaluate(()=>clients.length)).toBe(0);
 await page.evaluate(rows=>rotamapaImportRows(rows,'sintetica.csv'),rows);const before=await page.evaluate(()=>{clients[0].lat=-5.8;clients[0].lon=-35.2;clients[0].locationVerification='manual_reviewed';save();return JSON.stringify(clients);});
 await page.evaluate(rows=>rotamapaImportRows(rows,'sintetica.csv'),rows);expect(await page.evaluate(()=>JSON.stringify(clients))).toBe(before);expect(await page.evaluate(()=>clients[0].importFields.at(-1).value)).toBe('coluna preservada');
});
test('storage failure restores in-memory state and synthetic 53-client import preserves 19 columns',async({page})=>{
 await setup(page);const input=[['Nome','CNPJ','Endereço',...Array.from({length:16},(_,i)=>'Extra '+i)],...Array.from({length:53},(_,i)=>['Cliente '+i,'','Rua '+i,...Array.from({length:16},(_,j)=>'valor '+i+' '+j)])];
 await page.evaluate(async rows=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='projeto_rota_mapa_v1')throw Error('Synthetic quota');return original.call(this,k,v);};try{await rotamapaImportRows(rows,'sintetica.csv');}catch(e){window.__importError=e.message;}finally{Storage.prototype.setItem=original;}},input);
 expect(await page.evaluate(()=>window.__importError)).toBe('Synthetic quota');expect(await page.evaluate(()=>clients.length)).toBe(0);
 await page.evaluate(rows=>rotamapaImportRows(rows,'sintetica.csv'),input);expect(await page.evaluate(()=>clients.length)).toBe(53);expect(await page.evaluate(()=>clients.every(c=>c.importFields.length===19))).toBe(true);
});
