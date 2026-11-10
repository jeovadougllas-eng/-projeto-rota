# Instruções permanentes — RotaMapa

## Decisão vigente — somente Web e PWA

O proprietário suspendeu expressamente todo trabalho no APK. Não compilar, gerar, assinar, testar em emulador, distribuir ou publicar atualizações Android/OTA até novo pedido explícito. Desenvolver, testar e publicar somente Web/PWA. Essa decisão prevalece sobre as referências históricas de entrega nas três plataformas. Não alterar arquivos de mobile/ ou updates/android/ para acompanhar releases Web.

Leia integralmente este arquivo, docs/ROTAMAPA-ESCOPO.md e docs/ROTAMAPA-PROGRESSO.md antes de trabalhar. O GitHub é a fonte de continuidade entre sessões e tarefas; não dependa de memória de conversas. Se o escopo estiver incompleto, registre a lacuna e peça a continuação sem inventar requisitos.

## Conta de continuidade — decisão vigente

O proprietário decidiu manter a evolução do RotaMapa exclusivamente na conta Codex desta conversa. Essa decisão substitui as orientações anteriores de alternância entre duas contas presentes no Prompt Mestre, sem alterar o escopo funcional aprovado. Não proponha alternância de contas ao atingir a cota; retome nesta mesma conta quando houver disponibilidade.

Sessões e tarefas podem ser diferentes dentro desta conta: antes de retomar, consulte o GitHub e os documentos de progresso. Não presuma que memórias, ferramentas, processos ou credenciais sejam herdados. Esta decisão não migra nem recria GitHub, Supabase, Vercel ou o aplicativo. Consulte docs/ROTAMAPA-CONTINUIDADE.md.

## Branch e preservação

- Desenvolva exclusivamente em `dev/rotamapa-atualizacao-integral`. Confirme branch, HEAD e alterações locais antes de editar. Cada tarefa já é isolada; use o checkout existente, sem criar worktree salvo solicitação explícita.
- Base autorizada: `aebf58353428de586c59cc321032f3e63ce50cee`, produção informada pelo proprietário (deployment `dpl_374iR7zDa8QqEDkYehYFWA5yBPee`). Não use a main antiga.
- Preserve `dev/traxelo-android-routes` e `dev/rotamapa-insider-promocoes-importacao`. Não faça merge integral da experimental; audite separadamente qualquer aproveitamento.
- Preserve alterações de terceiros. Não use reset destrutivo, limpeza indiscriminada, force push ou reescrita de histórico.

## Segurança e dados

- O aplicativo está em uso com dados reais. Não recrie o produto, não substitua funcionalidades existentes e não redesenhe interfaces aprovadas.
- Preserve IDs de usuários e carteiras, chaves de armazenamento, sessões, pins confirmados, histórico, isolamento entre contas e carteiras e sincronização offline. Mudanças de chaves exigem plano de migração e aprovação.
- Preserve Supabase, autenticação e políticas RLS. Não faça escritas em produção, concessões de acesso, exclusões ou migrações destrutivas sem autorização expressa. Testes usam dados sintéticos, serviços simulados ou banco local isolado.
- Não complete login real para testar: a aplicação pode sincronizar dados ao autenticar. Não altere redirects ou sessões de produção para resolver erros de prévia sem diagnóstico.
- Nunca registre segredos, tokens, dados pessoais, contratos individuais ou documentos bancários. Referências EMS no escopo são privadas, não verificadas e não podem virar configuração definitiva ou material público sem validação e autorização.
- Preserve Signature e seus direitos existentes. Insider é limitado a cinco convidados; não ativar sem os e-mails fornecidos e autorização. Permissões devem ser verificadas no servidor.

## Identidade e compatibilidade

- Nome público: RotaMapa. Preserve logo, paleta, tipografia, navegação, layout e responsividade. Nomes técnicos históricos Traxio/Traxelo não justificam renomear projetos, chaves ou identificadores.
- Entregas contemplam Web, PWA e Android, com mesma versão funcional. Preserve manifest, service worker, armazenamento, assinatura Android e estratégia de atualização.
- Havendo divergência entre escopo e código, investigue, documente e explique antes de modificar; preserve o comportamento atual enquanto a mudança não estiver compreendida e validada.

## Desenvolvimento e validação

- Trabalhe incrementalmente com commits organizados. Não considere concluído só porque compila.
- Consulte scripts e testes existentes antes de executar. `npm ci` instala dependências com lockfile; `npm run check` verifica fontes e arte; os testes de modelo ficam em `test-unit`, e os testes de navegador em `tests`.
- Inspecione comandos antes de rodar: alguns scripts e workflows históricos acessam produção, escrevem dados ou publicam artefatos. Não execute workflows de release nem migrações automaticamente.
- Valide, conforme a mudança: regressões, RLS local, multiusuário, importação, precisão monetária, datas, offline, sincronização, autenticação simulada, responsividade, PWA e Android. Distinga testes passados, falhos, não executados e bloqueados.
- Projeções de comissão usam somente valores faturados, descontadas devoluções e ajustes conhecidos; não são controle de pagamento nem prova de direito adquirido. Não confunda comissão com desconto comercial.
- Registre ao final de cada etapa progresso, arquivos, decisões, testes, riscos, pendências e próximos passos em docs/ROTAMAPA-PROGRESSO.md. Faça commits e envie esta branch ao GitHub para continuidade, sem incluir segredos ou documentos individuais.

## Publicação

- Não publique em produção, não altere Vercel, Supabase ou dados reais sem autorização expressa específica.
- O domínio chamado traxio-preview pode atender produção: não deduza segurança pelo nome. Confirme target, domínio e commit antes de qualquer deploy.
- Entregas futuras devem incluir changelog, resultados verificáveis, limitações, atualização e rollback; publicação depende de aprovação posterior.
