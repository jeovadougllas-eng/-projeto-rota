/* Bounded arithmetic parser. No eval, code execution or paid service. */
(function(root){
'use strict';
const gcd=(a,b)=>{a=a<0n?-a:a;while(b){const t=a%b;a=b;b=t;}return a||1n;};
function fraction(n,d=1n){if(!d)throw Error('Divisão por zero');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);n/=g;d/=g;if(n.toString().length>100||d.toString().length>100)throw Error('Conta muito extensa');return{n,d};}
const add=(a,b)=>fraction(a.n*b.d+b.n*a.d,a.d*b.d);
function number(raw){if(raw.length>50)throw Error('Número muito longo');let s=raw;if(s.includes(',')){if(!/^(?:\d{1,3}(?:\.\d{3})+|\d+),\d+$/.test(s))throw Error('Número inválido');s=s.replaceAll('.','').replace(',','.');}else if(/^\d{1,3}(?:\.\d{3})+$/.test(s))s=s.replaceAll('.','');if(!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(s))throw Error('Número inválido');const [a,b='']=s.split('.');return fraction(BigInt((a||'0')+b),10n**BigInt(b.length));}
function evaluate(input){if(input.length>1000)throw Error('Conta muito extensa');const s=input.replace(/[xX×]/g,'*').replace(/÷/g,'/').replace(/−/g,'-');const tokens=[];let p=0;while(p<s.length){if(/\s/.test(s[p])){p++;continue;}const m=s.slice(p).match(/^(?:\d[\d.,]*|\.\d+)/);if(m){tokens.push(m[0]);p+=m[0].length;}else if('+-*/()'.includes(s[p]))tokens.push(s[p++]);else throw Error('Use números e operações');if(tokens.length>300)throw Error('Conta muito extensa');}let i=0,depth=0;
 function factor(){if(++depth>40)throw Error('Parênteses em excesso');const t=tokens[i++];let v;if(t==='+'||t==='-'){v=factor();if(t==='-')v=fraction(-v.n,v.d);}else if(t==='('){v=sum();if(tokens[i++]!==')')throw Error('Feche os parênteses');}else if(t&&/[\d.]/.test(t[0]))v=number(t);else throw Error('Conta incompleta');depth--;return v;}
 function product(){let a=factor();while(['*','/'].includes(tokens[i])){const op=tokens[i++],b=factor();a=op==='*'?fraction(a.n*b.n,a.d*b.d):fraction(a.n*b.d,a.d*b.n);}return a;}
 function sum(){let a=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++],b=product();a=add(a,op==='+'?b:fraction(-b.n,b.d));}return a;}
 const value=sum();if(i!==tokens.length)throw Error('Confira os operadores');return value;
}
function format(v){const negative=v.n<0n,n=negative?-v.n:v.n,scale=100000000n,scaled=(n*scale*2n/v.d+1n)/2n,whole=scaled/scale,rest=(scaled%scale).toString().padStart(8,'0').replace(/0+$/,'');return(negative&&scaled?'-':'')+whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.')+(rest?','+rest.padEnd(2,'0'):'');}
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
function analyze(body){const groups=new Map(),rows=[];let group='Sem loja',include=true,total=fraction(0n),count=0;for(const text of body.split('\n')){let expression=text.trim(),heading=null,lineInclude=include;const colon=expression.indexOf(':');if(colon>=0){heading=expression.slice(0,colon).trim();expression=expression.slice(colon+1).trim();if(heading){const special=/^(?:sub\s*total|total(?: geral)?)(?:\s|$)/.test(norm(heading));if(!special){group=heading;include=true;lineInclude=true;}else{lineInclude=false;if(!expression)include=false;}}}
 const row={text,result:'',error:'',group};if(expression.endsWith('=')){try{const value=evaluate(expression.slice(0,-1));row.result=format(value);row.approximate=value.n*100000000n%value.d!==0n;if(lineInclude){groups.set(group,add(groups.get(group)||fraction(0n),value));total=add(total,value);count++;}}catch(e){row.error=e.message;}}rows.push(row);}
 return{rows,errors:rows.filter(r=>r.error).length,groups:[...groups].map(([name,value])=>({name,total:format(value)})),total:format(total),count};}
root.RotaMapaNotesModel={evaluate,format,analyze};
})(globalThis);
