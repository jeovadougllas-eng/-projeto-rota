import {readFile,writeFile} from 'node:fs/promises';
const rows=[];
for(const screen of ['login','painel','clientes','mapa','dados']){
  const before=JSON.parse(await readFile(`docs/captures/reference-before-kit/${screen}-metrics.json`,'utf8'));
  const after=JSON.parse(await readFile(`docs/captures/reference/${screen}-metrics.json`,'utf8'));
  rows.push({screen,before:before.metrics,after:after.metrics,meanRGBErrorChange:after.metrics.meanAbsoluteRGBError-before.metrics.meanAbsoluteRGBError});
}
await writeFile('docs/captures/reference-summary.json',JSON.stringify({reference:'Unmodified crops from the supplied Traxio visual kit',previousCommit:'666c21a59af996b8e94b5a8faf130529d763b6c5',note:'Negative changes mean lower RGB error. Values include text, account data, and live map differences; they are not fidelity percentages.',screens:rows},null,2));
const table=rows.map(r=>`| ${r.screen} | ${r.before.meanAbsoluteRGBError.toFixed(2)} | ${r.after.meanAbsoluteRGBError.toFixed(2)} | ${r.meanRGBErrorChange.toFixed(2)} |`).join('\n');
await writeFile('docs/captures/reference-summary.md',`# Comparação com o kit visual aprovado\n\nAs mesmas referências PNG e proporções foram usadas nas duas execuções. Uma variação negativa indica redução da diferença média RGB (escala de 0 a 255). Estes valores não representam porcentagens de fidelidade. Dados de conta, fontes renderizadas pelo navegador e cartografia real também influenciam a medida.\n\n| Tela | Antes do kit | Depois do kit | Variação |\n| --- | ---: | ---: | ---: |\n${table}\n\nOs textos dos banners da versão nova são HTML acessível; o lettering da marca e os recursos gráficos aprovados continuam sendo exibidos a partir dos recortes originais. O histórico e variantes móveis não têm referência específica no kit.\n`);
console.log(table);
