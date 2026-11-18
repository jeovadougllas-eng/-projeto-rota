/* Explicit Web/PWA activation. No personal store is cleared or migrated here. */
(function(){
 'use strict';
 if(!('serviceWorker' in navigator)||!window.isSecureContext||window.TraxioNative||window.Capacitor?.isNativePlatform?.())return;
 const sw=navigator.serviceWorker,$=id=>document.getElementById(id);
 let registration=null,pending=null,dismissed=null,checking=false,lastCheck=0,request=null,requestTimer=null,lock=null,reloading=false,previousFocus=null;
 const bar=document.createElement('aside');bar.id='pwaUpdateNotice';bar.hidden=true;bar.setAttribute('aria-labelledby','pwaUpdateTitle');bar.innerHTML='<strong id="pwaUpdateTitle">Nova versão do RotaMapa disponível</strong><p id="pwaUpdateMessage" role="status" aria-live="polite">A atualização está pronta. Você escolhe quando aplicar.</p><div><button type="button" id="pwaUpdateApply">Atualizar agora</button><button type="button" id="pwaUpdateLater" class="secondary">Depois</button></div>';
 const curtain=document.createElement('dialog');curtain.id='pwaUpdateLock';curtain.setAttribute('aria-labelledby','pwaUpdateLockTitle');curtain.innerHTML='<h2 id="pwaUpdateLockTitle">Atualizando o RotaMapa</h2><p role="status">Conferindo as janelas abertas e ativando a nova versão. Seus dados salvos permanecem neste aparelho.</p>';curtain.addEventListener('cancel',e=>e.preventDefault());
 const messages={editing:'Salve o pedido ou cadastro em edição e feche a tela aberta antes de atualizar.',route:'Conclua ou encerre a rota em andamento antes de atualizar.',busy:'Aguarde a operação em andamento terminar antes de atualizar.',auth:'Conclua o acesso ou limpe os campos de entrada antes de atualizar.',other:'Outra janela do RM está em uso. Salve e feche as telas em edição nas outras janelas e tente novamente.',timeout:'Uma janela não respondeu. Conclua seu trabalho e feche as outras janelas do RM antes de tentar novamente.'};
 function visible(n){return !!n&&!n.hidden&&!!n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden';}
 function blocker(){
  if(document.body.classList.contains('pin-mode')||document.body.classList.contains('pin-review-active'))return 'editing';
  if(window.TraxeloLocations?.searching)return 'busy';
  if([...document.querySelectorAll('dialog[open],[role="dialog"][aria-modal="true"],.traxio-auth-overlay:not([hidden])')].some(n=>n!==curtain&&visible(n)))return 'editing';
  const nav=window.TraxeloNavigation?.state?.();if(nav&&(nav.tracking||nav.watching||nav.stops?.length)||visible($('liveNavigation')))return 'route';
  if([...document.querySelectorAll('[aria-busy="true"]')].some(visible))return 'busy';
  if(document.body.classList.contains('auth-locked')&&[...document.querySelectorAll('#authScreen input[type="password"],#authScreen input[type="email"]')].some(n=>visible(n)&&n.value))return 'auth';
  if(/[?&](code|access_token|error)=/.test(location.search)||/access_token=/.test(location.hash))return 'auth';
  return null;
 }
 function size(){if(!bar.hidden)document.body.style.setProperty('--rm-update-notice-height',Math.ceil(bar.getBoundingClientRect().height)+'px');}
 function show(text){if(!document.body)return;if(bar.hidden)previousFocus=document.activeElement;bar.hidden=false;document.body.classList.add('rm-pwa-update-visible');if(text)$('pwaUpdateMessage').textContent=text;size();}
 function hide(){bar.hidden=true;document.body.classList.remove('rm-pwa-update-visible');}
 function offer(worker,force=false){if(!worker||worker.state!=='installed')return;pending=worker;if(force||dismissed!==worker)show('A atualização está pronta. Os dados salvos no aparelho serão preservados, inclusive os que aguardam sincronização.');}
 function release(text){clearTimeout(requestTimer);if(lock){clearTimeout(lock.timer);lock=null;curtain.close();}request=null;$('pwaUpdateApply').disabled=false;$('pwaUpdateLater').disabled=false;if(text)show(text);}
 function reload(){if(!lock||reloading)return;reloading=true;location.reload();}
 function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed')setTimeout(()=>offer(registration?.waiting),0);if(worker.state==='activated'&&lock?.worker===worker)reload();if(worker.state==='redundant'){window.dispatchEvent(new Event('rotamapa:offline-shell-error'));if(lock?.worker===worker)release('A atualização mudou ou não pôde ser concluída. Seus dados foram preservados; tente novamente.');if(pending===worker)pending=null;}});}
 async function register(){if(registration)return registration;registration=await sw.register('/iphone-sw.js',{scope:'/',updateViaCache:'none'});registration.addEventListener('updatefound',()=>watch(registration.installing));watch(registration.installing);offer(registration.waiting);if(!await caches.match('/'))window.dispatchEvent(new Event('rotamapa:offline-shell-preparing'));return registration;}
 async function check(force=false){
  if(checking)return{available:!!pending,message:'Verificação em andamento.'};
  if(!navigator.onLine)return{available:!!pending,message:pending?'Atualização já recebida neste aparelho.':'Conecte à internet para procurar atualizações.'};
  if(!force&&Date.now()-lastCheck<60000)return{available:!!pending};
  checking=true;lastCheck=Date.now();try{await register();await registration.update();if(force)dismissed=null;offer(registration.waiting,force);return{available:!!registration.waiting,message:registration.waiting?'Nova versão pronta. Você pode atualizar agora.':registration.installing?'Baixando os arquivos da atualização. Você será avisado quando estiver pronta.':'Nenhuma atualização pronta no momento. O RM continuará verificando automaticamente.'};}catch{return{available:!!pending,message:'Não foi possível verificar agora. Sua versão atual e os dados locais foram mantidos.'};}finally{checking=false;}
 }
 function apply(){
  const reason=blocker();if(reason){show(messages[reason]);return false;}
  const worker=registration?.waiting;if(!worker||worker.state!=='installed'){show('A atualização ainda não está pronta. Verifique novamente com internet.');check(true);return false;}
  if(request||lock)return false;
  request=crypto.randomUUID();requestTimer=setTimeout(()=>{if(!lock)release(messages.timeout);},12000);$('pwaUpdateApply').disabled=$('pwaUpdateLater').disabled=true;show('Conferindo se é seguro atualizar todas as janelas…');try{worker.postMessage({type:'rotamapa:apply-update',id:request});return true;}catch{release('A atualização mudou. Verifique novamente e tente aplicar.');return false;}
 }
 sw.addEventListener('message',event=>{
  const data=event.data,worker=event.source;if(!data||!worker||worker!==registration?.waiting&&worker!==lock?.worker&&worker!==pending)return;
  if(data.type==='rotamapa:update-prepare'){
   const reason=blocker(),can=!reason&&(!lock||lock.id===data.id);if(can&&!lock){clearTimeout(requestTimer);lock={id:data.id,version:data.version,worker,timer:setTimeout(()=>{if(worker.state==='activated')reload();else if(worker.state!=='activating')release('Não foi possível concluir a atualização. Tente novamente; os dados salvos continuam neste aparelho.');},20000)};curtain.showModal();}
   worker.postMessage({type:'rotamapa:update-ready',id:data.id,ok:can,reason:reason||'busy'});
  }else if(data.type==='rotamapa:update-result'&&(request===data.id||lock?.id===data.id))release(messages[data.reason]||messages.other);
  else if(data.type==='rotamapa:update-activated'&&lock?.version===data.version)reload();
 });
 function init(){document.body.append(bar,curtain);$('pwaUpdateApply').onclick=apply;$('pwaUpdateLater').onclick=()=>{dismissed=pending;hide();if(previousFocus?.isConnected)previousFocus.focus();};window.addEventListener('resize',size);if(window.ResizeObserver)new ResizeObserver(size).observe(bar);register().catch(()=>window.dispatchEvent(new Event('rotamapa:offline-shell-error')));}
 window.RotaMapaPwaUpdates=Object.freeze({check,apply,isReloading:()=>reloading});
 window.addEventListener('focus',()=>{if(!document.hidden)check();});window.addEventListener('online',()=>check());document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});setInterval(()=>{if(!document.hidden)check();},300000);
 if(document.readyState==='complete')init();else window.addEventListener('load',init,{once:true});
})();
