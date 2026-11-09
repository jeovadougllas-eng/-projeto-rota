import{test,expect}from'playwright/test';import{prepare,ready}from'./fixtures/browser.js';import{records}from'./fixtures/routing.js';
async function setup(page){await prepare(page,{records,lockAuthFixture:true});await ready(page);await expect.poll(()=>page.evaluate(()=>!!window.TraxeloVisits?.getStore())).toBe(true);await page.locator('.tabs [data-tab=historico]').click();await page.locator('#fieldReportSettings > summary').click();}
test('remote order defaults to WhatsApp, saves offline and leaves physical metrics unchanged',async({page})=>{
 await setup(page);await page.context().setOffline(true);
 await page.locator('#newVisit').click();await page.locator('#visitEntryClient').selectOption('1');await page.locator('#visitEntryOutcome').selectOption('Pedido remoto');
 await expect(page.locator('#visitEntryChannel')).toHaveValue('whatsapp');await expect(page.locator('#visitEntryConfirmationText')).toHaveText('Confirmo que recebi/realizei este pedido remotamente.');await expect(page.locator('#visitEntryDuration')).toBeHidden();
 await page.locator('#visitEntryNotes').fill('Pedido sintético por mensagem');await page.locator('#visitEntryConfirm').check();await page.locator('#saveVisitEntry').click();await expect(page.locator('#visitEntryDialog')).toBeHidden();await expect(page.locator('#commerceChoiceDialog')).toBeHidden();
 const result=await page.evaluate(()=>({model:TraxeloVisits.getModel(),events:TraxeloVisits.getStore().events()}));expect(result.model.summary.visits).toBe(0);expect(result.model.remoteOrders).toHaveLength(1);expect(result.events[0]).toMatchObject({channel:'whatsapp',attendanceType:'remote',routeId:null,notes:'Pedido sintético por mensagem'});
 await expect(page.locator('#visitHistoryRows')).toContainText('WhatsApp');
 await page.context().setOffline(false);await page.reload();await page.locator('.tabs [data-tab=historico]').click();await page.locator('#fieldReportSettings > summary').click();await expect(page.locator('#visitHistoryRows')).toContainText('Pedido remoto');
 await page.locator('#newVisit').click();await page.locator('#visitEntryClient').selectOption('1');await expect(page.locator('#visitEntryOutcome')).toHaveValue('Atendimento realizado');await page.locator('#visitEntryConfirm').check();await page.locator('#saveVisitEntry').click();
 await expect.poll(()=>page.evaluate(()=>TraxeloVisits.getModel().summary.visits)).toBe(1);expect(await page.evaluate(()=>TraxeloVisits.getModel().summary.revisits)).toBe(0);
});
test('remote channel supports phone, email and other without creating a sale',async({page})=>{
 await setup(page);for(const channel of ['phone','email','other']){
 await page.locator('#newVisit').click();await page.locator('#visitEntryClient').selectOption('1');await page.locator('#visitEntryOutcome').selectOption('Pedido remoto');await page.locator('#visitEntryChannel').selectOption(channel);await page.locator('#visitEntryConfirm').check();await page.locator('#saveVisitEntry').click();}
 const values=await page.evaluate(()=>TraxeloVisits.getModel());expect(values.summary.visits).toBe(0);expect(values.remoteOrders.map(v=>v.channel).sort()).toEqual(['email','other','phone']);await expect(page.locator('#commerceChoiceDialog')).toBeHidden();
});
