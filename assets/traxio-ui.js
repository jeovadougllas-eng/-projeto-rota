/* Presentation adapter. Existing auth, client records, sync, imports and routing remain authoritative. */
'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const el = id => document.getElementById(id);
  const icon = (name, className = 'ui-icon') => {
    const paths = {
      search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
      mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
      lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
      eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      pin:'<path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2.5"/>',
      chart:'<path d="M3 21h19M5 17v-5h3v5M11 17V8h3v9M17 17V3h3v14M4 8l6-4 5 1 5-4"/>',
      clients:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2"/>',
      pending:'<path d="M8 4H5a2 2 0 0 0-2 2v14h10M9 3h6v5H9zM15 5h4v6"/><circle cx="17" cy="17" r="5"/><path d="M17 14v3l2 1"/>',
      map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15"/>',
      upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 14v7h16v-7"/>',
      sync:'<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
      filter:'<path d="M3 4h18l-7 8v7l-4 2v-9L3 4Z"/>',
      arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
      sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
      moon:'<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
      database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 4 16 4 16 0V5M4 12v7c0 4 16 4 16 0v-7"/>',
      cloud:'<path d="M6 19a5 5 0 1 1 0-10 7 7 0 0 1 13-1 5 5 0 0 1 0 11M12 21V11m-4 4 4-4 4 4"/>'
    };
    return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.pin}</svg>`;
  };
  const brand = className => `<span class="brand-crop ${className || ''}"><img src="assets/approved-mockup.jpg" alt="Traxio — Planeje melhor. Vá mais longe." width="1280" height="853"></span>`;
  const node = (tag, className, text) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const button = (text, action, className = 'secondary') => {
    const b = node('button', className, text); b.type = 'button'; b.addEventListener('click', action); return b;
  };
  const title = (heading, description) => {
    const box = node('div', 'tab-title'); box.append(node('h2', '', heading), node('p', '', description)); return box;
  };

  // Login uses the existing forms and their original event handlers.
  const authBrand = node('div', 'auth-brand-panel');
  authBrand.innerHTML = brand() + `<div class="auth-features"><div class="auth-feature">${icon('pin')}<span>Organize<br>sua carteira</span></div><div class="auth-feature">${icon('chart')}<span>Otimize<br>seus trajetos</span></div><div class="auth-feature">${icon('chart')}<span>Conquiste<br>mais resultados</span></div></div>`;
  el('authScreen').prepend(authBrand);
  const approvedScene = node('div','auth-approved-scene'); approvedScene.setAttribute('aria-hidden','true');
  approvedScene.innerHTML='<img src="assets/approved-mockup.jpg" alt="" width="1280" height="853">';
  el('authScreen').prepend(approvedScene);
  const authPanel = document.querySelector('.auth-panel');
  const authHeading = node('div', 'auth-heading');
  authHeading.innerHTML = '<h1>Acesse sua conta</h1><p>Entre para planejar suas rotas e gerenciar sua carteira.</p>';
  authPanel.insertBefore(authHeading, el('authMessage'));
  const form = el('authForm');
  for (const [id, name, placeholder] of [['authEmail','mail','Seu e-mail'], ['authPassword','lock','Sua senha']]) {
    const input = el(id), label = form.querySelector(`label[for="${id}"]`), wrapper = node('div','auth-input');
    input.placeholder = placeholder;
    input.before(wrapper); wrapper.innerHTML = icon(name); wrapper.append(label, input);
    if (id === 'authPassword') {
      const toggle = button('', () => {
        const show = input.type === 'password'; input.type = show ? 'text' : 'password';
        toggle.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
        toggle.setAttribute('aria-pressed', String(show));
      }, 'password-toggle');
      toggle.innerHTML = icon('eye'); toggle.setAttribute('aria-label','Mostrar senha'); toggle.setAttribute('aria-pressed','false'); wrapper.append(toggle);
    }
  }
  const options = node('div','auth-options');
  options.innerHTML = '<label><input type="checkbox" id="rememberEmail"> Lembrar de mim</label>';
  options.append(el('authForgotToggle')); el('authLogin').before(options);
  el('rememberEmail').title = 'Lembrar seu e-mail neste dispositivo';
  const remembered = localStorage.getItem('traxio.remembered-email.v1');
  if (remembered) { el('authEmail').value = remembered; el('rememberEmail').checked = true; }
  form.addEventListener('submit', () => {
    if (el('rememberEmail').checked) localStorage.setItem('traxio.remembered-email.v1', el('authEmail').value.trim());
    else localStorage.removeItem('traxio.remembered-email.v1');
  });
  el('authLogin').innerHTML = 'Entrar no Traxio ' + icon('arrow');
  document.querySelector('.traxio-auth-links').prepend(node('span','','Ainda não tem uma conta?'));

  // Fixed shell, account menu and shared persisted theme preference.
  const header = document.querySelector('body>header');
  const headerBrand = node('a','header-brand'); headerBrand.href = '#painel';
  headerBrand.innerHTML = brand();
  headerBrand.addEventListener('click', e => { e.preventDefault(); switchTab('painel'); }); header.prepend(headerBrand);
  const search = node('form','header-search'); search.setAttribute('role','search');
  search.innerHTML = '<input id="globalSearch" type="search" placeholder="Buscar cliente, endereço ou cidade..." aria-label="Buscar na carteira">' + icon('search');
  search.addEventListener('submit', e => { e.preventDefault(); switchTab('painel'); el('dashboardSearch').value = el('globalSearch').value; el('dashboardSearch').dispatchEvent(new Event('input')); });
  header.insertBefore(search, el('accountArea'));
  const theme = button('', () => {
    const dark = document.body.classList.toggle('traxio-dark');
    let prefs = {}; try { prefs = JSON.parse(localStorage.getItem('traxio.account.preferences.v1') || '{}'); } catch {}
    localStorage.setItem('traxio.account.preferences.v1', JSON.stringify({...prefs, theme: dark ? 'dark' : 'light'})); updateThemeButton();
  }, 'theme-toggle'); theme.id = 'themeToggle'; header.insertBefore(theme, el('accountArea'));
  function updateThemeButton() {
    const dark = document.body.classList.contains('traxio-dark'); theme.innerHTML = icon(dark ? 'moon' : 'sun');
    theme.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro'); theme.setAttribute('aria-pressed', String(dark));
  }
  updateThemeButton();
  new MutationObserver(updateThemeButton).observe(document.body,{attributes:true,attributeFilter:['class']});
  const avatar = node('span','account-avatar','T'); avatar.setAttribute('aria-hidden','true'); el('accountToggle').prepend(avatar);
  const updateAvatar = () => { avatar.textContent = (el('authIdentity').textContent || 'T').slice(0,1).toUpperCase(); };
  new MutationObserver(updateAvatar).observe(el('authIdentity'),{childList:true,characterData:true,subtree:true}); updateAvatar();
  const nav = document.querySelector('.tabs'); nav.setAttribute('aria-label','Navegação principal');
  const navArt = node('div','nav-art'); navArt.setAttribute('aria-hidden','true');
  navArt.innerHTML = '<img src="assets/approved-mockup.jpg" alt="" width="1280" height="853"><span class="nav-caption">Seu parceiro<br>na rota do<br>crescimento.</span>'; nav.append(navArt);
  const originalSwitch = switchTab;
  switchTab = id => {
    originalSwitch(id); const actual = id === 'rotas' ? 'mapa' : id;
    document.body.dataset.screen=actual;
    document.querySelectorAll('.tabs [data-tab]').forEach(b => { if(b.dataset.tab === actual) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
    document.querySelector('main').scrollTop = 0;
  };
  document.querySelector('.tabs [data-tab="painel"]').setAttribute('aria-current','page');
  document.body.dataset.screen='painel';

  // Dashboard: approved hero, three metrics, wallet cards and quick actions.
  const hero = document.querySelector('.traxio-hero');
  hero.querySelector('h2').innerHTML = 'Seu território<br>em <em>movimento.</em>';
  const heroArt = node('div','hero-art'); heroArt.setAttribute('aria-hidden','true');
  heroArt.innerHTML = '<img src="assets/approved-mockup.jpg" alt="" width="1280" height="853">'; hero.append(heroArt);
  const overview = el('painel').querySelector('.card'); overview.classList.add('dashboard-overview');
  const stats = overview.querySelector('.row'); stats.className = 'stats-row';
  stats.querySelectorAll('.stat').forEach((stat,i) => {
    const wrap = node('div'); while(stat.firstChild) wrap.append(stat.firstChild);
    stat.innerHTML = icon(['clients','pin','pending'][i]); stat.append(wrap);
  });
  stats.nextElementSibling.className = 'overview-note';
  const portfolioHeading = node('div','portfolio-heading');
  const walletTitle = overview.querySelector('h3'); walletTitle.before(portfolioHeading); portfolioHeading.append(walletTitle, overview.querySelector('.traxio-section-note'));
  const dashboardSearch = el('dashboardSearch'), dashboardField = dashboardSearch.parentElement; dashboardField.classList.add('search-field'); dashboardField.insertAdjacentHTML('afterbegin',icon('search'));
  dashboardSearch.setAttribute('aria-label','Buscar cliente no painel');
  const dashboardLayout = node('div','dashboard-layout'), dashboardMain = node('div','dashboard-main'); overview.before(dashboardLayout); dashboardMain.append(overview); dashboardLayout.append(dashboardMain);
  const quick = node('aside','card quick-actions'); quick.innerHTML = '<h3>Ações rápidas</h3>';
  [['Planejar rota','clients','mapa'],['Ver no mapa','map','mapa'],['Importar clientes','upload','dados'],['Sincronizar dados','sync','dados']].forEach(([text,ico,target], i) => {
    const b = button(text, () => { switchTab(target); if(i === 2) el('sheetFile').focus(); if(i === 3) el('cloudCheck').click(); }); b.setAttribute('aria-label',text); b.insertAdjacentHTML('afterbegin',icon(ico)); quick.append(b);
  });
  const overviewTop=node('div','overview-top'), overviewSummary=node('div','overview-summary');
  const walletCards=el('dashboardClients');
  [...overview.children].forEach(child=>{if(child!==walletCards&&!child.classList.contains('notice'))overviewSummary.append(child);});
  overviewTop.append(overviewSummary,quick);overview.prepend(overviewTop);

  // Clients: retain the exact original edit form, expose it in a native modal.
  const clientSection = el('clientes'), editCard = clientSection.querySelector('.card');
  editCard.querySelectorAll('.field').forEach(field=>{const label=field.querySelector('label'),input=field.querySelector('input,select');if(label&&input?.id)label.htmlFor=input.id;});
  const editor = node('dialog','detail-dialog client-edit-dialog'); editor.id = 'clientEditDialog'; editor.setAttribute('aria-labelledby','clientEditTitle');
  const editorHeader = node('div','dialog-header'); const editorTitle = editCard.querySelector('h2'); editorTitle.id='clientEditTitle';
  editorHeader.append(editorTitle,button('×',() => editor.close(),'close-client-editor')); editorHeader.lastChild.setAttribute('aria-label','Fechar cadastro'); editCard.prepend(editorHeader);
  editor.append(editCard); document.body.append(editor);
  const listCard = el('clientList').parentElement; listCard.classList.add('legacy-client-list'); listCard.hidden = true;
  clientSection.prepend(title('Clientes','Gerencie sua carteira e planeje suas visitas.'));
  const sectionActions = node('div','section-title'); sectionActions.append(node('h2','','Minha carteira'),button('+ Novo cliente',() => {
    editingClientId = null;
    for(const id of ['name','address','houseNumber','complement','cep','lat','lon']) el(id).value = '';
    el('priority').value='2'; el('saveStatus').textContent=''; editorTitle.textContent='Cadastrar cliente'; editor.showModal();
  },'')); clientSection.append(sectionActions);
  sectionActions.classList.add('registry-title-actions');sectionActions.querySelector('h2').remove();
  const registry = node('div','card registry-card');
  registry.innerHTML = `<div class="registry-controls"><div class="registry-search-row"><div class="search-field">${icon('search')}<input id="registrySearch" type="search" placeholder="Buscar cliente por nome, cidade, bairro ou endereço..." aria-label="Buscar clientes"></div><button type="button" id="registryFilterToggle" class="secondary icon-button" aria-label="Mostrar ou ocultar filtros" aria-expanded="true" aria-controls="registryFilters">${icon('filter')}</button></div><div class="registry-filters" id="registryFilters"><select id="registryCity" aria-label="Filtrar por cidade"><option value="">Todas as cidades</option></select><select id="registryNeighborhood" aria-label="Filtrar por bairro"><option value="">Todos os bairros</option></select><select id="registryCategory" aria-label="Filtrar por categoria"><option value="">Todas as categorias</option></select><button type="button" id="registryClear" class="secondary">Limpar filtros</button></div><p class="registry-count" id="registryCount" aria-live="polite"></p></div><div class="table-scroll"><table class="client-table"><thead><tr><th><input id="registrySelectAll" type="checkbox" aria-label="Selecionar todos os clientes filtrados"></th><th scope="col">Cliente</th><th scope="col">Cidade</th><th scope="col">Bairro</th><th scope="col">Categoria</th><th scope="col">Prioridade</th></tr></thead><tbody id="registryRows"></tbody></table></div><div class="registry-footer"><span id="registrySelection" aria-live="polite"></span><button type="button" id="registryPlan" class="secondary">Planejar visitas selecionadas →</button></div>`;
  clientSection.append(registry);
  const category = c => regionField(c,['categoria','segmento','ramo','atividade']) || c.category || '—';
  const filteredClients = () => {
    const q = norm(el('registrySearch').value), city = el('registryCity').value, district = el('registryNeighborhood').value, cat = el('registryCategory').value;
    return clients.filter(c => {
      const r = regionParts(c);
      return (!q || norm([c.name,c.address,r.city,r.district,category(c)].join(' ')).includes(q)) && (!city || r.city === city) && (!district || r.district === district) && (!cat || category(c) === cat);
    });
  };
  function updateOptions(id, values, initial) {
    const select = el(id), value = select.value; select.replaceChildren(new Option(initial,''));
    [...new Set(values.filter(x => x && x !== '—'))].sort((a,b) => a.localeCompare(b,'pt-BR')).forEach(v => select.add(new Option(v,v)));
    if([...select.options].some(o => o.value === value)) select.value = value;
  }
  function registrySelection() {
    const filtered = filteredClients(), count = filtered.filter(c => selectedIds.has(c.id)).length;
    el('registrySelectAll').checked = !!filtered.length && count === filtered.length;
    el('registrySelectAll').indeterminate = count > 0 && count < filtered.length;
    el('registrySelection').textContent = `${selectedIds.size} cliente${selectedIds.size === 1 ? '' : 's'} selecionado${selectedIds.size === 1 ? '' : 's'}`;
    el('registryPlan').disabled = !selectedIds.size;
  }
  function renderRegistry(refreshOptions = false) {
    if(refreshOptions) { updateOptions('registryCity',clients.map(c=>regionParts(c).city),'Todas as cidades'); updateOptions('registryCategory',clients.map(category),'Todas as categorias'); }
    updateOptions('registryNeighborhood',clients.filter(c=>!el('registryCity').value || regionParts(c).city === el('registryCity').value).map(c=>regionParts(c).district),'Todos os bairros');
    const filtered = filteredClients(), root = el('registryRows'); root.replaceChildren();
    el('registryCount').textContent = `${filtered.length} cliente${filtered.length === 1 ? '' : 's'}${filtered.length !== clients.length ? ' de ' + clients.length : ''}`;
    for(const c of filtered) {
      const row = node('tr'), checkCell = node('td'), check = node('input'); check.type='checkbox'; check.checked=selectedIds.has(c.id); check.setAttribute('aria-label','Selecionar '+c.name);
      check.addEventListener('change',()=>{ if(check.checked) selectedIds.add(c.id); else selectedIds.delete(c.id); updateSelectedCount(); renderWorkspace(); registrySelection(); }); checkCell.append(check); row.append(checkCell);
      const nameCell = node('td'); nameCell.append(button(c.name,()=>viewClient(c.id),'client-link')); row.append(nameCell);
      const r = regionParts(c); [r.city || '—',r.district || '—',category(c)].forEach(v=>row.append(node('td','',v)));
      const p = node('td'); p.append(makePriority(c.priority)); row.append(p); root.append(row);
    }
    if(!filtered.length) { const row=node('tr'), cell=node('td','empty-state',clients.length?'Nenhum cliente corresponde aos filtros.':'Sua carteira está vazia. Importe uma planilha ou cadastre um cliente.'); cell.colSpan=6; row.append(cell);root.append(row); }
    registrySelection();
  }
  ['registrySearch','registryCity','registryNeighborhood','registryCategory'].forEach(id=>el(id).addEventListener(id==='registrySearch'?'input':'change',()=>renderRegistry()));
  el('registryClear').addEventListener('click',()=>{ for(const id of ['registrySearch','registryCity','registryNeighborhood','registryCategory']) el(id).value=''; renderRegistry(); });
  el('registryFilterToggle').addEventListener('click',()=>{ const hidden=el('registryFilters').hidden=!el('registryFilters').hidden; el('registryFilterToggle').setAttribute('aria-expanded',String(!hidden)); });
  el('registrySelectAll').addEventListener('change',()=>{ for(const c of filteredClients()) { if(el('registrySelectAll').checked) selectedIds.add(c.id); else selectedIds.delete(c.id); } renderRegistry(); updateSelectedCount(); renderWorkspace(); });
  el('registryPlan').addEventListener('click',()=>switchTab('mapa'));
  el('detailEdit').addEventListener('click',()=>{ editorTitle.textContent='Editar cliente'; editor.showModal(); });
  el('saveClient').addEventListener('click',()=>{ if(el('saveStatus').textContent === 'Cliente salvo.') editor.close(); });
  el('adjustPin').addEventListener('click',()=>{if(adjustingPin)editor.close();});
  el('backToClient').addEventListener('click',()=>{editorTitle.textContent=editingClientId?'Editar cliente':'Cadastrar cliente';if(!editor.open)editor.showModal();});
  const originalOpenClientLocation=openClientLocation;
  openClientLocation=(...args)=>{originalOpenClientLocation(...args);editorTitle.textContent='Localizar cliente';if(!editor.open)editor.showModal();el('address').focus();};
  const remove = button('Excluir cliente',()=>{
    const c=clients.find(x=>x.id===activeDetailId); if(!c || !confirm('Excluir '+c.name+'?')) return;
    clients=clients.filter(x=>x.id!==c.id); save(); el('clientDialog').close();
  }); remove.style.color='#bb5261'; document.querySelector('#clientDialog .detail-actions').append(remove);
  const originalRender = render;
  render = () => { originalRender(); renderRegistry(true); };
  renderRegistry(true);

  // Route modes expose useful planning controls without replacing the route engine.
  el('mapa').prepend(title('Mapa e Rotas','Planeje suas rotas, visualize no mapa e otimize seus trajetos.'));
  const modes = node('div','route-mode-tabs'); modes.setAttribute('role','tablist'); modes.setAttribute('aria-label','Modo de planejamento');
  const modePanel = node('div','route-mode-panel'); modePanel.id='routeModePanel'; modePanel.setAttribute('role','tabpanel'); modePanel.hidden=true;
  const modesList = [['daily','Rota diária'],['weekly','Planejamento semanal'],['cities','Viagem entre cidades']];
  // Change only the basemap palette; retain route layers, sources, markers and camera.
  const originalPaint = new Map();
  function applyMapPalette() {
    if(!map?.isStyleLoaded())return;
    const dark=document.body.classList.contains('traxio-dark');
    for(const layer of map.getStyle().layers) {
      if(layer.source==='route')continue;
      const key=layer.type==='background'?'background-color':layer.type==='fill'?'fill-color':layer.type==='line'?'line-color':layer.type==='symbol'?'text-color':null;
      if(!key)continue;
      const id=layer.id+'|'+key;
      if(!originalPaint.has(id))originalPaint.set(id,map.getPaintProperty(layer.id,key));
      const color=layer.type==='background'?'#062432':layer.type==='symbol'?'#c3d8d8':layer.type==='line'?(/water/.test(layer.id)?'#075260':'#3d5b64'):/water/.test(layer.id)?'#084653':/park|wood|landcover|grass/.test(layer.id)?'#123c3f':'#0e303b';
      map.setPaintProperty(layer.id,key,dark?color:(originalPaint.get(id)??null));
    }
  }
  const originalInitMap=initMap;
  initMap=()=>{originalInitMap();if(map&&!map.__traxioPalette){map.__traxioPalette=true;map.on('style.load',()=>{originalPaint.clear();applyMapPalette();});map.once('load',applyMapPalette);if(map.isStyleLoaded())applyMapPalette();}};
  new MutationObserver(applyMapPalette).observe(document.body,{attributes:true,attributeFilter:['class']});
  function selectMode(mode) {
    modes.querySelectorAll('button').forEach(b=>{ const selected=b.dataset.mode===mode; b.setAttribute('aria-selected',String(selected)); b.tabIndex=selected?0:-1; });
    modePanel.replaceChildren(); modePanel.hidden=mode==='daily';
    if(mode==='weekly') {
      modePanel.innerHTML='<p class="muted">Escolha o dia das visitas. O planejamento é salvo neste dispositivo.</p><div class="grid"><label>Data das visitas<input type="date" id="visitDate"></label><button type="button" id="saveVisitDay">Salvar clientes selecionados para este dia</button></div><p id="visitDayStatus" class="muted" role="status"></p>';
      const date = new Date(); date.setMinutes(date.getMinutes()-date.getTimezoneOffset()); el('visitDate').value=date.toISOString().slice(0,10);
      const planningKey=()=> 'traxio.visit-planning.v1:'+(el('authIdentity').textContent || 'local');
      let planning={}; try { planning=JSON.parse(localStorage.getItem(planningKey())||'{}'); }catch{}
      const status=()=>{ const ids=planning[el('visitDate').value]||[]; el('visitDayStatus').textContent=ids.length?ids.length+' visitas planejadas para este dia.':'Nenhuma visita salva para este dia.'; };
      el('visitDate').addEventListener('change',status); status();
      el('saveVisitDay').addEventListener('click',()=>{ if(!el('visitDate').value || !selectedIds.size){el('visitDayStatus').textContent='Escolha uma data e selecione os clientes na lista.';return;} planning[el('visitDate').value]=[...selectedIds]; localStorage.setItem(planningKey(),JSON.stringify(planning)); status(); });
    }
    if(mode==='cities') {
      modePanel.innerHTML='<p class="muted">Selecione uma cidade para filtrar as visitas. Você também pode escolher clientes de cidades diferentes na lista.</p><label>Cidade de destino<select id="tripCity"><option value="all">Todas as cidades</option></select></label>';
      [...el('regionCity').options].slice(1).forEach(o=>el('tripCity').add(new Option(o.textContent,o.value)));
      el('tripCity').value=el('regionCity').value;
      el('tripCity').addEventListener('change',()=>{el('regionCity').value=el('tripCity').value;el('regionCity').dispatchEvent(new Event('change'));});
    }
  }
  modesList.forEach(([id,text])=>{const b=button(text,()=>selectMode(id));b.id='route-mode-'+id;b.dataset.mode=id;b.setAttribute('role','tab');b.setAttribute('aria-controls','routeModePanel');modes.append(b);});
  modes.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const list=[...modes.children];let index=list.indexOf(document.activeElement);index=e.key==='Home'?0:e.key==='End'?list.length-1:(index+(e.key==='ArrowRight'?1:-1)+list.length)%list.length;list[index].click();list[index].focus();});
  document.querySelector('#mapa .tab-title').after(modes,modePanel); selectMode('daily');
  // Real dependency failures remain explicit; no decorative map is presented as a live map.
  const mapNode=el('map');
  if(!window.maplibregl) {
    mapNode.innerHTML=`<div class="map-unavailable">${icon('map')}<strong>Conecte-se para carregar o mapa</strong><p>Não foi possível carregar o serviço de mapas. Sua carteira e seu planejamento continuam disponíveis.</p><button type="button" id="retryMap" class="secondary">Tentar novamente</button></div>`;
    el('retryMap').addEventListener('click',()=>location.reload());
  }

  el('dados').prepend(title('Planilhas','Importe, consulte, exporte e proteja sua carteira.'));
  const guide = document.querySelector('.traxio-data-guide'), guideEntries = [...guide.children]; guide.replaceChildren();
  guideEntries.forEach((old,i)=>{
    const b=button('',()=>{
      if(i===0)el('cloudCheck').click();
      const target = i===0?document.querySelector('.traxio-data-primary'):i===1?el('sheetFile').closest('.traxio-data-block'):document.querySelectorAll('.traxio-data-expand')[i-2];
      if(target.tagName==='DETAILS')target.open=true;
      target.scrollIntoView({behavior:'smooth',block:'center'});if(i===1)el('sheetFile').focus();
    }); b.innerHTML=icon(['cloud','upload','search','database'][i]); const content=node('div'); while(old.firstChild)content.append(old.firstChild);b.append(content);guide.append(b);
  });
  document.querySelector('.traxio-data-center>.traxio-section-note').hidden=true;
  el('historico').prepend(title('Histórico','Acompanhe suas visitas e os resultados dos seus trajetos.'));

  // Modal keyboard focus and backdrop interactions.
  for(const dialog of [editor,el('clientDialog')]) dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  const accountOverlay=el('accountDialog'); let returnFocus=null;
  new MutationObserver(()=>{
    if(!accountOverlay.hidden){returnFocus=document.activeElement;accountOverlay.querySelector('input,select,button')?.focus();}
    else if(returnFocus?.isConnected){returnFocus.focus();returnFocus=null;}
  }).observe(accountOverlay,{attributes:true,attributeFilter:['hidden']});
  accountOverlay.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const focusable=[...accountOverlay.querySelectorAll('button,input,select,a[href]')].filter(n=>!n.disabled&&n.getClientRects().length);const first=focusable[0],last=focusable.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  });
  document.body.classList.add('traxio-ui-ready');
});
