/* Deterministic campaign artwork. Prices come from the existing quotation engine. */
(function(root){
 'use strict';
 const M=root.RotaMapaCommerceModel,navy='#153c55',pink='#a52f69',teal='#008878';
 const day=s=>s.split('-').reverse().join('/');
 function wrap(ctx,text,width){const lines=[];let line='';for(const word of String(text).split(/\s+/)){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>width){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
 function bounds(products){return [...new Set(products.map(p=>day(p.start)+' a '+day(p.end)))].join('; ');}
 function caption(mode,date,groups){
  if(mode==='super_combo')return ['🔥 SUPER COMBO DE OFERTAS EMS','Seu próximo pedido pode render mais! Aproveite as condições do Acelera e do Dia D de '+day(date)+'.',...groups.map(g=>g.title+': '+bounds(g.products)+'.'),'Preços por unidade, já com impostos. Cada campanha tem seus próprios mínimos e condições; os descontos não se acumulam.','Fale comigo, confira as condições especiais e antecipe seu pedido!'].join('\n\n');
  return ['DIA D DE OFERTAS EMS','Vigência: '+day(date)+' a '+day(date),'Preços por unidade, já com impostos.',...groups[0].products.map(p=>p.name+'\nTabela: '+M.brl(p.priceCents)+'\n'+p.tiers.map(t=>'A partir de '+t.minimum+' un.: '+M.brl(t.priceCents)+' / un.').join(' | ')),'Cada apresentação tem sua própria quantidade mínima. Confira as condições especiais comigo!'].join('\n\n');
 }
 async function render({mode,date,groups,photo,check}){
  if(!M.day(date)||!['dia_d','super_combo'].includes(mode))throw Error('Confira o modelo e a data do card.');
  for(const g of groups){if(!g.products.length)throw Error('Não há condições de '+g.title+' para a data escolhida.');const ids=new Set();for(const p of g.products){if(ids.has(p.id))throw Error('Há mais de uma condição de '+p.name+' em '+g.title+'. Revise as campanhas antes de gerar o card.');ids.add(p.id);}}
  const combo=mode==='super_combo',canvas=document.createElement('canvas');canvas.width=combo?1800:1080;
  const ctx=canvas.getContext('2d'),gap=28,margin=40,colWidth=combo?(canvas.width-margin*2-gap)/2:canvas.width-margin*2;
  const columns=groups.map(g=>{const products=[...g.products].sort(M.productOrder).map(p=>({...p,tiers:[...p.tiers].sort((a,b)=>a.minimum-b.minimum)}));return{...g,products,rows:products.map(p=>{ctx.font='700 28px Arial, sans-serif';const names=wrap(ctx,p.name,colWidth-162);ctx.font='700 25px Arial, sans-serif';const tiers=p.tiers.map(t=>t.minimum+' un. · '+M.brl(t.priceCents)+' / un.');return{p,names,tiers,height:Math.max(170,38+names.length*33+33+tiers.length*32)};})};});
  const top=combo?260:225,bodyHeight=Math.max(...columns.map(g=>g.rows.reduce((n,r)=>n+r.height+10,0)));
  canvas.height=top+bodyHeight+150;if(canvas.height>28000)throw Error('Há produtos demais para um único card. Divida a campanha.');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  if(combo){const gradient=ctx.createLinearGradient(0,0,canvas.width,210);gradient.addColorStop(0,'#073858');gradient.addColorStop(1,'#07639b');ctx.fillStyle=gradient;ctx.fillRect(0,0,canvas.width,190);ctx.fillStyle='#1dc5c4';ctx.fillRect(0,190,canvas.width,7);ctx.fillStyle='#fff';ctx.font='700 59px Arial, sans-serif';ctx.fillText('SUPER COMBO DE OFERTAS',260,90);ctx.font='29px Arial, sans-serif';ctx.fillText('Mais oportunidades para o seu próximo pedido.',260,143);
  }else{ctx.fillStyle=navy;ctx.font='700 47px Arial, sans-serif';ctx.fillText('DIA D DE OFERTAS',margin,80);ctx.fillStyle='#111';ctx.font='700 38px Arial, sans-serif';ctx.fillText(day(date),margin,137);ctx.fillStyle='#dce7ed';ctx.fillRect(margin,178,canvas.width-margin*2,2);}
  const response=await fetch('assets/brands/ems.png');check();if(!response.ok)throw Error('Não foi possível carregar a logo EMS. Tente novamente.');const logo=await createImageBitmap(await response.blob());try{check();const maxW=combo?180:145,maxH=combo?125:110,scale=Math.min(maxW/logo.width,maxH/logo.height);ctx.drawImage(logo,combo?42:canvas.width-190,combo?28:34,logo.width*scale,logo.height*scale);}finally{logo.close();}
  for(const [index,g] of columns.entries()){
   const x=margin+index*(colWidth+gap);let y=top;
   if(combo){ctx.fillStyle=index?pink:navy;ctx.beginPath();ctx.roundRect(x,215,colWidth,47,9);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 28px Arial, sans-serif';ctx.fillText(g.title.toUpperCase(),x+20,247);y+=17;}
   for(const r of g.rows){check();const {p,names,tiers}=r;
    if(combo){ctx.fillStyle='#f7fafc';ctx.strokeStyle='#c1d5e0';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x,y,colWidth,r.height,16);ctx.fill();ctx.stroke();}
    const tx=x+150;let ty=y+37;ctx.fillStyle=navy;ctx.font='700 28px Arial, sans-serif';for(const name of names){ctx.fillText(name,tx,ty);ty+=33;}
    ctx.fillStyle='#52636b';ctx.font='25px Arial, sans-serif';ctx.fillText('Tabela '+M.brl(p.priceCents),tx,ty);ty+=34;
    ctx.fillStyle=combo?teal:pink;ctx.font='700 25px Arial, sans-serif';for(const tier of tiers){ctx.fillText(tier,tx,ty);ty+=32;}
    const asset=await photo(p);check();if(asset){const bitmap=await createImageBitmap(asset.blob);try{check();const [sx,sy,sw,sh]=asset.crop||[0,0,bitmap.width,bitmap.height],scale=Math.min(120/sw,(r.height-25)/sh);ctx.drawImage(bitmap,sx,sy,sw,sh,x+12+(120-sw*scale)/2,y+(r.height-sh*scale)/2,sw*scale,sh*scale);}finally{bitmap.close();}}else{ctx.fillStyle='#73858c';ctx.font='18px Arial, sans-serif';ctx.fillText('Foto pendente',x+12,y+r.height/2);}
    if(!combo){ctx.strokeStyle='#e0e5e8';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y+r.height);ctx.lineTo(x+colWidth,y+r.height);ctx.stroke();}y+=r.height+10;
   }
  }
  const fy=canvas.height-120;ctx.fillStyle=navy;ctx.beginPath();ctx.roundRect(margin,fy,canvas.width-margin*2,57,12);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 27px Arial, sans-serif';ctx.textAlign='center';ctx.fillText(combo?'PREÇOS POR UNIDADE, JÁ COM IMPOSTOS':'OFERTAS VÁLIDAS SOMENTE EM '+day(date),canvas.width/2,fy+38);
  ctx.fillStyle='#677780';ctx.font='22px Arial, sans-serif';ctx.fillText(combo?'Cada campanha tem seus próprios mínimos. Descontos não cumulativos.':'Preços por unidade, já com impostos. Quantidades conforme oferta.',canvas.width/2,canvas.height-23);ctx.textAlign='left';
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));check();if(!blob)throw Error('Não foi possível gerar o card.');return{blob,caption:caption(mode,date,columns)};
 }
 root.RotaMapaOfferCards=Object.freeze({render});
})(globalThis);
