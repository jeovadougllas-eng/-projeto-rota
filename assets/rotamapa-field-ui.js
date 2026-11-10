/* Foco em campo: presentation only. Existing controls, records and handlers stay authoritative. */
document.addEventListener('DOMContentLoaded',()=>{
 'use strict';
 const $=id=>document.getElementById(id),make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 const paths={
  case:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12a23 23 0 0 0 18 0M10 12v3h4v-3"/>',
  link:'<path d="m9 15 6-6m-8 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1"/>',
  trophy:'<path d="M8 3h8v5a4 4 0 0 1-8 0V3ZM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 12v6m-5 3h10m-8 0v-3h6v3"/>',
  home:'<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z"/>',
  people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/>',
  pin:'<path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2.5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h2m4 0h2m-8 4h2"/>',
  history:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2M3 4v4h4"/>',
  cloud:'<path d="M6 19a5 5 0 1 1 0-10 7 7 0 0 1 13-1 5 5 0 0 1 0 11M12 21V11m-4 4 4-4 4 4"/>',
  route:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h8M19 3v4M3 17v4"/>',
  map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15"/>',
  sync:'<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
  arrow:'<path d="m9 5 7 7-7 7"/>',
  check:'<path d="m5 12 4 4L20 5"/>',
  revisit:'<path d="M4 9a8 8 0 1 1 1 10M4 3v6h6"/>',
  store:'<path d="M3 10h18l-2-7H5l-2 7Zm1 0v11h16V10M9 21v-7h6v7"/>',
  sale:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M8 15h3m5-12v4M8 3v4"/>',
  download:'<path d="M12 3v13m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  alert:'<path d="m12 3 10 18H2L12 3Zm0 6v5m0 3h.01"/>'
  ,chart:'<path d="M3 3v18h18M7 17v-5m5 5V8m5 9V5"/>',fit:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',locate:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>'
 };
 const icon=name=>{const n=document.createElementNS('http://www.w3.org/2000/svg','svg');n.setAttribute('viewBox','0 0 24 24');n.setAttribute('aria-hidden','true');n.classList.add('field-icon');n.innerHTML=paths[name]||paths.pin;return n;};
 function action(label,fn,name,cls='secondary'){const b=make('button',cls);b.type='button';b.append(icon(name),make('span',null,label));b.addEventListener('click',fn);return b;}
 function disclosure(label,id,...nodes){const d=make('details','field-disclosure');if(id)d.id=id;d.append(make('summary',null,label),...nodes.filter(Boolean));return d;}
 function reveal(node){for(let p=node?.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;node?.scrollIntoView({block:'nearest',behavior:'smooth'});}
 function observe(target,fn,options={childList:true,subtree:true}){if(target)new MutationObserver(fn).observe(target,options);}
 function sceneTitle(page,scene){const title=page.querySelector(':scope>.tab-title');if(!title)return;title.classList.add('field-page-hero');const image=make('img','field-hero-image');image.src='assets/scenes/'+scene+'.webp';image.alt='';image.width=1024;image.height=1536;image.decoding='async';title.prepend(image);}

 document.body.classList.add('rm-field');
 const navNames={painel:'home',clientes:'people',mapa:'pin',agendamentos:'calendar',historico:'history',ranking:'trophy',links:'link',promocoes:'case',dados:'cloud'};
 document.querySelectorAll('.tabs>button>svg').forEach(svg=>{svg.innerHTML=paths[navNames[svg.parentElement.dataset.tab]]||paths.pin;});
 for(const [tab,scene]of Object.entries({clientes:'clientes',mapa:'mapa',agendamentos:'agendamentos',historico:'historico',ranking:'ranking',links:'links',promocoes:'comercial',dados:'dados'}))sceneTitle($(tab),scene);

 // Dashboard: illustration, compact account-scoped portfolio, next action, then the metrics.
 const home=$('painel'),hero=home.querySelector('.traxio-hero'),overview=home.querySelector('.dashboard-overview'),quick=home.querySelector('.quick-actions');
 const heroImage=make('img','field-hero-image');heroImage.src='assets/scenes/painel.webp';heroImage.alt='';heroImage.width=1024;heroImage.height=1536;hero.prepend(heroImage);
 const portfolio=$('portfolioPanel'),portfolioName=portfolio.querySelector(':scope>div'),portfolioVersion=$('activePortfolioVersion'),switchRow=make('div','field-portfolio-switch');
 switchRow.append(portfolioName,$('choosePortfolio'));
 const portfolioMore=disclosure('Gerenciar carteira','fieldPortfolioManagement',$('updatePortfolio'),$('portfolioVersions'),portfolioVersion,$('portfolioStatus'),$('usefulPortfolioCompany'));
 portfolio.replaceChildren(switchRow,portfolioMore);
 const next=make('section','field-next-step');next.id='fieldNextStep';next.append(make('h3',null,'Seu próximo passo'));
 const quickButtons=[...quick.querySelectorAll('button')],primary=quickButtons[0];
 quickButtons.forEach((b,i)=>{b.querySelector('.kit-quick-icon')?.replaceWith(icon(['route','map','cloud','sync'][i]));b.querySelector('.action-chevron')?.replaceWith(icon('arrow'));});
 primary.classList.add('field-primary-action');next.append(primary);
 home.prepend(hero,portfolio,next,overview,quick);
 $('reviewSavedLocations').textContent='Revisar pontos';$('locationRecovery').prepend(icon('alert'));
 const agenda=$('agendaDashboard');if(agenda){agenda.classList.add('field-agenda-shortcut');agenda.querySelector('h2')?.prepend(icon('calendar'));}

 // Registry retains its real table semantics and the CNPJ directly under each legal name.
 $('registrySearch').placeholder='Nome ou CNPJ';
 const extraFilters=disclosure('Mais filtros','fieldRegistryExtra',$('registryCategory'),$('registryClear'));
 $('registryFilters').append($('registryLocation'));$('registryFilters').after(extraFilters);$('registryLocation').options[0].text='Localização';
 function decorateClients(){
  for(const row of $('registryRows').rows){
   const cells=[...row.cells];if(cells.length<3||row.hasAttribute('data-field-card'))return;
   row.dataset.fieldCard='';const point=cells[1].querySelector('.registry-location-status'),location=make('small','field-client-region',cells[2].textContent.trim());
   if(point)cells[1].insertBefore(location,point);else cells[1].append(location);
   if(point)point.dataset.ready=String(point.textContent==='Localização confirmada');
   const check=cells[0].querySelector('input[type=checkbox]');if(check){const label=make('label','field-client-select');label.append(check);cells[0].append(label);}
  }
 }
 observe($('registryRows'),decorateClients);decorateClients();
 const selectAll=$('registrySelectAll'),selectAllLabel=make('label','field-client-select');selectAll.before(selectAllLabel);selectAllLabel.append(selectAll);

 // Map filters precede their result list. The live map and its existing pin actions take priority.
 const mapPage=$('mapa'),mapTitle=mapPage.querySelector('.tab-title'),workspace=mapPage.querySelector('.workspace'),planner=$('routePlannerPanel'),side=mapPage.querySelector('.workspace-side'),mapPanel=mapPage.querySelector('.workspace-map');
 document.querySelector('#priorityFilters [data-priority-filter=all]').textContent='Todas';
 const list=$('mapClientListDisclosure'),filters=make('section','field-map-controls');filters.id='fieldMapControls';filters.setAttribute('aria-label','Filtros de clientes no mapa');
 const mapSearch=$('mapClientSearch');filters.append($('priorityFilters'),list,$('regionPicker'));
 const selection=make('div','field-map-selection');selection.append($('selectAllClients'),$('selectNoClients'),$('selectEntirePortfolio'));
 list.querySelector('summary').after(mapSearch,selection);
 mapTitle.after(filters);workspace.prepend(mapPanel);planner.open=false;
 const modes=mapPage.querySelector('.route-mode-tabs'),modePanel=$('routeModePanel');
 const mapMore=disclosure('Mais opções do mapa','fieldMapOptions',modes,modePanel,$('clientLocationSearch'));
 workspace.after(mapMore);$('clientLocationSearch').open=false;
 const dock=$('routeActionBar');dock.classList.add('field-map-actions');mapPanel.append(dock);
 const toolbar=make('div','field-map-toolbar'),mapTools=mapPanel.querySelector(':scope>.row');
 toolbar.append(mapPanel.querySelector('.map-layer-switch'),mapTools);$('map').before(toolbar);
 for(const [id,name]of [['fitBtn','fit'],['myLocation','locate']]){const b=$(id),label=b.textContent;b.setAttribute('aria-label',label);b.title=label;b.replaceChildren(icon(name));}
 const calculate=$('calcRoute');mapPage.querySelector('.planner-main').prepend(calculate);
 dock.append($('openSavedRoutes'));$('openSavedRoutes').textContent='Rotas salvas';
 $('suggestToggle').addEventListener('click',()=>{if(!$('strategyPanel').hidden){planner.open=true;reveal($('strategyPanel'));}});
 primary.addEventListener('click',()=>{list.open=true;planner.open=true;reveal(filters);});
 const library=$('savedRoutesPanel'),libraryDetails=disclosure('Minhas rotas salvas','fieldRouteLibrary',library);mapMore.after(libraryDetails);
 $('openSavedRoutes').addEventListener('click',()=>{libraryDetails.open=true;reveal(library);});
 // Controls remain reachable when an existing workflow opens the planner programmatically.
 side.querySelector('.approved-trace-route')?.addEventListener('click',()=>{planner.open=true;});
 $('focusedClientNavigate').prepend(icon('route'));$('focusedClientAdjust').prepend(icon('pin'));

 // History starts with visit coverage. Sales, billing and projections keep their existing tools.
 const history=$('historico'),report=$('visitReportPanel');history.querySelector('.tab-title').after(report);
 const reportSettings=disclosure('Meta, calendário e preferências','fieldReportSettings');
 const controls=report.querySelector('.visit-report-controls');
 for(const label of [...controls.children].slice(1))reportSettings.append(label);
 const calendar=report.querySelector(':scope>details');if(calendar)reportSettings.append(calendar);
 const metrics=$('visitMetrics'),forecastToggle=action('Ver projeções e metas',()=>{const show=!metrics.classList.contains('field-show-all');metrics.classList.toggle('field-show-all',show);forecastToggle.setAttribute('aria-expanded',String(show));},'chart');
 forecastToggle.id='fieldForecastToggle';forecastToggle.setAttribute('aria-expanded','false');forecastToggle.setAttribute('aria-controls','visitMetrics');metrics.after(forecastToggle);
 const historyActions=make('div','field-history-actions');historyActions.id='fieldHistoryActions';
 $('exportVisitWorkbook').textContent='Exportar Excel';$('exportVisitWorkbook').classList.add('secondary');$('exportVisitWorkbook').prepend(icon('download'));
 historyActions.append(action('Registrar venda',()=>window.RotaMapaSales.openSale(),'sale','field-primary-action'),$('exportVisitWorkbook'));
 $('visitDailyChart').after(historyActions);
 for(const id of ['newVisit','backupVisits','syncVisits','saveVisitPreferences'])reportSettings.append($(id));
 reportSettings.append($('visitForecastNote'));historyActions.after(reportSettings);
 reportSettings.prepend(forecastToggle);reportSettings.after($('visitSyncStatus'),$('visitFeedback'));
 for(const [id,label]of [['billingPanel','Conferência de faturamento'],['commerceReport','Vendas registradas'],['proInsights','Evolução da carteira']]){const section=$(id);if(section){const d=disclosure(label,'field-'+id,section);history.append(d);}}
 function barChart(){
  const model=window.TraxeloVisits?.getModel();if(!model)return;
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 600 218');svg.setAttribute('role','img');svg.setAttribute('aria-label','Visitas realizadas por dia no mês');
  const add=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!=null)n.textContent=text;svg.append(n);return n;};
  add('title',{},'Visitas por dia');const rows=model.daily||[],max=Math.max(4,Math.ceil(Math.max(0,...rows.map(r=>r.visits||0))/4)*4),step=540/Math.max(1,rows.length),base=180;
  for(let i=0;i<=4;i++){const y=base-i*38;add('path',{d:'M38 '+y+'H585',class:'field-chart-grid'});add('text',{x:2,y:y+5,class:'field-chart-tick'},Number((max*i/4).toFixed(1)));}
  rows.forEach((r,i)=>{const count=r.visits||0,height=count/max*152,x=40+i*step;const rect=add('rect',{x,y:base-height,width:Math.max(2,step-4),height:Math.max(0,height),rx:2,class:'field-chart-bar'});const title=document.createElementNS(ns,'title');title.textContent=r.date+': '+count+' visita(s)';rect.append(title);if(i===0||i===rows.length-1||(i+1)%5===0)add('text',{x:x+step/2,y:204,'text-anchor':'middle',class:'field-chart-tick'},String(i+1).padStart(2,'0'));});
  const target=$('visitDailyChart');target.replaceChildren(make('h3',null,'Visitas por dia'),svg);if(!rows.some(r=>r.visits))target.append(make('p','field-chart-empty','As visitas confirmadas aparecerão aqui.'));
 }
 window.addEventListener('rotamapa:visit-report-rendered',barChart);barChart();

 // A first-class upload surface still hands off to the existing named-portfolio confirmation.
 const data=$('dados'),importBlock=$('sheetFile').closest('.traxio-data-block');importBlock.id='fieldImportPanel';
 data.querySelector('.tab-title').after(importBlock);
 const upload=make('label','field-upload');upload.htmlFor='sheetFile';upload.append(icon('cloud'),make('strong',null,'Selecionar planilha'),make('small',null,'Excel ou CSV'));
 $('sheetFile').classList.add('field-file-input');upload.append($('sheetFile'));importBlock.prepend(upload);
 const importLabel=make('label','field-import-name','Nome da carteira'),importName=make('input');importName.id='fieldImportName';importName.maxLength=80;importName.placeholder='Ex.: EMS • Natal';importName.autocomplete='off';importLabel.append(importName);upload.after(importLabel);
 const steps=make('ol','field-import-steps');steps.setAttribute('aria-label','Etapas da importação');for(const label of ['Enviar','Conferir','Importar'])steps.append(make('li',null,label));importLabel.after(steps);
 const originalBegin=window.RotaMapaPortfolios.beginImport;window.RotaMapaPortfolios.beginImport=payload=>{const value=originalBegin(payload);const name=importName.value.trim();if(name)$('portfolioName').value=name;return value;};
 const importContext=make('div','field-import-context'),importPortfolio=action('',()=>$('choosePortfolio').click(),'arrow');importPortfolio.id='fieldImportPortfolio';importContext.append(importPortfolio);upload.before(importContext);
 const importActions=make('div','field-import-actions');
 const syncBlock=data.querySelector('.traxio-data-primary'),syncDetails=disclosure('Estado da sincronização','fieldDataSync',syncBlock);
 const backup=[...data.querySelectorAll('.traxio-data-expand')].find(n=>/Backup/.test(n.querySelector('summary')?.textContent));
 importActions.append(action('Atualizar carteira',()=>$('updatePortfolio').click(),'sync'),action('Sincronizar dados',()=>{syncDetails.open=true;reveal(syncBlock);$('cloudCheck').click();},'sync'),action('Backup',()=>{if(backup){backup.open=true;reveal(backup);}},'download'));
 steps.after(importActions);importBlock.after(syncDetails);
 const imported=make('p','field-import-count');importActions.after(imported);
 const tools=data.querySelector('.data-tools');if(tools)syncDetails.after(tools);
 const center=data.querySelector('.traxio-data-center');if(center)data.append(disclosure('Central de dados','fieldDataCenter',center));
 if($('commercePanel'))data.append(disclosure('Vendas, catálogo e campanhas','fieldCommerceTools',$('commercePanel')));
 function context(){const name=$('activePortfolioName').textContent;const span=importPortfolio.querySelector('span');if(span.textContent!==name)span.textContent=name;const text=clients.length+' cliente(s) nesta carteira';if(imported.textContent!==text)imported.textContent=text;}
 observe($('activePortfolioName'),context);observe($('registryCount'),context);context();
 observe($('portfolioNameDialog'),()=>{const pending=$('portfolioNameDialog').open&&$('portfolioImportNote').textContent.startsWith('Planilha:');steps.children[0].classList.toggle('field-step-current',!pending);steps.children[1].classList.toggle('field-step-current',pending);},{attributes:true,attributeFilter:['open']});steps.children[0].classList.add('field-step-current');
 // The agenda keeps its existing create/list workflow, with a timeline for the list.
 const appointmentList=$('appointmentList'),listPanel=$('appointmentListPanel'),week=make('div','field-agenda-week');
 week.setAttribute('aria-label','Escolher dia dos agendamentos');
 const weekMonth=make('p','field-agenda-month'),weekBox=make('div','field-agenda-calendar');weekBox.append(weekMonth,week);listPanel.prepend(weekBox);
 const agendaFields=listPanel.querySelector('.appointment-fields'),agendaLegend=listPanel.querySelector(':scope>p'),agendaSync=$('appointmentSync');
 const agendaSettings=disclosure('Filtros e sincronização','fieldAgendaSettings',agendaFields,agendaLegend,agendaSync);listPanel.append(agendaSettings);
 const scheduledRoute=listPanel.querySelector('.appointment-route'),routeSettings=disclosure('Critério e horário da rota','fieldAppointmentRouteSettings');
 for(const child of [...scheduledRoute.children])if(child.id!=='appointmentGenerateRoute')routeSettings.append(child);
 scheduledRoute.prepend($('appointmentSelectDay'));scheduledRoute.append(routeSettings);
 function drawWeek(){
  const date=$('appointmentFilterDate').value||TraxeloVisitsModel.day(new Date(),'America/Fortaleza'),at=new Date(date+'T12:00:00Z');
  weekMonth.textContent=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'}).format(at);week.replaceChildren();
  for(let offset=-2;offset<=2;offset++){const d=new Date(at);d.setUTCDate(d.getUTCDate()+offset);const key=d.toISOString().slice(0,10),b=make('button','secondary');b.type='button';b.append(make('small',null,new Intl.DateTimeFormat('pt-BR',{weekday:'short',timeZone:'UTC'}).format(d).replace('.','')),make('strong',null,String(d.getUTCDate()).padStart(2,'0')));b.setAttribute('aria-label',new Intl.DateTimeFormat('pt-BR',{dateStyle:'full',timeZone:'UTC'}).format(d));b.setAttribute('aria-pressed',String(key===date&&!$('appointmentAllDates').checked));b.addEventListener('click',()=>{$('appointmentFilterDate').value=key;$('appointmentFilterDate').dispatchEvent(new Event('change',{bubbles:true}));});week.append(b);}
 }
 $('appointmentFilterDate').addEventListener('change',drawWeek);$('appointmentAllDates').addEventListener('change',drawWeek);drawWeek();
 function decorateAppointments(){for(const card of appointmentList.querySelectorAll('.appointment-item')){if(card.hasAttribute('data-field-timeline'))continue;card.dataset.fieldTimeline='';const time=card.querySelector('.appointment-date')?.textContent.match(/\b\d{2}:\d{2}\b/)?.[0];if(time)card.prepend(make('strong','field-appointment-time',time));const more=disclosure('Opções da visita',null,card.querySelector('.row'));card.append(more);}}
 observe(appointmentList,decorateAppointments);decorateAppointments();
 $('appointmentGenerateRoute').classList.add('field-primary-action');$('appointmentGenerateRoute').replaceChildren(icon('route'),make('span',null,'Gerar rota do dia'));
 const newAppointment=action('Novo agendamento',()=>{$('appointmentNewTab').click();reveal($('appointmentNewPanel'));},'calendar');newAppointment.id='fieldNewAppointment';$('appointmentGenerateRoute').after(newAppointment);
 $('appointmentListTab').click();
 window.RotaMapaFieldUI={version:1,reveal};
});
