# Progresso — RotaMapa

## Estado de continuidade

- Etapa atual: Web/PWA 1.9.1 publicada e validada, com importação de participantes exclusivos da Feira Unifarma e contraste corrigido; todo trabalho e distribuição APK/OTA suspensos até novo pedido explícito.
- Conta de continuidade: exclusivamente a conta Codex desta conversa, por decisão posterior do proprietário. Não alternar contas.
- Branch exclusiva: `dev/rotamapa-atualizacao-integral`.
- Base: `aebf58353428de586c59cc321032f3e63ce50cee`.
- Produção atual: `dpl_HZxTmowhrsy4kPMqoSsFLodR7GRd`, READY/production, fonte `c6bb4b74d5245ae0f7dfce5505068b6b42909913`, https://traxio-preview.vercel.app/. APK/OTA suspensos. Rollback anterior 1.9.0: `dpl_2TVBpaFDJdSvcVSLb4SxEGKDp3bh`, com ressalva de compatibilidade da lista por CNPJ descrita ao final; preferir correção progressiva sem reverter dados.
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

### Correção de empacotamento OCR e validação PWA

Checkpoint 65fe4ab enviado e confirmado no GitHub; Preview dpl_6Wr4tv1hwhvu2yxokoZSq3Q7gJmR READY em https://traxio-preview-fqtl8hx6x-jeovadougllas-9240.vercel.app/. Produção continuou no deployment original. A compilação Android release passou em 14s, mas a conferência de TODOS os arquivos identificou que AAPT descompactava/renomeava por.traineddata.gz dentro do APK, quebrando a URL esperada pelo OCR. Esse APK não foi aprovado nem entregue como instalador.

Correção: manter os mesmos bytes/checksum upstream sob por.traineddata e solicitar esse caminho com gzip:false; o worker Tesseract identifica os bytes gzip automaticamente e os descompacta. Evita o renomeio pelo AAPT sem desabilitar verificações, alterar idioma ou criar divergência de runtime entre Web e Android. Extração/OCR real em imagem sintética repetida: 4 casos desktop/celular passaram. Será repetida a conferência byte a byte no APK recompilado.

PWA: 8 casos passaram com service worker REAL, cache contendo somente aviso offline, perda de transporte e reconexão sem perder a carteira sintética; controles e links sem códigos OAuth também verificados. O motor foi Chromium com identificação/interface de iPhone simulada, não Safari físico/WebKit; configuração explícita playwright.development-pwa.config.js. WebKit gerenciado não está instalado nesta instância. Não houve login real nem alteração do manifest/service worker existente.

Primeira execução CI 42743058946 passou em npm, checks, unitários e navegador, mas falhou no comando sdkmanager ausente do PATH do runner (exit 127); build e assinatura não foram executados por esse CI. Corrigida a chamada para o caminho do SDK já instalado. A próxima execução usa PostgreSQL local isolado e o teste adicional PWA. Não declarar CI aprovado antes de observar o resultado.


## Retomada nesta conversa — 10/11/2026 — candidata 1.8.0

Prompt Mestre recebido integralmente, com FIM DO PROMPT MESTRE. As referências de alternância entre contas são históricas, conforme orientação expressa do proprietário. A branch oficial remota já continha 15 commits após a base aprovada; preservados e auditados sem merge da experimental ou alterações na branch de produção.

Auditoria real somente leitura: Vercel confirmou produção no deployment/base originais, home HTTP 200, módulo de links e manifest Android iguais à entrega FAROL. Supabase confirmou 15 migrações, encerrando em explicit_manual_invoicing; nenhum dos rascunhos novos havia sido aplicado. Também foram consultadas assinaturas/hashes de funções e os avisos existentes, sem ler documentos ou modificar usuários. Os avisos são os quatro informativos de tabelas privadas QA sem políticas de cliente e o aviso preexistente de proteção contra senhas vazadas desabilitada. Não alterar configurações reais nesta etapa.

Verificação nesta execução: baseline com 176 testes unitários e cadeia SQL local aprovada. Corrigido o runner SQL que falhava no GitHub por depender de rg, ausente na imagem utilizada. As verificações de prontidão usam grep, disponível no runner, sem reduzir as asserções.

Implementado:

- Campanhas importadas chegam à calculadora e à venda, inclusive períodos arbitrários, região, horário, estoque informado e mais faixas do documento. As condições não se acumulam; casos sem elegibilidade usam tabela com aviso. O snapshot preserva documento/condições/contexto. O servidor confere origem, conjunto completo de faixas, vínculo e cálculo; nenhuma revisão de venda antiga ou preço original é executada.
- Importação de campanhas confirma o vínculo por apresentação, com seleção automática apenas quando inequívoca. Nomes funcionais de contratos aceitam abreviações equivalentes de formas e unidades sem aproximar doses ou embalagens.
- Exclusão com originais foi completada com confirmação forte, congelamento da carteira, ticket privado retomável, remoção pela API Storage autenticada em lotes e finalização apenas após confirmar ausência dos arquivos. Falhas preservam os registros locais; restauração/renomeação ficam bloqueadas enquanto a exclusão sem backup estiver em andamento. Não há DELETE de storage.objects no código de aplicação. O SQL de teste usa somente metadata sintética para exercitar RLS.
- Confirmação manual de faturamento sem PDF no histórico, preservando produtos/valores e coletando data do faturamento e número de nota opcional. O faturamento confirmado entra em ambos os rankings. Na projeção, usa-se a data de faturamento informada; registros históricos sem essa data usam a data da venda, não o dia em que o titular clicou para confirmar. Nenhum registro real foi reescrito.
- Ordem de carregamento corrigida para reler vendas importadas após reabertura. A conferência aparece imediatamente ao abrir o histórico, sem aguardar o timer de lembretes.
- Ranking na Preview aceita somente o hostname exato configurado pelo servidor nessa implantação, além das origens existentes. Não foi liberado wildcard Vercel nem alterado OAuth/redirect real.
- Versão funcional candidata 1.8.0, versionCode Android 8; identidade, IDs, chaves locais e runtime nativo preservados. O build público possui allowlist e saída separada; docs/SQL/testes/contratos não entram no site. O repositório foi confirmado PUBLIC, por isso a tabela comercial privada foi omitida do escopo atual. Isso não reescreve nem apaga commits anteriores.

Testes já observados nesta etapa: 183 unitários passaram; chain SQL local com RLS, campanhas na venda, exclusão retomável/Storage e data de faturamento passou; 16 casos desktop/celular da biblioteca passaram, 10 de exclusão passaram, quatro de OCR/CSV passaram e dois adicionais da confirmação manual passaram. Uma regressão ampla anterior aprovou 54 casos e apontou uma expectativa antiga sobre uso de documento ainda não sincronizado; esse caso foi atualizado para verificar o bloqueio seguro, e a suite específica passou. Um teste inicial parou por timeout global de 15s; a rodada documental usa 45s sem ampliar asserções locais de preço/estado. Uma tentativa PWA concorrente parou por disputa da porta local; nova execução usa servidor persistente e dados sintéticos.

Pendências externas preservadas: planilha original de 53 clientes/19 colunas; contratos/aditivos originais e tabelas de caixas/campanhas para aferir a leitura de documentos reais; cinco e-mails Insider; aprovação específica do rollout das sete migrações novas e da publicação. O catálogo EMS original já existe no anexo desta conversa, com 40 páginas, e não precisa ser reenviado. Nenhum Insider foi ativado.

Android: o workflow compila e procura exclusivamente uma assinatura compatível. Consulta à API GitHub encontrou zero caches disponíveis nesta execução; não assumir que o keystore original pode ser restaurado. Não gerar chave substituta nem distribuir unsigned.apk como instalador. O runtime atual também admite atualização interna de conteúdo; será preparado um pacote privado, sem publicação do manifest OTA de produção. Assinatura/instalação física e resultado final do CI ainda precisam de evidência específica.

Próximo checkpoint: resultados finais PWA/browser, CI Android, build público e Preview nova a partir do commit exato, com validação pública sem sessão real. Produção, banco e arquivos reais permanecem intactos.

Checkpoint adicional: sete casos PWA passaram com um caso de recuperação de transporte omitido nessa rodada porque foi usado TRAXELO_PWA_BASE; não declarar a omissão como aprovação. A confirmação manual ficou visível imediatamente no histórico e passou em desktop/celular. Condições ambíguas de campanha preservam estoque/horário/restrições durante a revisão.


### Fechamento do checkpoint 1.8.0

Commit funcional 6d63422 enviado ao GitHub. A proteção final de condições globais de OCR foi ampliada também às linhas que exigem revisão; 184 testes unitários passaram. A recuperação real de transporte PWA foi executada separadamente sem TRAXELO_PWA_BASE e passou, completando os oito cenários observados. O build público local foi verificado por hashes e não contém docs, SQL, testes, contratos ou instaladores.

Primeira Preview desta etapa: dpl_2acpiw4UPnkZ4wjPc5MqyAyhJvSX, fonte 6d63422, target null/Preview. A verificação pública e o build Android do CI são registrados separadamente; não confundir esse link com produção ou com ativação do schema. O workflow 42754441245 confirmou checks, testes unitários, build público e cadeia SQL local; browser/Android ainda estavam em execução na última consulta. Não declarar APK assinado antes de verificar android-proof.json.

Pacote Android de conteúdo preparado privadamente em /workspace/artifacts/rotamapa-integral-1.8.0, runtime capacitor8-20261026 e mínimo nativo 2. Não houve troca do manifest OTA de produção. O pacote será refeito quando a fonte mudar; nenhum instalador ou pacote antigo deve ser rotulado como a fonte nova.


### Entrega da prévia final deste checkpoint

Preview final READY: https://traxio-preview-e4imbmkby-jeovadougllas-9240.vercel.app/ — dpl_P2SDsoXDeP4j5bpLyB9iqvzfkZua, fonte cc3e72660efc6e53e4b09e1d65dfc37ef1cdc1bd, target null/Preview. Manifesto público e interpretador de documentos foram comparados com a fonte exata. Na primeira implantação com a mesma allowlist, o escopo privado retornou 404 e a API de ranking sem sessão retornou 401. Produção foi consultada novamente e permaneceu dpl_374iR7zDa8QqEDkYehYFWA5yBPee/aebf583.

CI 42754441245 da fonte 6d63422 concluiu com sucesso os checks, testes, SQL/RLS, navegador/PWA e compilação Android. A prova do compilador informou signed:false, signingStatus:Original compatible key not available, arquivo unsigned de 27.916.047 bytes, deviceTested:false. Esse arquivo NÃO é instalador apto para distribuição. CI 42755176227 valida a fonte cc3e726; consultar seu estado antes de alegar aprovação dessa fonte. Listagem de nomes de secrets via token CLI foi negada por 403; nenhuma chave foi lida, exposta ou criada, nem foi solicitada ampliação de acesso.

Pacote interno final Android: /workspace/artifacts/rotamapa-integral-1.8.0-final, fonte cc3e726, release af3f24aca289c6a81406ff23f7b5716fd0a58e64358a305880e31318aee76761, 149 arquivos, ZIP de 23.357.823 bytes. Conferidos os hashes de todos os arquivos, igualdade dos módulos compartilhados, runtime capacitor8-20261026/mínimo nativo 2 e limites do instalador (512 arquivos/80 MiB expandidos). Somente artefato privado; nenhum manifest OTA de produção foi alterado e nenhuma instalação física foi simulada como concluída.

Estado para o proprietário: candidata salva e testada, ainda não entrega final integral. Módulos novos de nuvem aguardam autorização específica para as sete migrações. A prévia continua apontando aos endpoints existentes; usar somente conta/dados de teste, sem sincronizar carteira real para avaliar alterações novas antes desse rollout. Permanecem necessários os arquivos de referência citados (planilha 53/19, contratos/aditivos, campanhas e caixas) e a resolução da assinatura do novo instalador. A atualização interna preserva a estratégia atual e está preparada para futura aprovação, sem exigir desinstalação.

Resultado posterior: CI 42755176227 da fonte final cc3e726 concluiu com success. Checks, 184 unitários, cadeia SQL/RLS, navegador/PWA e build Android aprovados. A validação de assinatura e aparelho permanece discriminada na prova Android; sucesso do job não transforma um unsigned.apk em instalador.


## Publicação integral autorizada — 10/11/2026

O proprietário descartou o redesenho minimalista, aprovou o mockup Insider e autorizou explicitamente concluir e publicar as alterações na Web, na PWA instalada e no Android. Esta autorização substitui o bloqueio histórico de publicação do Prompt Mestre. Não exige nova aprovação para esse rollout. O titular confirmou que ainda não possui os cinco e-mails Insider: deixar vagas e recursos prontos sem ativar convidados. Signature permanece inalterado.

Esclarecimento Pedido remoto: opção adicional no Resultado, canal WhatsApp padrão e outros canais opcionais. Não registra visita presencial, deslocamento, rota ou faturamento. Testes existentes confirmaram esse comportamento; nenhum ajuste desnecessário foi feito na autenticação da produção ou nas chaves de sessão. Mantida a interface atual e verificados os arquivos de arte e fundos originais.

Aplicadas em sequência as sete migrações já testadas em PostgreSQL isolado: insider_membership, portfolio_lifecycle, monthly_pdf_imports, document_library, imported_promotion_pricing, catalog_deletion_workflow e manual_invoice_date. Operações de exclusão não foram invocadas; nenhum convidado foi ativado. Fingerprints agregados de clientes, vendas, carteiras e grants são idênticos antes/depois do rollout. Segurança: tabelas privadas têm RLS e nenhuma política de acesso direto; RPCs públicas intencionalmente privilegiadas verificam auth.uid, conta/carteira, estado e confirmação e têm EXECUTE revogado de anon/PUBLIC. O aviso preexistente sobre senha vazada desabilitada não foi alterado.

Insider refinado conforme mockup: selo turquesa, cartão Pioneiros, benefício Elite, acesso gratuito permanente, agradecimento, ausência de cobrança; nenhuma mudança na apresentação Signature ou nos planos comerciais. 184 testes unitários, verificações de sintaxe/arte/OCR e cadeia SQL local passaram. Primeira rodada de 22 casos confirmou remotos/Signature/planos; identificou classe Insider ausente na aba Minha assinatura; corrigida e os dois casos Insider passaram em celular e desktop, claro/escuro. CI final e publicação ficam registrados adiante.

Preparado build público com allowlist explícita e validação dos hashes Web/Android. O novo entrypoint de produção não expõe escopo, contratos, testes ou SQL; inclui somente o manifesto, ZIP Android atual, página de instalação e instaladores previamente assinados identificados. O novo APK 1.8 ainda depende da chave original compatível; nenhuma chave substituta foi gerada. A entrega do app instalado usa o mecanismo OTA existente, sem desinstalação e sem reiniciar navegação em andamento. Não confundir atualização funcional com substituição do binário assinado.


### Web/PWA e pacote Android 1.8.0 publicados

Fonte funcional: 103a984c20be1ac03c0424694815b1d2d1a7a034. CI 42759046937 SUCCESS: 184 unitários, 78 casos de navegador, oito de PWA e cadeia SQL/RLS local aprovados; Android compilado com todos os assets compartilhados conferidos. O artefato é unsigned, 27.916.595 bytes, SHA-256 d1fd3edf82f906c1eb00b226b882da3ccf72a59e6645dd6146b0cbd7dd4c7603. Não foi distribuído como instalador.

Prévia validada: dpl_3zcMQ4NKXr8Diz74G2DB9ngzooyW. Produção REAL: dpl_ErNsdvVns1mpoBj9CLA535J4ZFvD, READY/production, https://traxio-preview.vercel.app/, mesma fonte exata. Foi feito build de produção próprio para preservar o escopo das variáveis de ambiente, sem promover Preview com ausência de chaves de produção. Nenhum segredo ou configuração OAuth foi alterado.

Conferidos via HTTPS os 160 arquivos públicos, manifesto Android/candidate idênticos, ZIP de 23.358.353 bytes e os 149 hashes internos. Release Android cd241481f71e628c65a3eb6c6cd7bed1d1f7feb405426f6c090e0c5a197382b3, runtime capacitor8-20261026/mínimo nativo 2. Índice Android é deliberadamente diferente do índice Web: inclui bridge e release metadata, sem controles PWA. Assets compartilhados são idênticos. HTML da prévia recebe toolbar da Vercel; a verificação retira exclusivamente esse script reconhecido na Preview, não altera a aplicação. Não há normalização de fontes JS, CSS, APKs ou ZIPs.

Verificação do endereço de produção passou: marca PWA RotaMapa, arquivos privados do escopo/SQL retornam 404, API de ranking rejeita POST sem autenticação com 401. Navegador renderizou os assets realmente servidos, o cartão Insider e a Central de Promoções; autenticação sintética e escritas reais bloqueadas, sem login de clientes reais. O catálogo EMS original de 40 páginas foi aberto em conta sintética local, primeira/última páginas renderizadas e download idêntico por SHA-256; clientes e produtos não foram modificados.

PWA: mesmo origin/manifest/IDs/armazenamento e worker network-only preservados. Fechar e reabrir com internet carrega o site novo, sem forçar reload de uma rota ativa. Android: manter instalação atual, abrir com internet e aguardar download; fechar completamente e reabrir para aplicar o pacote. Nova instalação usa o APK assinado 1.7.0 explicitamente identificado na página /docs/android-install.html e recebe depois os recursos 1.8.0 por OTA. Não rotular esse arquivo como APK 1.8.0 nem orientar desinstalação.

Validação do app Android instalado disparada no workflow 42759880864, fonte 103a984. Usa APK já assinado, emulador isolado, download HTTPS real da versão publicada e dados sintéticos; verifica cold start, preservação de dados, ACK e rejeição de pacote corrompido. Resultado final será adicionado após conclusão.

Rollback: manter o schema aditivo e os dados; não executar migrações reversas destrutivas. Em falha grave, reatribuir a produção ao deployment anterior dpl_374iR7zDa8QqEDkYehYFWA5yBPee. Esse deployment preserva o manifesto Android anterior f6dfbc71ce564b73d91fc9a5671f514774654461de5670a4c3e5d6768e3e476a. Não apagar os pacotes anteriores nem os dados do aparelho; o loader nativo mantém fallback validado. Restauração de UI/manifest não exige restauração de clientes/vendas, que não foram reescritos.

Pendências de dados a fornecer pelo titular: cinco e-mails Insider, planilha original 53/19 e contratos/aditivos/caixas para validação desses exemplos reais. Essas ausências não bloqueiam os importadores disponíveis para os usuários, nem autorizam inventar taxas ou convidados. Pagamentos reais e Google billing/geolocalização continuam fora deste rollout. Um novo APK nativo assinado 1.8.0 continua dependendo da chave compatível; atualização interna funcional foi publicada e não troca assinatura.


## Central Comercial — Web/PWA 1.8.1 — 10/11/2026

Autorização: titular aprovou e pediu implementação da organização comercial e dos ajustes visuais anotados. Confirmação posterior Arrastão Azul MENSAL; Acelera mensal e Dia D diário. APK suspenso por ordem expressa; nenhuma compilação, assinatura, emulador, alteração em mobile/ ou regeneração dos arquivos updates/android/ nesta etapa. Pipeline de desenvolvimento agora valida somente Web/PWA. Build público com allowlist sem distribuir instaladores ou OTA.

Registro histórico correto: o workflow Android 42759880864 terminou com FALHA, sem staging/aplicação do pacote 1.8. O instalador existente rejeita extensões não aceitas pelo loader; não tratar o pacote publicado anteriormente como atualização aplicada. Não corrigir o loader nem retomar APK sem novo pedido do titular.

Implementados: menu Comercial com maleta reconhecida pelo adaptador; Central Comercial ordenada em Campanhas, Material de Divulgação, Projeção de comissões e Consultas. Catálogo/caixas/biblioteca agrupados em Consultas. Navegação inicial por família de campanha, detalhamento de produtos somente ao selecionar a família, filtro por data e consulta de vigências anteriores. Fontes desconhecidas preservadas como Outras campanhas, sem presumir modalidade. Registros comerciais legados e vendas não são migrados nem reescritos.

Importador mantém PDF/imagem/OCR local e tabelas existentes. Seletor de modalidade com identificação automática da lâmina e conferência de conflito; Acelera/Arrastão exigem mês completo e Dia D um único dia. Categoria opcional fica nos metadados imutáveis do documento, com todos os tiers e condições de origem preservados. Nenhuma migração ou escrita administrativa em Supabase necessária. Regras de cota, sincronização e origem confirmada para calcular/salvar vendas permanecem.

Novos fundos por página: agendamentos.webp, ranking.webp, links.webp, comercial.webp, gerados no padrão visual original e otimizados WebP; hashes em docs/commercial-scenes.json. Arquivos dos cinco fundos originais preservados. Hero e cenário da página apontam à mesma arte correspondente. Contraste corrigido apenas em #regionFilterSummary no modo claro.

Validação até este checkpoint: 188 unitários passaram, checks de fontes/arte/OCR passaram, 36 casos focados de navegador aprovaram visual, campanhas, biblioteca, catálogo, preço importado, cards, comissões, isolamento e faturamento sem PDF. Após a confirmação do Arrastão mensal, repetição focada cobre a nova vigência e regressões de preços/faixas. Uma suite comercial antiga clicava em controles recolhidos desde o layout anterior; seus helpers foram atualizados para abrir os disclosures reais, sem mudar as asserções de valores. Resultado final, CI e publicação serão registrados ao concluir.


### Correção posterior do titular — duração do Arrastão Azul

Arrastão Azul ocorre uma vez por mês, mas é válido SOMENTE em uma data, com início e fim no mesmo dia. Acelera SellOut continua pelo mês completo. Dia D continua diário. Essa correção substitui a interpretação anterior que tratava a vigência do Arrastão como mês inteiro. Validar uma única data por lâmina de Arrastão sem inventar um limite de importações nem reescrever campanhas históricas.


### Validações da Central Comercial e correção da vigência

Fonte inicial 8f8906a: CI 42789514242 SUCCESS, incluindo verificações, 188 unitários, RLS local, 86 casos de navegador e oito de PWA; não houve build/assinatura/emulador/distribuição Android. Prévia dpl_BVKAswrBKBwfh7YspECTgLCRcTdZ verificada por hash dos 160 arquivos Web/PWA; arquivos privados e endpoint de atualização Android ausentes (404). Navegador verificou a página e campanhas a partir dos arquivos realmente servidos em quatro viewports: celular, tablet vertical/horizontal e desktop, com autenticação sintética e escritas reais bloqueadas.

Regressões locais adicionais passaram 14 casos de cálculo e faixas: preço de tabela após item com desconto, 17/18 unidades, preço unitário exato, faixas opcionais e edição após reabrir o app. Os helpers antigos precisavam abrir o disclosure que já recolhia os controles no layout anterior, inclusive após reload; foram ajustados para os controles reais sem alterar os valores esperados.

Correção do titular chegou antes da publicação de produção: Arrastão é um único dia no mês, não o mês inteiro. Fonte corrigida fba62a0: 188 unitários repetidos e os dois casos Arrastão em celular/desktop passaram; valida início=fim e uma única data por lâmina, sem aplicar limite novo de importações. A prévia antiga não foi promovida. A publicação definitiva usa apenas a fonte corrigida.

Rollback desta etapa deve preservar a suspensão Android: restaurar somente fontes Web anteriores mantendo o build Web/PWA-only. Não reatribuir automaticamente um deployment antigo que volte a distribuir OTA/instaladores. Nunca reverter dados reais ou apagar regras/documentos/vendas para desfazer uma mudança de interface.


### Entrega concluída — Central Comercial Web/PWA 1.8.1

Produção confirmada READY: dpl_FSdm4V93oDKeRQz2VGyGEpsixGV3, fonte fba62a0ac5eae6ead09f192488f4c8c8706a12d1, domínio habitual https://traxio-preview.vercel.app/. CI 42790502785 SUCCESS na fonte corrigida: 188 unitários, 86 casos Chromium desktop/celular, oito cenários PWA com service worker real e cadeia SQL/RLS local. Zero compilação, assinatura, emulador ou distribuição Android. Arquivos mobile/ e updates/android/ sem alterações nesta etapa.

Verificação de produção: 160 arquivos públicos conferidos por SHA-256, versão 1.8.1 e nome PWA RotaMapa; escopo/SQL privados e endpoint OTA retornam 404, POST de ranking sem autenticação retorna 401. Navegador renderizou os assets realmente publicados nos quatro tamanhos de tela, confirmou a ordem dos quatro blocos, três famílias iniciais e produtos ocultos antes de selecionar campanha. Autenticação sintética e escritas reais bloqueadas; nenhum login de usuário real nem migração administrativa de dados. Checagem Vercel de erros de execução nos últimos 15 minutos: nenhum erro encontrado. Recibo em docs/rotamapa-1.8.1-commercial-release.json.

Vigência final correta: Acelera SellOut mês inteiro; Dia D somente um dia; Arrastão Azul acontece uma vez por mês e é válido somente no dia escolhido. Importador confere início=fim e uma única data por lâmina do Arrastão, sem inventar quota mensal de campanhas. Arquivos e condições antigos preservados, incluindo duplicidades históricas; reimportação equivalente preserva o original.

PWA existente recebe a atualização ao fechar e reabrir com internet. Mesmo endereço, manifest, IDs, chaves, sessão e armazenamento; nenhuma reinstalação e nenhum reload forçado durante rota ativa. APK permanece suspenso, com endpoints de distribuição excluídos do build Web/PWA. Próximos ajustes continuam somente Web/PWA, conforme ordem do titular.

## Atualizações aprovadas — candidata Web/PWA 1.9.0 — 10/11/2026

O titular aprovou expressamente implementar e publicar os ajustes acumulados na Web e na PWA. Aprovação posterior da referência visual 2 (listas compactas) substitui o descarte anterior: somente ações, atalhos e superfícies de informação; preservar fundos ilustrados, cabeçalhos, logo e paleta. APK/Android/OTA continuam suspensos. Nenhuma reativação Insider ou mudança de autenticação.

Implementados nesta candidata: quatro disclosures compactos na Central Comercial; atalhos e links mais finos; eliminação da lacuna entre planejamento e opções do mapa; exclusão sem digitação com confirmação nativa, cancelamento e mesmas proteções/validação do servidor. Não foi executada exclusão real.

Vitrine Feira Unifarma com 29 apresentações e EANs verificados, vigência exclusiva 12–13/11/2026 (RN), tabela e faixas transcritas exclusivamente das colunas finais com imposto. Preços fixos da lâmina, sem recalcular pelo percentual nem acumular outras campanhas. Busca, favoritos por conta/carteira, modo apresentação responsivo, seleção da quantidade, faixa e total previsto. Não gera venda nem faturamento automaticamente. Fora da vigência, identifica prévia ou consulta histórica.

Material de Divulgação: galeria por conta/carteira no IndexedDB local, famílias Acelera/Dia D/Arrastão/Feira, originais e cards gerados, legenda guardada, imagem ampliada com fechamento/zoom e download; catálogo de preços da carteira e filtro sem promoção vigente. Recortes originais do catálogo associados por código/EAN, substituição de foto com conferência explícita da apresentação; a geração reutiliza a foto. Novos materiais e fotos personalizados são locais a este aparelho; não alegar sincronização em nuvem desses binários. PWA continua network-only para HTML: originais ficam locais, mas reabrir todo o app offline continua usando o aviso offline anterior.

Comissões: mês vigente inicial do dia 1 até hoje, gráfico acumulado diário, escolha opcional de mês/período, atualização sobre faturamento confirmado e exceções explícitas para taxas ausentes. Leitura de regras da nuvem ao abrir; não inventa taxas, não confunde desconto promocional com comissão. Recebidos e conferidos o contrato original e o aditivo. Apenas as regras normalizadas foram adicionadas privadamente à carteira EMS do titular: 42 vínculos anteriores até setembro e 44 a partir de outubro, total de dois documentos/86 regras. PDFs, identificação contratual e percentuais privados ficam FORA do repositório público e do runtime. Comparação agregada comprovou os 105 registros comerciais inalterados antes/depois. Nenhuma migração, alteração de RLS ou regra da conta Maura.

Pendência explícita de arquivos: dez fotos foram exibidas na conversa e visualmente identificadas, mas sem originais locais ou pointers Sediment disponíveis para download. Solicitado reenvio como arquivos/ZIP enquanto prossegue a validação. Há 36 recortes do catálogo preparados e registro das oito apresentações sem foto utilizável; não substituir por embalagens geradas. Duas das dez imagens são melhorias de fotos já existentes. Esta pendência impede declarar a etapa das fotos integralmente concluída.

Validação em andamento: 190 unitários aprovados; verificações de sintaxe e integridade de arte/OCR. Primeira rodada 42 casos passou 41 e encontrou mensagem de validação de foto divergente; mensagem corrigida sem reduzir asserções. Execução simultânea de tablets foi interrompida porque o servidor de outra suite encerrou; falha de infraestrutura, não contar como aprovação. Nova matriz sequencial usa servidor persistente independente. Resultado final, commit, CI e publicação serão registrados após conclusão.

Checkpoint: fonte f5f8880 enviada ao GitHub e Preview dpl_2pDTz8WYd6GhgxhHEJ6tKRXZppUx READY. Os 202 arquivos públicos foram conferidos por hash; escopo/SQL/Android ausentes e ranking sem sessão rejeitado com 401. Não é produção. Matriz responsiva passou 23/24; o card completo de 29 produtos ultrapassou a espera padrão de cinco segundos no celular. Adicionado progresso de geração e bloqueio do botão, legenda completa e download direto; repetição das quatro apresentações passou 4/4 com prazo apropriado de 20 segundos para gerar o PNG completo. Oito testes de PWA passaram com worker real, incluindo falha de transporte e recuperação sem perder os dados sintéticos. CI 42822446060 aprovou checks, 190 unitários, build público, SQL/RLS e 94 casos de navegador; dois testes antigos do catálogo precisavam abrir o novo disclosure Campanhas antes de clicar e foram atualizados. Não tratar esse CI como aprovado integralmente.

## Ampliação solicitada durante a implementação — Feira Unifarma anual

O titular pediu ambiente próprio no menu lateral, destinado às carteiras identificadas como EMS Marcas, com identidade EMS + Unifarma, participantes da rede e convidados, lançamentos vinculados e ranking do brinde. Confirmou explicitamente: prêmio classificado SOMENTE por faturamento confirmado. O mesmo pedido permanece no histórico geral e alimenta comissão/rankings gerais sem cópia financeira. Publicação foi retida para incorporar esta ampliação; a produção continua 1.8.1 até o recibo definitivo abaixo.

ZIP Logos + Produtos recebido e conferido: dez fotos originais e duas marcas oficiais. Pendência anterior de arquivos resolvida. Todas as 44 apresentações têm imagens reais com hashes verificados; dez originais copiados sem alteração dos bytes. Metadados de enquadramento são usados no SVG/canvas de exibição, preservando os originais. A marca Convenção Unifarma 2026 é exibida somente na edição de 2026. Fundo exclusivo de pavilhão de convenções gerado sem marcas; logos oficiais sobrepostas como arquivos originais. Outros fundos e a marca RotaMapa são preservados.

Novo menu Feira Unifarma com ícone de estande, seleção/criação de edição anual, Ofertas, Vendas, Ranking e Participantes. Identificação EMS usa a preferência existente da carteira, sem conceder acesso a dados de terceiros. Preferências anuais e referências ficam no item settings já protegido por proprietário/carteira, com revisão CAS e comparação canônica. Nenhuma nova tabela, RPC, migração ou alteração de RLS.

Clientes são incluídos explicitamente como Rede Unifarma ou Convidado. Não classifica automaticamente todas as vendas do período como vendas da feira. Vínculo é referência ao mesmo ID do histórico, com seleção dos pedidos de origem quando um registro reúne vários PDFs; permite justificar manualmente exceção de data. Revogar vínculo não cancela nem altera a venda geral. Contabilização usa itens efetivamente faturados e cortes conferidos, desconta devoluções/estornos conhecidos, exclui cancelados e pendentes, e aceita faturamento posterior à data da feira. Mesmos CNPJs são agrupados. Empate na liderança é sinalizado; nenhum brinde é concedido automaticamente.

Registro/importação iniciado na feira usa a calculadora/importador existentes. Evento de venda salva agenda somente a referência; falha de conexão mantém o registro geral e a fila local de vínculo por proprietário/carteira, com retomada sem duplicação. Configurações de participantes/edições precisam de conexão para confirmação; dados previamente sincronizados permanecem consultáveis. Nova fila é removida apenas após exclusão da carteira confirmada no servidor. Troca de conta/carteira oculta imediatamente nomes, resultados e formulários privados.

Condições RN 2026 conferidas e adicionadas privadamente à carteira EMS do titular como um documento reviewed: 29 produtos, 54 faixas, início 12/11 e fim 13/11; nenhuma faixa acima do preço cadastrado. Não foram alterados produtos, valores ou status de vendas existentes. Ao iniciar venda pela feira, a condição importada apropriada é disponibilizada na calculadora, sem acumular outros descontos nem alterar o preço de tabela. Próximas edições usam suas próprias lâminas/importações; não reutilizam automaticamente ofertas ou a marca datada de 2026.

Validações locais desta ampliação: 196 testes unitários aprovados, incluindo totalização por referência, recibos selecionados, cortes, cancelamentos/devoluções, confirmação de outro usuário rejeitada, faturamento tardio, convidados, datas e duplicidade entre edições. Seis cenários principais desktop/celular passaram; 16 casos tablet vertical/horizontal passaram; quatro casos adicionais de venda offline/retomada e isolamento na troca de conta passaram; dois casos de seleção automática do preço importado passaram, preservando a tabela e a origem. Arte e OCR íntegros. Fonte final será novamente validada no CI e na implantação antes da publicação.

CI anterior 42823409337 da fonte b363e80 concluiu SUCCESS (Web/PWA sem Android), antes da ampliação anual. Não atribuir esse resultado à fonte nova. Rollback de UI deve usar a entrega Web/PWA 1.8.1, que já exclui Android/OTA; manter os documentos privados aditivos e os dados reais, sem exclusões ou reversões destrutivas.

Checkpoint anual: CI 42829944228 da fonte 0f20ae5 concluiu SUCCESS. Runtime público de 216 arquivos conferido por hash, privados/Android ausentes e ranking sem autenticação rejeitado. Ajuste posterior permite lançar manualmente pedidos depois do fim da feira usando a data real dentro da edição; antes do início continua bloqueado. A captura do formulário impede salvar como pedido da feira uma data fora do período. Dois testes desktop/celular passaram: data inicial 13/11 ao consultar em 14/11, tentativa em 14/11 rejeitada sem gravar e confirmação em 13/11 vinculada uma única vez. Esse ajuste será incluído na fonte final e no novo CI.


## Entrega concluída — Web/PWA 1.9.0 — 10/11/2026

Autorização expressa do titular para concluir todas as alterações e publicar Web/PWA, ampliada pelo pedido do ambiente anual Feira Unifarma e pelo envio das logos e fotos originais. Publicada a fonte funcional d21ba36d73339723ee6e1978e357838c1c2f8e7b no deployment dpl_2TVBpaFDJdSvcVSLb4SxEGKDp3bh, READY/production. Alias habitual https://traxio-preview.vercel.app/ confirmado nesse deployment. Build de produção próprio com variáveis do ambiente de produção; Preview não foi promovida como substituta. Nenhuma configuração OAuth, segredo ou política RLS alterada.

CI final 42831521991 SUCCESS na fonte exata: 196 unitários, 110 cenários de navegador, oito testes PWA com service worker real, checks de fontes/arte/OCR e cadeia SQL/RLS local. Rodadas adicionais locais aprovaram tablets, retomada offline do vínculo da feira, troca de conta, seleção da condição importada, lançamento posterior com data real dentro da edição e duas regressões completas de planejamento de rota desktop/celular.

Verificação HTTPS em produção: 216 arquivos públicos idênticos por SHA-256 à fonte, versão 1.9.0, documentos privados/SQL/Android ausentes (404), API de ranking sem sessão rejeitada (401). Navegador com dados sintéticos e escritas reais bloqueadas confirmou os assets servidos em celular, tablet vertical, tablet horizontal e desktop: 29 ofertas, ambas as logos originais carregadas, nenhum erro JavaScript nem overflow na apresentação verificada. Apevitin 140 unidades: total R$ 1.008,00, com imposto. Vercel não registrou erros de runtime na janela consultada de 15 minutos; essa consulta não garante ausência de erros futuros. Evidências locais em /workspace/artifacts/rotamapa-showroom-1.9.0 e recibo público de engenharia em docs/rotamapa-1.9.0-release.json.

Entregues os atalhos compactos preservando fundos/paleta, links úteis mais finos, remoção do vão do planejador, exclusão com confirmar/cancelar sem digitação, projeção mensal automática com evolução e consulta histórica, galeria de materiais, fotos reais nas 44 apresentações e ambiente Feira Unifarma anual. Feira 2026: 12–13/11, 29 produtos e 54 faixas com impostos, fotos e marcas oficiais. Prêmio somente por faturamento confirmado; referências aos mesmos registros de venda, sem duplicar receita/comissão. Participantes e pedidos reais não foram admitidos/vinculados automaticamente; o titular os seleciona no ambiente.

Documentos de regras de comissão conferidos com o contrato/aditivo e documento de campanha revisada foram adicionados somente à carteira EMS do titular, conforme autorização, preservando vendas existentes. Não foram publicados contratos, dados bancários nem percentuais individuais no runtime. Não houve migração de schema ou mudança de RLS. Assinaturas Signature preservadas; nenhuma vaga Insider ativada sem e-mail. A integração automática Mercado Farma permanece descartada.

Limitações de uso: cards, fotos personalizadas e seus binários são guardados por conta/carteira neste aparelho e não sincronizam entre aparelhos. Configuração da feira e referências confirmadas usam a sincronização existente; o vínculo pendente após venda offline tem retomada sem duplicação. A PWA mantém o worker network-only existente: abrir com internet; não prometer cold start totalmente offline. Novas lâminas anuais exigem importação e revisão, sem reutilizar preços ou marca 2026 automaticamente. Taxas ausentes e projeções parciais continuam indicadas; comissão estimada não é comprovante de pagamento.

Atualização instalada: fechar completamente e reabrir a PWA com internet, mantendo mesmo origin, manifesto, IDs e armazenamento; não desinstalar nem apagar dados. APK/OTA continuam suspensos: nenhum build, assinatura, emulador, distribuição ou alteração em mobile/ e updates/android/ nesta entrega (comparação com fonte publicada 1.8.1). Rollback usa dpl_FSdm4V93oDKeRQz2VGyGEpsixGV3, que já exclui Android/OTA. Manter os documentos privados aditivos, os dados e os vínculos; não executar reversão destrutiva do banco. Este recibo final altera documentação apenas e não muda a fonte funcional publicada d21ba36.


## Ajustes solicitados após uso no celular — Web/PWA 1.9.1 em validação

Titular aprovou lista própria da feira por PDF/Excel/CSV, limitada a CNPJ, razão social e nome fantasia, com pesquisa também em Vendas. Essa lista não deve criar cadastros gerais, endereço, pins ou rotas; ao registrar pedido, o CNPJ identifica o cliente já existente na carteira EMS. Pediu corrigir somente o contraste de quantidade e preço no caminho Ofertas → Produtos e condições, preservando a organização e os fundos. Autorização de atualização Web/PWA permanece vigente; APK/OTA continuam suspensos.

Implementação: participantes podem ser referências antigas de cliente ou registros próprios da edição por CNPJ. Leitura compatível com as referências já gravadas; resolução dinâmica por CNPJ e agrupamento do ranking conservam os mesmos IDs de vendas. Importação local com prévia editável, confirmação explícita, validação dos dígitos verificadores, deduplicação e identificação de CNPJs ausentes/ambíguos na carteira. Somente os três campos autorizados são persistidos no settings existente por proprietário/carteira; arquivos e outras colunas não são enviados. Reimportar atualiza os nomes da lista da feira sem sobrescrever a categoria anterior nem alterar dados dos clientes. Lista e busca em Participantes; filtro por CNPJ/razão/fantasia em Vendas. Participante ainda não identificado permanece consultável; não cria cliente automaticamente nem permite escolher silenciosamente entre cadastros gerais duplicados.

PDFs usam extração local com posições de colunas e OCR existente quando necessário; CNPJ e nomes são conferidos na prévia. Arquivos de até 20 MB/30 páginas e listas até 5.000 participantes, respeitando o tamanho disponível do settings; planilhas têm cabeçalho CNPJ e Razão social ou Nome fantasia. Sem promessa de reconhecimento perfeito de qualquer diagramação; documento ambíguo exige correção na prévia ou Excel/CSV. O PDF específico do titular ainda não foi recebido para aferir sua diagramação.

Adicionados nove casos unitários de importação/vínculo/isolamento e cenários de navegador para CSV, PDF real, repetição, nomes com acentos, pesquisa parcial de CNPJ, pedido único no histórico, faturamento, recarga, erro de sincronização e troca de conta. Excel XLSX e XLS foram lidos com a biblioteca SheetJS 0.20.3 original em navegador isolado e dados sintéticos, sem alterar os 157 clientes do teste. Contraste das etiquetas validado nos dois modos por razão WCAG >=4,5. Rodada inicial revelou que a mensagem de falha de salvamento era apagada pela atualização da prévia; corrigida para preservar o erro e permitir nova tentativa. Testes antigos foram ajustados para abrir o disclosure de inclusão individual, mantendo as asserções financeiras. Rodadas concorrentes causaram timeouts de execução e foram substituídas por uma única suite; não contar execuções interrompidas como sucesso. Fonte final, CI e publicação serão registrados após conclusão.


### Entrega concluída — participantes da feira e contraste — 1.9.1

Produção READY confirmada: dpl_HZxTmowhrsy4kPMqoSsFLodR7GRd, fonte c6bb4b74d5245ae0f7dfce5505068b6b42909913, domínio habitual https://traxio-preview.vercel.app/. Preview validada dpl_HYAjcAVSniK5byxLjVB6diwRKrQi. Publicação por build próprio de produção com o escopo correto de ambiente; nenhuma variável, redirect OAuth ou segredo alterado.

CI 42844919000 SUCCESS na fonte exata: 205 unitários, 120 cenários de navegador, oito testes PWA e cadeia SQL/RLS isolada. Suite local final única: 24 cenários focados desktop/celular aprovados, incluindo falha de salvamento e nova tentativa, retomada offline, associação de venda sem duplicação e confirmação tardia. XLSX e XLS reais lidos com SheetJS 0.20.3; PDF real com PDF.js; CSV com leitor existente. A diagramação do PDF específico do titular ainda depende do arquivo, não enviado nesta etapa; prévia e edição permitem conferir a leitura antes de salvar.

218 arquivos públicos conferidos em produção por SHA-256; escopo, SQL, arquivos privados e Android ausentes (404), API de ranking sem autenticação recusada (401). Navegador nos quatro tamanhos de tela confirmou a versão realmente servida: importação sintética de dois CNPJs, filtro por fantasia, resolução ao ID original do cliente, lista geral e vendas intactas, nenhum erro JavaScript. Escritas reais bloqueadas e nenhum login de cliente real utilizado. Contraste medido nas etiquetas: 10,13:1 no modo claro e 11,17:1 no escuro, com os fundos preservados. Zero erros de runtime na janela consultada de 15 minutos; não equivale a garantia futura. Evidências locais em /workspace/artifacts/rotamapa-fair-1.9.1 e recibo docs/rotamapa-1.9.1-release.json.

Não houve escrita administrativa em dados reais, migração de schema, alteração de RLS, concessão de acessos ou mudança de contratos/taxas nesta etapa. Os próprios usuários importam a lista nas suas edições, via settings já protegido por conta e carteira. Não foram criados participantes reais automaticamente. Somente CNPJ/razão social/fantasia e categoria são guardados para novos participantes; as referências antigas ao ID do cliente são preservadas quando já existiam. Endereços, coordenadas e outras colunas do arquivo não são persistidos na lista.

PWA: fechar completamente e reabrir com internet, no mesmo origin/armazenamento; não desinstalar nem apagar dados. Sem alterações em mobile/ ou updates/android/ em comparação à produção 1.9.0, sem build/emulador/assinatura/OTA Android.

Rollback: manter todo o settings e todos os registros financeiros. O deployment anterior Web/PWA 1.9.0 dpl_2TVBpaFDJdSvcVSLb4SxEGKDp3bh preserva a suspensão Android, porém seu leitor antigo exige clientId para todo participante e não renderiza listas novas somente por CNPJ. Assim, preferir correção progressiva que preserve a compatibilidade; se necessário restaurar a UI anterior temporariamente, manter os dados e informar indisponibilidade do ambiente da feira até restaurar o leitor novo. Não apagar participantes para acomodar uma versão antiga. A fonte funcional publicada permanece c6bb4b7; este recibo final é documental.
