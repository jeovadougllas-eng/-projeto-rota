import {expect} from 'playwright/test';
import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
export async function verifyClientFields({page,device,evidence}){
 await page.locator('[data-tab=clientes]').click();
 await page.locator('#registryRows .client-link').first().click();await page.locator('#detailEdit').click();
 const initial=await page.evaluate(()=>({id:editingClientId,number:document.getElementById('houseNumber').value,street:document.getElementById('address').value,lat:clients.find(c=>c.id===editingClientId).lat}));
 await page.locator('#pharmacyNetwork').selectOption('Coopefarma');await page.locator('#complement').fill('Loja Android 2');await page.locator('#saveClient').click();
 await expect(page.locator('#clientEditDialog')).not.toBeVisible();
 const saved=await page.evaluate(id=>clients.find(c=>c.id===id),initial.id);
 expect(saved.pharmacyNetwork).toBe('Coopefarma');expect(saved.complement).toBe('Loja Android 2');expect(saved.houseNumber).toBe(initial.number);expect(saved.street).toBe(initial.street);expect(saved.lat).toBe(initial.lat);
 await page.locator('[data-tab=mapa]').click();await page.locator('#mapClientListDisclosure').evaluate(n=>n.open=true);await expect(page.locator('#mapClientListDisclosure>summary')).toContainText('Mostrar clientes filtrados');
 await writeFile('mobile/evidence/android-client-fields.png',execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:20000000}));
 evidence.checks.push('Original installed APK separates client address fields, saves a manual pharmacy network and exposes a prominent filtered-results bar without changing the confirmed pin');
 return page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'));
}
