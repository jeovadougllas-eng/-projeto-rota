/* Local document extraction shared by campaigns, boxes and commission imports. */
(function(root){
 'use strict';let pdfLibrary=null,ocrLibrary=null,busy=false;
 const local=p=>new URL(p,document.baseURI).href;
 function aborted(signal){if(signal?.aborted)throw Error('Leitura cancelada. Nenhum dado foi salvo.');}
 async function ocr(canvas,{signal,onProgress}){
  aborted(signal);if(!ocrLibrary)ocrLibrary=new Promise((resolve,reject)=>{const tag=document.createElement('script');tag.src=local('assets/vendor/ocr/tesseract.min.js');tag.onload=resolve;tag.onerror=()=>{ocrLibrary=null;reject(Error('Não foi possível carregar o OCR local.'));};document.head.append(tag);});await ocrLibrary;
  let worker;const options={workerPath:local('assets/vendor/ocr/worker.min.js'),corePath:local('assets/vendor/ocr/'),langPath:local('assets/vendor/ocr/'),gzip:true,cacheMethod:'none',workerBlobURL:false,logger:m=>onProgress?.(m.status,Math.round((m.progress||0)*100))};
  let cancel;const cancelled=new Promise((_,reject)=>{cancel=()=>{worker?.terminate();reject(Error('Leitura cancelada. Nenhum dado foi salvo.'));};signal?.addEventListener('abort',cancel,{once:true});});
  try{const init=root.Tesseract.createWorker('por',1,options).then(w=>{worker=w;if(signal?.aborted){w.terminate();throw Error('Leitura cancelada. Nenhum dado foi salvo.');}return w;});await Promise.race([init,cancelled]);aborted(signal);const result=await Promise.race([worker.recognize(canvas),cancelled]);return{text:result.data.text,confidence:result.data.confidence};}finally{signal?.removeEventListener('abort',cancel);await worker?.terminate();}
 }
 async function pdf(bytes,{signal,onProgress,allowOcr=true}={}){
  pdfLibrary||=import('./vendor/pdfjs/pdf.min.js');const lib=await pdfLibrary;lib.GlobalWorkerOptions.workerSrc=local('assets/vendor/pdfjs/pdf.worker.min.js');let doc,task;
  try{
   task=lib.getDocument({data:bytes,isEvalSupported:false,disableFontFace:true,useSystemFonts:true,stopAtErrors:true});doc=await task.promise;if(doc.numPages>30)throw Error('Use documentos de até 30 páginas.');const pages=[];let usedOcr=false,confidence=100;
   for(let n=1;n<=doc.numPages;n++){
    aborted(signal);onProgress?.('Página '+n+' de '+doc.numPages,Math.round(100*(n-1)/doc.numPages));const page=await doc.getPage(n),content=await page.getTextContent(),lines=[];
    for(const item of content.items.filter(i=>typeof i.str==='string'&&i.str.trim())){let row=lines.find(r=>Math.abs(r.y-item.transform[5])<2);if(!row){row={y:item.transform[5],items:[]};lines.push(row);}row.items.push(item);}
    let text=lines.sort((a,b)=>b.y-a.y).map(r=>r.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str).join(' ')).join('\n');
    if(text.replace(/\s/g,'').length<20&&allowOcr){const base=page.getViewport({scale:1}),scale=Math.min(2,Math.sqrt(4000000/(base.width*base.height))),view=page.getViewport({scale}),canvas=document.createElement('canvas');canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);try{await page.render({canvasContext:canvas.getContext('2d'),viewport:view}).promise;const result=await ocr(canvas,{signal,onProgress});text=result.text;confidence=Math.min(confidence,result.confidence);usedOcr=true;}finally{canvas.width=canvas.height=0;}}
    pages.push(text);page.cleanup();
   }return{text:pages.join('\n'),ocr:usedOcr,confidence,pages:doc.numPages};
  }finally{if(doc)await doc.destroy();else await task?.destroy();}
 }
 async function extract(file,{signal,onProgress=()=>{}}={}){
  if(busy)throw Error('Aguarde ou cancele a leitura atual.');busy=true;
  try{aborted(signal);if(!file||file.size>20*1024*1024)throw Error('Use arquivos de até 20 MB.');const bytes=new Uint8Array(await file.arrayBuffer()),sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join(''),ext=file.name.split('.').pop().toLowerCase();let result;
   if(ext==='csv'){const text=new TextDecoder().decode(bytes);result={rows:parseCSV(text),text,ocr:false,confidence:100};}
   else if(['xlsx','xls'].includes(ext)){if(!root.XLSX)throw Error('Biblioteca de planilhas indisponível. Conecte-se ou exporte CSV.');const book=XLSX.read(bytes,{type:'array'});result={rows:XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{header:1,defval:'',raw:false}),text:'',ocr:false,confidence:100};}
   else if(ext==='pdf'){if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('PDF inválido.');result=await pdf(bytes,{signal,onProgress});}
   else if(['png','jpg','jpeg','webp'].includes(ext)){const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');try{const scale=Math.min(1,Math.sqrt(4000000/(bitmap.width*bitmap.height)));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);result={...await ocr(canvas,{signal,onProgress}),ocr:true};}finally{bitmap.close();canvas.width=canvas.height=0;}}
   else throw Error('Formato não suportado. Use PDF, imagem, XLSX ou CSV.');
   aborted(signal);onProgress('Leitura concluída',100);return {...result,sha256,fileName:file.name.slice(0,200),format:ext};
  }finally{busy=false;}
 }
 root.RotaMapaDocuments=Object.freeze({extract,pdf,library:()=>{pdfLibrary||=import('./vendor/pdfjs/pdf.min.js');return pdfLibrary;}});
})(globalThis);
