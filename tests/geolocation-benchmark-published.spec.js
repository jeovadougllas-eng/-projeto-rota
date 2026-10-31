import {test,expect} from 'playwright/test';
test('public comparison page loads, both server-only credentials are configured and unauthenticated queries are rejected',async({page,request},info)=>{
 const status=await request.get('/api/geolocation-benchmark');expect(status.status()).toBe(200);expect(await status.json()).toEqual({readOnly:true,configured:{geoapify:true,tomtom:true}});
 const forbidden=await request.post('/api/geolocation-benchmark',{data:{name:'Synthetic test',street:'Rua Teste',house:'123',city:'Natal',state:'RN'}});expect(forbidden.status()).toBe(401);
 const response=await page.goto('/geolocation-test.html');expect(response.status()).toBe(200);await expect(page.locator('h1')).toHaveText('Geoapify × TomTom');await expect(page.locator('#account')).toContainText('Entre no aplicativo');await expect(page.locator('#load')).toBeDisabled();await expect(page.locator('#start')).toBeDisabled();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('published-comparison.png'),fullPage:true});
});
