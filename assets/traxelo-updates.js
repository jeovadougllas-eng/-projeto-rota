/* Only the new Android binary exposes this plugin. The website needs no installer. */
(function(){
 'use strict';
 if(!window.Capacitor?.isNativePlatform?.()||!Capacitor.isPluginAvailable?.('TraxeloUpdates'))return;
 const updates=Capacitor.registerPlugin('TraxeloUpdates');
 let checking=false,lastCheck=0;
 const version=()=>document.querySelector('meta[name="traxelo-release"]')?.content;
 function show(message){
  let status=document.getElementById('appUpdateStatus');
  if(!status){status=document.createElement('p');status.id='appUpdateStatus';status.className='muted app-update-status';status.setAttribute('role','status');document.querySelector('#dados .tab-title')?.after(status);}
  status.textContent=message;
 }
 async function check(force=false){
  if(checking||(!force&&Date.now()-lastCheck<3600000))return;
  checking=true;lastCheck=Date.now();
  try{const result=await updates.check();show(result.pending?'Atualização recebida. Será aplicada na próxima abertura do aplicativo.':result.nativeRequired?'Uma nova versão Android é necessária para receber as próximas melhorias.':'Aplicativo atualizado. As próximas melhorias serão verificadas automaticamente.');return result;}
  catch{show('Não foi possível verificar atualizações agora. A versão instalada continua disponível.');}
  finally{checking=false;}
 }
 window.TraxeloUpdates={check};
 document.addEventListener('DOMContentLoaded',()=>{
  if(!document.body.classList.contains('traxio-ui-ready'))return;
  requestAnimationFrame(()=>{if(document.getElementById('plannerState'))updates.ready({version:version()}).catch(()=>{});});
  setTimeout(()=>check(),5000);
  Capacitor.registerPlugin('App').addListener('appStateChange',({isActive})=>{if(isActive)check();}).catch(()=>{});
 });
})();
