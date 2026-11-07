import { clients } from './clients.js';

// Only Playwright injects these doubles. Production HTML has no test switch or auth bypass.
export async function prepare(page, {authenticated=true, theme='light', records=clients, liveMaps=false, lockAuthFixture=false}={}) {
  await page.addInitScript(({authenticated,theme,records,lockAuthFixture})=>{
    if(!localStorage.getItem('projeto_rota_mapa_v1')) localStorage.setItem('projeto_rota_mapa_v1',JSON.stringify(records));
    if(!localStorage.getItem('traxio.account.preferences.v1')) localStorage.setItem('traxio.account.preferences.v1',JSON.stringify({theme,font:100}));
    const user={id:'00000000-0000-4000-8000-000000000001',email:'representante@exemplo.com',user_metadata:{display_name:'Representante Traxio'},app_metadata:{provider:'google'}};
    const session=authenticated?{user}:null;
    window.__oauthCalls=[];window.__exchangeCalls=[]; window.__passwordCalls=[];window.__dataCalls=[];
    const rows=records.map(c=>({id:c.id,local_id:c.id,portfolio_id:'00000000-0000-4000-8000-000000000000',data:c,revision:1,deleted_at:null}));
    const query=table=>{
      const result={data:table==='clients'?rows:table==='rotamapa_portfolios'?[{id:'00000000-0000-4000-8000-000000000000',name:'Carteira inicial',revision:1}]:table==='traxelo_workspace_items'?[]:null,count:table==='clients'?rows.length:0,error:null};
      const chain={then:(yes,no)=>Promise.resolve(result).then(yes,no)};
      for(const method of ['select','eq','order','range','is','in','limit','match','neq','gt','gte','lt','lte'])chain[method]=()=>chain;
      for(const method of ['insert','upsert','update','delete'])chain[method]=payload=>{window.__dataCalls.push({method,table,payload});return chain;};
      chain.single=chain.maybeSingle=async()=>({data:table==='traxio_profiles'?{full_name:'Representante',address:'Endereço de teste',phone:'00000000000'}:{revision:1},error:null});
      return chain;
    };
    window.supabase={createClient:()=>({auth:{
      getSession:async()=>({data:{session},error:null}),getUser:async()=>({data:{user:session?.user||null},error:null}),
      onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
      signInWithPassword:async credentials=>{window.__passwordCalls.push(credentials);return{data:{user},error:null};},
      signInWithOAuth:async options=>{window.__oauthCalls.push(options);return{data:{url:'https://identity.example.test/authorize'},error:null};},
      exchangeCodeForSession:async code=>{window.__exchangeCalls.push(code);return {data:{session:{user}},error:null};},
      signOut:async()=>({error:null}),resetPasswordForEmail:async()=>({error:null}),updateUser:async()=>({data:{user},error:null}),signUp:async()=>({data:{user,session:null},error:null})
    },from:query,rpc:async name=>name==='traxelo_plan_access'?({data:{plan:'pro',beta:true,routeLimit:null,routeCount:0},error:null}):({data:null,error:{message:'Workspace fixture write not configured'}})})};
    // Real service-worker controlled navigations can bypass page-level CDN routing.
    // Keep this test-only SDK double authoritative; never initialize a real account.
    if(lockAuthFixture){const fixture=window.supabase;Object.defineProperty(window,'supabase',{configurable:true,get:()=>fixture,set:()=>{}});}
  },{authenticated,theme,records,lockAuthFixture});
  // Block all external services so no real account, client record, geocoder, or provider is touched.
  await page.route(/^https?:\/\/(?!(?:127\.0\.0\.1|localhost)(?::|\/))/,async route=>{
    const url=route.request().url();
    if(liveMaps && (/^https:\/\/unpkg\.com\/maplibre-gl@/.test(url) || /^https:\/\/[^/]*openfreemap\.org\//.test(url) || /^https:\/\/server\.arcgisonline\.com\//.test(url))) { await route.continue(); return; }
    if(/\.(js|css)(\?|$)/.test(url))await route.fulfill({status:200,contentType:url.includes('.css')?'text/css':'application/javascript',body:''});
    else await route.fulfill({status:200,contentType:'application/json',body:'[]'});
  });
}

export async function ready(page) { await page.goto('/'); await page.locator('body.traxio-ui-ready').waitFor(); }

