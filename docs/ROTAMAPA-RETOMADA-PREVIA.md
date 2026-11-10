# Retomada imediata — entregar URL Web/PWA em Preview

O proprietário autorizou validar e salvar o trabalho pendente para iniciar uma nova tarefa na MESMA conta, com ferramentas/credencial Vercel efetivamente disponíveis. Prioridade imediata é entregar uma URL real de Preview da versão salva, sem publicar produção. Não voltar a conduzir o proprietário por menus/tokens/comandos locais já tentados.

## Antes de agir

Leia AGENTS.md, ROTAMAPA-PROGRESSO.md e ROTAMAPA-ESCOPO.md. Use exclusivamente dev/rotamapa-atualizacao-integral e o HEAD remoto mais recente. Não usar main, reset destrutivo ou merge da experimental. Código atual é o último commit que altera este arquivo/catálogo e seus descendentes. A ausência de ferramentas é um bloqueio da publicação, não motivo para recriar o aplicativo ou configurar outro projeto.

## Verificação objetiva de acesso

Descubra as ferramentas Vercel realmente disponíveis. Se usar API/CLI, confira nomes/presença de VERCEL_TOKEN e estado da rede; nunca imprima valores, headers de autorização ou arquivos de credenciais. O proprietário cadastrou o segredo HTTP e api.vercel.com na UI, mas esses valores NÃO chegaram à tarefa antiga, que continuava na revisão 1, sem bindings. Não pedir outro token sem testar primeiro o que está disponível nesta nova execução.

Consulte somente os metadados do projeto existente para confirmar a identidade:

- Projeto: traxio-preview.
- Project ID informado no Prompt Mestre: prj_Bes4oJLB9Nsv4tosvzI29F5sfytu.
- Team ID informado: team_nkA7YdysnXiPjmhoqbOoTBzc.
- Escopo/slug visto nas capturas: jeovadougllas-9240.
- Domínio de produção preservado: traxio-preview.vercel.app.

Não inferir identidade pela semelhança do nome; comparar IDs da resposta. Não alterar Git integration, Production Branch, Auto-assign Custom Production Domains, variáveis de produção ou domínios.

## Preparar e publicar somente Preview

Use scripts/prepare-vercel-preview.mjs para preparar um upload NOVO a partir do checkout validado. O ZIP antigo da sessão anterior está desatualizado em relação ao catálogo novo. O script inclui runtime e exclui docs privados, .env, banco, testes, APKs e repositório Git, registra o commit e hashes e não executa deploy.

Use o mecanismo autenticado disponível para o projeto EXISTENTE e target Preview. Se usar CLI, vincule apenas localmente o diretório preparado ao projeto existente e use `deploy --target=preview`; nunca --prod, promote, alias ou domains. Não criar outro projeto. Não publicar a raiz inteira do checkout, pois contém documentos de escopo com referências comerciais privadas e artefatos que não devem ser servidos publicamente.

Espere o resultado real da implantação. Não invente URL nem apresente deployment antigo como versão atual. Confirme que o manifesto rotamapa-preview-build.json corresponde ao commit e que a home, assets, iphone.webmanifest, iphone-sw.js e ícones necessários respondem corretamente. Faça inspeção sem sessão real e sem escritas em dados de produção. Informe proteção de acesso e limitações de PWA, caso existam; não desative proteções globais para fazer um teste passar.

Entregue a URL real Web e informe que PWA usa o mesmo endereço. Preview não equivale à entrega integral de todas as funcionalidades nem autoriza promoção para produção.

## Limitações já conhecidas

Código ainda aponta aos endpoints Supabase originais. Não usar contas reais para testes de escrita nem alterar redirects/RLS/banco para resolver a prévia sem autorização. Migrações de Insider, ciclo de carteiras e contador PDF estão preparadas mas não aplicadas. APIs existentes possuem regras de origem que precisam de validação. Arquivos fornecidos para o catálogo são visualizados localmente; não há persistência/sincronização de PDF nessa etapa.

APK anterior é unsigned e não contém o catálogo adicionado depois. Não distribuir como atualização. Entrega APK exige reconstrução da versão final, assinatura compatível e teste de atualização. Não é condição para criar a Preview Web; registrar como entrega separada pendente.

## Comunicação e encerramento

Registrar URL/ID/commit/target/resultado da Preview e testes no progresso, fazer commit e push. Se faltarem ferramentas, credencial ou rede nessa nova execução, informar exatamente qual teste falhou e parar apenas a publicação. Não pedir para o usuário criar tokens repetidamente nem prometer que acesso foi confirmado sem evidência.
