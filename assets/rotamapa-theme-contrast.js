/* Readability for opt-in themes. No layout, text, event, storage or artwork changes.
   A panel may stay at 25% while only text that needs it receives a solid backing. */
(function(){'use strict';
 const marked=new Set();let scheduled=false,running=false;const pendingRoots=new Set();
 const skip='script,style,svg,canvas,option,#authScreen,#rmThemeBackdrop,#choosePortfolio,.gm-style,.maplibregl-map,.presentation-photo,.rm-theme-swatch';
 function rgba(s){const m=s.match(/[\d.]+/g);return m?[+m[0],+m[1],+m[2],m[3]===undefined?1:+m[3]]:[0,0,0,0];}
 const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
 const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
 function refresh(root=document.body){if(running)return;running=true;try{
  for(const n of marked)if(!n.isConnected||root===document.body||n===root||root.contains(n)){n.removeAttribute('data-rm-readable');marked.delete(n);}
  if(!document.body.classList.contains('rm-field'))return;
  const cache=new WeakMap(),style=n=>{if(!cache.has(n))cache.set(n,getComputedStyle(n));return cache.get(n);},backs=new WeakMap();
  function backgrounds(n){if(n===document.body||!n){const wallpaper=document.getElementById('rmThemeBackdrop')?.style.getPropertyValue('--rm-bg')||'';if(document.body.dataset.rmTheme&&/gradient|url\(/.test(wallpaper))return[[0,0,0],[255,255,255]];const bg=rgba(getComputedStyle(document.body).backgroundColor);return bg[3]===1?[bg.slice(0,3)]:[[0,0,0],[255,255,255]];}if(backs.has(n))return backs.get(n);const bg=rgba(style(n).backgroundColor);let out=backgrounds(n.parentElement).map(b=>blend(bg,b));
   // Decorative photos/gradients can contain any color. An opaque control/plate
   // above them resolves that uncertainty in the subsequent compositing step.
   if(style(n).backgroundImage!=='none'||n.matches('.field-page-hero,.traxio-hero,.showroom-hero'))out=[[0,0,0],[255,255,255]];
   backs.set(n,out);return out;}
  const plan=[];
  const nodes=root===document.body?document.querySelectorAll('main *,nav.tabs *,body>header *,dialog *,dialog,.account-dialog *,#accountMenu *,#traxio-legal-links *,#offlineConnectionStatus,#pwaUpdateNotice *'):[root,...root.querySelectorAll('*')];
  for(const n of nodes){
   if(n.closest(skip))continue;const visible=typeof n.checkVisibility==='function'?n.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}):n.getClientRects().length&&style(n).visibility!=='hidden'&&style(n).opacity!=='0';if(!visible)continue;
   const direct=[...n.childNodes].some(t=>t.nodeType===3&&t.textContent.trim());
   if(!direct&&!n.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]),textarea,select'))continue;
   const st=style(n),fg=rgba(st.color);if(fg[3]===0||st.fontSize==='0px')continue;
   const bgs=backgrounds(n),minimum=c=>{const level=lum(c),low=Math.min(...bgs.map(lum)),high=Math.max(...bgs.map(lum));return level>=low&&level<=high?1:Math.min(...bgs.map(bg=>ratio(blend(c,bg),bg)));};
   if(minimum(fg)>=4.55)continue;
   const black=[0,0,0,1],white=[255,255,255,1];
   if(minimum(black)>=4.55||minimum(white)>=4.55)plan.push([n,minimum(black)>minimum(white)?'black':'white']);
   else plan.push([n,n.closest('.field-page-hero,.traxio-hero,.showroom-hero')?'hero':'plate']);
  }
  for(const[n,value]of plan){n.dataset.rmReadable=value;marked.add(n);}
 }finally{running=false;}}
 function schedule(root=document.body){if(!(root instanceof Element))root=document.body;pendingRoots.add(root);if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;const roots=[...pendingRoots];pendingRoots.clear();for(const n of roots)if(n.isConnected&&!roots.some(other=>other!==n&&other.contains(n)))refresh(n);});}
 new MutationObserver(records=>{for(const r of records){const root=r.target.nodeType===1?r.target:r.target.parentElement;if(root?.closest('.gm-style,.maplibregl-map,#rmThemeBackdrop'))continue;schedule(root);}}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden','open','disabled','aria-selected','aria-pressed','data-rm-theme']});
 window.addEventListener('resize',()=>schedule());for(const event of ['pointerover','pointerout','focusin','focusout'])document.addEventListener(event,e=>{const control=e.target.closest?.('button,a,input,textarea,select,summary,[role=button]');if(control)schedule(control.parentElement);},true);document.addEventListener('transitionend',e=>schedule(e.target.parentElement),true);document.addEventListener('toggle',e=>schedule(e.target),true);
 window.RotaMapaThemeContrast=Object.freeze({refresh});schedule();
})();
