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
  const brand = className => `<span class="brand-crop traxelo-approved-brand rotamapa-approved-brand ${className || ''}" role="img" aria-label="RotaMapa — Sua rota com inteligência."><img class="rotamapa-brand-image" src="assets/rotamapa/logo.webp" alt="" width="1540" height="306"></span>`;
  // Display unmodified original pixels from the supplied reference crops.
  const glyph=(source,sourceWidth,sourceHeight,x,y,w,h,className='')=>`<span class="kit-glyph ${className}" aria-hidden="true" style="aspect-ratio:${w}/${h}"><img src="assets/visual-kit/assets/${source}" alt="" width="${sourceWidth}" height="${sourceHeight}" style="width:${100*sourceWidth/w}%;height:${100*sourceHeight/h}%;left:${-100*x/w}%;top:${-100*y/h}%"></span>`;
  // Key only the crop background, then intersect with source alpha. The final
  // composite preserves transparent input pixels instead of creating black frames.
  const cropFilters=document.createElementNS('http://www.w3.org/2000/svg','svg');cropFilters.classList.add('kit-filter-defs');cropFilters.setAttribute('aria-hidden','true');
  const keyFilter=(id,alpha,slope,intercept)=>`<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  ${alpha}"/><feComponentTransfer result="keyed"><feFuncA type="linear" slope="${slope}" intercept="${intercept}"/></feComponentTransfer><feComposite in="keyed" in2="SourceGraphic" operator="in"/></filter>`;
  cropFilters.innerHTML='<defs>'+keyFilter('kit-crop-light','-1 -1 -1 0 3',4,-.4)+keyFilter('kit-crop-dark','1 1 1 0 -.6',2,0)+keyFilter('kit-crop-nav','1 1 1 0 -1.8',2,0)+keyFilter('rotamapa-brand-key','1 1 1 0 -.7',2.5,0)+'</defs>';document.body.append(cropFilters);
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
  authBrand.innerHTML = brand('auth-original-logo') + `<div class="auth-features">${[[59,216,'Organize<br>sua carteira'],[58,276,'Otimize<br>seus trajetos'],[58,336,'Conquiste<br>mais resultados']].map(([x,y,text])=>`<div class="auth-feature">${glyph('login_hero_reference.png',354,632,x,y,33,33,'kit-benefit-icon')}<span>${text}</span></div>`).join('')}</div>`;
  el('authScreen').prepend(authBrand);
  const approvedScene = node('div','auth-approved-scene'); approvedScene.setAttribute('aria-hidden','true');
  approvedScene.innerHTML='<img class="reconstructed-login-plate" src="assets/reconstructed/login-background.png" alt=""><img class="original-login-art" src="assets/visual-kit/assets/login_hero_reference.png" alt="" width="354" height="632">';
  el('authScreen').prepend(approvedScene);
  const roadContinuation=node('div','auth-road-continuation');roadContinuation.setAttribute('aria-hidden','true');roadContinuation.innerHTML='<img src="assets/visual-kit/reference/1411.png" alt="" width="1536" height="1024">';el('authScreen').prepend(roadContinuation);
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
  el('authLogin').innerHTML = 'Entrar no RotaMapa ' + icon('arrow');
  document.querySelector('.traxio-auth-links').prepend(node('span','','Ainda não tem uma conta?'));

  // Fixed shell, account menu and shared persisted theme preference.
  const header = document.querySelector('body>header');
  const headerBrand = node('a','header-brand'); headerBrand.href = '#painel';
  headerBrand.innerHTML = brand()+'<span class="header-motto">SUA ROTA<br>COM INTELIGÊNCIA.</span>';
  headerBrand.addEventListener('click', e => { e.preventDefault(); switchTab('painel'); }); header.prepend(headerBrand);
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
  navArt.innerHTML = '<img src="assets/scenes/painel.webp" alt="" width="1024" height="1536"><span class="nav-caption">Seu parceiro<br>na rota do<br>crescimento.</span>'; nav.append(navArt);
  const navPattern=node('div','nav-pattern');navPattern.setAttribute('aria-hidden','true');navPattern.innerHTML='<img src="assets/visual-kit/reference/1411.png" alt="" width="1536" height="1024">';nav.append(navPattern);
  // Keep the original sidebar symbols as vectors so their heavier strokes stay crisp on iOS and Android.
  nav.querySelectorAll(':scope>button>svg').forEach(svg=>svg.classList.add('ui-icon'));
  const originalSwitch = switchTab;
  switchTab = id => {
    originalSwitch(id); const actual = id === 'rotas' ? 'mapa' : id;
    document.body.dataset.screen=actual;
    document.querySelectorAll('.tabs [data-tab]').forEach(b => { if(b.dataset.tab === actual) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
    document.querySelector('main').scrollTop = 0;
  };
  document.querySelector('.tabs [data-tab="painel"]').setAttribute('aria-current','page');
  document.body.dataset.screen='painel';

  // Approved full-screen scenes, with real controls rather than baked-in UI.
  const scenery = node('div','app-scenery'); scenery.setAttribute('aria-hidden','true');
  const scene = node('img'); scene.src='assets/scenes/painel.webp'; scene.alt=''; scene.decoding='async'; scenery.append(scene); document.body.prepend(scenery);
  const updateScene=()=>{const screen=document.body.dataset.screen||'painel';const src='assets/scenes/'+screen+'.webp';if(scene.getAttribute('src')!==src)scene.src=src;navArt.querySelector('img').src=src;};
  new MutationObserver(updateScene).observe(document.body,{attributes:true,attributeFilter:['data-screen']});
  const hero=document.querySelector('.traxio-hero');hero.querySelector('h2').innerHTML='Seu território<br>em <em>movimento.</em>';
  hero.querySelector('p').textContent='Planeje suas visitas com inteligência.';
  const overview=el('painel').querySelector('.card');overview.classList.add('dashboard-overview');
  const stats=overview.querySelector('.row');stats.className='stats-row';
  stats.querySelectorAll('.stat').forEach((stat,i)=>{
    const wrap=node('div');while(stat.firstChild)wrap.append(stat.firstChild);
    const [x,y,w,h]=[[188,278,35,36],[346,278,32,36],[496,278,32,36]][i];
    stat.innerHTML=glyph('dashboard_mockup_reference.png',858,635,x,y,w,h,'kit-metric-icon');stat.append(wrap);
    stat.append(node('span','stat-chevron','›'));
  });
  stats.nextElementSibling.className='overview-note';
  const quick=node('aside','quick-actions');quick.innerHTML='<h3>Ações rápidas</h3>';
  [['Planejar rota','Organize suas visitas','mapa'],['Ver no mapa','Explore seus clientes','mapa'],['Importar clientes','Adicione sua planilha','dados'],['Sincronizar dados','Atualize sua carteira','dados']].forEach(([text,description,target],i)=>{
    const b=button('',()=>{switchTab(target);if(i===2)el('sheetFile').focus();if(i===3)el('cloudCheck').click();},'glass-action');
    b.setAttribute('aria-label',text);b.insertAdjacentHTML('afterbegin',glyph('dashboard_mockup_reference.png',858,635,668,[266,306,347,389][i],25,25,'kit-quick-icon'));
    const content=node('span','quick-action-copy');content.append(node('strong','',text),node('small','',description));b.append(content,node('span','action-chevron','›'));quick.append(b);
  });
  overview.after(quick);
  const serviceNote=overview.querySelector('.notice');serviceNote.classList.add('dashboard-service-note');quick.after(serviceNote);

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
    for(const id of ['name','address','houseNumber','complement','pharmacyNetwork','cep','lat','lon','clientCity','clientNeighborhood','clientState']) el(id).value = '';
    el('priority').value='2'; el('saveStatus').textContent=''; editorTitle.textContent='Cadastrar cliente'; editor.showModal();
  },'')); clientSection.append(sectionActions);
  sectionActions.classList.add('registry-title-actions');sectionActions.querySelector('h2').remove();
  const registry = node('div','card registry-card');
  registry.innerHTML = `<div class="registry-controls"><div class="registry-search-row"><div class="search-field">${icon('search')}<input id="registrySearch" type="search" placeholder="Buscar cliente por nome, cidade, bairro ou endereço..." aria-label="Buscar clientes"></div><button type="button" id="registryFilterToggle" class="secondary icon-button" aria-label="Mostrar ou ocultar filtros" aria-expanded="true" aria-controls="registryFilters">${icon('filter')}</button></div><div class="registry-filters" id="registryFilters"><select id="registryCity" aria-label="Filtrar por cidade"><option value="">Todas as cidades</option></select><select id="registryNeighborhood" aria-label="Filtrar por bairro"><option value="">Todos os bairros</option></select><select id="registryCategory" aria-label="Filtrar por categoria"><option value="">Todas as categorias</option></select><button type="button" id="registryClear" class="secondary">Limpar filtros</button></div><div class="registry-location-tools"><label for="registryLocation">Localização</label><select id="registryLocation"><option value="">Todos os clientes</option><option value="confirmed">Localização confirmada</option><option value="review">Aguardando confirmação</option><option value="saved">Pontos salvos para revisar</option><option value="missing">Sem ponto salvo</option></select><div id="confirmedPortfolioActions" hidden><button type="button" id="registryPlanConfirmed">Criar rota com estes confirmados</button><button type="button" id="registrySuggestConfirmed" class="secondary">Sugerir rota com estes confirmados</button></div></div><p class="registry-count" id="registryCount" aria-live="polite"></p></div><div class="table-scroll"><table class="client-table"><thead><tr><th><input id="registrySelectAll" type="checkbox" aria-label="Selecionar todos os clientes filtrados"></th><th scope="col">Cliente</th><th scope="col">Cidade</th><th scope="col">Bairro</th><th scope="col">Categoria</th><th scope="col">Prioridade</th></tr></thead><tbody id="registryRows"></tbody></table></div><div class="registry-footer"><span id="registrySelection" aria-live="polite"></span><button type="button" id="registryPlan" class="secondary">Planejar visitas selecionadas →</button></div>`;
  clientSection.append(registry);
  const category = c => regionField(c,['categoria','segmento','ramo','atividade']) || c.category || '—';
  const filteredClients = () => {
    const q = norm(el('registrySearch').value), city = el('registryCity').value, district = el('registryNeighborhood').value, cat = el('registryCategory').value;
    return clients.filter(c => {
      const r = regionParts(c), location = el('registryLocation').value, ready = TraxioPlanner.location(c).ready;
      return (!location || (location === 'confirmed' ? ready : location === 'saved' ? !ready && TraxioPlanner.hasSavedPoint(c) : location === 'missing' ? !TraxioPlanner.hasSavedPoint(c) : !ready)) && (!q || norm([c.name,c.address,r.city,r.district,category(c)].join(' ')).includes(q)) && (!city || r.city === city) && (!district || r.district === district) && (!cat || category(c) === cat);
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
    const reviewMode=['saved','review'].includes(el('registryLocation').value);
    const reviewCount=clients.filter(c=>selectedIds.has(c.id)&&!TraxioPlanner.location(c).ready&&TraxioPlanner.hasSavedPoint(c)).length;
    el('registryPlan').textContent=reviewMode?'Confirmar pontos no mapa'+(reviewCount?' ('+reviewCount+')':''):'Planejar visitas selecionadas →';
    el('registryPlan').disabled = reviewMode?!reviewCount:!selectedIds.size;
  }
  function renderRegistry(refreshOptions = false) {
    if(refreshOptions) { updateOptions('registryCity',clients.map(c=>regionParts(c).city),'Todas as cidades'); updateOptions('registryCategory',clients.map(category),'Todas as categorias'); }
    updateOptions('registryNeighborhood',clients.filter(c=>!el('registryCity').value || regionParts(c).city === el('registryCity').value).map(c=>regionParts(c).district),'Todos os bairros');
    const filtered = filteredClients(), root = el('registryRows'); root.replaceChildren();
    const confirmed = clients.filter(c=>TraxioPlanner.location(c).ready).length;
    const saved=clients.filter(c=>!TraxioPlanner.location(c).ready&&TraxioPlanner.hasSavedPoint(c)).length;
    el('locationRecovery').hidden=!saved;
    el('locationRecoveryText').textContent=saved+' cliente'+(saved===1?' possui ponto salvo':'s possuem pontos salvos')+' para revisar. Esses pontos não foram apagados; precisam de confirmação para entrar na rota.';
    el('locatedShortcut').setAttribute('aria-label',`Ver ${confirmed} clientes com localização confirmada`);
    el('pendingShortcut').setAttribute('aria-label',`Ver ${clients.length-confirmed} clientes aguardando confirmação`);
    el('confirmedPortfolioActions').hidden = el('registryLocation').value !== 'confirmed';
    for(const id of ['registryPlanConfirmed','registrySuggestConfirmed'])el(id).disabled = !filtered.length;
    el('registryCount').textContent = `${filtered.length} cliente${filtered.length === 1 ? '' : 's'}${filtered.length !== clients.length ? ' de ' + clients.length : ''}`;
    for(const c of filtered) {
      const row = node('tr'), checkCell = node('td'), check = node('input'); check.type='checkbox'; check.checked=selectedIds.has(c.id); check.setAttribute('aria-label','Selecionar '+c.name);
      check.addEventListener('change',()=>{ if(check.checked) selectedIds.add(c.id); else selectedIds.delete(c.id); updateSelectedCount(); renderWorkspace(); registrySelection(); }); checkCell.append(check); row.append(checkCell);
      const nameCell = node('td'); nameCell.append(button(c.name,()=>viewClient(c.id),'client-link')); const point=TraxioPlanner.location(c); nameCell.append(node('small','registry-location-status',point.ready?'Localização confirmada':point.kind==='unavailable'?'Sem localização':point.kind==='approximate'?'Localização aproximada · confirmar':'Coordenadas não verificadas')); row.append(nameCell);
      const r = regionParts(c); [r.city || '—',r.district || '—',category(c)].forEach(v=>row.append(node('td','',v)));
      const p = node('td'); p.append(makePriority(c.priority)); row.append(p); root.append(row);
    }
    if(!filtered.length) { const row=node('tr'), cell=node('td','empty-state',clients.length?'Nenhum cliente corresponde aos filtros.':'Sua carteira está vazia. Importe uma planilha ou cadastre um cliente.'); cell.colSpan=6; row.append(cell);root.append(row); }
    registrySelection();
  }
  ['registrySearch','registryCity','registryNeighborhood','registryCategory','registryLocation'].forEach(id=>el(id).addEventListener(id==='registrySearch'?'input':'change',()=>renderRegistry()));
  el('registryClear').addEventListener('click',()=>{ for(const id of ['registrySearch','registryCity','registryNeighborhood','registryCategory','registryLocation']) el(id).value=''; renderRegistry(); });
  el('registryFilterToggle').addEventListener('click',()=>{ const hidden=el('registryFilters').hidden=!el('registryFilters').hidden; el('registryFilterToggle').setAttribute('aria-expanded',String(!hidden)); });
  el('registrySelectAll').addEventListener('change',()=>{ for(const c of filteredClients()) { if(el('registrySelectAll').checked) selectedIds.add(c.id); else selectedIds.delete(c.id); } renderRegistry(); updateSelectedCount(); renderWorkspace(); });
  el('registryPlan').addEventListener('click',()=>{if(['saved','review'].includes(el('registryLocation').value)&&window.TraxeloLocations?.beginReview)window.TraxeloLocations.beginReview([...selectedIds]);else switchTab('mapa');});
  function showLocationClients(mode) {
    for(const id of ['registrySearch','registryCity','registryNeighborhood','registryCategory'])el(id).value='';
    el('registryLocation').value=mode;el('registryFilters').hidden=false;
    el('registryFilterToggle').setAttribute('aria-expanded','true');
    renderRegistry();switchTab('clientes');el('registryLocation').focus({preventScroll:true});
  }
  el('reviewSavedLocations').addEventListener('click',()=>showLocationClients('saved'));
  for(const [metric,id,mode] of [['total','allClientsShortcut',''],['located','locatedShortcut','confirmed'],['pending','pendingShortcut','review']]){
    const shortcut=el(metric).closest('.stat');shortcut.id=id;shortcut.setAttribute('role','button');shortcut.tabIndex=0;
    shortcut.title='Clique para visualizar estes clientes';
    shortcut.addEventListener('click',()=>showLocationClients(mode));
    shortcut.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showLocationClients(mode);}});
  }
  function planConfirmed(suggest) {
    const confirmed=filteredClients().filter(c=>TraxioPlanner.location(c).ready);if(!confirmed.length)return;
    selectedIds=new TraxioPlanner.IdSet(confirmed.map(c=>c.id));selectionInitialized=true;
    updateSelectedCount();renderWorkspace();registrySelection();switchTab('mapa');
    const disclosure=el('routePlannerPanel');if(disclosure)disclosure.open=true;
    if(suggest&&el('strategyPanel').hidden)el('suggestToggle').click();
    if(!suggest)el('origin').focus({preventScroll:true});
  }
  el('registryPlanConfirmed').addEventListener('click',()=>planConfirmed(false));
  el('registrySuggestConfirmed').addEventListener('click',()=>planConfirmed(true));
  el('detailEdit').addEventListener('click',()=>{ editorTitle.textContent='Editar cliente'; editor.showModal(); });
  el('saveClient').addEventListener('click',()=>{ if(el('saveStatus').textContent === 'Cliente salvo.') editor.close(); });
  el('adjustPin').addEventListener('click',()=>{if(adjustingPin)editor.close();});
  el('backToClient').addEventListener('click',()=>{if(window.traxeloPinController)return;editorTitle.textContent=editingClientId?'Editar cliente':'Cadastrar cliente';if(!editor.open)editor.showModal();});
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
    if(!map?.__traxioStyleReady)return;
    const dark=document.body.classList.contains('traxio-dark');
    for(const layer of map.getStyle().layers) {
      if(layer.source==='route'||layer.id==='traxio-satellite')continue;
      const key=layer.type==='background'?'background-color':layer.type==='fill'?'fill-color':layer.type==='line'?'line-color':layer.type==='symbol'?'text-color':null;
      if(!key)continue;
      const id=layer.id+'|'+key;
      if(!originalPaint.has(id))originalPaint.set(id,map.getPaintProperty(layer.id,key));
      const color=layer.type==='background'?'#062432':layer.type==='symbol'?'#c3d8d8':layer.type==='line'?(/water/.test(layer.id)?'#075260':'#3d5b64'):/water/.test(layer.id)?'#084653':/park|wood|landcover|grass/.test(layer.id)?'#123c3f':'#0e303b';
      map.setPaintProperty(layer.id,key,dark?color:(originalPaint.get(id)??null));
      if(layer.type==='symbol'){const haloId=layer.id+'|text-halo-color';if(!originalPaint.has(haloId))originalPaint.set(haloId,map.getPaintProperty(layer.id,'text-halo-color'));map.setPaintProperty(layer.id,'text-halo-color',dark?'#082b37':(originalPaint.get(haloId)??null));}
    }
  }
  const originalInitMap=initMap;
  initMap=()=>{originalInitMap();if(map&&!map.__traxioPalette){map.__traxioPalette=true;map.jumpTo({center:[-35.22,-5.817],zoom:11.3});map.on('style.load',()=>{map.__traxioStyleReady=true;originalPaint.clear();applyMapPalette();});map.once('load',()=>{map.__traxioStyleReady=true;applyMapPalette();});if(map.isStyleLoaded()){map.__traxioStyleReady=true;applyMapPalette();}}};
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
  const visitSide=document.querySelector('.workspace-side'),selectionLabel=node('p','approved-selection-count');
  const traceSelected=button('Traçar rota selecionada',()=>{el('calcRoute').click();document.querySelector('.workspace-route').scrollIntoView({behavior:'smooth',block:'start'});},'approved-trace-route secondary');
  const reflectSelection=()=>{selectionLabel.textContent=selectedIds.size+' clientes selecionados';traceSelected.disabled=!selectedIds.size;};
  new MutationObserver(reflectSelection).observe(el('selectedCount'),{childList:true,characterData:true,subtree:true});reflectSelection();
  el('mapClientListDisclosure').before(selectionLabel,traceSelected);
  const mapNode=el('map');
  mapNode.after(el('mapStatus'),el('mapSelectionStatus'));
  const layerSwitch=node('div','map-layer-switch');layerSwitch.setAttribute('role','group');layerSwitch.setAttribute('aria-label','Camada do mapa');
  let satellite=false;
  const layerButtons=['Mapa','Satélite'].map((label,i)=>{const b=button(label,()=>{
    if(!map?.getStyle()?.layers?.length){el('mapStatus').textContent='Aguarde o carregamento do mapa para trocar a camada.';return;}
    satellite=!!i;
    if(satellite&&!map.getSource('traxio-satellite')){
      map.addSource('traxio-satellite',{type:'raster',tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],tileSize:256,attribution:'Imagery © Esri'});
      const before=map.getStyle().layers.find(l=>l.type==='symbol'||l.source==='route')?.id;
      map.addLayer({id:'traxio-satellite',type:'raster',source:'traxio-satellite'},before);
    }
    if(map.getLayer('traxio-satellite'))map.setLayoutProperty('traxio-satellite','visibility',satellite?'visible':'none');
    layerButtons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
  });b.setAttribute('aria-pressed',String(i===0));layerSwitch.append(b);return b;});
  mapNode.before(layerSwitch);
  if(!window.maplibregl) {
    mapNode.innerHTML=`<div class="map-unavailable">${icon('map')}<strong>Conecte-se para carregar o mapa</strong><p>Não foi possível carregar o serviço de mapas. Sua carteira e seu planejamento continuam disponíveis.</p><button type="button" id="retryMap" class="secondary">Tentar novamente</button></div>`;
    el('retryMap').addEventListener('click',()=>location.reload());
  }

  el('dados').prepend(title('Importar carteira','Importe sua planilha, consulte cadastros e proteja suas carteiras.'));
  const guide = document.querySelector('.traxio-data-guide'), guideEntries = [...guide.children]; guide.replaceChildren();
  guideEntries.forEach((old,i)=>{
    const b=button('',()=>{
      if(i===0)el('cloudCheck').click();
      const target = i===0?document.querySelector('.traxio-data-primary'):i===1?el('sheetFile').closest('.traxio-data-block'):document.querySelectorAll('.traxio-data-expand')[i-2];
      if(target.tagName==='DETAILS')target.open=true;
      target.scrollIntoView({behavior:'smooth',block:'center'});if(i===1)el('sheetFile').focus();
    }); const [x,y,w,h]=[[117,130,30,30],[285,130,29,30],[118,186,29,31],[285,186,29,31]][i];b.innerHTML=glyph('spreadsheets_mockup_reference.png',458,388,x,y,w,h,'kit-data-icon'); const content=node('div'); while(old.firstChild)content.append(old.firstChild);b.append(content);guide.append(b);
  });
  document.querySelector('.traxio-data-center>.traxio-section-note').hidden=true;
  const dataCenter=document.querySelector('.traxio-data-center'),syncCard=document.querySelector('.traxio-data-primary');
  syncCard.classList.add('card');dataCenter.after(syncCard);
  const syncBar=node('div','approved-sync-bar'),syncText=node('div','approved-sync-text'),syncMark=node('span','approved-sync-mark','✓');
  syncMark.setAttribute('aria-hidden','true');syncText.append(el('traxioSyncSimple'),el('cloudStatus'));syncBar.append(syncMark,syncText,el('cloudCheck'));syncCard.append(syncBar);syncCard.querySelector('.row').remove();
  const tools=node('div','data-tools');syncCard.after(tools);
  [...dataCenter.children].filter(n=>n.classList.contains('traxio-data-block')||n.tagName==='DETAILS').forEach(n=>tools.append(n));
  const importBlock=el('sheetFile').closest('.traxio-data-block');importBlock.classList.add('card');
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

