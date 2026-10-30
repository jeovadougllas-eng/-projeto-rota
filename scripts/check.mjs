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

for(const file of ['rotamapa-commerce-model.js','rotamapa-commerce-store.js','rotamapa-commerce-ui.js','rotamapa-install-identity.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

for(const file of ['rotamapa-portfolio-scope.js','rotamapa-portfolios.js','rotamapa-visit-details-model.js','rotamapa-visit-details.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});

if(!html.includes('KEY=RotaMapaPortfolioScope.clientsKey()'))throw Error('Missing portfolio client isolation');
if(!(await readFile(new URL('../assets/rotamapa-portfolio-scope.js',import.meta.url),'utf8')).includes("?'projeto_rota_mapa_v1'"))throw Error('Legacy client storage must remain available');

for(const file of ['rotamapa-scheduling-model.js','rotamapa-scheduling.js'])new Script(await readFile(new URL('../assets/'+file,import.meta.url),'utf8'),{filename:file});
