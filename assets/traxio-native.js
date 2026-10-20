/* Optional Capacitor bridge. The website uses the same interface without native plugins. */
(function(){
'use strict';
const cap=window.Capacitor;
if(!cap?.isNativePlatform?.())return;
const App=cap.registerPlugin('App'),Browser=cap.registerPlugin('Browser'),Launcher=cap.registerPlugin('AppLauncher'),Geo=cap.registerPlugin('Geolocation');
const native={authRedirect:'app.traxio.mobile://auth/callback',apiBase:'https://traxio-preview.vercel.app',openOAuth:url=>Browser.open({url})};
window.TraxioNative=native;
const active=new Map();let nextId=1;
async function permission(){const p=await Geo.checkPermissions();if(p.location!=='granted'&&p.coarseLocation!=='granted'){const granted=await Geo.requestPermissions({permissions:['location']});if(granted.location!=='granted'&&granted.coarseLocation!=='granted')throw Error('Permita a localização nas configurações do aplicativo.');}}
const fail=(callback,error)=>callback?.({code:1,message:error?.message||'Não foi possível acessar o GPS.'});
const geolocation={
 getCurrentPosition(ok,error,options={}){permission().then(()=>Geo.getCurrentPosition(options)).then(ok,e=>fail(error,e));},
 watchPosition(ok,error,options={}){const id=nextId++;active.set(id,null);permission().then(()=>{if(active.has(id))return Geo.watchPosition({...options,minimumUpdateInterval:2000},(position,err)=>{if(!active.has(id))return;if(err)fail(error,err);else if(position)ok(position);});}).then(async watch=>{if(!watch)return;if(active.has(id))active.set(id,watch);else await Geo.clearWatch({id:watch});}).catch(e=>fail(error,e));return id;},
 clearWatch(id){const nativeId=active.get(id);active.delete(id);if(nativeId)Geo.clearWatch({id:nativeId}).catch(()=>{});}
};
Object.defineProperty(navigator,'geolocation',{value:geolocation,configurable:true});
async function authReturn(url){
 let parsed;try{parsed=new URL(url)}catch{return;}if(parsed.protocol!=='app.traxio.mobile:'||parsed.host!=='auth'||parsed.pathname!=='/callback')return;
 try{
  const error=parsed.searchParams.get('error_description')||parsed.searchParams.get('error');if(error)throw Error(error);
  const code=parsed.searchParams.get('code');if(!code)throw Error('O retorno do login não contém um código válido.');
  for(let tries=0;tries<40;tries++){try{if(authClient)break;}catch{}await new Promise(r=>setTimeout(r,250));}
  if(!authClient)throw Error('Serviço de autenticação indisponível.');
  const {data,error:exchangeError}=await authClient.auth.exchangeCodeForSession(code);if(exchangeError)throw exchangeError;if(data.session?.user)authUnlock(data.session.user);
  await Browser.close().catch(()=>{});
 }catch(e){if(typeof authNotice==='function')authNotice('Não foi possível concluir o login: '+e.message,true);}
}
App.addListener('appUrlOpen',event=>authReturn(event.url));
App.getLaunchUrl().then(result=>{if(result?.url)authReturn(result.url);}).catch(()=>{});
document.addEventListener('click',async event=>{
 const link=event.target.closest('a[data-navigation-provider]');if(!link?.href||link.getAttribute('aria-disabled')==='true')return;
 event.preventDefault();try{const result=await Launcher.openUrl({url:link.href});if(result.completed===false)throw Error('Aplicativo indisponível');}catch{const message=document.getElementById('liveGPSState');if(message)message.textContent='Não foi possível abrir o aplicativo de navegação. Verifique se ele está instalado.';}
});
})();
