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
