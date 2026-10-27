# Rotas salvas, agenda e planos — pré-lançamento

## Onde encontrar

- Gere o trajeto em **Mapa e Rotas** e toque em **Salvar esta rota** junto ao resumo. Dê um nome de até 100 caracteres.
- Use **Minhas rotas salvas** para abrir a biblioteca na mesma página. Também é possível salvar a rota atual ali.
- A biblioteca permite buscar pelo nome, abrir com posição atual ou origem original, renomear e excluir. Plus e Pro acrescentam favoritos, filtro de favoritas e duplicação.
- Ao abrir, a ordem é preservada e o percurso pelas ruas é recalculado com os cadastros atuais. Clientes removidos e pontos pendentes impedem a abertura até revisão. Posições corrigidas usam as coordenadas atuais e são identificadas no resumo.
- Uma rota salva é um planejamento. Salvar, abrir, duplicar ou agendar nunca registra visitas realizadas.

## Agenda

Em **Minhas rotas → Agenda de visitas**, programe um cliente ou uma rota para uma data, uma repetição semanal ou mensal. O dia 31 usa o último dia disponível em meses mais curtos, voltando ao dia original no próximo mês. Compromissos únicos vencidos permanecem visíveis para conferência.

A próxima programação também aparece no Painel. Os lembretes são mostrados dentro do aplicativo quando ele está aberto; esta entrega não inclui notificações push ou acompanhamento com o aplicativo fechado.

## Histórico e acompanhamento

- Todos os planos mantêm cadastro, mapas, confirmação de localização, navegação, recálculo e histórico/resumo de visitas.
- Plus: Excel completo com resumos, visitas, dados diários e semanais, PDVs e dois gráficos editáveis.
- Pro: metas, projeção diária do mês usando os dias concluídos até ontem, comparação mensal e sugestões de retorno.
- No mês em andamento, a comparação considera até o mesmo dia nos dois meses, limitado ao último dia do mês anterior. Meses fechados usam os meses completos.
- A cobertura usa a carteira ativa atual como referência nos dois períodos, sem alegar uma reconstrução histórica da carteira.
- O Excel Pro inclui a aba **Comparação**; o Plus omite os valores de projeção e comparação.
- Nas sugestões Pro, defina o intervalo de retorno em dias para cada cliente. Só visitas confirmadas contam para a última visita. Chegadas por GPS ainda pendentes, registros anulados e datas futuras não entram. Clientes sem histórico são descritos como **Sem visita registrada**.
- Em Histórico, **Salvar preferências na conta** sincroniza a meta, o fuso e o calendário. A edição diária continua disponível localmente; o botão confirma o envio das preferências à nuvem.

## Planos aprovados

| Recurso | Free | Plus | Pro |
|---|---|---|---|
| Rotas salvas | 3 | 20 | Sem limite de quantidade |
| Abrir, renomear, excluir | Sim | Sim | Sim |
| Favoritos e duplicação | — | Sim | Sim |
| Agenda recorrente | — | Sim | Sim |
| Excel completo e gráficos | — | Sim | Sim |
| Metas e projeção | — | — | Sim |
| Comparação e sugestões de retorno | — | — | Sim |

**Pré-lançamento:** contas autenticadas recebem Pro de teste gratuitamente enquanto o indicador de beta está ativo no servidor. Não há checkout, preços ou cobrança. Concessões administrativas explícitas por conta têm prioridade e permitem validar Free e Plus. O usuário não pode alterar seu plano pelo navegador.

Uma redução de plano preserva todas as rotas para consulta, abertura, renomeação e exclusão. Novos salvamentos ficam bloqueados enquanto a quantidade exceder a cota. Favoritos e compromissos já guardados permanecem nos dados, sem criação/edição de recursos exclusivos fora do plano.

## Persistência e limites técnicos

- Biblioteca, agenda e preferências são vinculadas ao UUID da conta e sincronizadas no Supabase. Cada registro tem revisão: uma edição antiga não sobrescreve uma mais recente.
- Novas gravações e exclusões exigem internet para confirmar o plano, a cota e o salvamento no servidor. A última biblioteca sincronizada pode ser consultada offline. Atualizar o percurso/navegar depende dos serviços de mapa/roteamento e GPS.
- Quotas são verificadas no servidor sob bloqueio por usuário, inclusive em pedidos simultâneos. Tabelas de planos e biblioteca não aceitam gravação direta de clientes.
- Exclusões são lógicas, evitando ressuscitar rotas em outro aparelho. Uma falha de comunicação não aparece como salvamento confirmado.
- Rotas ilimitadas significam quantidade de rotas armazenadas no Pro, não consultas ilimitadas aos provedores. Há validação de tamanho por registro e 1.000 paradas por rota, além dos limites técnicos atuais do roteamento.
- Clientes, evidências de localização e histórico existentes não são migrados, removidos nem convertidos em planejamento.

## Verificação

`test-unit/premium-model.test.mjs`, `tests/premium.spec.js`, `test-db/premium-assertions.sql`, `test-db/premium-concurrency.py` e `.github/workflows/premium.yml` cobrem planos, conta, cotas, conflitos, rotas reabertas, recorrência, recomendações e exportação real do Excel. Os testes de interface usam contas/GPS/serviços sintéticos e não consultam a carteira real.

`test-db/premium-assertions.sql` foi executado em transação com rollback no Supabase, sem deixar usuários ou rotas de teste. O teste de concorrência roda somente no PostgreSQL isolado de CI.

O mesmo pacote web é usado na PWA e no Android. A atualização Android mantém o APK assinado original, aplica o novo conteúdo na próxima inicialização e preserva a carteira e o histórico. O fluxo de CI só ativa o pacote depois dos testes no APK original instalado no emulador.
