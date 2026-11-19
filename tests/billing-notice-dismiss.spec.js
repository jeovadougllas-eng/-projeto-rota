import {test,expect} from 'playwright/test';
import {setupLinks} from './fixtures/links.js';
for(const action of ['bell','banner'])test('billing banner dismisses for this opening through '+action,async({page})=>{
 await setupLinks(page,{records:[{id:'notice-client',name:'Farmácia teste',cnpj:'01234567000189',city:'Natal',state:'RN'}]});
 await page.evaluate(()=>{const s=RotaMapaSales.getStore(),p=s.events().find(p=>p.kind==='product');s.add({id:crypto.randomUUID(),kind:'sale',clientId:String(clients[0].id),clientName:clients[0].name,date:TraxeloVisitsModel.day(),status:'confirmed',lines:[RotaMapaCommerceModel.line(p,1,null,TraxeloVisitsModel.day())],totalCents:p.priceCents});RotaMapaSales.refresh();});
 await expect(page.locator('#billingReminder')).toBeVisible();
 await page.locator(action==='bell'?'#appointmentBell':'#billingReminder').click();
 await expect(page.locator('#billingReminder')).toBeHidden();
 await page.evaluate(()=>{RotaMapaBilling.render();RotaMapaScheduling.render();document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.locator('#billingReminder')).toBeHidden();
 await expect(page.locator('#appointmentBellCount')).toBeVisible();
 expect(await page.locator('#appointmentBellCount').evaluate(e=>e.getBoundingClientRect().width)).toBeLessThanOrEqual(10);
 expect(await page.evaluate(()=>document.body.style.getPropertyValue('--billing-notice-height'))).toBe('0px');
 expect(await page.evaluate(()=>RotaMapaSales.getStore().events().filter(e=>e.kind==='sale').length)).toBe(1);
});
