// Production-size exports from the approved source art; no lettering is redrawn.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),sharp=createRequire(new URL('mobile/package.json',root))('sharp');
const dir=new URL('assets/rotamapa/',root);
if(process.env.ROTAMAPA_APPROVED_LOGO&&process.env.ROTAMAPA_APPROVED_ICON){
 await mkdir(dir,{recursive:true});
 await sharp(process.env.ROTAMAPA_APPROVED_LOGO).extract({left:130,top:286,width:1540,height:306}).webp({lossless:true}).toFile(fileURLToPath(new URL('logo.webp',dir)));
 await sharp(process.env.ROTAMAPA_APPROVED_ICON).resize(512,512).png().toFile(fileURLToPath(new URL('icon-512.png',dir)));
 for(const size of [32,180,192])await sharp(process.env.ROTAMAPA_APPROVED_ICON).resize(size,size).png().toFile(fileURLToPath(new URL(`icon-${size}.png`,dir)));
}
// Native label/icon are build outputs. Keep package, OAuth scheme and local data keys.
const native=new URL('mobile/android/app/src/main/res/',root);
await mkdir(new URL('drawable/',native),{recursive:true});
await writeFile(new URL('drawable/traxio_icon.png',native),await readFile(new URL('icon-512.png',dir)));
const strings=new URL('values/strings.xml',native);
let xml=await readFile(strings,'utf8');xml=xml.replace(/(<string name="(?:app_name|title_activity_main)">)[^<]*(<\/string>)/g,'$1RotaMapa$2');await writeFile(strings,xml);
console.log('Prepared approved RotaMapa launcher art and label, retaining app.traxio.mobile.');
