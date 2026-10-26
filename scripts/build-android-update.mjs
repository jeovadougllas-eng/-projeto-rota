import {readFile,writeFile,mkdir,readdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),www=new URL('mobile/www/',root);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function list(dir,prefix=''){
 const out=[];for(const e of await readdir(new URL(prefix,dir),{withFileTypes:true})){
  const path=prefix+e.name;if(e.isDirectory())out.push(...await list(dir,path+'/'));
  else if(e.isFile())out.push(path);
 }return out.sort();
}
// Called after build-mobile. The native runtime itself is included and compatibility-gated.
const original=await readFile(new URL('index.html',www),'utf8');
const files={};for(const path of await list(www))files[path]=hash(await readFile(new URL(path,www)));
const tag=process.env.TRAXELO_RELEASE_TAG||'web';
const version=hash(JSON.stringify({schema:1,runtime:'capacitor8-20261026',tag,files}));
await writeFile(new URL('index.html',www),original.replace('</head>',`<meta name="traxelo-release" content="${version}"></head>`));
files['index.html']=hash(await readFile(new URL('index.html',www)));
const release={schema:1,packageId:'app.traxio.mobile',runtime:'capacitor8-20261026',nativeVersion:2,version,files};
await writeFile(new URL('traxelo-release.json',www),JSON.stringify(release));
if(process.env.TRAXELO_UPDATE_OUTPUT){
 const output=new URL(process.env.TRAXELO_UPDATE_OUTPUT+'/',root);await mkdir(new URL('bundles/',output),{recursive:true});
 const archive=new URL('bundles/'+version+'.zip',output);
 await rm(archive,{force:true});
 execFileSync('zip',['-q','-r',fileURLToPath(archive),'.'],{cwd:www});
 const bytes=await readFile(archive);
 await writeFile(new URL('manifest.json',output),JSON.stringify({...release,bundle:'/updates/android/bundles/'+version+'.zip',sha256:hash(bytes),bytes:bytes.length},null,2));
}
console.log(JSON.stringify({version,tag,files:Object.keys(files).length,nativeVersion:2}));
