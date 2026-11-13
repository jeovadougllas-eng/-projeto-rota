import {readFile} from'node:fs/promises';import{createHash}from'node:crypto';
const root=new URL('../assets/vendor/offline/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
for(const {file,sha256}of manifest.files){if(file.includes('/')||file.includes('..'))throw Error('Invalid vendor path');if(createHash('sha256').update(await readFile(new URL(file,root))).digest('hex')!==sha256)throw Error('Offline dependency changed: '+file);}
console.log('Verified pinned offline SDKs and their licenses.');
