import{test}from'node:test';import assert from'node:assert/strict';await import('../assets/rotamapa-commerce-model.js');await import('../assets/rotamapa-commissions-model.js');await import('../assets/rotamapa-document-model.js');const M=RotaMapaDocumentModel;
test('commission tables preserve product codes and distinguish malformed dates and percentages',()=>{
 const result=M.rows([['Código','Produto','Percentual','Início','Fim'],['00123','Produto 20 mg','9%','01/11/2026','30/11/2026'],['002','Outro','120%','01/11/2026','30/11/2026']],'commissions');assert.equal(result.entries[0].code,'00123');assert.equal(result.entries[0].validFrom,'2026-11-01');assert.equal(result.review.length,1);assert.equal(M.date('31/02/2026'),null);
});
test('box tables are read-only quantities, never implied order multiples',()=>{
 const result=M.rows([['Código','Produto','Unidades por caixa'],['01','Produto',12],['02','Outro',0]],'boxes');assert.equal(result.entries[0].units,12);assert.equal(result.review.length,1);assert.equal(result.entries[0].minimum,undefined);
});
test('campaign tables never combine discount and offer price or infer missing dates',()=>{
 const result=M.rows([['Código','Início','Fim','Preço','Desconto'],['01','01/11/2026','30/11/2026','19,90',''],['02','01/11/2026','30/11/2026','19,90','5%']],'campaigns');assert.equal(result.entries[0].priceCents,1990);assert.equal(result.review.length,1);
});
test('text extraction uses exact commission rows and retains ambiguous contract clauses for review',()=>{
 const result=M.parseText('Vigência 01/11/2026 a 30/11/2026\n00123 Produto 20mg 30 cápsulas 9%\nExceção especial 5% mediante aprovação','commissions');assert.equal(result.entries.length,1);assert.equal(result.entries[0].code,'00123');assert.equal(result.review.length,1);assert.equal(M.parseText('Contrato sem taxas legíveis','commissions').entries.length,0);
});
test('box and campaign PDF text is extracted only when codes, units, prices and validity are explicit',()=>{
 const boxes=M.parseText('CAIXAS PADRAO\n001 Produto exemplo 20 mg 12 un/caixa\n002 Produto outro 24 unidades','boxes');assert.equal(boxes.entries.length,2);assert.equal(boxes.entries[0].units,12);
 const campaign=M.parseText('Vigência 01/11/2026 a 30/11/2026\n001 Produto exemplo 20mg R$ 15,00 mínimo 6\nSomente clientes credenciados','campaigns');assert.equal(campaign.entries[0].priceCents,1500);assert.match(campaign.entries[0].restrictions,/Somente/);
 assert.equal(M.parseText('001 Produto exemplo R$ 15,00 mínimo 6','campaigns').entries.length,0);
});
test('contract exceptions are retained for review and commercial hours are never silently discarded',()=>{
 const contract=M.rows([['Código','Produto','Comissão','Início','Exceções'],['001','Produto','9%','01/11/2026','Somente rede credenciada']],'commissions');assert.equal(contract.entries.length,0);assert.match(contract.review[0].restrictions,/credenciada/);
 const campaign=M.rows([['Código','Início','Fim','Preço','Horário início','Horário fim','Canal'],['001','01/11/2026','30/11/2026','10,00','09:00','10:00','Somente distribuidor A']],'campaigns');assert.equal(campaign.entries[0].startTime,'09:00');assert.match(campaign.entries[0].restrictions,/distribuidor/);
});
test('review retains valid price, stock, time and restrictions when another campaign field is ambiguous',()=>{
 const r=M.rows([['Código','Produto','Início','Fim','Preço','Quantidade mínima','Estoque','Horário início','Horário fim','Restrições'],['001','Produto','31/02/2026','30/11/2026','15,00','6','8','09:00','10:00','Somente rede credenciada']],'campaigns');assert.equal(r.entries.length,0);assert.equal(r.review[0].priceText,'15,00');assert.equal(r.review[0].stock,'8');assert.equal(r.review[0].startTime,'09:00');assert.equal(r.review[0].endTime,'10:00');assert.equal(r.review[0].restrictions,'Somente rede credenciada');
});
test('ambiguous OCR lines retain global commercial restrictions for review',()=>{
 const r=M.parseText('Vigência 31/02/2026 a 30/11/2026\n001 Produto 15% mínimo 6\nSomente rede credenciada','campaigns');assert.equal(r.entries.length,0);assert.ok(r.review.length);assert.match(r.review[0].restrictions,/Somente rede credenciada/);
});
