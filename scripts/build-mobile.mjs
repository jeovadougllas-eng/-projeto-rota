import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
const target=new URL('../mobile/www/',import.meta.url);
await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
await cp(new URL('../assets/',import.meta.url),new URL('assets/',target),{recursive:true});
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
await writeFile(new URL('index.html',target),html);
console.log('Bundled the approved Traxio interface and original visual assets for native apps.');
