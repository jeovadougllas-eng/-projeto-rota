/* Campaign-first navigation over the existing account/portfolio ledgers and document library. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),G=RotaMapaCampaignGroups,M=RotaMapaCommerceModel;
 const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
 const click=(label,fn)=>{const b=make('button',label,'secondary');b.type='button';b.onclick=()=>Promise.resolve().then(fn).catch(error=>feedback(error.message));return b;};
 const dialog=$('commerceCampaignList'),overview=$('commerceCampaignRows');
 const tools=make('div',null,'campaign-browser-filters');
 tools.innerHTML='<label>Condições em<input type="date" id="campaignBrowserDate"></label><label>Exibir<select id="campaignBrowserScope"><option value="active">Vigentes nessa data</option><option value="all">Todas as vigências</option></select></label>';
 overview.before(tools);
 const detail=make('section');detail.id='campaignBrowserDetail';detail.hidden=true;
 detail.innerHTML='<button type="button" id="campaignBrowserBack" class="secondary">← Voltar às campanhas</button><h3 id="campaignBrowserTitle"></h3><label>Buscar produto<input type="search" id="campaignBrowserSearch" placeholder="Nome ou apresentação"></label><p id="campaignBrowserCount" role="status"></p><div id="campaignBrowserProducts" class="commerce-list"></div>';
 overview.after(detail);
 const note=make('p');note.id='campaignBrowserStatus';note.setAttribute('role','status');detail.after(note);
 let selected=null,rows=[],records=[],revision=0;
 const label=id=>G.families.find(f=>f.id===id)?.name||'Outras campanhas';
 const date=()=>TraxeloVisitsModel.day(new Date(),'America/Fortaleza');
 const feedback=message=>{$('campaignBrowserStatus').textContent=message;};
 function reset(){revision++;selected=null;rows=[];records=[];overview.replaceChildren();$('campaignBrowserProducts').replaceChildren();detail.hidden=true;overview.hidden=false;feedback('');}
 async function refresh(){
  const rev=++revision,sales=RotaMapaSales.getStore(),library=window.RotaMapaLibrary?.getStore();
  if(!sales||document.body.classList.contains('auth-locked')){reset();return;}
  try{const same=library?.owner===sales.owner&&library.portfolio===sales.portfolio,items=same?await library.items():[];
   if(rev!==revision||sales!==RotaMapaSales.getStore()||same&&library!==RotaMapaLibrary.getStore())return;
   records=items;rows=G.conditions(sales.events().filter(c=>c.kind==='campaign'),items,sales.events().filter(c=>c.kind==='product'),{date:$('campaignBrowserDate').value,all:$('campaignBrowserScope').value==='all'});render();
  }catch(error){if(rev===revision)feedback(error.message);}
 }
 function render(){
  overview.replaceChildren();overview.hidden=!!selected;detail.hidden=!selected;
  const groups=[...G.families,...(rows.some(r=>r.family==='other')?[{id:'other',name:'Outras campanhas',period:'Vigências do documento'}]:[])];
  for(const family of groups){const list=rows.filter(r=>r.family===family.id),card=make('button',null,'campaign-family-card secondary');card.type='button';card.dataset.campaignFamily=family.id;
   const heading=make('strong',family.name),period=make('small',family.period),count=make('span',list.length?new Set(list.map(r=>r.productId||r.name)).size+' produtos com condições':'Nenhuma condição neste filtro','campaign-family-count');
   card.append(heading,period,count,make('span','Consultar produtos →','campaign-family-action'));card.onclick=()=>{selected=family.id;$('campaignBrowserSearch').value='';render();$('campaignBrowserTitle').focus();};overview.append(card);
  }
  $('campaignBrowserTitle').tabIndex=-1;$('campaignBrowserTitle').textContent=label(selected);
  const needle=G.norm($('campaignBrowserSearch').value),found=rows.filter(r=>r.family===selected&&G.norm(r.name).includes(needle));
  $('campaignBrowserCount').textContent=found.length+' condições · '+($('campaignBrowserScope').value==='all'?'Todas as vigências':$('campaignBrowserDate').value.split('-').reverse().join('/'));
  const target=$('campaignBrowserProducts');target.replaceChildren();
  if(selected&&!found.length)target.append(make('p','Não há condições para este filtro. Importe a lâmina da campanha ou selecione outra data.'));
  for(const row of found){const card=make('article',null,'commerce-item');card.append(make('strong',row.name),make('p',row.start.split('-').reverse().join('/')+' a '+row.end.split('-').reverse().join('/')));
   for(const [index,tier] of row.tiers.entries()){const minimum=tier.minimum??tier.minQty,price=tier.priceCents??tier.unitPriceCents;card.append(make('p',(tier.label||(row.tiers.length===1?'Faixa única':'Faixa '+(index+1)))+' · A partir de '+minimum+' un. · '+(price!=null?M.brl(price)+' por unidade':(tier.discountBps/100).toLocaleString('pt-BR')+'% sobre a tabela')));const context=[tier.region,tier.startTime&&tier.endTime?'Horário: '+tier.startTime+' a '+tier.endTime:'',tier.stock!==''&&tier.stock!=null?'Estoque informado: '+tier.stock+' un.':'',tier.restrictions].filter(Boolean);if(context.length)card.append(make('small',context.join(' · ')));}
   if(row.kind==='legacy'){if(row.campaign.type==='importada')card.append(click('Consultar documento',()=>RotaMapaLibrary.openCampaign(row.campaign.imported.documentId,row.productId)));else card.append(click('Editar condições',()=>RotaMapaSales.openCampaign(row.campaign)));}
   else{const source=records.find(r=>r.value.id===row.id),pending=!source?.synced&&row.document.data.format==='pdf';card.append(make('small','Fonte: '+row.document.data.fileName+(pending?' · Confirmação de importação pendente':'')));card.append(click(pending?'Sincronizar para calcular':'Consultar e calcular',()=>pending?RotaMapaLibrary.sync():RotaMapaLibrary.openCampaign(row.id,row.productId)));}
   target.append(card);
  }
 }
 $('campaignBrowserDate').value=date();$('campaignBrowserDate').onchange=refresh;$('campaignBrowserScope').onchange=refresh;$('campaignBrowserSearch').oninput=render;
 $('campaignBrowserBack').onclick=()=>{selected=null;render();overview.querySelector('button')?.focus();};
 $('importCommerceCampaign').onclick=()=>{try{RotaMapaLibrary.openImport('campaigns',selected||'auto');}catch(error){feedback(error.message);}};
 $('openCommerceCampaigns').addEventListener('click',()=>{selected=null;dialog.scrollTop=0;feedback('');refresh();});
 dialog.addEventListener('close',()=>{selected=null;$('campaignBrowserSearch').value='';});
 window.addEventListener('rotamapa:sales-rendered',refresh);window.addEventListener('rotamapa:library-rendered',refresh);window.addEventListener('rotamapa:commerce-scope-changed',reset);
 new MutationObserver(()=>{if(document.body.classList.contains('auth-locked'))reset();}).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.RotaMapaCampaignBrowser={refresh};refresh();
})();
