import{readFile,readdir,writeFile}from'node:fs/promises';import{join,resolve}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';
export async function prepareOfflineFiles(root,version='v1'){
 const files=[],add=async(path,local)=>files.push({path,sha256:createHash('sha256').update(await readFile(local)).digest('hex')});
 for(const path of ['/','/iphone.webmanifest','/iphone-offline.html'])await add(path,join(root,path==='/'?'index.html':path.slice(1)));
 async function walk(dir,prefix){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.isDirectory())await walk(join(dir,entry.name),prefix+entry.name+'/');else if(prefix+entry.name!=='/assets/rotamapa-offline-files.json')await add(prefix+entry.name,join(dir,entry.name));}}
 await walk(join(root,'assets'),'/assets/');await writeFile(join(root,'assets/rotamapa-offline-files.json'),JSON.stringify({version,files})+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await prepareOfflineFiles(fileURLToPath(new URL('../',import.meta.url)));
