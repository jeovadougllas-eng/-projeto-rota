// Public runtime only. Private scope, contracts, tests, SQL and APKs never enter the web output.
import {cp,lstat,mkdir,readdir,readFile,rm,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'preview-runtime');
const release=process.env.ROTAMAPA_PUBLIC_RELEASE==='1';
if(process.env.VERCEL_ENV==='production'&&!release)throw Error('Use the explicitly authorized production build entry.');
const commit=process.env.VERCEL_GIT_COMMIT_SHA||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
if(!/^[a-f0-9]{40}$/.test(commit))throw Error('A verified source commit is required.');
const allowed=['index.html','privacidade.html','termos.html','iphone.webmanifest','iphone-sw.js','iphone-offline.html','assets'];
if(release){
 const manifest=JSON.parse(await readFile(join(root,'updates/android/manifest.json'),'utf8'));
 if(manifest.runtime!=='capacitor8-20261026'||manifest.nativeVersion!==2||!/^\/updates\/android\/bundles\/[a-f0-9]{64}\.zip$/.test(manifest.bundle))throw Error('Invalid Android release manifest.');
 const archive=await readFile(join(root,manifest.bundle.slice(1)));
 if(archive.length!==manifest.bytes||createHash('sha256').update(archive).digest('hex')!==manifest.sha256)throw Error('Android update integrity mismatch.');
 for(const [name,digest] of Object.entries(manifest.files)){
  if(name.startsWith('assets/')&&name!=='assets/capacitor-runtime.js'){
   if(name.includes('..')||createHash('sha256').update(await readFile(join(root,name))).digest('hex')!==digest)throw Error('Android and web sources differ: '+name);
  }
 }
 allowed.push('updates/android/manifest.json','updates/android/candidate.json',manifest.bundle.slice(1),'docs/android-install.html','downloads/rotamapa-android-testes.apk','downloads/rotamapa-android-1.7.0-testes.apk','downloads/traxio-android-testes.apk');
}
if(!process.env.VERCEL){
 const branch=process.env.GITHUB_REF_NAME||execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();
 if(branch!=='dev/rotamapa-atualizacao-integral')throw Error('Use the authorized development branch.');
 execFileSync('git',['diff','--exit-code','HEAD','--',...allowed],{cwd:root,stdio:'pipe'});
 if(execFileSync('git',['ls-files','--others','--exclude-standard','--',...allowed],{cwd:root,encoding:'utf8'}).trim())throw Error('Uncommitted public runtime files.');
}
async function inspect(path){const s=await lstat(path);if(s.isSymbolicLink())throw Error('Unexpected symlink in public runtime.');if(s.isDirectory())for(const name of await readdir(path))await inspect(join(path,name));}
for(const name of allowed)await inspect(join(root,name));
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
for(const name of allowed){await mkdir(join(output,name,'..'),{recursive:true});await cp(join(root,name),join(output,name),{recursive:true});}
const files={};
async function hashDirectory(path,prefix=''){for(const e of await readdir(path,{withFileTypes:true})){const name=prefix+e.name;if(e.isDirectory())await hashDirectory(join(path,e.name),name+'/');else files[name]=createHash('sha256').update(await readFile(join(path,e.name))).digest('hex');}}
await hashDirectory(output);
await writeFile(join(output,'rotamapa-preview-build.json'),JSON.stringify({sourceCommit:commit,target:release?'production':'preview',files},null,2)+'\n');
console.log(JSON.stringify({sourceCommit:commit,output:'preview-runtime',publicFiles:Object.keys(files).length,deployed:false}));
