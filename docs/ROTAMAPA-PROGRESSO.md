# Progresso — RotaMapa

## Estado de continuidade

- Etapa atual: escopo completo recebido; auditoria e implementação incremental iniciadas.
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
