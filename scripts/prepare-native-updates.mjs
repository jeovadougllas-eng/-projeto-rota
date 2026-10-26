import {cp,mkdir} from 'node:fs/promises';
const target=new URL('../mobile/android/app/src/main/java/app/traxio/mobile/',import.meta.url);
await mkdir(target,{recursive:true});
for(const name of ['MainActivity.java','TraxeloUpdatesPlugin.java','UpdateBundle.java'])await cp(new URL('../mobile/native/'+name,import.meta.url),new URL(name,target));
console.log('Prepared the local Android update plugin; localhost origin and OAuth identifiers retained.');
