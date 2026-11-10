import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
const html = await readFile(new URL('../index.html', import.meta.url),'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match => match[1]).filter(Boolean);
scripts.forEach((source,index) => new Script(source,{filename:'application-inline-'+index+'.js'}));
new Script(await readFile(new URL('../assets/traxio-ui.js', import.meta.url),'utf8'),{filename:'traxio-ui.js'});
new Script(await readFile(new URL('../assets/traxio-geolocation.js', import.meta.url),'utf8'),{filename:'traxio-geolocation.js'});
new Script(await readFile(new URL('../assets/traxio-native.js', import.meta.url),'utf8'),{filename:'traxio-native.js'});
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
if(new Set(ids).size !== ids.length) throw Error('Duplicate IDs in HTML');
for(const source of ['https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.js','https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/dist/umd/supabase.js']) if(!html.includes(source)) throw Error('Missing existing dependency: '+source);
for(const provider of ["data-provider=\"google\"", "data-provider=\"azure\"", "flowType:'pkce'", "storageKey:'traxio-auth-v3'"]) if(!html.includes(provider)) throw Error('Existing integration changed: '+provider);
console.log(`Validated ${scripts.length} inline scripts, the presentation adapter, unique HTML IDs and existing integration identifiers.`);

for(const file of ['traxio-planner.js','traxio-route-ui.js','traxelo-navigation-model.js','traxelo-navigation-ui.js','traxelo-map-actions.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});


for(const file of ['traxelo-iphone-pwa.js','traxelo-geo-recovery.js','traxelo-updates.js','traxelo-location-ui.js','traxelo-visits-model.js','traxelo-visit-store.js','traxelo-visit-report.js','traxelo-visits-ui.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

for(const file of ['traxelo-premium-model.js','traxelo-workspace-store.js','traxelo-workspace-ui.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

for(const file of ['rotamapa-commerce-model.js','rotamapa-commerce-store.js','rotamapa-commerce-ui.js','rotamapa-order-pdf-model.js','rotamapa-order-pdf-ui.js','rotamapa-install-identity.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

for(const file of ['rotamapa-account-model.js','rotamapa-account-ui.js','rotamapa-client-identity.js','rotamapa-portfolio-scope.js','rotamapa-portfolios.js','rotamapa-visit-details-model.js','rotamapa-visit-details.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

if(!html.includes('KEY=RotaMapaPortfolioScope.clientsKey()'))throw Error('Missing portfolio client isolation');
if(!(await readFile(new URL('../assets/rotamapa-portfolio-scope.js',import.meta.url),'utf8')).includes("?'projeto_rota_mapa_v1'"))throw Error('Legacy client storage must remain available');

for(const file of ['rotamapa-scheduling-model.js','rotamapa-scheduling.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

if(JSON.parse(await readFile(new URL('../assets/rotamapa-release.json',import.meta.url),'utf8')).version!==JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version)throw Error('Account release version differs from package version');

for(const file of ['rotamapa-billing-model.js','rotamapa-billing-ui.js','rotamapa-buyer-model.js','rotamapa-buyer-ui.js','rotamapa-plan-testing.js','rotamapa-portfolio-version-model.js','rotamapa-portfolio-version-ui.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

new Script(await readFile(new URL('../assets/rotamapa-field-ui.js',import.meta.url),'utf8'),{filename:'rotamapa-field-ui.js'});
if(!html.includes('assets/rotamapa-field-ui.css')||!html.includes('assets/rotamapa-field-ui.js'))throw Error('Missing approved field UI');
const nativeHtml=html.replace(/<!-- iphone-pwa:start -->[\s\S]*?<!-- iphone-pwa:end -->/g,'');if(!nativeHtml.includes('assets/rotamapa-field-ui.js'))throw Error('Field UI must also ship in Android');

new Script(await readFile(new URL('../assets/rotamapa-ranking-ui.js',import.meta.url),'utf8'),{filename:'rotamapa-ranking-ui.js'});
if(!nativeHtml.includes('assets/rotamapa-ranking-ui.js')||!nativeHtml.includes('assets/rotamapa-ranking.css'))throw Error('Ranking must ship on web and Android');

for(const file of ['rotamapa-subscription-model.js','rotamapa-subscription-ui.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

new Script(await readFile(new URL('../assets/rotamapa-auth.js',import.meta.url),'utf8'),{filename:'rotamapa-auth.js'});

for(const file of ['rotamapa-client-import.js','rotamapa-client-import-ui.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

new Script(await readFile(new URL('../assets/rotamapa-portfolio-lifecycle.js',import.meta.url),'utf8'),{filename:'rotamapa-portfolio-lifecycle.js'});

for(const file of ['rotamapa-documents.js','rotamapa-document-model.js','rotamapa-commissions-model.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

for(const file of ['rotamapa-catalog-viewer.js','rotamapa-promotions-ui.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

for(const file of ['rotamapa-library-store.js','rotamapa-promotion-model.js','rotamapa-library-ui.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

new Script(await readFile(new URL('../assets/rotamapa-commercial-cards.js',import.meta.url),'utf8'),{filename:'rotamapa-commercial-cards.js'});

for(const file of ['rotamapa-campaign-groups.js','rotamapa-campaign-browser.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

for(const file of ['rotamapa-compact-ui.js','rotamapa-showroom.js','rotamapa-fair-data.js','rotamapa-product-photos.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

for(const file of ['rotamapa-fair-model.js','rotamapa-fair-import.js','rotamapa-fair-import-ui.js','rotamapa-fair-ui.js','rotamapa-fair-orders-model.js','rotamapa-fair-orders-ui.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

for(const file of ['rotamapa-google-model.js','rotamapa-google-map.js','rotamapa-google-ui.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});
