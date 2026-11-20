/* Topic navigation moves the existing controls; business handlers and account data stay authoritative. */
(function(){'use strict';
const $=id=>document.getElementById(id),make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const pages=new Map(),dialogStack=[];let originalTab=null;let current={page:'painel',topic:null},restoring=false,initialized=false;
function button(text,action,cls='secondary'){const b=make('button',text,cls);b.type='button';b.onclick=action;return b;}
function build(id,name,root=$(id)){if(!root)return;const page=$(id),header=make('div',null,'rm-topic-heading'),back=button('← Voltar aos tópicos',()=>go(id,null),'secondary rm-topic-back'),heading=make('h2',name),landing=make('div',null,'rm-topic-grid'),content=make('div',null,'rm-topic-content');header.append(back,heading);back.hidden=true;root.prepend(header,landing,content);page.classList.add('rm-topics-page');const item={id,name,root,page,header,back,heading,landing,content,topics:new Map()};pages.set(id,item);return item;}
function add(page,id,title,description,nodes=[],enter=null){const p=pages.get(page);if(!p)return;const view=make('section',null,'rm-topic-view');view.dataset.rmTopic=id;view.hidden=true;p.content.append(view);const elements=nodes.map(n=>typeof n==='string'?$(n):n).filter(Boolean);for(const n of elements){view.append(n);for(const d of n.querySelectorAll(':scope>details.rm-compact-disclosure')){d.open=true;d.classList.add('rm-task-details');}if(n.tagName==='DETAILS'){n.open=true;n.classList.add('rm-task-details');}}const card=button('',()=>go(page,id),'secondary rm-topic-card'),copy=make('span',null,'rm-topic-copy');copy.append(make('strong',title),make('small',description));const arrow=make('span','›','rm-topic-arrow');arrow.setAttribute('aria-hidden','true');const iconName=({carteira:'people',planejar:'route',agenda:'calendar',vendas:'sale',gerenciar:'sync',sincronizacao:'sync',lista:'people',exportar:'download',novo:'people',cobertura:'chart',localizacoes:'pin',filtros:'chart',mapa:'map',clientes:'people',salvas:'route',ferramentas:'map',visitas:'history',faturamento:'check',compras:'store',metas:'chart',evolucao:'chart',registros:'history',bussola:'sale',pedidos:'case',catalogos:'case',promocoes:'sale',comissoes:'chart',manutencao:'download',catalogo:'case',campanhas:'sale',materiais:'download',notas:'case',consultas:'link',atalhos:'link',empresa:'case',ajuda:'alert',produtos:'store',ofertas:'sale',participantes:'people',ranking:'trophy',resumo:'chart'})[id]||'arrow';const glyph=window.RotaMapaFieldUI?.icon(iconName);if(glyph){const tile=make('span',null,'rm-topic-icon');tile.append(glyph);card.append(tile);}card.append(copy,arrow);card.dataset.rmOpen=id;card.dataset.rmPage=page;p.landing.append(card);p.topics.set(id,{id,title,view,elements,enter});return view;}
function action(page,id,title,description,fn){const view=add(page,id,title,description,[]);const item=pages.get(page)?.topics.get(id);if(item)item.launch=fn;return view;}
function routeState(){return {rmTopics:1,page:current.page,topic:current.topic,dialog:dialogStack.at(-1)?.dialog.id||null};}
function remember(replace=false){if(restoring)return;const state={...history.state,...routeState()};try{history[replace?'replaceState':'pushState'](state,'',location.pathname+location.search+location.hash);}catch{}}
function show(page,topic){const p=pages.get(page);if(!p)return;const entry=p.topics.get(topic);p.landing.hidden=!!entry;p.back.hidden=!entry;p.heading.textContent=entry?.title||p.name;p.page.dataset.rmCurrentTopic=topic||'';for(const t of p.topics.values())t.view.hidden=t!==entry;if(entry){for(const n of entry.elements){if(n.parentElement!==entry.view)entry.view.append(n);for(const d of n.querySelectorAll(':scope>details.rm-compact-disclosure')){d.open=true;d.classList.add('rm-task-details');}if(n.tagName==='DETAILS')n.open=true;}if(entry.enter)entry.enter();}p.header.hidden=dialogStack.length>0;}
function go(page,topic=null,{replace=false,enter=true}={}){if(page==='mapa'&&['clientes','planejar'].includes(topic))window.RotaMapaMapScope='selection';if(!pages.has(page))return originalTab(page);if(dialogStack.length&&!closeAll())return;const launch=pages.get(page).topics.get(topic)?.launch;if(launch&&enter){current={page,topic:null};originalTab(page);show(page,null);remember(replace);launch();return;}current={page,topic};originalTab(page);show(page,topic);if(enter)remember(replace);$('rmMobileMenu')?.setAttribute('aria-expanded','false');document.body.classList.remove('rm-topic-menu-open');pages.get(page).heading.tabIndex=-1;pages.get(page).heading.focus({preventScroll:true});document.querySelector('body>main')?.scrollTo({top:0,behavior:'auto'});window.RotaMapaThemeContrast?.refresh(pages.get(page).root);}
function closeAll(force=false){const old=restoring;restoring=true;try{for(const item of [...dialogStack].reverse()){if(!force&&!item.dialog.dispatchEvent(new Event('cancel',{cancelable:true})))return false;item.dialog.close();unmount(item);}return true;}finally{restoring=old;}}
function unmount(item){const i=dialogStack.indexOf(item);if(i<0)return;dialogStack.splice(i,1);item.dialog.classList.remove('rm-task-dialog');item.anchor.replaceWith(item.dialog);item.stage.remove();const previous=dialogStack.at(-1);if(previous)previous.stage.hidden=false;else show(current.page,current.topic);if(!dialogStack.length)document.body.classList.remove('rm-task-open');}
function openDialog(dialog){if(dialog.open)return;const p=pages.get(current.page);if(!p)return HTMLDialogElement.prototype.showModal.call(dialog);const previous=dialogStack.at(-1);if(previous)previous.stage.hidden=true;else{p.header.hidden=true;p.landing.hidden=true;for(const t of p.topics.values())t.view.hidden=true;}const anchor=document.createComment('Return '+dialog.id),stage=make('section',null,'rm-task-stage');dialog.before(anchor);const back=button('← Voltar',()=>cancelDialog(dialog),'secondary rm-task-back');stage.append(back,dialog);p.content.append(stage);dialog.classList.add('rm-task-dialog');const item={dialog,anchor,stage,route:{...current}};dialogStack.push(item);document.body.classList.add('rm-task-open');HTMLDialogElement.prototype.show.call(dialog);remember();document.querySelector('body>main')?.scrollTo({top:0,behavior:'auto'});back.focus({preventScroll:true});}
function cancelDialog(dialog){const e=new Event('cancel',{cancelable:true});if(dialog.dispatchEvent(e))dialog.close();}
function registerDialog(id){const d=$(id);if(!d||d.tagName!=='DIALOG'||d.dataset.rmTaskRegistered)return;d.dataset.rmTaskRegistered='true';d.showModal=()=>openDialog(d);d.addEventListener('close',()=>{const item=dialogStack.find(x=>x.dialog===d);if(!item)return;const wasTop=dialogStack.at(-1)===item;unmount(item);if(wasTop&&!restoring&&history.state?.dialog===d.id)history.back();});}
function click(id){const b=$(id);if(b&&!b.disabled)b.click();}
function take(selector,root=document){return root.querySelector(selector);}
function initial(){if(initialized)return;initialized=true;originalTab=window.switchTab;
// Main sections retain their artwork, themes, permissions and existing inputs.
for(const [id,name]of [['painel','Painel'],['clientes','Clientes'],['mapa','Mapa e Rotas'],['agendamentos','Agendamentos'],['historico','Histórico'],['dados','Importar arquivos'],['links','Links úteis'],['promocoes','Comercial']])build(id,name);
build('ranking','Ranking',$('rankingContent'));build('feiraUnifarma','Feira Unifarma',$('fairWorkspace'));
const home=$('painel'),hero=take('.traxio-hero',home);if(hero){hero.classList.add('rm-topic-cover');home.prepend(hero);}
add('painel','carteira','Minha carteira','Clientes, cobertura e pontos a revisar.',[take('.dashboard-overview',home)]);
action('painel','planejar','Planejar minha rota','Escolher clientes e organizar as paradas.',()=>beginRouteSelection());
action('painel','agenda','Agenda de hoje','Consultar visitas e compromissos.',()=>go('agendamentos','agenda'));
action('painel','vendas','Vendas do mês','Consultar pedidos e faturamento.',()=>go('historico','vendas'));
add('painel','gerenciar','Gerenciar carteiras','Trocar, atualizar ou consultar versões.',['portfolioPanel']);
action('painel','sincronizacao','Sincronização','Conferir os dados deste aparelho.',()=>go('dados','sincronizacao'));
for(const n of [take('#fieldNextStep'),take('.quick-actions',home),$('agendaDashboard')])if(n)n.hidden=true;
const registry=take('.registry-card'),registryActions=take('.registry-title-actions'),registryFilters=$('registryFilters'),extra=$('fieldRegistryExtra');
add('clientes','lista','Consultar e selecionar clientes','Buscar lojas, selecionar e exportar PDF ou Excel.',[registryActions,registry]);
add('clientes','exportar','Selecionar e exportar','Marcar lojas e preparar PDF ou Excel.',[registryActions,registry]);
const filterView=add('clientes','filtros','Filtros de clientes','Cidade, bairros, prioridade e localização.',[registryFilters,extra]);
pages.get('clientes').landing.querySelector('[data-rm-open=filtros]').hidden=true;
if(filterView){const apply=button('Aplicar filtros',()=>go('clientes','lista'));filterView.append(apply);registryFilters.hidden=false;if(extra)extra.open=true;}
if($('registryFilterToggle'))$('registryFilterToggle').onclick=()=>go('clientes','filtros');
// Replace only the old filter visibility listener; retain every filtering input/handler.
if($('registryFilterToggle'))$('registryFilterToggle').addEventListener('click',()=>{registryFilters.hidden=false;go('clientes','filtros');});
action('clientes','novo','Cadastrar cliente','CNPJ, empresa, contato e endereço.',()=>registryActions?.querySelector('button')?.click());
add('clientes','cobertura','Cobertura de visitas','Clientes visitados e pendentes neste mês.',['portfolioVisitCoverage']);
action('clientes','localizacoes','Revisar localizações','Conferir os pontos que precisam de atenção.',()=>go('mapa','localizacoes'));
action('clientes','gerenciar','Gerenciar carteira','Atualizar, retirar clientes e consultar versões.',()=>go('painel','gerenciar'));
// Map: keep the real map, pin actions and navigation overlay; move lengthy tools away.
function beginRouteSelection(reset=true){window.RotaMapaMapScope='selection';if(window.TraxeloNavigation?.isTracking()){go('mapa');return;}click('clearRoute');$('origin').value='gps';$('origin').dispatchEvent(new Event('change'));if(reset)selectedIds.clear();syncRouteChoices();renderWorkspace();go('mapa','clientes');}
const map=$('mapa'),workspace=take('.workspace',map),mapPanel=take('.workspace-map',map);add('mapa','mapa','Mapa','Mapa da carteira e rota calculada.',[workspace]);
add('mapa','clientes','Selecionar clientes','Buscar lojas e filtrar cidade, bairros e prioridades.',['fieldMapControls'],()=>{if($('mapClientListDisclosure'))$('mapClientListDisclosure').open=true;});
add('mapa','planejar','Planejar rota','Origem, estratégia e ordem das paradas.',['routePlannerPanel']);
add('mapa','salvas','Rotas salvas','Consultar, salvar e retomar roteiros.',['fieldRouteLibrary']);
add('mapa','ferramentas','Mais ferramentas','Rotas por modo e buscas de localização.',['fieldMapOptions']);
add('mapa','localizacoes','Revisar localizações','Buscar por nome ou endereço e conferir pins.',['googleLocateClients','googleLocationFeedback','locationReview','clientLocationSearch']);
const providerFeedback=$('googleLocationFeedback');if(providerFeedback&&mapPanel){const mirror=make('p');mirror.id='rmMapLocationFeedback';mirror.setAttribute('role','status');mirror.setAttribute('aria-live','polite');mapPanel.prepend(mirror);const copyFeedback=()=>{mirror.textContent=providerFeedback.textContent;mirror.hidden=providerFeedback.hidden;};copyFeedback();new MutationObserver(copyFeedback).observe(providerFeedback,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['hidden']});}
// Keep the heading/context for the tool, rather than hiding the map controls themselves.
const mapActions=make('div',null,'rm-map-topic-actions');for(const [id,label]of [['clientes','Clientes'],['planejar','Planejar rota'],['salvas','Rotas salvas'],['ferramentas','Ferramentas']])mapActions.append(button(label,()=>id==='planejar'?beginRouteSelection(false):go('mapa',id),id==='planejar'?'':'secondary'));if(mapPanel)mapPanel.before(mapActions);
// Restore the sequential planning flow using the original strategy/origin controls.
const selectionView=pages.get('mapa').topics.get('clientes').view,filters=$('fieldMapControls');
if(filters&&$('regionPicker')){filters.prepend($('regionPicker'));$('regionPicker').open=true;}
const wizard=make('dialog',null,'detail-dialog commerce-dialog');wizard.id='routeSuggestionWizard';wizard.setAttribute('aria-labelledby','routeWizardTitle');
const title=make('h2','Como sugerir a rota?');title.id='routeWizardTitle';
const close=button('Fechar',()=>wizard.close(),'secondary');close.setAttribute('aria-label','Fechar sugestão de rota');
const strategyStep=make('section'),originStep=make('section');strategyStep.id='routeStrategyStep';originStep.id='routeOriginStep';originStep.hidden=true;
wizard.append(title,close,strategyStep,originStep);document.body.append(wizard);
strategyStep.append($('strategyPanel'));$('strategyPanel').hidden=false;
const advance=$('generateSuggestion');advance.textContent='Avançar: escolher origem';advance.onclick=()=>{strategyStep.hidden=true;originStep.hidden=false;title.textContent='De onde você quer sair?';$('origin').focus();};
const originField=$('origin').closest('.field');originStep.append(originField);
const originNote=make('p','A permissão de localização é controlada pelo navegador e pelo sistema do aparelho.');originStep.append(originNote);
const originBack=button('Voltar aos critérios',()=>{originStep.hidden=true;strategyStep.hidden=false;title.textContent='Como sugerir a rota?';});
const calculate=button('Confirmar origem e calcular rota',()=>{wizard.close();go('mapa','planejar');click('calcRoute');});calculate.id='routeWizardCalculate';originStep.append(originBack,calculate);
$('origin').value='gps';$('origin').dispatchEvent(new Event('change'));
const suggest=$('suggestToggle');selectionView.append(suggest);suggest.textContent='Sugerir rota';suggest.onclick=null;
suggest.addEventListener('click',e=>{e.stopImmediatePropagation();if(!selectedIds.size){window.alert('Selecione pelo menos um cliente para sugerir a rota.');return;}originStep.prepend(originField);resumeOrigin.hidden=true;strategyStep.hidden=false;originStep.hidden=true;title.textContent='Como sugerir a rota?';wizard.showModal();},true);
window.addEventListener('rotamapa:commerce-scope-changed',()=>{if(wizard.open)wizard.close();});
const resumeOrigin=button('Continuar planejamento',()=>{originStep.prepend(originField);resumeOrigin.hidden=true;wizard.showModal();});resumeOrigin.id='routeResumeOrigin';resumeOrigin.hidden=true;mapActions.append(resumeOrigin);
$('pickRouteOrigin').addEventListener('click',()=>{wizard.close();go('mapa');mapPanel.prepend(originField);resumeOrigin.hidden=false;});

const oldShow=show;show=function(page,topic){if(page==='mapa'&&!topic)topic='mapa';oldShow(page,topic);if(page==='mapa'){if(typeof renderMarkers==='function')renderMarkers();const p=pages.get(page);p.landing.hidden=true;const t=p.topics.get(topic);p.heading.textContent=topic==='mapa'?'Mapa e Rotas':t?.title||'Mapa e Rotas';p.back.hidden=topic==='mapa';if(topic==='mapa')setTimeout(()=>window.dispatchEvent(new Event('resize')),30);}};
if($('openSavedRoutes'))$('openSavedRoutes').addEventListener('click',()=>go('mapa','salvas'));
if($('plannerState'))new MutationObserver(()=>{if(current.page==='mapa'&&current.topic==='planejar'&&typeof lastRoute!=='undefined'&&lastRoute&&/Rota (parcialmente )?calculada/.test($('plannerState').textContent))go('mapa');}).observe($('plannerState'),{childList:true,characterData:true,subtree:true});
const lookupButton=button('Buscar ou revisar localizações',()=>go('mapa','localizacoes'),'secondary');pages.get('mapa').topics.get('ferramentas').view.prepend(lookupButton);
const oldReveal=window.RotaMapaFieldUI?.reveal;if(oldReveal)window.RotaMapaFieldUI.reveal=node=>{const view=node?.closest('.rm-topic-view');if(view){const owner=view.closest('.tab');if(owner)go(owner.id,view.dataset.rmTopic);}oldReveal(node);};
// Scheduling.
const appointmentTabs=take('.appointment-tabs');if(appointmentTabs)appointmentTabs.hidden=true;
add('agendamentos','agenda','Minha agenda','Consultar compromissos e preparar a rota do dia.',['appointmentListPanel','appointmentStatus'],()=>{click('appointmentListTab');});
add('agendamentos','novo','Novo agendamento','Escolher cliente, data, horário e lembrete.',['appointmentNewPanel'],()=>click('appointmentNewTab'));
add('agendamentos','filtros','Filtros e sincronização','Ajustar a consulta dos compromissos.',['fieldAgendaSettings']);
if($('fieldNewAppointment'))$('fieldNewAppointment').onclick=()=>go('agendamentos','novo');
const agendaFilter=button('Filtros',()=>go('agendamentos','filtros'),'secondary');$('appointmentListPanel')?.prepend(agendaFilter);
// History separates visits, sales, billing and projections.
add('historico','visitas','Visitas realizadas','Cobertura mensal e evolução dos atendimentos.',['visitReportPanel']);
add('historico','vendas','Vendas registradas','Pedidos e faturamento por período.',['field-commerceReport']);
add('historico','faturamento','Conferir faturamento','Resolver os pedidos que aguardam conferência.',['field-billingPanel']);
action('historico','compras','Compras por cliente','Consultar pedidos e produtos de cada loja.',()=>click('openCommerceHistory'));
add('historico','metas','Metas e preferências','Calendário, metas e configurações do relatório.',['fieldReportSettings']);
add('historico','evolucao','Evolução da carteira','Analisar resultados e projeções.',['field-proInsights']);
add('historico','registros','Registros de atendimento','Consultar registros anteriores e detalhes.',[take('.traxio-history')]);
$('visitReportPanel')?.append(button('Metas e preferências',()=>go('historico','metas'),'secondary'));
// File center: one type of upload per page.
for(const [id,title,description,node]of [['clientes','Clientes e carteiras','Incluir, atualizar ou retirar CNPJs.','fileImportClients'],['bussola','Vendas do Bússola','Conferir pedidos e valores do CSV.','fileImportSales'],['pedidos','Pedidos de clientes','Planilha, Word, foto ou PDF Mercado Farma.','fileImportOrders'],['catalogos','Catálogos e produtos','Guardar PDFs e consultar produtos.','fileImportCatalogs'],['promocoes','Promoções e tabelas','Condições de campanhas e caixas padrão.','fileImportCommercial'],['comissoes','Documentos de comissão','Importar e conferir regras da carteira.','fileImportCommissions'],['sincronizacao','Sincronização','Dados locais e envios pendentes.','fieldDataSync'],['manutencao','Backup e manutenção','Cópias de segurança e ferramentas de dados.','fieldDataCenter']])add('dados',id,title,description,[node]);
add('dados','ferramentas','Ferramentas da carteira','Backup e ferramentas adicionais.',[take('#dados .data-tools')]);
if($('fileImportPortfolio'))pages.get('dados').header.append($('fileImportPortfolio'));if($('fileImportStatus'))pages.get('dados').root.append($('fileImportStatus'));if($('fileImportHub'))$('fileImportHub').hidden=true;if($('fieldCommerceTools'))$('fieldCommerceTools').hidden=true;
// Commercial entry cards hand off to the original catalog/calculator/campaign dialogs.
action('promocoes','pedidos','Pedidos','Montar pedidos ou registrar uma venda.',()=>window.RotaMapaSales?.openSale());
action('promocoes','modelo-pedido','Exemplo de planilha de pedidos','Baixar Excel com produtos, EAN e quantidade em branco.',()=>window.RotaMapaOrderExcel.template());
action('promocoes','catalogo','Catálogo e preços','Consultar ou cadastrar produtos.',()=>click('openCommerceCatalog'));
action('promocoes','campanhas','Campanhas','Dia D, Acelera e condições anteriores.',()=>click('openCommerceCampaigns'));
add('promocoes','materiais','Material de divulgação','Cards, listas e textos por data.',['commercialMaterials']);
add('promocoes','comissoes','Projeção de comissões','Regras e valores faturados da carteira.',['commercialCommissions']);
action('promocoes','notas','Bloco de notas','Anotações com cálculos automáticos.',()=>take('#commercialNotes button')?.click());
add('promocoes','consultas','Consultas e documentos','Caixas padrão e biblioteca comercial.',['commercialConsultations']);
for(const n of [$('commercialCampaigns'),$('commercialNotes'),$('openUnifarmaFair')])if(n)n.hidden=true;
// Useful links.
add('links','atalhos','Meus atalhos','Sistemas e sites da empresa e distribuidoras.',['usefulCards',take('#links .useful-section-heading'),'usefulStatus','usefulSync']);
add('links','empresa','Empresa da carteira','Escolher a empresa e seus links disponíveis.',[take('#links .useful-company')]);
add('links','ajuda','Como organizar meus links','Orientações para criar e manter seus atalhos.',[take('#links .useful-welcome'),take('#links .useful-help')]);
const rankNodes=[...$('rankingContent')?.children||[]].filter(n=>!n.classList.contains('rm-topic-heading')&&!n.classList.contains('rm-topic-grid')&&!n.classList.contains('rm-topic-content'));
add('ranking','clientes','Ranking de clientes','Classificação por faturamento confirmado.',rankNodes,()=>click('rankingModeClients'));
add('ranking','produtos','Ranking de produtos','Produtos e unidades efetivamente faturados.',rankNodes,()=>click('rankingModeProducts'));
const fairContext=take('#fairWorkspace .fair-edition-tools');if(fairContext)$('fairWorkspace').prepend(fairContext);
for(const [id,title,description,panel,tab]of [['ofertas','Ofertas da edição','Produtos, condições e material da feira.','fairOffers','offers'],['vendas','Pedidos da feira','Montar, vincular, editar e conferir.','fairSales','sales'],['participantes','Participantes','Consultar rede e convidados.','fairPeoplePanel','people'],['ranking','Ranking da feira','Faturamento dos pedidos vinculados.','fairRanking','ranking']])add('feiraUnifarma',id,title,description,[panel],()=>take('[data-fair-tab='+tab+']')?.click());
add('feiraUnifarma','resumo','Resumo da edição','Indicadores e período da feira.',[take('#fairWorkspace .fair-metrics'),'fairPeriod']);
const fairTabs=take('.fair-tabs');if(fairTabs)fairTabs.hidden=true;
// Visible account/portfolio context stays compact; no extra data is persisted by this layer.
for(const p of pages.values()){const hero=take(':scope>.tab-title',p.page);if(hero){hero.classList.add('rm-topic-cover');p.page.prepend(hero);}}
const contextButtons=[];for(const p of pages.values()){const b=button('',()=>go('painel','gerenciar'),'secondary rm-topic-context');p.header.append(b);contextButtons.push(b);}const refreshContext=()=>{const name=$('activePortfolioName')?.textContent.trim()||'Carteira atual';for(const b of contextButtons)b.textContent='Carteira · '+name;};refreshContext();if($('activePortfolioName'))new MutationObserver(refreshContext).observe($('activePortfolioName'),{childList:true,characterData:true,subtree:true});
const ids=['clientEditDialog','commerceCatalogDialog','commerceProductDialog','commerceCampaignList','commerceCampaignDialog','commerceSaleDialog','commerceHistoryDialog','pdfEditOrder','bussolaImportDialog','centralImportDialog','centralQuoteDialog','notesDialog','showroomGallery','showroomDialog','clientExportDialog','campaignReuseDialog','commercePdfDialog','orderDraftImport','centralImportDialog','portfolioUpdateDialog','portfolioExcludeDialog','portfolioVersionsDialog','portfolioDialog','portfolioNameDialog','manualBillingDialog','billingOrdersDialog','billingReviewDialog','fairEditionDialog','fairLinkDialog','orderReconcileDialog','commercialMaterialDialog','visitEntryDialog','visitDetailsDialog','usefulLinkDialog','usefulCompanyDialog','rankingFullDialog','rankingBuyerDialog','rankingProductDialog'];ids.forEach(registerDialog);
window.switchTab=id=>{if(id==='rotas')id='mapa';go(id,null);};
// Existing links that target a function must open its topic, rather than a hidden landing.
for(const [id,page,topic]of [['billingReminder','historico','faturamento'],['coverageShowMissing','clientes','lista'],['allClientsShortcut','clientes','lista'],['locatedShortcut','clientes','lista'],['pendingShortcut','clientes','lista'],['reviewSavedLocations','mapa','localizacoes'],['registryPlan','mapa','planejar'],['appointmentGenerateRoute','mapa','mapa'],['dashboardOpenRoutes','agendamentos','agenda']])$(id)?.addEventListener('click',()=>{if(!dialogStack.length)go(page,topic);});
const nav=$('rmMobileMenu')||button('Menu',()=>{const open=document.body.classList.toggle('rm-topic-menu-open');nav.setAttribute('aria-expanded',String(open));},'secondary rm-topic-mobile');nav.id='rmMobileMenu';nav.setAttribute('aria-controls','rmTopicsSidebar');nav.setAttribute('aria-expanded','false');const sidebar=take('body>nav.tabs');if(sidebar)sidebar.id='rmTopicsSidebar';take('body>header')?.prepend(nav);
window.addEventListener('popstate',event=>{const s=event.state;if(!s?.rmTopics)return;restoring=true;try{while(dialogStack.length&&dialogStack.at(-1).dialog.id!==s.dialog){const last=dialogStack.at(-1);if(!last.dialog.dispatchEvent(new Event('cancel',{cancelable:true}))){history.forward();return;}last.dialog.close();unmount(last);}if(!dialogStack.length){current={page:s.page,topic:s.topic};originalTab(current.page);show(current.page,current.topic);}}finally{restoring=false;}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialogStack.length&&!document.querySelector('dialog:modal')&&(!$('accountDialog')||$('accountDialog').hidden)){e.preventDefault();cancelDialog(dialogStack.at(-1).dialog);}});
new MutationObserver(()=>{if(document.body.classList.contains('auth-locked')){if(wizard.open)wizard.close();closeAll(true);for(const p of pages.values())show(p.id,null);current={page:'painel',topic:null};remember(true);}}).observe(document.body,{attributes:true,attributeFilter:['class']});
document.body.classList.add('rm-topics-ready');current={page:document.querySelector('main>.tab.active')?.id||'painel',topic:null};show(current.page,null);remember(true);
window.RotaMapaTopics={go,current:()=>({...current}),registerDialog,version:1};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initial,{once:true});else initial();
})();
