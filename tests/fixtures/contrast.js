// Test-only computed contrast audit. Treat the wallpaper as both black and white:
// arbitrary imported photos cannot be represented by a single average color.
export function auditContrast(){
 const rgba=s=>{const m=s.match(/[\d.]+/g);return m?[+m[0],+m[1],+m[2],m[3]===undefined?1:+m[3]]:[0,0,0,0];};
 const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
 const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
 const issues=[];let count=0;
 const path=n=>n.id?'#'+n.id:n.tagName.toLowerCase()+[...n.classList].slice(0,3).map(c=>'.'+c).join('');
 for(const n of document.querySelectorAll('body *')){
  if(n.closest('script,style,canvas,#authScreen,#rmThemeBackdrop,.gm-style,.maplibregl-map,.rm-theme-swatch,#choosePortfolio')||!n.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
  const text=[...n.childNodes].filter(t=>t.nodeType===3).map(t=>t.textContent.trim()).join(' ').trim();
  if(!text&&!n.matches('input:not([type=checkbox]):not([type=range]):not([type=color]),textarea,select'))continue;
  if(n.closest('svg')&&!n.matches('text'))continue;if(n.matches('option')||getComputedStyle(n).fontSize==='0px')continue;
  const chain=[];let cur=n;while(cur&&cur!==document.body){chain.unshift(cur);cur=cur.parentElement;}
  let worst=22,best=0;const levels=[];const fg=rgba(getComputedStyle(n)[n.matches('svg text')?'fill':'color']);const wallpaper=document.getElementById('rmThemeBackdrop')?.style.getPropertyValue('--rm-bg')||'',root=rgba(getComputedStyle(document.body).backgroundColor),uncertain=!!document.body.dataset.rmTheme&&/gradient|url\(/.test(wallpaper)||chain.some(a=>getComputedStyle(a).backgroundImage!=='none'||a.matches('.field-page-hero,.traxio-hero,.showroom-hero'));const bases=!uncertain&&root[3]===1?[root.slice(0,3)]:[[0,0,0],[255,255,255]];for(const base of bases){let bg=base;
   for(const a of chain){const st=getComputedStyle(a);bg=blend(rgba(st.backgroundColor),bg);if(st.backgroundImage!=='none'||a.matches('.field-page-hero,.traxio-hero,.showroom-hero'))bg=base;}
   levels.push(lum(bg));const r=ratio(blend(fg,bg),bg);worst=Math.min(worst,r);best=Math.max(best,r);
  }
  if(lum(fg)>=Math.min(...levels)&&lum(fg)<=Math.max(...levels))worst=1;count++;if(worst<4.49)issues.push({selector:path(n),parent:path(n.parentElement),text:(text||n.getAttribute('placeholder')||n.tagName).slice(0,70),fg:getComputedStyle(n).color,bg:getComputedStyle(n).backgroundColor,ratio:+worst.toFixed(2),kind:best<4.49?'color':'backdrop'});
 }
 return{count,issues};
}
