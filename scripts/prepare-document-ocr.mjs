// Copy only pinned npm artifacts; npm lock integrity verification remains enabled.
import{mkdir,copyFile,readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const target=new URL('../assets/vendor/ocr/',import.meta.url);await mkdir(target,{recursive:true});
const files={
 'tesseract.min.js':'tesseract.js/dist/tesseract.min.js','worker.min.js':'tesseract.js/dist/worker.min.js',
 'tesseract.LICENSE':'tesseract.js/LICENSE.md','core.LICENSE':'tesseract.js-core/LICENSE',
 'por.PACKAGE.json':'@tesseract.js-data/por/package.json','por.README.md':'@tesseract.js-data/por/README.md',
 'por.traineddata':'@tesseract.js-data/por/4.0.0/por.traineddata.gz'
};
for(const name of ['tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js','tesseract-core-relaxedsimd-lstm.wasm.js'])files[name]='tesseract.js-core/'+name;
const hashes={};for(const[name,source]of Object.entries(files)){const src=new URL('../node_modules/'+source,import.meta.url);await copyFile(src,new URL(name,target));hashes[name]=createHash('sha256').update(await readFile(src)).digest('hex');}
await writeFile(new URL('manifest.json',target),JSON.stringify({packages:{'tesseract.js':'7.0.0','tesseract.js-core':JSON.parse(await readFile(new URL('../node_modules/tesseract.js-core/package.json',import.meta.url),'utf8')).version,'@tesseract.js-data/por':'1.0.0'},files:hashes},null,2)+'\n');
console.log('Prepared local Portuguese OCR assets; no document sent to any server.');
