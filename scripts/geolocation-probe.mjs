// Small, read-only provider diagnostic. No production clients or keys are read.
const probes = [
 ['photon-pt', 'https://photon.komoot.io/api/?limit=2&lang=pt&q=Natal'],
 ['photon-default', 'https://photon.komoot.io/api/?limit=2&q=Natal'],
 ['photon-structured', 'https://photon.komoot.io/structured?countrycode=BR&city=Natal&street=Rua%20Luiz%20XV&housenumber=770&limit=3'],
 ['photon-address', 'https://photon.komoot.io/api/?limit=4&q=Rua%20Luiz%20XV%20770%20Natal%20Brasil'],
 ['viacep', 'https://viacep.com.br/ws/59073230/json/'],
 ['brasilapi-cep', 'https://brasilapi.com.br/api/cep/v2/59073230'],
 ['osrm', 'https://router.project-osrm.org/route/v1/driving/-35.22,-5.81;-35.21,-5.82?overview=full&geometries=geojson']
];
const report=[];
for(const [name,url] of probes){
 const started=Date.now();
 try{const response=await fetch(url,{signal:AbortSignal.timeout(12000)});const body=await response.text();let json;try{json=JSON.parse(body)}catch{};
 report.push({name,status:response.status,ms:Date.now()-started,body:json||body.slice(0,400)});
 }catch(error){report.push({name,error:error.message,ms:Date.now()-started});}
 await new Promise(r=>setTimeout(r,1800));
}
console.log('GELOCATION_PROBE '+JSON.stringify(report));
