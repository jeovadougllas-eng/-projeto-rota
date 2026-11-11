/* Local document extraction shared by campaigns, boxes and commission imports. */
(function(root){
 'use strict';let pdfLibrary=null,ocrLibrary=null,busy=false;
 const local=p=>new URL(p,document.baseURI).href;
 function aborted(signal){if(signal?.aborted)throw Error('Leitura cancelada. Nenhum dado foi salvo.');}
 async function ocr(canvas,{signal,onProgress}){
  aborted(signal);if(!ocrLibrary)ocrLibrary=new Promise((resolve,reject)=>{const tag=document.createElement('script');tag.src=local('assets/vendor/ocr/tesseract.min.js');tag.onload=resolve;tag.onerror=()=>{ocrLibrary=null;reject(Error('Não foi possível carregar o OCR local.'));};document.head.append(tag);});await ocrLibrary;
  // Language bytes retain their upstream gzip checksum. The suffix avoids Android AAPT renaming; the worker detects gzip magic.
  let worker;const options={workerPath:local('assets/vendor/ocr/worker.min.js'),corePath:local('assets/vendor/ocr/'),langPath:local('assets/vendor/ocr/'),gzip:false,cacheMethod:'none',workerBlobURL:false,logger:m=>onProgress?.(m.status,Math.round((m.progress||0)*100))};
  let cancel;const cancelled=new Promise((_,reject)=>{cancel=()=>{worker?.terminate();reject(Error('Leitura cancelada. Nenhum dado foi salvo.'));};signal?.addEventListener('abort',cancel,{once:true});});
  try{const init=root.Tesseract.createWorker('por',1,options).then(w=>{worker=w;if(signal?.aborted){w.terminate();throw Error('Leitura cancelada. Nenhum dado foi salvo.');}return w;});await Promise.race([init,cancelled]);aborted(signal);const result=await Promise.race([worker.recognize(canvas),cancelled]);return{text:result.data.text,confidence:result.data.confidence};}finally{signal?.removeEventListener('abort',cancel);await worker?.terminate();}
 }
 async function pdf(bytes,{signal,onProgress,allowOcr=true,preserveLayout=false}={}){
  pdfLibrary||=import('./vendor/pdfjs/pdf.min.js');const lib=await pdfLibrary;lib.GlobalWorkerOptions.workerSrc=local('assets/vendor/pdfjs/pdf.worker.min.js');let doc,task;
  try{
   task=lib.getDocument({data:bytes,isEvalSupported:false,disableFontFace:true,useSystemFonts:true,stopAtErrors:true});doc=await task.promise;if(doc.numPages>30)throw Error('Use documentos de até 30 páginas.');const pages=[],layout=[];let usedOcr=false,confidence=100;
   for(let n=1;n<=doc.numPages;n++){
    aborted(signal);onProgress?.('Página '+n+' de '+doc.numPages,Math.round(100*(n-1)/doc.numPages));const page=await doc.getPage(n),content=await page.getTextContent(),lines=[];
    for(const item of content.items.filter(i=>typeof i.str==='string'&&i.str.trim())){let row=lines.find(r=>Math.abs(r.y-item.transform[5])<2);if(!row){row={y:item.transform[5],items:[]};lines.push(row);}row.items.push(item);}
    let text=lines.sort((a,b)=>b.y-a.y).map(r=>r.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str).join(' ')).join('\n');
    if(text.replace(/\s/g,'').length<20&&allowOcr){const base=page.getViewport({scale:1}),scale=Math.min(2,Math.sqrt(4000000/(base.width*base.height))),view=page.getViewport({scale}),canvas=document.createElement('canvas');canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);try{await page.render({canvasContext:canvas.getContext('2d'),viewport:view}).promise;const result=await ocr(canvas,{signal,onProgress});text=result.text;confidence=Math.min(confidence,result.confidence);usedOcr=true;}finally{canvas.width=canvas.height=0;}}
    if(preserveLayout)layout.push(lines.sort((a,b)=>b.y-a.y).map(r=>({items:r.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>({text:i.str,x:i.transform[4],width:i.width||0}))})));pages.push(text);page.cleanup();
   }return{text:pages.join('\n'),ocr:usedOcr,confidence,pages:doc.numPages,...(preserveLayout?{layout}: {})};
  }finally{if(doc)await doc.destroy();else await task?.destroy();}
 }
 function wordZipBudget(bytes){
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break;}
  if(end<0)throw Error('Word inválido. Use um arquivo .docx completo.');const count=view.getUint16(end+10,true);let offset=view.getUint32(end+16,true),total=0;if(count>500)throw Error('Word muito complexo. Simplifique o documento.');
  for(let i=0;i<count;i++){if(offset+46>bytes.length||view.getUint32(offset,true)!==0x02014b50)throw Error('Word inválido.');if(view.getUint16(offset+8,true)&1)throw Error('Envie o Word sem senha.');total+=view.getUint32(offset+24,true);if(total>12000000)throw Error('Word descompactado acima de 12 MB.');offset+=46+view.getUint16(offset+28,true)+view.getUint16(offset+30,true)+view.getUint16(offset+32,true);}
 }
 async function extract(file,{signal,onProgress=()=>{},preserveLayout=false}={}){
  if(busy)throw Error('Aguarde ou cancele a leitura atual.');busy=true;
  try{aborted(signal);if(!file||file.size>20*1024*1024)throw Error('Use arquivos de até 20 MB.');const bytes=new Uint8Array(await file.arrayBuffer()),sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join(''),ext=file.name.split('.').pop().toLowerCase();let result;
   if(ext==='csv'){const text=new TextDecoder().decode(bytes);result={rows:parseCSV(text),text,ocr:false,confidence:100};}
   else if(['xlsx','xls'].includes(ext)){if(!root.XLSX)throw Error('Biblioteca de planilhas indisponível. Conecte-se ou exporte CSV.');const book=XLSX.read(bytes,{type:'array'});result={rows:XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{header:1,defval:'',raw:false}),text:'',ocr:false,confidence:100};}
   else if(ext==='docx'){
    if(!root.XLSX?.CFB)throw Error('Leitor Word indisponível. Conecte-se e tente novamente.');
    wordZipBudget(bytes);const archive=XLSX.CFB.read(bytes,{type:'array'}),entry=XLSX.CFB.find(archive,'/word/document.xml');if(!entry||entry.size>2000000)throw Error('Word inválido ou acima do limite. Use .docx de até 2 MB de texto.');
    const xml=new DOMParser().parseFromString(new TextDecoder().decode(entry.content),'application/xml');if(xml.querySelector('parsererror'))throw Error('Não foi possível ler este Word.');
    const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main',paragraphs=[...xml.getElementsByTagNameNS(ns,'p')],tables=[...xml.getElementsByTagNameNS(ns,'tbl')];
    const text=paragraphs.map(p=>[...p.getElementsByTagNameNS(ns,'t')].map(t=>t.textContent).join('')).join('\n');
    const rows=tables.length?tables.flatMap(table=>[...table.getElementsByTagNameNS(ns,'tr')].map(r=>[...r.getElementsByTagNameNS(ns,'tc')].map(c=>[...c.getElementsByTagNameNS(ns,'t')].map(t=>t.textContent).join('')))):null;
    result={text,...(rows?{rows}:{}),ocr:false,confidence:100};
   }
   else if(ext==='pdf'){if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('PDF inválido.');result=await pdf(bytes,{signal,onProgress,preserveLayout});}
   else if(['png','jpg','jpeg','webp'].includes(ext)){const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');try{const scale=Math.min(1,Math.sqrt(4000000/(bitmap.width*bitmap.height)));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);result={...await ocr(canvas,{signal,onProgress}),ocr:true};}finally{bitmap.close();canvas.width=canvas.height=0;}}
   else throw Error('Formato não suportado. Use PDF, Word (.docx), imagem, XLSX ou CSV.');
   aborted(signal);onProgress('Leitura concluída',100);return {...result,sha256,fileName:file.name.slice(0,200),format:ext};
  }finally{busy=false;}
 }
 root.RotaMapaDocuments=Object.freeze({extract,pdf,library:()=>{pdfLibrary||=import('./vendor/pdfjs/pdf.min.js');return pdfLibrary;}});
})(globalThis);
