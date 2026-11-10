import{test,expect}from'playwright/test';import{portfolioSetup,initial}from'./fixtures/portfolios.js';
async function setup(page){await portfolioSetup(page);await page.evaluate(()=>{
 window.__lifecycleCalls=[];window.__lifecycleState=[];const rpc=authClient.rpc.bind(authClient);
 authClient.rpc=async(name,args)=>{
  if(name==='rotamapa_portfolio_states')return{data:window.__lifecycleState,error:null};
  if(name==='rotamapa_prepare_portfolio_delete'){window.__lifecycleCalls.push({method:'prepare',...args});window.__lifecycleState=[{id:args.p_portfolio,state:'deleting'}];return{data:{id:args.p_portfolio,state:'deleting',ticketId:'00000000-0000-4000-8000-000000000044',paths:window.__deletePaths||[]},error:null};}
  if(name==='rotamapa_portfolio_delete_batch')return{data:{id:window.__lifecycleState[0].id,state:'deleting',ticketId:args.p_ticket,paths:window.__deletePaths||[]},error:null};
  if(name==='rotamapa_finish_portfolio_delete'){window.__lifecycleCalls.push({method:'finish',...args});if(window.__deletePaths?.length)return{error:{message:'Still pending files'}};const id=window.__lifecycleState[0].id;window.__lifecycleState=[{id,state:'deleted'}];return{data:{id,state:'deleted'},error:null};}
  if(name==='rotamapa_manage_portfolio'){window.__lifecycleCalls.push(args);if(window.__failLifecycle)return{error:{message:'Synthetic server rejection'}};window.__lifecycleState=[{id:args.p_portfolio,state:{archive:'archived',restore:'active',delete:'deleted'}[args.p_action]}];return{data:{id:args.p_portfolio,state:window.__lifecycleState[0].state},error:null};}
  return rpc(name,args);
 };localStorage.setItem('traxio_sync_baseline_v29_'+localStorage.getItem('traxio_sync_owner_v29'),JSON.stringify(Object.fromEntries(clients.map(c=>[c.id,{hash:cloudCanonical(c),revision:1}]))));
 });await page.evaluate(()=>RotaMapaPortfolios.sync());await page.locator('#choosePortfolio').click();await page.locator('.portfolio-choice').first().getByRole('button',{name:'Gerenciar exclusão'}).click();}
test('cancelled permanent-delete confirmation and offline attempts never invoke destructive RPC',async({page})=>{
 await setup(page);await page.locator('#portfolioLifecycleAction').selectOption('delete');page.once('dialog',d=>d.dismiss());await page.locator('#portfolioLifecycleSubmit').click();expect(await page.evaluate(()=>__lifecycleCalls.length)).toBe(0);
 await page.context().setOffline(true);await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleError')).toContainText('internet');expect(await page.evaluate(()=>__lifecycleCalls.length)).toBe(0);expect(await page.evaluate(()=>clients.length)).toBe(1);
});
test('server rejection preserves local records and pending local changes block the request',async({page})=>{
 await setup(page);await page.evaluate(()=>window.__failLifecycle=true);await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleError')).toContainText('Synthetic server rejection');expect(await page.evaluate(()=>clients.length)).toBe(1);
 await page.evaluate(()=>{clients[0].name='Mudança offline';save();});await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleError')).toContainText('clientes locais');expect(await page.evaluate(()=>__lifecycleCalls.length)).toBe(1);
});
test('archiving retains the cache and blocks the active portfolio until restore or switch',async({page})=>{
 await setup(page);const before=await page.evaluate(()=>JSON.stringify(clients));await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleDialog')).toBeHidden();expect(await page.evaluate(()=>JSON.stringify(clients))).toBe(before);await expect(page.locator('nav.tabs [data-tab=clientes]')).toBeDisabled();
});
test('confirmed deletion clears only selected synced caches after acknowledgement',async({page})=>{
 await setup(page);await page.evaluate(()=>localStorage.setItem('rotamapa.clients.v1:other-owner:other-portfolio','preserve me'));
 await page.locator('#portfolioLifecycleAction').selectOption('delete');page.on('dialog',d=>d.accept());await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleDialog')).toBeHidden();
 expect(await page.evaluate(()=>clients.length)).toBe(0);expect(await page.evaluate(()=>localStorage.getItem('rotamapa.clients.v1:other-owner:other-portfolio'))).toBe('preserve me');expect(await page.evaluate(()=>__lifecycleCalls[0])).toMatchObject({method:'prepare',p_portfolio:initial,p_revision:1,p_confirmation:'EXCLUIR EMS — Natal'});
});

test('an interrupted original-file removal preserves local data and resumes before final deletion acknowledgement',async({page})=>{
 await setup(page);await page.evaluate(initial=>{const owner=localStorage.getItem('traxio_sync_owner_v29');window.__deletePaths=[owner+'/'+initial+'/'+'a'.repeat(64)+'.pdf'];window.__deleteFailure=true;window.__removedPaths=[];authClient.storage={from:bucket=>bucket!=='rotamapa-catalogs'?(()=>{throw Error('Unexpected bucket')})():{remove:async paths=>{if(window.__deleteFailure)return{error:{message:'Synthetic lost connection'}};window.__removedPaths.push(...paths);window.__deletePaths=[];return{data:paths.map(name=>({name})),error:null};}}};},initial);
 await page.locator('#portfolioLifecycleAction').selectOption('delete');page.on('dialog',d=>d.accept());await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleError')).toContainText('Synthetic lost connection');expect(await page.evaluate(()=>clients.length)).toBe(1);expect(await page.evaluate(()=>__lifecycleCalls.some(c=>c.method==='finish'))).toBe(false);
 await page.evaluate(()=>window.__deleteFailure=false);await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleDialog')).toBeHidden();expect(await page.evaluate(()=>clients.length)).toBe(0);expect(await page.evaluate(()=>__removedPaths.length)).toBe(1);expect(await page.evaluate(()=>__lifecycleCalls.at(-1).method)).toBe('finish');
});
