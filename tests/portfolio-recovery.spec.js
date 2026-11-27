import{test,expect}from'playwright/test';
import{portfolioSetup,initial,second}from'./fixtures/portfolios.js';
import{setup as updateSetup,spreadsheet}from'./fixtures/portfolio-version.js';
async function unavailable(page,state,{onlyInitial=false}={}){
 await portfolioSetup(page);
 await page.addInitScript(()=>{const create=window.supabase.createClient;window.supabase.createClient=(...args)=>{const c=create(...args),rpc=c.rpc.bind(c);c.rpc=(name,...p)=>name==='rotamapa_portfolio_states'?Promise.resolve({data:localStorage.getItem('__recoveryNetworkFail')?null:JSON.parse(localStorage.getItem('__recoveryPersisted')||'[]'),error:localStorage.getItem('__recoveryNetworkFail')?{message:'Synthetic network failure'}:null}):rpc(name,...p);return c;};});
 await page.evaluate(({state,initial,onlyInitial})=>{
  window.__recoveryState=[{id:initial,state}];localStorage.setItem('__recoveryPersisted',JSON.stringify(__recoveryState));const original=authClient.rpc.bind(authClient);
  authClient.rpc=async(name,args)=>{
   if(name==='rotamapa_portfolio_states')return window.__stateError?{data:null,error:{message:'Synthetic state failure'}}:{data:__recoveryState,error:null};
   if(name==='rotamapa_manage_portfolio'){__recoveryState=[];return{data:{id:args.p_portfolio,state:'active'},error:null};}
   return original(name,args);
  };
  if(onlyInitial){const k='__portfolio_cloud:rotamapa_portfolios';localStorage.setItem(k,JSON.stringify(JSON.parse(localStorage.getItem(k)).filter(p=>p.id===initial)));TraxeloPlans.access=()=>({plan:'free',portfolioLimit:1,portfolioCount:1});}
  if(state==='deleted'){clients=[];traxioSyncSuspended=true;localStorage.removeItem('projeto_rota_mapa_v1');const k='__portfolio_cloud:clients';localStorage.setItem(k,JSON.stringify(JSON.parse(localStorage.getItem(k)).filter(c=>c.portfolio_id!==initial)));}
  localStorage.setItem('traxio_sync_baseline_v29_'+localStorage.getItem('traxio_sync_owner_v29'),JSON.stringify(Object.fromEntries(clients.map(c=>[c.id,{hash:cloudCanonical(c),revision:1}]))));
 },{state,initial,onlyInitial});
 await page.evaluate(()=>RotaMapaPortfolios.sync());
 await expect(page.locator('#portfolioRecovery')).toBeVisible();
}
test('archived wallet retains data and lets the user manage and restore without inert controls',async({page})=>{
 await unavailable(page,'archived');const before=await page.evaluate(()=>JSON.stringify(clients));
 await expect(page.locator('#updatePortfolio')).toBeDisabled();await expect(page.locator('nav.tabs [data-tab=clientes]')).toBeDisabled();
 await page.locator('#choosePortfolio').click();await page.getByRole('button',{name:'Restaurar ou excluir',exact:true}).click();
 await expect(page.locator('#portfolioLifecycleAction')).toHaveValue('restore');await page.locator('#portfolioLifecycleSubmit').click();
 await expect(page.locator('#portfolioLifecycleDialog')).toBeHidden();await expect(page.locator('nav.tabs [data-tab=clientes]')).toBeEnabled();expect(await page.evaluate(()=>JSON.stringify(clients))).toBe(before);
});
test('deleted initial wallet imports into a fresh ID even when old plan count is full',async({page})=>{
 await unavailable(page,'deleted',{onlyInitial:true});await page.locator('#portfolioRecoveryImport').click();await expect(page.locator('#fileImportUpdateClients')).toBeDisabled();
 await page.locator('#sheetFile').setInputFiles({name:'nova.csv',mimeType:'text/csv',buffer:Buffer.from('Nome;Cidade\nNova farmácia;Natal')});await page.locator('#clientImportContinue').click();
 await expect(page.locator('#portfolioNameTitle')).toHaveText('Importar em uma nova carteira');await page.locator('#portfolioName').fill('Nova carteira');await page.locator('#savePortfolio').click();
 await expect(page.locator('#activePortfolioName')).toHaveText('Nova carteira');expect(await page.evaluate(()=>RotaMapaPortfolioScope.loadedId)).not.toBe(initial);
 await expect.poll(()=>page.evaluate(()=>clients.map(c=>c.name))).toEqual(['Nova farmácia']);expect(await page.evaluate(()=>RotaMapaSales.getStore().events().length)).toBe(0);
});
test('pending deletion is resumable and old operational topics stay blocked',async({page})=>{
 await unavailable(page,'deleting');await page.evaluate(()=>RotaMapaTopics.go('mapa','planejar'));expect(await page.evaluate(()=>RotaMapaTopics.current())).toEqual({page:'painel',topic:'gerenciar'});
 await page.locator('#choosePortfolio').click();await page.getByRole('button',{name:'Retomar exclusão',exact:true}).click();await expect(page.locator('#portfolioLifecycleAction')).toHaveValue('delete');
 await page.locator('#portfolioLifecycleCancel').click();await page.locator('#closePortfolios').click();await page.locator('#portfolioRecoveryImport').click();await page.goBack();
 await expect(page.locator('#choosePortfolio')).toBeVisible();expect(await page.evaluate(()=>RotaMapaTopics.current().page)).toBe('painel');
});
test('state lookup failure preserves the previously confirmed unavailable state',async({page})=>{
 await unavailable(page,'deleted');await page.evaluate(async()=>{window.__stateError=true;await RotaMapaPortfolios.sync();});
 await expect(page.locator('#portfolioStatus')).toContainText('Não foi possível conferir');expect(await page.evaluate(()=>RotaMapaPortfolios.state())).toBe('deleted');await expect(page.locator('#choosePortfolio')).toBeEnabled();
 await page.locator('#choosePortfolio').click();await page.locator('[data-portfolio-id="'+second+'"]').click();await expect.poll(()=>page.evaluate(()=>window.RotaMapaPortfolioScope?.loadedId)).toBe(second);
});
test('comparison errors are visible in the import topic and cancel never applies an update',async({page})=>{
 await updateSetup(page);await page.evaluate(()=>{RotaMapaTopics.go('dados','clientes');window.__oldCloudIdentity=cloudIdentity;cloudIdentity=async()=>{throw Error('Falha de conexão simulada');};});
 await page.locator('#portfolioUpdateFile').setInputFiles(spreadsheet());await expect(page.locator('#fileImportStatus')).toBeVisible();await expect(page.locator('#fileImportStatus')).toContainText('Falha de conexão simulada');
 const before=await page.evaluate(()=>JSON.stringify(clients));await page.evaluate(()=>{window.__heldIdentities=[];cloudIdentity=()=>new Promise(resolve=>__heldIdentities.push(resolve));});
 await page.locator('#portfolioUpdateFile').setInputFiles(spreadsheet());await expect(page.locator('#portfolioCompareProgress')).toBeVisible();await page.locator('#portfolioCompareCancel').click();await expect(page.locator('#portfolioCompareProgress')).toBeHidden();await expect(page.locator('#fileImportStatus')).toContainText('cancelada');
 await page.evaluate(()=>{cloudIdentity=__oldCloudIdentity;for(const resolve of __heldIdentities)resolve('00000000-0000-4000-8000-000000000001');});await page.waitForFunction(()=>!traxioSyncRunning&&!cloudBusy);await expect(page.locator('#portfolioUpdateDialog')).toBeHidden();expect(await page.evaluate(()=>JSON.stringify(clients))).toBe(before);
 await page.evaluate(()=>{cloudIdentity=__oldCloudIdentity;});await page.locator('#portfolioUpdateFile').setInputFiles(spreadsheet());await expect(page.locator('#portfolioUpdateDialog')).toBeVisible();await expect(page.locator('#portfolioUpdatePreview')).toContainText('Permanecem (1)');
});
test('a delayed read times out visibly and late results cannot reopen the update preview',async({page})=>{
 await updateSetup(page);await page.clock.install();await page.evaluate(()=>{RotaMapaTopics.go('dados','clientes');cloudIdentity=()=>new Promise(resolve=>window.__resolveLateIdentity=resolve);});
 await page.locator('#portfolioUpdateFile').setInputFiles(spreadsheet());await expect(page.locator('#portfolioCompareProgress')).toBeVisible();await page.clock.runFor(31000);await expect(page.locator('#portfolioCompareProgress')).toBeHidden();await expect(page.locator('#fileImportStatus')).toContainText('demorou');
 await page.evaluate(()=>__resolveLateIdentity('00000000-0000-4000-8000-000000000001'));await expect(page.locator('#portfolioUpdateDialog')).toBeHidden();
});

test('confirmed deletion remains blocked across a reload when the next state lookup is unavailable',async({page})=>{
 await unavailable(page,'archived');await page.evaluate(initial=>{RotaMapaPortfolios.applyLifecycle({id:initial,state:'deleted',revision:2});localStorage.setItem('__recoveryNetworkFail','1');},initial);
 await page.reload();await page.waitForFunction(()=>window.RotaMapaTopics&&window.RotaMapaPortfolios?.state()==='deleted');await expect(page.locator('#portfolioRecovery')).toBeVisible();await page.locator('#choosePortfolio').click();await expect(page.locator('#portfolioDialog')).toBeVisible();await expect(page.locator('nav.tabs [data-tab=clientes]')).toBeDisabled();
});

test('a late lifecycle acknowledgement cannot update another account cache',async({page})=>{
 await portfolioSetup(page);const result=await page.evaluate(initial=>{const before=localStorage.getItem('rotamapa.portfolio.states.v1:00000000-0000-4000-8000-000000000001');try{RotaMapaPortfolios.applyLifecycle({id:initial,state:'deleted'},'00000000-0000-4000-8000-000000000002');return{rejected:false};}catch(e){return{rejected:true,message:e.message,unchanged:before===localStorage.getItem('rotamapa.portfolio.states.v1:00000000-0000-4000-8000-000000000001')};}},initial);expect(result).toMatchObject({rejected:true,unchanged:true});
});
