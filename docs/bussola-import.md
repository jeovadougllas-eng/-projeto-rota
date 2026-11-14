# Web/PWA 1.16.0 — CSV Bússola e identidade dos produtos

## Fluxo

Em Importar arquivos > Vendas do Bússola (ou no atalho contextual Feira Unifarma > Vendas), usar **Importar CSV do Bússola**. Exportar Pedidos em CSV no Bússola; este recurso não faz login no Mercado Farma, não usa API externa nem envia pedidos. A leitura é local. Arquivo UTF-8 até 10 MB, 10 mil linhas e 500 pedidos; até 100 EANs por pedido. Colunas podem estar em outra ordem; nomes esperados são os da exportação Bússola. Separadores vírgula e ponto e vírgula, aspas, acentos e decimais brasileiros são tratados.

A prévia identifica clientes pelo CNPJ e produtos pelo EAN; também usa a relação verificada código EMS → EAN das 44 apresentações. Clientes fora da carteira ou ambíguos precisam ser ignorados ou resolvidos na carteira antes. Apresentação desconhecida requer associação explícita; EAN conflitante não pode ser associado silenciosamente.

Número do pedido e CNPJ identificam pedidos externos. Distribuidora e cabeçalhos divergentes exigem conferência. PDF único do mesmo pedido pode receber o vínculo. Venda com vários PDFs fica bloqueada para não atribuir o total de um pedido ao conjunto. Vendas manuais do mesmo CNPJ são oferecidas para seleção, nunca juntadas automaticamente. Quando há candidatas, o padrão é ignorar até escolher um vínculo ou confirmar novo. Dois pedidos externos não podem usar o mesmo registro RM no lote.

Ao confirmar com alguma pendência, o formulário rola até o campo correspondente e o coloca em foco, com destaque e mensagem junto dele. Ao corrigir e confirmar novamente, a próxima pendência é indicada. Pedidos marcados para ignorar continuam fora da validação do lote.

Marcar a conferência global e, quando houver confirmação anterior de faturamento, a revisão da divergência. Só depois Confirmar importação grava o lote local. Carteira/histórico alterado durante a prévia invalida o lote e pede reabertura. Erro de espaço não grava metade do lote. Mesmo conteúdo externo é reconhecido mesmo em outro arquivo/dia; não cria outra venda. Pedidos novos recebem ID determinístico por conta/carteira/CNPJ/pedido. Índice e validação no servidor protegem duplicidade, inclusive entre CSV/PDF e aparelhos. Revisões usam o CAS existente. Conflitos remotos ficam pendentes, sem sobrescrever dados silenciosamente.

## Valores e histórico

O pedido original, ID, cliente, linhas/preços, notas, confirmação manual, PDF e vínculos de feira são preservados. `bussola` guarda a revisão conferida; `bussolaHistory` preserva até 10 revisões anteriores. Pedidos novos usam origem explícita `bussola_csv`, sem fingir um PDF nem consumir cota de PDF. Limite de tamanho existente de 256 KiB por registro permanece; ao atingir limites é necessário preservar os dados e revisar com suporte.

`valor_faturado` permanece como faturamento sem impostos informado pelo CSV. Total com impostos é **calculado** por quantidade faturada × preço unitário com impostos. O CSV de referência fecha exatamente com preços sem impostos; não há alíquota inventada. Faturado parcial usa só a quantidade faturada; Atendido e Atendido Parcial sem nota não contam como faturamento. Cancelado sem faturamento retira o registro dos totais sem apagar o original. Nota exportada pode ter referência alfanumérica: não é convertida indevidamente para número fiscal puro.

Rankings gerais e da feira usam valores com impostos; Bússola é calculado e isso aparece no histórico. Comissão mantém a base já implementada e as regras individuais; valores sem impostos são preservados separadamente, sem alterar percentuais contratuais. Para Bússola o ranking mensal usa a data de faturamento. Pedidos novos só entram na feira depois de vínculo explícito à edição; atualizações conservam vínculos existentes. Nenhum pedido remoto é transformado em visita presencial.

A exportação CSV não fornece uma data confiável da última mudança de cada pedido. Assim, o RM não adivinha que uma situação mudou depois: a prévia exige conferência da revisão importada e alerta sobre arquivos antigos. Pedidos faturados que o CSV informar como cancelados ou diferentes precisam ser conferidos; não inferir devolução fiscal ou estorno sem informação.

## Catálogo e PDF

Normalização local/sincronizada por referência EMS verificada: EAN e nome padrão associados ao mesmo ID/código/preço. Nome anterior guardado como alternativa. Histórico e snapshots de campanhas não são renomeados. Códigos sem referência inequívoca permanecem para revisão. EAN conflitante ou duplicado não dispara sugestão automática. O PDF passa a preferir EAN em vez de semelhança de texto. Não é consulta online ao cadastro GS1 nem enriquecimento por API paga.

## Offline e atualização

Lote salvo no outbox existente, isolado por conta/carteira, até reconectar. Fechar sem confirmar descarta a prévia e não cria vendas. Arquivo permanece no aparelho; relatório normalizado e hash são sincronizados. Não há upload do CSV bruto. Primeira preparação exige internet. Atualizar todos os aparelhos para 1.16.0 antes de importar; clientes anteriores não entendem a nova origem CSV e podem recusar sua sincronização até atualizar.

APK/OTA suspensos. Rollback Web possível para 1.15.1 (deployment dpl_9vjf6W8YgMePMXEbjXuxdf4WY8FN), porém uma vez importados pedidos CSV recomenda-se correção adiante em vez de cliente antigo incapaz de ler a nova origem. Não apagar snapshots nem reverter dados reais para rollback.
