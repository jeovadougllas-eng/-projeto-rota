# Validação da atualização incremental — checkpoint

Branch: dev/rotamapa-atualizacao-integral. Base de produção preservada: aebf58353428de586c59cc321032f3e63ce50cee. Nenhuma migração, alteração de autenticação, escrita de dados reais ou publicação de produção foi executada.

## Resultados locais

- `npm ci` com lockfile: passou; posteriormente adicionadas dependências exatas de OCR e lockfile atualizado intencionalmente.
- `npm run check`: passou (sintaxe, IDs, integrações, chaves históricas e arte do kit).
- `node scripts/check-rotamapa-art.mjs`: passou; arte RotaMapa original preservada.
- `node scripts/check-document-assets.mjs`: passou; dez artefatos OCR locais verificados por SHA-256.
- `node --test test-unit/*.test.mjs`: 171 passaram, zero falhas/skip.
- Autenticação/bridge nativa: 20 cenários Chromium passaram em desktop claro/celular escuro; validação adicional da repetição de callback nativo passou (3 casos desktop). SDK, conta e GPS simulados.
- Assinaturas: 18 cenários desktop/Android-browser passaram, incluindo Signature e Insider sintético; nenhuma ativação real.
- Pedido remoto/visitas: 14 cenários desktop claro/celular escuro passaram, incluindo offline, quatro canais, persistência, visita presencial do mesmo cliente, isolamento e Excel.
- Importação de clientes: 4 cenários desktop claro/celular escuro passaram. Lote de 53 clientes/19 colunas é sintético, não o arquivo UNIFARMA ainda ausente.
- Carteiras: 16 cenários de gestão/isolation/importação passaram; 8 casos finais focados de gestão passaram. Não somar como cenários únicos porque há repetição entre execuções.
- Pedidos PDF: 6 cenários desktop passaram, incluindo dois PDFs/uma venda, duplicados, isolamento e envio posterior offline.
- Extração: 2 cenários desktop passaram; OCR real com imagem sintética em português, CSV e cancelamento, sem upload externo.
- `bash scripts/test-insider-db.sh`: asserções SQL passaram em PostgreSQL 16 local descartável, sem rede e sem portas publicadas.
- `bash scripts/test-portfolio-lifecycle-db.sh`: cadeia SQL real/base local e asserções de arquivamento, exclusão, antirressurreição e contador mensal passaram. A importação sintética de dois PDFs conta uma operação; importação inválida reverte a reserva. O runner só abre socket do Docker local e limpa seu próprio container.

Os testes de navegador têm fixtures que bloqueiam tráfego externo. Esses resultados não certificam login real, RLS do banco remoto, funcionamento em aparelhos físicos nem a produção.

## Reproduzir os testes de navegador

As fontes dos testes estão em `tests`. Configure `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para o Chromium disponível; no ambiente validado é `/usr/bin/chromium`. Use os configs existentes e projetos nomeados nos comandos. Relatórios/traces gerados são ignorados por Git; o resumo e os testes ficam versionados.

Exemplo:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/auth.spec.js tests/native-bridge.spec.js --project=desktop-light --project=phone-dark --workers=2
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test tests/document-extraction.spec.js --project=desktop-light --workers=1
```

## Dependências e confiança

OCR: `npm ci` seguido de `node scripts/prepare-document-ocr.mjs` reproduz os artefatos npm públicos com integridade do lockfile. Não editar os arquivos vendorizados para satisfazer formatter: duas licenças/README de terceiros mantêm linhas em branco do original. Não há documento contratual individual nos artefatos OCR.

Android: Java runtime 21 inicial não incluía javac. Foi obtido JDK Temurin 21.0.9+10 oficial com SHA-256 verificado. SDK command-line tools foi obtido do repositório Google, com checksum do metadata oficial; instalados platforms 35/36 e build-tools 35.0.0/36.0.0 porque plugins Capacitor exigem ambos. Gradle 8.14.3 agora tem distributionSha256Sum oficial fixado no wrapper.

O JDK baixado exigiu confiar no CA herdado do ambiente para o proxy. Foi criada truststore separada em /workspace/rotamapa-tools/trust/cacerts a partir da store original do JDK e importado somente o CA fornecido por CODEX_PROXY_CERT. A verificação TLS não foi desativada. Ferramentas/cache ficam fora do checkout em /workspace/rotamapa-tools. São preparações da instância, não credenciais nem garantia de restauração em outra máquina.

O bundle comum foi preparado por `node scripts/build-mobile.mjs` e sincronizado por `cap sync android`. PWA e identificadores nativos históricos foram preservados. O build `assembleRelease` é exclusivamente de validação, sem assinatura de distribuição, instalação ou publicação. Resultado: assembleRelease passou (324 tarefas), gerando APK unsigned de validação. Nove arquivos comuns foram conferidos byte a byte no ZIP, com prova em rotamapa-local-android-proof.json. Assinatura, instalação física e atualização não foram validadas; não distribuir esse arquivo como atualização.

## Limites e próximos passos

A entrega integral NÃO está concluída. Faltam integração de UI/persistência dos documentos e snapshots, Central de Promoções, catálogo digital/caixas, amostras contratuais/campanhas para validar extração, ensaio com a planilha correta, configuração real de OAuth, revisão/aplicação autorizada das migrações, assinatura Android compatível e validação final Web/PWA/APK. Consulte ROTAMAPA-PROGRESSO.md para o checkpoint mais recente.
