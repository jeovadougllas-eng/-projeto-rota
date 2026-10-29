/* iPhone install guidance: iOS requires the user's browser Share menu to add a web app. */
(function(){
'use strict';
function initialize(){
if(window.TraxioNative||window.Capacitor?.isNativePlatform?.()||!/iPhone|iPod/i.test(navigator.userAgent))return;
const standalone=matchMedia('(display-mode: standalone)'),isInstalled=()=>standalone.matches||navigator.standalone===true;
const header=document.querySelector('body>header'),theme=document.getElementById('themeToggle'),account=document.getElementById('accountArea');
if(!header||!theme)return;
const tools=document.createElement('div');tools.id='iphoneInstallTools';tools.setAttribute('aria-label','Aparência e instalação');
const button=document.createElement('button');button.id='iphoneInstallButton';button.type='button';button.title='Adicionar RotaMapa à Tela de Início';button.setAttribute('aria-label','Instalar RotaMapa no iPhone');
button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8M5 10v11h8M9 21v-7h5M18 14v8M14 18h8"/></svg><span>Instalar</span>';
const dialog=document.createElement('dialog');dialog.id='iphoneInstallDialog';dialog.setAttribute('aria-labelledby','iphoneInstallTitle');
dialog.innerHTML='<div class="iphone-install-heading"><img src="/assets/rotamapa/icon-180.png" width="56" height="56" alt=""><div><h2 id="iphoneInstallTitle" tabindex="-1">RotaMapa no seu iPhone</h2><p>Acesse pelo ícone na Tela de Início.</p></div></div><p id="iphoneBrowserHelp"></p><ol id="iphoneInstallSteps"></ol><p class="iphone-install-note">A instalação é concluída no menu do navegador. Se não encontrar a opção, copie o link e abra-o no Safari.</p><p class="iphone-install-note">Já usa o RotaMapa? Confira a sincronização em Planilhas antes de instalar. Ao abrir pelo ícone, entre na mesma conta para acessar seus dados sincronizados.</p><div class="iphone-install-actions"><button type="button" id="copyIphoneAppLink" class="secondary">Copiar link do aplicativo</button><button type="button" id="closeIphoneInstall">Entendi</button></div><p id="iphoneInstallStatus" role="status" aria-live="polite"></p>';
document.body.append(dialog);
const browser=/CriOS/i.test(navigator.userAgent)?'Chrome':/FxiOS/i.test(navigator.userAgent)?'Firefox':/EdgiOS/i.test(navigator.userAgent)?'Edge':/Version\/[\d.]+.*Safari/i.test(navigator.userAgent)?'Safari':'seu navegador';
const inApp=/FBAN|FBAV|Instagram|Line\/|GSA\//i.test(navigator.userAgent);
document.getElementById('iphoneBrowserHelp').textContent=inApp?'Abra este link no Safari ou Chrome para adicionar o aplicativo.':browser==='Safari'?'No Safari, siga estes passos:':'No '+browser+', use o menu de compartilhamento:';
const steps=browser==='Safari'?['Toque em Compartilhar (quadrado com seta para cima). Em algumas versões, abra primeiro o menu •••.','Escolha Adicionar à Tela de Início. Se não aparecer, procure em Editar Ações.','Ative Abrir como App, se essa opção aparecer, e toque em Adicionar.']:['Toque em Compartilhar, ao lado da barra de endereço ou dentro do menu •••.','Escolha Adicionar à Tela de Início.','Confirme o nome RotaMapa e toque em Adicionar. Se a opção não estiver disponível, abra o link no Safari.'];
const list=document.getElementById('iphoneInstallSteps');for(const text of steps){const item=document.createElement('li');item.textContent=text;list.append(item);}
button.onclick=()=>{if(!dialog.open){dialog.showModal();dialog.scrollTop=0;document.getElementById('iphoneInstallTitle').focus({preventScroll:true});}};
document.getElementById('closeIphoneInstall').onclick=()=>dialog.close();
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{if(!button.hidden&&button.isConnected)button.focus();});
document.getElementById('copyIphoneAppLink').onclick=async()=>{
 const canonical=location.origin+'/',status=document.getElementById('iphoneInstallStatus');
 try{await navigator.clipboard.writeText(canonical);status.textContent='Link copiado. Cole-o no Safari para continuar.';}
 catch{status.replaceChildren(document.createTextNode('Copie este link e abra-o no Safari: '));const link=document.createElement('input');link.type='url';link.readOnly=true;link.value=canonical;link.setAttribute('aria-label','Link do aplicativo');status.append(link);link.focus();link.select();}
};
function positionTools(){
 const enabled=!isInstalled();if(document.body.classList.contains('iphone-install-available')!==enabled)document.body.classList.toggle('iphone-install-available',enabled);if(document.body.classList.contains('iphone-pwa-standalone')===enabled)document.body.classList.toggle('iphone-pwa-standalone',!enabled);
 if(!enabled){dialog.close();tools.remove();if(theme.parentElement!==header)header.insertBefore(theme,account);return;}
 if(theme.parentElement!==tools)tools.append(theme);if(button.parentElement!==tools)tools.append(button);
 const parent=document.body.classList.contains('auth-locked')?document.querySelector('#authScreen .auth-panel'):header;
 if(parent&&tools.parentElement!==parent){if(parent===header)header.insertBefore(tools,account);else parent.insertBefore(tools,parent.children[1]||null);}
}
document.getElementById('accountToggle')?.setAttribute('aria-label','Abrir menu da conta');
positionTools();standalone.addEventListener('change',positionTools);window.addEventListener('appinstalled',positionTools);
new MutationObserver(positionTools).observe(document.body,{attributes:true,attributeFilter:['class']});
if('serviceWorker' in navigator&&window.isSecureContext){
 const register=()=>navigator.serviceWorker.register('/iphone-sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{});
 if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
