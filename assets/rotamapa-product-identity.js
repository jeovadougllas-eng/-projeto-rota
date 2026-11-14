/* Verified EMS presentation references. Never change product IDs or historical sale snapshots. */
(function(root){
'use strict';
const code=v=>String(v||'').trim().replace(/^0+/,'');
function conflicted(p){const known=Object.entries(root.RotaMapaProductPhotos||{}).filter(([,r])=>code(r.code)&&code(r.code)===code(p?.code));return !!(p?.ean&&known.length===1&&p.ean!==known[0][0]);}
function reference(p){if(conflicted(p))return null;const all=Object.entries(root.RotaMapaProductPhotos||{}),direct=all.filter(([ean])=>[p.ean,p.code].some(v=>String(v||'')===ean));if(direct.length)return direct.length===1?{ean:direct[0][0],...direct[0][1]}:null;const mapped=all.filter(([,r])=>code(r.code)&&code(r.code)===code(p.code));return mapped.length===1?{ean:mapped[0][0],...mapped[0][1]}:null;}
function ean(p){return /^\d{13,14}$/.test(p?.ean||'')?p.ean:reference(p||{})?.ean||(/^\d{13,14}$/.test(p?.code||'')?p.code:'');}
function match(value,products){const hits=products.filter(p=>!p.disabled&&!conflicted(p)&&ean(p)===String(value));return hits.length===1?hits[0]:null;}
function standard(p){const r=reference(p);if(!r||p.disabled||p.ean&&p.ean!==r.ean)return p;const aliases=[...new Set([...(p.aliases||[]),p.name].filter(n=>n&&n!==r.name))].slice(-20);return {...p,ean:r.ean,name:r.name,aliases};}
root.RotaMapaProductIdentity={reference,ean,match,standard,conflicted};
})(globalThis);
