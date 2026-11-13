import {test,expect} from 'playwright/test';
import {prepare,ready} from './fixtures/browser.js';
const records=[
 {id:'a',name:'Natal Alta',city:'NATAL',neighborhood:'LAGOA NOVA',priority:3,lat:-5.81,lon:-35.21,locationVerification:'manual_reviewed',importFields:[{label:'Categoria',value:'Farmácia'}]},
 {id:'b',name:'Natal Média',city:'Natal',neighborhood:'Lagoa Nova',priority:'2',lat:null,lon:null},
 {id:'c',name:'Natal Baixa',city:'NATAL',neighborhood:'PAJUCARA',priority:'1',lat:null,lon:null},
 {id:'d',name:'Natal Conjunto',city:'NATAL',neighborhood:'CONJUNTO SANTAREM',lat:null,lon:null},
 {id:'e',name:'Parnamirim Alta',city:'PARNAMIRIM',neighborhood:'CENTRO',priority:3,lat:null,lon:null}
];
async function setup(page){await prepare(page,{records,lockAuthFixture:true});if(process.env.TRAXELO_PWA_BASE)await page.route(process.env.TRAXELO_PWA_BASE+'/**',r=>r.continue());await ready(page);await page.locator('[data-tab=clientes]').click();}
const names=page=>page.locator('#registryRows .client-link');
test('commercial categories always expose Alta, Média and Baixa and combine with city, district and location',async({page})=>{
 await setup(page);const before=await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'));
 await page.locator('#fieldRegistryExtra>summary').click();
 await expect(page.locator('#registryCategory option')).toHaveText(['Categoria','Alta','Média','Baixa']);
 await page.locator('#registryCategory').selectOption({label:'Alta'});await expect(names(page)).toHaveText(['Natal Alta','Parnamirim Alta']);
 await page.locator('#registryCity').selectOption('NATAL');await expect(names(page)).toHaveText(['Natal Alta']);
 await page.locator('#registryNeighborhood').selectOption({label:'Lagoa Nova'});await expect(names(page)).toHaveText(['Natal Alta']);
 await page.locator('#registryCategory').selectOption({label:'Média'});await expect(names(page)).toHaveText(['Natal Média']);
 await page.locator('#registryLocation').selectOption('confirmed');await expect(names(page)).toHaveCount(0);
 await page.locator('#registryLocation').selectOption('');await page.locator('#registryClear').click();
 await page.locator('#registryCategory').selectOption({label:'Baixa'});await expect(names(page)).toHaveText(['Natal Baixa']);
 await page.locator('#registryClear').click();await expect(names(page)).toHaveCount(5);
 expect(await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'))).toBe(before);
});
test('Natal lists all 36 official districts plus imported sets and matches case and accents without changing pins or selection',async({page})=>{
 await setup(page);const before=await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'));
 await page.locator('#registryRows input').first().check();
 await page.locator('#registryCity').selectOption('NATAL');await expect(names(page)).toHaveCount(4);
 // NATAL/Natal are the same city; official spelling takes precedence over duplicate variants.
 await expect(page.locator('#registryCity option')).toHaveCount(3);
 const districts=await page.locator('#registryNeighborhood option').allTextContents();
 const official=await page.evaluate(()=>Object.values(RotaMapaBuyerModel.natal).flat());
 expect(official).toHaveLength(36);for(const district of official)expect(districts).toContain(district);
 expect(districts).toContain('CONJUNTO SANTAREM');expect(districts).toHaveLength(38);
 await page.locator('#registryNeighborhood').selectOption({label:'Pajuçara'});await expect(names(page)).toHaveText(['Natal Baixa']);
 await page.locator('#registryNeighborhood').selectOption({label:'Ponta Negra'});await expect(names(page)).toHaveCount(0);await expect(page.locator('#registryRows')).toContainText('Nenhum cliente corresponde');
 await page.locator('#registryNeighborhood').selectOption({label:'CONJUNTO SANTAREM'});await expect(names(page)).toHaveText(['Natal Conjunto']);
 await page.locator('#registryCity').selectOption('PARNAMIRIM');await expect(page.locator('#registryNeighborhood')).toHaveValue('');await expect(page.locator('#registryNeighborhood option')).toHaveText(['Bairro','CENTRO']);await expect(names(page)).toHaveText(['Parnamirim Alta']);
 expect(await page.evaluate(()=>[...selectedIds])).toEqual(['a']);expect(await page.evaluate(()=>localStorage.getItem('projeto_rota_mapa_v1'))).toBe(before);
});
