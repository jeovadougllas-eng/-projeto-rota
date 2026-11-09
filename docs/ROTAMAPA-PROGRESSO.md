# Progresso — RotaMapa

## Estado de continuidade

- Etapa atual: fase 0, documentação permanente; implementação funcional não iniciada.
- Branch exclusiva: `dev/rotamapa-atualizacao-integral`.
- Base: `aebf58353428de586c59cc321032f3e63ce50cee`.
- Produção informada pelo proprietário: deployment Vercel `dpl_374iR7zDa8QqEDkYehYFWA5yBPee`, READY, target production, branch `dev/traxelo-android-routes`.
- Experimental preservada: `4d8c018eed5956a4eef6e87536602a893275746c`; sem merge.
- Datas: sessão informa 2026-11-09; Prompt Mestre declara versão 11/11/2026. Preservada a versão do autor, sem inferir mudança do relógio.

## Etapa 0A — Documentação

Concluído: leitura integral do arquivo disponível (19.976 bytes), ativação da branch correta e criação de AGENTS.md, docs/ROTAMAPA-ESCOPO.md e deste documento. O escopo contém a transcrição completa do material recebido.

Nenhum arquivo da aplicação, configuração Vercel, banco, autenticação, dado real, PWA ou APK foi alterado. Nenhum deploy ou workflow de publicação foi executado.

Commit desta etapa: localizar por `git log --oneline -- AGENTS.md docs/ROTAMAPA-ESCOPO.md docs/ROTAMAPA-PROGRESSO.md` (o hash do próprio commit não pode constar de seu conteúdo). Mensagem prevista: `docs: persist RotaMapa safety rules and received master scope`.

## Auditoria anterior preservada

Main 84b23d4 é ancestral de aebf583, 421 commits atrás. A experimental acrescenta três commits a aebf583: núcleo de comissões e ajustes de identidade/mensagem PKCE. Não foi incorporada. A versão base contém PWA, Android, carteiras, visitas, agenda, vendas, faturamento, ranking e assinatura. Não usar instruções antigas de setup da main como descrição completa desta base.

## Divergências e bloqueios

1. O arquivo do Prompt Mestre termina em `- [ ] Os cinco Insiders não`, na seção 12. Falta a continuação dos critérios de aceitação e eventual conteúdo posterior. Não inferir o restante. Implementação pausada até recebimento da continuação.
2. O módulo experimental de comissões não existe na base de produção; deve ser auditado e testado antes de eventual reaproveitamento, sem merge integral.
3. Há identidade histórica Traxio no login legado. Investigar camadas de interface e fluxo PKCE antes de corrigir; não renomear chaves internas.
4. A planilha correta UNIFARMA - DOUGLAS.xlsx (53 clientes, 19 colunas) não foi fornecida nesta sessão. Não usar a versão de 279 clientes.
5. Faltam e-mails dos cinco Insiders, documentos originais EMS, contratos/aditivos, amostras de campanhas e caixas. Não ativar benefícios nem taxas presumidas.
6. Rede observada anteriormente bloqueia serviços externos e Vercel. Configuração reutilizável start_skill teve erro INVALID_ARGUMENT; persistência não confirmada. Não ampliar rede indiscriminadamente.

## Validação desta etapa

Somente documentação: conferir branch/base, integridade da transcrição, diff sem alterações na aplicação e verificação de whitespace. `git diff --cached --check` apontou seis finais de linha com dois espaços usados como quebra Markdown no original; foram preservados para manter a transcrição. A verificação com `core.whitespace=-blank-at-eol` permite essas quebras intencionais. Testes funcionais, instalação de dependências, testes de navegador, RLS e builds Web/PWA/APK ainda não executados nesta etapa. Nenhuma alegação de prontidão funcional.

## Próximas etapas

1. Receber e integrar a continuação do Prompt Mestre antes de implementar.
2. Confirmar envio da branch e deste commit ao GitHub; se falhar, registrar o erro e não alegar continuidade remota.
3. Auditar scripts de testes e efeitos colaterais, dependências e toolchain Android; preparar testes isolados.
4. Comparar autenticação, identidade, limites dos planos e modelos de dados com o escopo; explicar divergências antes de mudar comportamento.
5. Implementar por etapas com testes e commits, atualizando este documento em cada etapa. Nenhum recurso dos capítulos 3–10 está declarado concluído por esta documentação.
