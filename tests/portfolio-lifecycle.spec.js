import{test,expect}from'playwright/test';import{portfolioSetup,initial}from'./fixtures/portfolios.js';
async function setup(page){await portfolioSetup(page);await page.evaluate(()=>{
 window.__lifecycleCalls=[];window.__lifecycleState=[];const rpc=authClient.rpc.bind(authClient);
 authClient.rpc=async(name,args)=>{
  if(name==='rotamapa_portfolio_states')return{data:window.__lifecycleState,error:null};
  if(name==='rotamapa_manage_portfolio'){window.__lifecycleCalls.push(args);if(window.__failLifecycle)return{error:{message:'Synthetic server rejection'}};window.__lifecycleState=[{id:args.p_portfolio,state:{archive:'archived',restore:'active',delete:'deleted'}[args.p_action]}];return{data:{id:args.p_portfolio,state:window.__lifecycleState[0].state},error:null};}
  return rpc(name,args);
 };localStorage.setItem('traxio_sync_baseline_v29_'+localStorage.getItem('traxio_sync_owner_v29'),JSON.stringify(Object.fromEntries(clients.map(c=>[c.id,{hash:cloudCanonical(c),revision:1}]))));
 });await page.evaluate(()=>RotaMapaPortfolios.sync());await page.locator('#choosePortfolio').click();await page.locator('.portfolio-choice').first().getByRole('button',{name:'Gerenciar exclusão'}).click();}
test('missing confirmation and offline attempts never invoke destructive RPC',async({page})=>{
 await setup(page);await page.locator('#portfolioLifecycleAction').selectOption('delete');await page.locator('#portfolioLifecycleConfirmation').fill('wrong');await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleError')).toContainText('exatamente');
 await page.locator('#portfolioLifecycleConfirmation').fill('EXCLUIR EMS — Natal');await page.context().setOffline(true);await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleError')).toContainText('internet');expect(await page.evaluate(()=>__lifecycleCalls.length)).toBe(0);expect(await page.evaluate(()=>clients.length)).toBe(1);
});
test('server rejection preserves local records and pending local changes block the request',async({page})=>{
 await setup(page);await page.locator('#portfolioLifecycleConfirmation').fill('ARQUIVAR EMS — Natal');await page.evaluate(()=>window.__failLifecycle=true);await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleError')).toContainText('Synthetic server rejection');expect(await page.evaluate(()=>clients.length)).toBe(1);
 await page.evaluate(()=>{clients[0].name='Mudança offline';save();});await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleError')).toContainText('clientes locais');expect(await page.evaluate(()=>__lifecycleCalls.length)).toBe(1);
});
test('archiving retains the cache and blocks the active portfolio until restore or switch',async({page})=>{
 await setup(page);const before=await page.evaluate(()=>JSON.stringify(clients));await page.locator('#portfolioLifecycleConfirmation').fill('ARQUIVAR EMS — Natal');await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleDialog')).toBeHidden();expect(await page.evaluate(()=>JSON.stringify(clients))).toBe(before);await expect(page.locator('nav.tabs [data-tab=clientes]')).toBeDisabled();
});
test('confirmed deletion clears only selected synced caches after acknowledgement',async({page})=>{
 await setup(page);await page.evaluate(()=>localStorage.setItem('rotamapa.clients.v1:other-owner:other-portfolio','preserve me'));
 await page.locator('#portfolioLifecycleAction').selectOption('delete');await page.locator('#portfolioLifecycleConfirmation').fill('EXCLUIR EMS — Natal');await page.locator('#portfolioLifecycleSubmit').click();await expect(page.locator('#portfolioLifecycleDialog')).toBeHidden();
 expect(await page.evaluate(()=>clients.length)).toBe(0);expect(await page.evaluate(()=>localStorage.getItem('rotamapa.clients.v1:other-owner:other-portfolio'))).toBe('preserve me');expect(await page.evaluate(()=>__lifecycleCalls[0])).toMatchObject({p_portfolio:initial,p_revision:1,p_action:'delete',p_confirmation:'EXCLUIR EMS — Natal'});
});
