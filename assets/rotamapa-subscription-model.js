/* Public presentation only. Entitlements always come from the account RPC. */
(function(root){
 'use strict';
 const plans={
  free:{name:'Essencial',phrase:'Seu próximo resultado começa aqui.',monthly:0,annual:0,icon:'pin',features:['1 carteira de clientes','Até 3 rotas salvas','Cadastro e localização de clientes','Planejamento e navegação','Visitas e vendas manuais','Catálogo e cálculo de descontos']},
  plus:{name:'Executivo',phrase:'Sua operação comercial sob seu comando.',monthly:2990,annual:29900,icon:'case',features:['Tudo do Essencial','Até 3 carteiras e 20 rotas salvas','Até 3 importações de PDF por mês, por carteira','Pedidos por PDF e faturamento','Agendamentos e lembretes','Rankings de clientes e produtos','Relatórios em Excel']},
  pro:{name:'Elite',phrase:'Visão estratégica para ir além em cada rota.',monthly:5990,annual:59900,icon:'crown',features:['Tudo do Executivo','Carteiras e rotas salvas sem limite*','Metas e análises avançadas','Rotas por potencial de compra','Planejamento por região','Experiência mais completa']}
 };
 const signature=a=>!!a&&a.signature===true&&a.plan==='pro'&&a.qa!==true;
 const insider=a=>!!a&&a.insider===true&&a.plan==='pro'&&a.qa!==true&&!signature(a);
 function identity(a){if(insider(a))return{key:'insider',name:'Insider',phrase:'Quem vive a experiência ajuda a construir o futuro do RotaMapa.'};if(signature(a))return{key:'signature',name:'Signature',phrase:'Sua assinatura na história do RotaMapa.'};const key=Object.hasOwn(plans,a?.plan)?a.plan:null;return key?{key,name:plans[key].name,phrase:plans[key].phrase}:{key:'pending',name:'Consultando',phrase:'Aguarde a confirmação do seu acesso.'};}
 const money=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
 function next(a){return a?.qa&&!signature(a)&&!insider(a)?({free:'plus',plus:'pro'})[a.plan]||null:null;}
 root.RotaMapaSubscriptionModel={plans,signature,insider,identity,money,next};
})(globalThis);
