import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const path of ['docs/interface-theme-art.json','docs/rotamapa-brand.json']){
 const data=JSON.parse(await readFile(path,'utf8')),files=data.files||data;
 for(const[file,sha]of Object.entries(files))if(hash(await readFile(file))!==sha)throw Error('Approved artwork changed: '+file);
}
console.log('Original five scenic backgrounds, legacy art and new approved RotaMapa exports verified.');
