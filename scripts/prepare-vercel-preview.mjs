// Prepare a separate, allowlisted Preview upload. Never deploys or links a project.
import{mkdtemp,cp,readFile,writeFile,readdir,lstat}from'node:fs/promises';
import{resolve,join}from'node:path';import{fileURLToPath}from'node:url';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
if(execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim()!=='dev/rotamapa-atualizacao-integral')throw Error('Use the authorized development branch.');
if(execFileSync('git',['status','--porcelain','--untracked-files=normal'],{cwd:root,encoding:'utf8'}).trim())throw Error('Commit and validate the changes before attributing a Preview to HEAD.');
const out=await mkdtemp('/workspace/rotamapa-preview-'),commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const entries=['index.html','privacidade.html','termos.html','iphone.webmanifest','iphone-sw.js','iphone-offline.html','assets','api','lib'];
// Refuse symlinks to prevent credentials/private paths escaping the allowlist.
async function inspect(path){const st=await lstat(path);if(st.isSymbolicLink())throw Error('Unexpected symlink: '+path);if(st.isDirectory())for(const name of await readdir(path))await inspect(join(path,name));}
for(const entry of entries){await inspect(join(root,entry));await cp(join(root,entry),join(out,entry),{recursive:true,errorOnExist:true,force:false});}
const config=JSON.parse(await readFile(join(root,'vercel.json'),'utf8'));
// Per-upload configuration only; no change to the linked project's production settings.
Object.assign(config,{framework:null,buildCommand:'',installCommand:'',outputDirectory:'.'});
await writeFile(join(out,'vercel.json'),JSON.stringify(config,null,2)+'\n');
await writeFile(join(out,'package.json'),JSON.stringify({name:'rotamapa-preview-upload',private:true,type:'module'},null,2)+'\n');
const hashes={};async function hashesFor(path,prefix=''){for(const e of await readdir(path,{withFileTypes:true})){const relative=prefix+e.name;if(e.isDirectory())await hashesFor(join(path,e.name),relative+'/');else hashes[relative]=createHash('sha256').update(await readFile(join(path,e.name))).digest('hex');}}
await hashesFor(out);await writeFile(join(out,'rotamapa-preview-build.json'),JSON.stringify({sourceCommit:commit,target:'preview',files:hashes},null,2)+'\n');
console.log(JSON.stringify({directory:out,sourceCommit:commit,files:Object.keys(hashes).length,target:'preview',deployed:false}));
