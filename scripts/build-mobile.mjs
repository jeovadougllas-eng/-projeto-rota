import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const {execFileSync}=await import('node:child_process');
execFileSync(process.execPath,[fileURLToPath(new URL('./prepare-rotamapa-brand.mjs',import.meta.url))],{stdio:'inherit'});
const target=new URL('../mobile/www/',import.meta.url);
await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
await cp(new URL('../assets/',import.meta.url),new URL('assets/',target),{recursive:true});
const esbuild=createRequire(new URL('../mobile/package.json',import.meta.url))('esbuild');
await esbuild.build({entryPoints:[fileURLToPath(new URL('../mobile/runtime-entry.js',import.meta.url))],bundle:true,platform:'browser',format:'iife',outfile:fileURLToPath(new URL('assets/capacitor-runtime.js',target))});
let html=await readFile(new URL('../index.html',import.meta.url),'utf8');
// iPhone PWA controls and service-worker metadata are web-only; never ship them in the native shell.
html=html.replace(/<!-- iphone-pwa:start -->[\s\S]*?<!-- iphone-pwa:end -->/g,'').replace(',viewport-fit=cover','');
html=html.replace('<script src="assets/traxio-native.js"></script>','<script src="assets/capacitor-runtime.js"></script><script src="assets/traxio-native.js"></script>');
await writeFile(new URL('index.html',target),html);
execFileSync(process.execPath,[fileURLToPath(new URL('./prepare-native-updates.mjs',import.meta.url))],{stdio:'inherit'});
execFileSync(process.execPath,[fileURLToPath(new URL('./build-android-update.mjs',import.meta.url))],{stdio:'inherit'});
console.log('Bundled RotaMapa with approved scenic assets and compatible native identifiers.');
