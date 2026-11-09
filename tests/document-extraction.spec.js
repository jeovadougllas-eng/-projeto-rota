import{test,expect}from'playwright/test';import{prepare,ready}from'./fixtures/browser.js';
test('Portuguese OCR runs locally on a synthetic scan, with no external document upload',async({page})=>{
 test.setTimeout(120000);await prepare(page,{records:[],lockAuthFixture:true,authenticated:false});await ready(page);
 const data=await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=500;const c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,1600,500);c.fillStyle='black';c.font='48px sans-serif';c.fillText('TABELA DE COMISSAO',60,100);c.fillText('1001 PRODUTO TESTE 20 MG 30 CAPSULAS 9%',60,200);c.fillText('VIGENCIA 01/11/2026 A 30/11/2026',60,300);
  const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));return RotaMapaDocuments.extract(new File([blob],'sintetico.png',{type:'image/png'}));
 });expect(data.ocr).toBe(true);expect(data.text).toContain('1001');expect(data.text).toContain('9%');expect(data.sha256).toMatch(/^[a-f0-9]{64}$/);expect(data.confidence).toBeGreaterThan(60);
});
test('CSV document extraction preserves source strings and rejects cancellation without writes',async({page})=>{
 await prepare(page,{records:[],lockAuthFixture:true,authenticated:false});await ready(page);
 const result=await page.evaluate(async()=>{const f=new File(['Codigo;Percentual\n00123;9%'],'sintetico.csv',{type:'text/csv'}),data=await RotaMapaDocuments.extract(f);const controller=new AbortController();controller.abort();let error;try{await RotaMapaDocuments.extract(f,{signal:controller.signal});}catch(e){error=e.message;}return{data,error,calls:window.__dataCalls};});
 expect(result.data.rows[1][0]).toBe('00123');expect(result.error).toContain('cancelada');expect(result.calls).toEqual([]);
});
