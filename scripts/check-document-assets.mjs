import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
const root=new URL('../assets/vendor/ocr/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
for(const[file,expected]of Object.entries(manifest.files)){const bytes=await readFile(new URL(file,root));if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('OCR artifact changed: '+file);}
console.log('Verified '+Object.keys(manifest.files).length+' local OCR artifacts.');
