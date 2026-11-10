# Progresso — RotaMapa

## Estado de continuidade

- Etapa atual: implementação incremental em andamento; próximos módulos e limitações registrados nas etapas abaixo.
- Conta de continuidade: exclusivamente a conta Codex desta conversa, por decisão posterior do proprietário. Não alternar contas.
- Branch exclusiva: `dev/rotamapa-atualizacao-integral`.
- Base: `aebf58353428de586c59cc321032f3e63ce50cee`.
- Produção informada pelo proprietário: deployment Vercel `dpl_374iR7zDa8QqEDkYehYFWA5yBPee`, READY, target production, branch `dev/traxelo-android-routes`.
- Experimental preservada: `4d8c018eed5956a4eef6e87536602a893275746c`; sem merge.
- Datas: sessão informa 2026-11-09; Prompt Mestre declara versão 11/11/2026. Preservada a versão do autor, sem inferir mudança do relógio.

## Etapa 0A — Documentação

Concluído: leitura integral do arquivo disponível (19.976 bytes), ativação da branch correta e criação de AGENTS.md, docs/ROTAMAPA-ESCOPO.md e deste documento. O escopo contém a transcrição completa do material recebido.

Nenhum arquivo da aplicação, configuração Vercel, banco, autenticação, dado real, PWA ou APK foi alterado. Nenhum deploy ou workflow de publicação foi executado.

Commit desta etapa: localizar por `git log --oneline -- AGENTS.md docs/ROTAMAPA-ESCOPO.md docs/ROTAMAPA-PROGRESSO.md` (o hash do próprio commit não pode constar de seu conteúdo). Mensagem prevista: `docs: persist RotaMapa safety rules and received master scope`.

## Persistência confirmada

Commit documental `b94c3502cb991614b52886fbe0ecec76a11f6340` enviado ao GitHub em `dev/rotamapa-atualizacao-integral`, com upstream configurado. `git ls-remote` confirmou o mesmo SHA. Checkout ativo nesta branch; somente os três documentos diferem da base. Nenhum comando de deploy executado.

## Auditoria anterior preservada

Main 84b23d4 é ancestral de aebf583, 421 commits atrás. A experimental acrescenta três commits a aebf583: núcleo de comissões e ajustes de identidade/mensagem PKCE. Não foi incorporada. A versão base contém PWA, Android, carteiras, visitas, agenda, vendas, faturamento, ranking e assinatura. Não usar instruções antigas de setup da main como descrição completa desta base.

## Divergências e bloqueios

1. Resolvido: continuação das seções 12–14 recebida e integrada, com FIM DO PROMPT MESTRE.
2. O módulo experimental de comissões não existe na base de produção; deve ser auditado e testado antes de eventual reaproveitamento, sem merge integral.
3. Há identidade histórica Traxio no login legado. Investigar camadas de interface e fluxo PKCE antes de corrigir; não renomear chaves internas.
4. A planilha correta UNIFARMA - DOUGLAS.xlsx (53 clientes, 19 colunas) não foi fornecida nesta sessão. Não usar a versão de 279 clientes.
5. Faltam e-mails dos cinco Insiders, documentos originais EMS, contratos/aditivos, amostras de campanhas e caixas. Não ativar benefícios nem taxas presumidas.
6. Rede observada anteriormente bloqueia serviços externos e Vercel. Configuração reutilizável start_skill teve erro INVALID_ARGUMENT; persistência não confirmada. Não ampliar rede indiscriminadamente.

## Validação desta etapa

Somente documentação: conferir branch/base, integridade da transcrição, diff sem alterações na aplicação e verificação de whitespace. `git diff --cached --check` apontou seis finais de linha com dois espaços usados como quebra Markdown no original; foram preservados para manter a transcrição. A verificação com `core.whitespace=-blank-at-eol` permite essas quebras intencionais. Testes funcionais, instalação de dependências, testes de navegador, RLS e builds Web/PWA/APK ainda não executados nesta etapa. Nenhuma alegação de prontidão funcional.

## Próximas etapas

1. Continuação integrada; seguir a implementação incremental.
2. Envio inicial confirmado; manter futuras etapas documentadas e enviadas nesta mesma branch.
3. Auditar scripts de testes e efeitos colaterais, dependências e toolchain Android; preparar testes isolados.
4. Comparar autenticação, identidade, limites dos planos e modelos de dados com o escopo; explicar divergências antes de mudar comportamento.
5. Implementar por etapas com testes e commits, atualizando este documento em cada etapa. Nenhum recurso dos capítulos 3–10 está declarado concluído por esta documentação.

## Etapa 1A — Identidade textual e callbacks OAuth

Escopo integral recebido e consolidado, incluindo seções 12–14. Dependências instaladas com `npm ci`, sem mudança de lockfile. Baseline: `npm run check` passou e 150 testes unitários existentes passaram.

Divergência explicada antes da edição: o login legado ainda tinha nome Traxio; seus textos foram corrigidos para RotaMapa, sem redesenho, alterações de arte, chaves, provider ou redirect. Web e Android tinham chamadas separadas de exchange; agora `assets/rotamapa-auth.js` compartilha uma promessa por cliente/código para evitar a troca duplicada. Falhas PKCE exibem orientação de mesmo navegador/endereço, sem divulgar a mensagem bruta do provedor. Nenhuma sessão é apagada ou migrada.

Arquivos: index.html, assets/traxio-native.js, novo assets/rotamapa-auth.js, scripts/check.mjs, tests/auth.spec.js, tests/native-bridge.spec.js e novo test-unit/auth-callback.test.mjs, além dos documentos.

Validação: três novos testes unitários de callback passaram. A matriz focada de autenticação/bridge passou 20/20 em Chromium desktop claro e celular escuro, com SDK/GPS sintéticos e rede externa bloqueada. Uma primeira execução revelou que a fixture sem autenticação não persistia a sessão após exchange; o teste foi corrigido para reproduzir o mesmo callback, sem simular persistência inexistente. Login real Google/senha, callbacks administrativos e Android físico não foram testados.

Auditoria de planos: limites de 3/1 e 20/3 já estão implementados no servidor; preservados. Insider, gestão de exclusão, promoções/importações e comissões continuam pendentes. Docker local e Java 21 disponíveis; SDK/assinatura Android ainda não verificados. Não executar workflows históricos de release, pois publicam artefatos na branch de produção.

## Etapa 1B — Insider sem ativação

Commit anterior: e7eddc7 (autenticação/identidade), enviado ao GitHub. Implementada a apresentação Insider na assinatura e no selo, com paleta e textos aprovados; os três planos públicos e Signature permanecem intactos. A identidade Insider exige flag de acesso do servidor com plano pro, sem QA, nunca metadados editáveis do usuário.

Preparada migração aditiva `20261109000100_insider_membership.sql`, NÃO aplicada ao Supabase. Ela cria tabela privada com cinco slots exclusivos, RLS sem políticas para clientes e nenhuma pessoa cadastrada. A função de acesso preserva Signature e limites existentes; associação Insider permanente só poderá ser provisionada administrativamente depois dos e-mails e aprovação. A migração não ativa contas nem modifica grants existentes.

Arquivos: modelos/UI/CSS de assinatura e conta, fixture/testes de assinatura, migração, test-db/insider-base.sql, test-db/insider.sql e scripts/test-insider-db.sh.

Testes: 3 testes unitários de assinatura passaram; `npm run check` passou; 18 cenários de navegador desktop/Android-browser passaram (incluindo regressões Signature). PostgreSQL 16 em Docker local, sem rede/portas, passou asserções de zero ativações na migração, limite de cinco, duplicidade, preservação Signature, exclusão de QA, negação de leitura/escrita do cliente e metadados forjados. Runner encerra e remove apenas seu próprio container. Imagem fixada por digest. Nenhum teste foi dirigido à produção.

Pendência: migração e provisionamento exigem revisão e autorização futuras; ainda faltam os cinco e-mails. A funcionalidade não está ativa em produção. Limite Executivo de PDFs e automação de promoções continuam sob auditoria; nenhum limite novo imposto.

## Etapa 1C — Pedido remoto

Commit anterior: d3741ce (Insider), enviado ao GitHub. Implementada de forma independente a opção adicional Pedido remoto no formulário existente, sem remover opções. Canal padrão WhatsApp, com Telefone/E-mail/Outro; confirmação contextual; observações opcionais; nenhum valor obrigatório. Usa o ledger e outbox existentes e mantém IDs/chaves. Não converte registros históricos nem dispara o diálogo automático de venda.

Relatórios separam `remoteOrders`/histórico de visitas presenciais; cobertura, revisitas, projeções e sugestões de retorno excluem atendimento remoto. Histórico exibe canal; Excel acrescenta aba de pedidos remotos quando existem. Nenhuma rota ou quilometragem é criada. Venda e faturamento continuam operações explícitas separadas. A classificação adicional não exige migração no schema JSON atual.

Arquivos: assets/traxelo-visits-model.js, traxelo-visits-ui.js, traxelo-visit-report.js, traxelo-premium-model.js, rotamapa-commerce-ui.js; testes de pedido remoto e visitas; .gitignore para saídas geradas.

Validação: 21 regressões unitárias de visitas/store/premium passaram, dois testes novos passaram e 14 cenários Chromium (desktop claro/celular escuro) passaram, incluindo offline/reload, quatro canais, mesmo cliente remoto/presencial, isolamento por conta, falha de armazenamento e exportação XLSX. A primeira execução identificou testes antigos tentando clicar Registrar visita dentro de um disclosure fechado da interface já existente; os testes agora abrem o disclosure pelo controle real. Não houve mudança de layout para contornar o teste.

Limitação: clientes antigos ainda não conhecem a classificação remota e podem mostrar indicadores antigos; validar rollout coerente Web/PWA/Android antes de liberar a funcionalidade. Sincronização contra dados reais não foi executada. Exclusão de carteiras continua pendente: requer tombstones e proteção de clientes antigos; não será simulada só pela remoção visual.

## Etapa 1D — Importação local com pré-visualização

Commit anterior: 292eeab (Pedido remoto), enviado ao GitHub. Adicionados staging determinístico, pré-visualização, identificação de duplicados e conflitos, preparação em lotes com progresso/cancelamento e aplicação local única com restauração da memória se o armazenamento falhar. Repetir o mesmo lote na mesma carteira não cria novos IDs nem sobrescreve pins, dados revisados ou registros existentes. Carteiras diferentes continuam independentes. Colunas originais são preservadas; CNPJ mantém 14 dígitos/zeros formatados e não aceita CPF/notação científica nem inventa zeros já perdidos no arquivo.

Nome fantasia agora aparece como texto secundário na identidade compartilhada dos clientes, sem mudar a fonte principal. A localização continua usando a fila existente em segundo plano somente para novos clientes. O modal bloqueante de enriquecimento foi removido da conclusão da importação: BrasilAPI continua acessível pelos controles existentes e seus limites/pausas não foram burlados. Explicado ao proprietário que parsing/importação local e chamadas externas são tempos distintos.

Arquivos: index.html, assets/rotamapa-client-identity.js, novos rotamapa-client-import.js/rotamapa-client-import-ui.js, scripts/check.mjs e testes unitários/browser de importação.

Testes: 7 testes de importação/identidade passaram; quatro cenários Chromium desktop claro/celular escuro passaram (cancelar prévia, preservar IDs/pins, importação repetida, falha de storage, lote sintético de 53 clientes e 19 colunas). `npm run check` passou. A planilha real UNIFARMA - DOUGLAS.xlsx continua ausente; a validação sintética não substitui o ensaio com o arquivo correto. Não foi medido tempo real de geocodificação/BrasilAPI.

## Etapa 1E — Gestão segura de carteiras (migração não aplicada)

Commit anterior: 899266b (importação), enviado ao GitHub. Preparadas operações transacionais de arquivar/restaurar/excluir com confirmação textual exata e revisão CAS. Arquivo morto recuperável preserva todos os registros no servidor; exclusão permanente remove apenas os filhos conhecidos da conta/carteira selecionada e mantém tombstone. Triggers compartilham lock da carteira com a operação e rejeitam reenvios de aparelhos antigos, inclusive da carteira inicial. Tombstones não consomem quotas; arquivos recuperáveis continuam ocupando os limites anteriores.

A interface desabilita gestão quando o RPC não existe, exige conexão, bloqueia clientes locais ainda não sincronizados/outboxes pendentes e não agenda exclusão offline. Caches conhecidos da carteira só são removidos após confirmação de exclusão pelo servidor; arquivos de outras contas/carteiras permanecem intactos. Uma carteira ativa arquivada/excluída fica bloqueada até restauração/troca. Sem migração aplicada, os controles não realizam operações.

Arquivos: assets/rotamapa-portfolios.js, novo rotamapa-portfolio-lifecycle.js, index.html, scripts/check.mjs, migração 20261109000200_portfolio_lifecycle.sql, runner/fixtures SQL e testes de carteiras. Corrigida espera de inicialização do Postgres nos runners para evitar conexão durante a troca do servidor temporário de init para o definitivo.

Testes: PostgreSQL local com cadeia existente e migração de faturamento manual passou asserções de arquivo/restauração, pins intactos, confirmação forte, revisão desatualizada, isolamento entre usuários/carteiras, preservação das outras carteiras, bloqueio de ressurreição normal/inicial e contagem sem tombstones. 16 cenários de navegador de gestão/carteiras passaram; oito cenários finais focados passaram, incluindo exclusão confirmada, rejeição pelo servidor, offline e caches de outra conta preservados. Suite completa atual: 160 testes unitários passaram. Nenhuma migração foi aplicada ao Supabase real.

Limitações: exclusão definitiva é código preparado para revisão; ativação em produção exige autorização. Confirmar cobertura de futuras tabelas/documentos antes de incluir novos módulos na entrega. Dispositivos antigos podem conservar cópias locais, mas o servidor preparado rejeita o reenvio; a operação não promete apagar remotamente armazenamento de outros aparelhos.

Esclarecimento recebido: Executivo = 3 importações de PDF por mês por carteira. Implementação do contador mensal está pendente; documentos existentes não devem ser removidos. Permanecem pendentes Central de Promoções, extração/OCR, catálogo digital, caixas, comissões e validação/empacotamento final Web/PWA/APK.

## Etapa 1F — Cota mensal de importações PDF (preparada)

Commit anterior: 6de2239 (gestão de carteiras), enviado ao GitHub. Incorporado esclarecimento do proprietário: Executivo permite 3 importações de PDF por mês por carteira. A unidade implementada é uma operação concluída: o fluxo existente pode reunir um ou dois PDFs do mesmo pedido em uma venda; esse lote consome uma importação. Repetição do mesmo conjunto de hashes não consome novamente no mês.

Migração 20261109000300_monthly_pdf_imports.sql cria ledger privado por usuário/carteira/mês e guarda de importação em transação, com lock, validação de plano no servidor e período America/Fortaleza. Não contabiliza retroativamente documentos existentes. Importação inválida reverte também a reserva; o cliente não pode apagar o contador. Elite/Signature/Insider seguem sem esse limite. A migração não foi aplicada à produção. Futuros importadores da Central devem chamar a mesma função privada no servidor; ainda não estão integrados.

Testes: cadeia SQL completa local passou asserções de idempotência, bloqueio da quarta importação, negação ao cliente e integração com venda real sintética de dois PDFs, que consome uma operação; uma venda inválida não consome cota. Seis testes Chromium de importação de pedidos PDF passaram. Corrigidos nesses testes os caminhos para abrir os disclosures da interface existente, sem alterar a interface para fazer testes passarem.

Arquivos: migração, test-db/pdf-import-quota.sql, scripts/monthly-pdf-db-fixture.mjs, runner SQL, modelos/textos de assinatura e importador PDF, tests/order-pdf.spec.js.

## Consulta sobre acessos

O proprietário perguntou como conectar Supabase e Vercel. Orientações registradas em docs/ROTAMAPA-ACESSOS.md: OAuth em servidores oficiais, Supabase restrito ao projeto com read_only=true, Vercel sem promessa de modo somente leitura técnico, nenhuma credencial em chat. Apps conectados no ChatGPT podem não chegar a esta sessão Codex; verificar ferramentas disponíveis. Nenhuma conexão foi confirmada e nenhuma permissão de escrita foi concedida nesta consulta.

## Etapa 1G — Extração local e núcleo de projeção (ainda sem integração completa)

Commit anterior: 35d35f7 (cota PDF), enviado ao GitHub. Preparados extrator local PDF/XLSX/CSV/imagens e OCR português com Tesseract.js 7.0.0 e dados por 1.0.0, versões fixas no lockfile. Engines local/SIMD/relaxed-SIMD, modelo e licenças são artefatos npm públicos, copiados por scripts/prepare-document-ocr.mjs e verificados por SHA-256 por scripts/check-document-assets.mjs. Nenhum contrato privado ou imagem de produto foi adicionado. A extração não envia documentos a serviços externos.

O interpretador determinístico reconhece tabelas de comissões, campanhas e caixas e preserva linhas ambíguas para revisão. Não infere datas inválidas nem combina automaticamente preço de oferta com desconto. PDF com pouco texto usa OCR local; há limites de tamanho/páginas/pixels e cancelamento. A precisão com documentos reais ainda NÃO foi validada.

Divergência explicada antes da implementação: a experimental reconhecia status FATURADO, que não corresponde ao schema de vendas confirmado/recibos do aplicativo. Não houve merge. O novo núcleo rotamapa-commissions-model.js adapta recibos efetivamente faturados e confirmações manuais existentes. Usa centavos/basis points, regras por conta/carteira/empresa, correspondência inequívoca, datas no fuso configurado, snapshots de taxas, devoluções/estornos conhecidos e revisão de ambiguidades/duplicidades. Não é controle de pagamento nem prova de comissão devida.

Testes: suite completa final com 171 testes unitários passou; verificações de fontes, arte aprovada e 10 artefatos OCR passaram. Dois testes de navegador passaram com OCR REAL sobre imagem sintética em português e CSV/cancelamento, com autenticação simulada e tráfego externo bloqueado. Não houve chamada a OCR externo nem consulta de contratos reais. Sete testes de comissões e quatro de interpretação integram a suite total.

Pendências deliberadamente explícitas: o núcleo e o extrator estão carregados, mas NÃO há tela completa de importação/validação/persistência de regras/snapshots, Central de Promoções, visualizador de catálogo ou consulta de caixas nesta etapa. Os modelos não representam essas funcionalidades concluídas. Ainda faltam documentos de referência e integração segura de armazenamento/sincronização/limites do novo módulo, com testes. Nenhuma taxa EMS foi ativada.

## Preparação de validação Android e documentação de acessos

Checkpoint de fundações: 7d91a0d, enviado ao GitHub. Orientação de conexão OAuth solicitada pelo proprietário está em ROTAMAPA-ACESSOS.md. Nenhum app Supabase/Vercel foi conectado ou autorizado a escrever nesta sessão.

Resumo de testes, comandos e limites registrados em ROTAMAPA-VALIDACAO.md. Não considerar a entrega integral concluída. As checagens de whitespace dos artefatos npm apontaram somente linhas em branco finais de arquivos de terceiros, preservadas junto com seus hashes/licenças; nenhuma verificação de integridade foi burlada.

Preparados JDK com compilador e SDKs requeridos em /workspace/rotamapa-tools; checksum oficial do Gradle fixado no wrapper. Corrigidos pré-requisitos locais identificados por builds (javac ausente, build-tools 35 adicional exigida e CA do proxy para o JDK baixado). TLS, checksums e assinatura de pacotes continuam verificados. Bundle gerado e Capacitor sync concluídos. Sem chave de assinatura compatível confirmada; não substituir APK instalado nem promover artefatos.

### Resultado da compilação Android de validação

`assembleRelease` terminou com BUILD SUCCESSFUL em 2m48s, 324 tarefas (308 executadas, 16 reutilizadas), JDK/SDK/CA verificados. Gerado apenas app-release-unsigned.apk de 27.885.021 bytes; SHA-256 f22a5dea8d494e7dbebf653b5e8318ba7647a98111cddbd9fc651623222426c0. Nove arquivos compartilhados foram comparados byte a byte com as fontes no APK; metadata de PWA foi excluída do shell nativo como no build existente. Evidência em docs/rotamapa-local-android-proof.json.

O arquivo NÃO está assinado, não foi instalado, publicado nem usado como atualização. O identificador app.traxio.mobile e versão técnica existente 1.7.0 foram preservados nesta validação. Não alegar entrega final ou compatibilidade de assinatura. O APK permanece no diretório de build ignorado; prova/comandos/fontes ficam no GitHub. A chave compatível ainda precisa ser identificada por fluxo seguro autorizado.

Próximo trabalho funcional: concluir UI e persistência/sincronização de documentos/condições/snapshots, catálogo PDF e caixas; validar as amostras corretas; revisar rollout das migrações e executar regressões finais por plataforma. Orientação de acesso somente de leitura fornecida; aguardar a conexão real antes de afirmar leitura do Supabase/Vercel. E-mails Insider não recebidos, ninguém ativado. Produção sem comandos de escrita/deploy.

## Decisão posterior — continuidade exclusiva nesta conta

O proprietário decidiu abandonar a alternância de contas para a evolução do RotaMapa. Atualizados AGENTS.md e o aviso de precedência do escopo, preservando o texto histórico recebido. Criado ROTAMAPA-CONTINUIDADE.md com fluxo de trabalho, repositório/branch, pendências e limites de autorização. Esta etapa altera somente documentação.

Checkpoint anterior à decisão: 5d4051ae5202ee16618dea3bb80d8d7a3e657216, confirmado na branch local e no GitHub. Checkout estava limpo. O commit desta decisão pode ser localizado pelo histórico dos quatro documentos. Verificações desta etapa: branch correta, correspondência local/remota antes da edição, revisão do diff e git diff --check. Não foram necessários testes da aplicação para alteração documental.

Nenhum projeto, dado, credencial ou configuração foi migrado ou revogado. Supabase e Vercel continuam sendo os projetos originais. As ferramentas dos plugins ainda não foram expostas nesta sessão; isso permanece uma pendência de integração, independente da decisão sobre contas. A aplicação e a produção não foram alteradas nesta etapa.

## Preparação de upload manual de Preview

Após as capturas da Vercel, identificada ausência de repositório vinculado visível e ausência de campo de branch em Production. O domínio de produção e seu toggle foram preservados. Preparado script de upload allowlist e ZIP local de 23.353.103 bytes, sem documentos privados, segredos ou instaladores. Todos os hashes do manifesto e os assets locais referenciados no HTML foram conferidos. Foram alterados apenas script e documentação; código da aplicação não foi modificado. Procedimento e limitações em ROTAMAPA-PREVIA-MANUAL.md.

Nenhum deploy foi executado: não existe URL nova confirmada. O pacote usa os endpoints existentes, portanto não fazer login/testes de escrita com dados reais; falta configuração de teste, revisão de OAuth/CORS e validação remota. CLI manual é alternativa ao vínculo Git, sempre target=preview. O menu Create New exibido era global, não um comando de criação de deployment. Produção intacta por esta etapa.

## Checkpoint autorizado de preservação — catálogo e próxima Preview

Após solicitar parada, o proprietário autorizou explicitamente retomar apenas validação e salvamento do trabalho pendente no GitHub para viabilizar uma nova tarefa na mesma conta, com prioridade em entregar link atualizado Web/PWA.

Preservados: visualizador PDF local e entrada Central de Promoções, sem redesenhar as telas existentes. Visualizador tem navegação de páginas, miniaturas sob demanda, zoom, busca textual, controle de tela cheia, swipe em ajuste à largura e download do original. Fecha e libera documento/URL/canvas ao trocar conta ou carteira ou sair. No Android, tenta compartilhar o arquivo local pela Web Share API, sem upload; informa indisponibilidade quando o aparelho não oferecer suporte. O atalho Campanhas abre o diálogo já existente.

Arquivos desta etapa: assets/rotamapa-catalog-viewer.js, assets/rotamapa-catalog.css, assets/rotamapa-promotions-ui.js, index.html, scripts/check.mjs e tests/catalog-viewer.spec.js, além destes documentos. Nenhuma chave de armazenamento foi alterada. O PDF não é enviado ao servidor e não cadastra produtos. Persistência/sincronização de catálogos, caixas padrão e integração completa de promoções/comissões continuam pendentes; não declarar entrega integral.

Validação final: npm run check, verificação da arte RotaMapa e dos artefatos OCR passaram; 171 testes unitários passaram. 28 casos Chromium desktop claro/celular escuro passaram: 10 de catálogo (busca, zoom, original byte a byte, múltiplas páginas, miniaturas, troca de conta, arquivo inválido, campanha existente e compartilhamento nativo simulado), 14 de autenticação e 4 de importação. Fixtures bloqueiam serviços externos e usam dados sintéticos. Tela cheia/swipe físicos e aparelho Android real não foram certificados. Nenhum build APK novo foi realizado: a prova do APK anterior se refere ao código anterior ao catálogo, e esse APK não deve ser apresentado como atualização atual.

Instrução de retomada em ROTAMAPA-RETOMADA-PREVIA.md: confirmar acesso Vercel efetivo, preparar upload novo com allowlist e criar somente Preview no projeto existente, verificar resultado Ready/commit e entregar URL real Web/PWA. A tarefa antiga continuava sem ferramentas Vercel; cadastro manual de segredo HTTP/domínio na UI não se propagou à execução observada. Nenhum deployment, migração ou escrita em dados reais foi executado nesta etapa.

## Etapa 1H — Retomada autorizada, Vercel acessível e integração de documentos

O proprietário autorizou novamente a implementação integral nesta conversa. Mantida a branch dev/rotamapa-atualizacao-integral e a proibição de produção/dados reais. Nenhuma configuração publicada do ambiente foi reaplicada.

A credencial Vercel tornou-se ready no executor atual. GET autenticado confirmou projeto/equipe e produção aebf583/dpl_374iR7zDa8QqEDkYehYFWA5yBPee. Criada e confirmada READY a primeira Preview dpl_8cQHdsGUkpngrRa6fA1c37TCQ8h3, fonte e7cb0a3, URL https://traxio-preview-qg8easr3c-jeovadougllas-9240.vercel.app/. Produção permaneceu no mesmo deployment antes/depois. O hostname público da Preview é bloqueado pelo proxy desta tarefa; não confundir READY com validação remota completa.

Integrados biblioteca IndexedDB com isolamento por conta/carteira, persistência de originais locais, outbox explícita e sincronização imutável, caixas padrão com busca, importação/revisão de campanhas e contratos, projeção sobre faturamento real e snapshots das taxas, além de cards/legendas para WhatsApp com fotografia original conferida pelo usuário. Campos comerciais desconhecidos são retidos como restrições; exceções contratuais não resolvidas não liberam taxas automáticas. Reimportação com o mesmo conteúdo e nome de arquivo diferente preserva o original, sem duplicar regras.

Preparada migração 20261110000100_document_library.sql: RLS, RPC com plano/conta/carteira, bucket privado de catálogos, contador mensal compartilhado de PDFs, metadados imutáveis, verificação servidor do faturamento e regra sincronizada antes do snapshot. Rascunho apenas; não aplicado ao Supabase. Upload incompleto de catálogo pode ser retomado após verificar hash do original pelo proprietário. Exclusão definitiva com originais no Storage permanece bloqueada até limpeza autorizada; arquivamento e restauração preservam os originais. Dados textuais e caches sincronizados são limpos apenas no escopo confirmado pelo servidor.

Divergência preservada: a calculadora e o servidor existentes aceitam Dia D diário e Acelera mensal completo. Importações exatamente equivalentes podem ser adicionadas à calculadora sem alterar vendas antigas. Campanhas de períodos arbitrários ou restrições adicionais ficam para consulta/revisão; suporte integral dessas condições nas vendas ainda requer evolução e validação específicas. Não alegar que todo o Prompt Mestre foi concluído.

Validação: 176 testes unitários passaram; checks de sintaxe, arte RotaMapa e 10 artefatos OCR passaram. Rodada de regressão com 54 casos Chromium desktop/celular passou (autenticação simulada, cliente/pins, catálogo, documentos/OCR, pedidos remotos e bridge Android). Após endurecimento final da biblioteca e lifecycle, nova rodada focada com 26 casos passou. Cadeia SQL real de carteiras/planos/Insider/cota/biblioteca passou em Postgres 16 local sem rede, incluindo RLS multiusuário/carteira, upload privado, idempotência, arquivamento, tombstones, limite mensal e snapshots somente com faturamento e regra válida. Não houve testes com dados reais.

Adicionados preparo/deploy de Preview com allowlist, manifesto completo e confirmação de produção intacta; o preparo recusa checkout sujo para não atribuir fontes diferentes ao mesmo commit. Workflow de desenvolvimento tem apenas contents:read, testes sintéticos e artefatos Android, sem job de publicação; utiliza chave existente somente se produzir certificado igual ao APK 1.7.0 de referência. Não gera chave substituta. Detalhes, limitações e caminhos de configuração segura em ROTAMAPA-ENTREGA-DESENVOLVIMENTO.md.

Próximo passo desta etapa: registrar/push deste checkpoint, atualizar Preview a partir do commit exato, recompilar APK com as mesmas fontes e registrar recibos/hashes. Pendências externas: schema Supabase real ainda não auditado/acesso administrativo não confirmado; migrações exigem autorização específica; assinatura compatível Android e teste em aparelho não confirmados; faltam documentos originais e e-mails Insider. Ninguém foi ativado. A produção, autenticação e dados reais permanecem intactos.
