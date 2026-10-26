import {test,expect} from 'playwright/test';
const clients=[{id:1,name:'Cliente teste Natal',address:'Rua Exemplo, 123, Natal',city:'Natal',state:'RN',cep:'59000000',lat:-5.8,lon:-35.2,locationVerification:'manual_reviewed'},{id:2,name:'Cliente teste Mossoró',address:'Rua Dois, 45, Mossoró',city:'Mossoró',state:'RN',lat:null,lon:null}];
const result={readOnly:true,combined:'compatible',results:Object.fromEntries(['geoapify','tomtom'].map(p=>[p,{provider:p,status:'compatible',requests:1,attempts:[{method:'address',status:'ok'}],reason:'Endereço compatível',candidates:[],best:{label:'Rua Exemplo 123',lat:-5.8,lon:-35.2,attribution:'Crédito teste'}}]))};
async function prepare(page,{loggedIn=true,owner='benchmark-owner',apiResult=result,wait=false}={}){
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/**',route=>route.fulfill({body:''}));
 await page.addInitScript(({clients,loggedIn,owner})=>{
  const user=loggedIn?{id:'benchmark-owner'}:null;window.mockUser=user;window.queryCalls=[];window.authCallback=null;
  window.supabase={createClient:()=>({auth:{getUser:async()=>({data:{user},error:null}),getSession:async()=>({data:{session:user?{user,access_token:'fixture-token'}:null}}),onAuthStateChange:cb=>{window.authCallback=cb;}},from(table){const chain={select(s){window.queryCalls.push({table,select:s});return chain;},eq(k,v){window.queryCalls.push({filter:k,value:v});return chain;},order(){return chain;},range:async()=>({data:[{local_id:'remote',data:{...clients[0],name:'Cliente da nuvem'},deleted_at:null}],error:null})};return chain;}})};
  localStorage.setItem('projeto_rota_mapa_v1',JSON.stringify(clients));if(owner)localStorage.setItem('traxio_sync_owner_v29',owner);
 },{clients,loggedIn,owner});
 await page.route('**/api/geolocation-benchmark',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{readOnly:true,configured:{geoapify:true,tomtom:true}}});
  if(wait)await new Promise(r=>setTimeout(r,800));
  await route.fulfill({status:apiResult.httpStatus||200,json:apiResult});
 });
 await page.goto('/geolocation-test.html');
}
test('authenticated read-only comparison handles multiple cities, consent and report export without changing customers',async({page},info)=>{
 await prepare(page);await page.locator('#load').click();await expect(page.locator('#source')).toContainText('2 clientes');await expect(page.locator('#start')).toBeDisabled();await page.locator('#consent').check();
 const queries=[];page.on('request',r=>{if(r.url().endsWith('/api/geolocation-benchmark')&&r.method()==='POST')queries.push(r.postDataJSON());});
 await page.locator('#start').click();await expect(page.locator('#progress')).toContainText('Comparação encerrada',{timeout:20000});await expect(page.locator('#results .row')).toHaveCount(2);
 expect(queries.map(q=>q.city)).toEqual(['Natal','Mossoró']);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1')))).toEqual(clients);expect(await page.evaluate(()=>window.queryCalls)).toEqual([]);
 const download=page.waitForEvent('download');await page.locator('#download').click();expect((await download).suggestedFilename()).toBe('traxelo-comparacao-localizacao.json');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('comparison-synthetic.png'),fullPage:true});
});
test('anonymous visitor cannot load or query and receives a login instruction',async({page})=>{
 await prepare(page,{loggedIn:false});await expect(page.locator('#account')).toContainText('Entre no aplicativo');await expect(page.locator('#load')).toBeDisabled();await expect(page.locator('#start')).toBeDisabled();
});
test('another account local cache is ignored and cloud reads are owner-filtered',async({page})=>{
 await prepare(page,{owner:'other-owner'});await page.locator('#load').click();await expect(page.locator('#source')).toContainText('1 clientes');await expect(page.locator('#source')).toContainText('nuvem');
 expect(await page.evaluate(()=>window.queryCalls.some(q=>q.filter==='user_id'&&q.value==='benchmark-owner'))).toBe(true);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1')))).toEqual(clients);
});
test('quota failure stops execution clearly instead of showing successful geolocation',async({page})=>{
 await prepare(page,{apiResult:{httpStatus:429,error:'Limite do teste atingido.'}});await page.locator('#load').click();await page.locator('#consent').check();await page.locator('#start').click();await expect(page.locator('#progress')).toContainText('Teste interrompido');await expect(page.locator('#results .row')).toHaveCount(1);await expect(page.locator('#summary')).toContainText('Combinados sem conflito: 0');await expect(page.locator('#download')).toBeEnabled();
});
test('stop and account change cancel pending work without mutating the portfolio',async({page})=>{
 await prepare(page,{wait:true});await page.locator('#load').click();await page.locator('#consent').check();await page.locator('#start').click();await expect(page.locator('#stop')).toBeEnabled();await page.locator('#stop').click();await expect(page.locator('#progress')).toContainText('Interrompido.');await expect(page.locator('#results .row')).toHaveCount(0);await page.evaluate(()=>window.authCallback('SIGNED_OUT',null));await expect(page.locator('#account')).toContainText('Sessão alterada');await expect(page.locator('#load')).toBeDisabled();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('projeto_rota_mapa_v1')))).toEqual(clients);
});
