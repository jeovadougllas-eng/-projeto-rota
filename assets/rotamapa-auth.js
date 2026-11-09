/* Shared Web/PWA/Android callback guard. No storage, redirect or session mutations. */
(function(root){
 'use strict';
 const exchanges=new WeakMap();
 function exchange(client,code){
  if(typeof code!=='string'||!code.trim())return Promise.reject(new Error('O retorno do login não contém um código válido.'));
  if(!client?.auth?.exchangeCodeForSession)return Promise.reject(new Error('Serviço de autenticação indisponível.'));
  const previous=exchanges.get(client);
  if(previous?.code===code)return previous.promise;
  const promise=Promise.resolve().then(()=>client.auth.exchangeCodeForSession(code));
  exchanges.set(client,{code,promise});
  return promise;
 }
 function message(error){
  if(/code verifier|auth code|pkce/i.test(String(error?.message||'')))return 'Não foi possível concluir o login neste endereço. Retorne ao mesmo navegador e endereço em que iniciou o login e tente novamente. Seus dados não foram apagados.';
  return 'Não foi possível finalizar o login. Tente novamente no mesmo endereço ou verifique sua conexão.';
 }
 root.RotaMapaAuth=Object.freeze({exchange,message});
})(globalThis);
