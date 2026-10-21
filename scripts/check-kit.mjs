import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('assets/visual-kit/manifest.json',root),'utf8'));
const hashes=JSON.parse(await readFile(new URL('docs/kit-integrity.json',root),'utf8'));
for(const [path,expected] of Object.entries(hashes)){
  const bytes=await readFile(new URL('assets/visual-kit/'+path,root));
  if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('Original kit file changed: '+path);
}
for(const [name,[left,top,right,bottom]] of Object.entries({...manifest.assets.brand_crops,...manifest.assets.mockup_crops})){
  const png=await readFile(new URL('assets/visual-kit/assets/'+name,root));
  if(png.readUInt32BE(16)!==right-left||png.readUInt32BE(20)!==bottom-top)throw Error('Crop dimensions do not match supplied manifest: '+name);
}
console.log(`Verified ${Object.keys(hashes).length} unmodified kit files and all supplied crop dimensions.`);
