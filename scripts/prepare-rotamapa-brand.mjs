// Production-size exports; preserve the existing wordmark and slogan pixels.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),sharp=createRequire(new URL('mobile/package.json',root))('sharp');
const dir=new URL('assets/rotamapa/',root);
if(process.env.ROTAMAPA_APPROVED_MARK){
 // New RM symbol: pin in R and three road dashes in the right stem of M.
 const mark=process.env.ROTAMAPA_APPROVED_MARK;
 const previous=await readFile(new URL('logo.webp',dir));
 const lettering=await sharp(previous).extract({left:490,top:0,width:1050,height:306}).png().toBuffer();
 const symbol=await sharp(mark).extract({left:202,top:380,width:851,height:495}).resize({width:465,height:280,fit:'contain',background:'#033b49'}).png().toBuffer();
 await sharp({create:{width:1540,height:306,channels:3,background:'#033b49'}})
  .composite([{input:symbol,left:0,top:13},{input:lettering,left:490,top:0}]).webp({lossless:true}).toFile(fileURLToPath(new URL('logo.webp',dir)));
 for(const size of [32,180,192,512])await sharp(mark).resize(size,size).png().toFile(fileURLToPath(new URL(`icon-${size}.png`,dir)));
}
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
