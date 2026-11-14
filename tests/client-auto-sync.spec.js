import {test,expect} from 'playwright/test';
import {setup} from './fixtures/portfolio-version.js';
async function initialize(page){await setup(page);await page.evaluate(async()=>{clearTimeout(traxioSyncTimer);traxioSyncTimer=null;await traxioAutoSync();});}
const remoteNames=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('__version_clients')).map(r=>r.data.name));
test('manual addition automatically retries while another cloud task is busy',async({page})=>{
 await initialize(page);await page.locator('[data-tab=clientes]').first().click();await page.getByRole('button',{name:'+ Novo cliente',exact:true}).click();
 await page.evaluate(()=>cloudBusy=true);await page.locator('#name').fill('Inclusão manual sintética');await page.locator('#saveClient').click();
 await expect(page.locator('#clientSyncStatus')).toContainText('salvo(s) neste aparelho');await page.waitForTimeout(1800);
 expect(await remoteNames(page)).not.toContain('Inclusão manual sintética');await page.evaluate(()=>cloudBusy=false);
 await expect.poll(()=>remoteNames(page)).toContain('Inclusão manual sintética');await expect(page.locator('#clientSyncStatus')).toContainText('Clientes sincronizados');
});
test('file additions synchronize automatically, offline saves survive reload and reconnect',async({page})=>{
 await initialize(page);await page.context().setOffline(true);
 await page.evaluate(async()=>{window.queueClientGeocode=async()=>{};await rotamapaImportRows([['Nome','CNPJ'],['Importação sintética','11222333000181']],'sintetico.csv');});
 await expect(page.locator('#clientSyncStatus')).toContainText('Sem internet');expect(await remoteNames(page)).not.toContain('Importação sintética');
 // The same persisted queue is recovered after restart; network is restored for the test server only.
 await page.context().setOffline(false);await page.reload();await page.waitForFunction(()=>window.RotaMapaPortfolioVersions);
 await expect.poll(()=>remoteNames(page)).toContain('Importação sintética');
 expect(await page.evaluate(()=>clients.some(c=>c.name==='Importação sintética'))).toBe(true);
});
test('temporary insert failures retain local data and retry automatically',async({page})=>{
 await initialize(page);await page.evaluate(()=>{window.__clientInsertFailure=true;clients.push({id:'retry',name:'Cadastro para tentar novamente'});save();});
 await expect.poll(()=>page.evaluate(()=>traxioSyncRetry)).toBe(30000);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem(KEY)).some(c=>c.id==='retry'))).toBe(true);
 await page.evaluate(()=>window.__clientInsertFailure=false);
 await expect.poll(()=>remoteNames(page),{timeout:22000}).toContain('Cadastro para tentar novamente');
});
test('edits made during an in-flight flush get a following pass and confirmed pins survive',async({page})=>{
 await initialize(page);await page.evaluate(()=>{const original=authClient.rpc;authClient.rpc=async(...args)=>{const result=await original(...args);if(args[0]==='traxio_update_client_safe'&&!window.__released){window.__released=true;await new Promise(r=>window.__releaseClientSync=r);}return result;};clients[0].phone='111';save();});
 await page.waitForFunction(()=>window.__releaseClientSync);await page.evaluate(()=>{clients[0].phone='222';save();});await page.waitForTimeout(1400);await page.evaluate(()=>window.__releaseClientSync());
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('__version_clients'))[0].data.phone)).toBe('222');
 expect(await page.evaluate(()=>clients[0].locationVerification)).toBe('manual_reviewed');
});
test('closing warns only for unsent clients; a clean portfolio does not warn',async({page})=>{
 await initialize(page);expect(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;})).toBe(false);
 await page.evaluate(()=>{traxioSyncSuspended=true;clients.push({id:'offline-close',name:'Cadastro salvo'});save();});
 expect(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;})).toBe(true);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem(KEY)).some(c=>c.id==='offline-close'))).toBe(true);
});
test('acknowledged progress survives a later failure and subsequent edits use the new revision',async({page})=>{
 await initialize(page);await page.evaluate(async()=>{const original=authClient.rpc;let first=true;authClient.rpc=async(name,p)=>{if(name==='traxio_update_client_safe'&&p.p_local_id==='2'&&first){first=false;throw Error('Synthetic interrupted network');}return original(name,p);};clients[0].phone='Primeiro envio';clients[1].phone='Segundo envio';save();clearTimeout(traxioSyncTimer);traxioSyncTimer=null;try{await traxioAutoSync();}catch{};clients[0].phone='Alteração posterior';save();});
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('__version_clients')).map(r=>r.data.phone))).toEqual(['Alteração posterior','Segundo envio']);
 expect(await page.evaluate(()=>traxioPendingClients())).toBe(0);
});
test('account change during a read stops all writes and does not replace local clients',async({page})=>{
 await initialize(page);await page.evaluate(async()=>{const original=cloudReadAll;cloudReadAll=async(...args)=>{const rows=await original(...args);localStorage.setItem(TRAXIO_SYNC_OWNER,'00000000-0000-4000-8000-000000000099');return rows;};clients.push({id:'private-pending',name:'Preservado localmente'});localStorage.setItem(KEY,JSON.stringify(clients));try{await traxioAutoSync();}catch{};});
 expect(await remoteNames(page)).not.toContain('Preservado localmente');expect(await page.evaluate(()=>clients.some(c=>c.id==='private-pending'))).toBe(true);
 await expect(page.locator('#clientSyncStatus')).toContainText('Não foi possível confirmar');
});
test('simultaneous local and remote edits remain protected instead of being overwritten',async({page})=>{
 await initialize(page);await page.evaluate(async()=>{clearTimeout(traxioSyncTimer);traxioSyncTimer=null;clients[0].phone='Alteração local';localStorage.setItem(KEY,JSON.stringify(clients));const rows=JSON.parse(localStorage.getItem('__version_clients'));rows[0].data.phone='Alteração em outro aparelho';rows[0].revision++;localStorage.setItem('__version_clients',JSON.stringify(rows));await traxioAutoSync();});
 expect(await page.evaluate(()=>clients[0].phone)).toBe('Alteração local');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('__version_clients'))[0].data.phone)).toBe('Alteração em outro aparelho');await expect(page.locator('#clientSyncStatus')).toContainText('precisam de revisão');
});
test('first authenticated use without an owner marker never reports unverified clients as synchronized',async({page})=>{
 await setup(page);await page.evaluate(()=>{clearTimeout(traxioSyncTimer);traxioSyncTimer=null;localStorage.removeItem(TRAXIO_SYNC_OWNER);cloudBusy=true;traxioClientSyncStatus();});
 await expect(page.locator('#clientSyncStatus')).toContainText('salvo(s) neste aparelho');expect(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;})).toBe(true);
});
