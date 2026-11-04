# RotaMapa 1.2 — gestão e teste de planos

## Pedidos e faturamento

PDFs cancelados são rejeitados. Faturados entram como venda confirmada. Processamento/confirmado usam o total solicitado; atendido usa o atendido, com conferência dos itens e da soma. Até dois documentos da mesma empresa podem compor uma venda, mantendo cada distribuidora independente.

Pedidos sem faturamento entram no total provisório por sete dias a partir do registro no servidor. Após esse prazo ficam fora do total provisório e permanecem arquivados, sem exclusão automática. O aviso na tela inicial e o sino abrem a conferência. É possível confirmar quantidades e preços efetivamente faturados, registrar cortes/cancelamento ou importar a versão faturada do mesmo pedido. O original e as confirmações anteriores são preservados; a atualização não cria venda duplicada.

Os relatórios distinguem valores faturados/declarados, provisórios e arquivados. Gráficos financeiros e ranking usam apenas faturados/declarados. Os valores representam vendas, não lucro líquido: comissão e despesas não são inventadas.

## Atualização da carteira

No painel, **Atualizar carteira** compara uma planilha com a carteira selecionada por CNPJ. Uma única tela mostra quem permanece, entra/reativa, sai, duplicidades e inconsistências. CNPJ e razão social ficam visíveis. CSV/Excel são preferíveis; PDF precisa conter uma lista de clientes legível com CNPJ e razão social na mesma linha. PDF de pedido não é uma carteira.

A ativação requer revisão explícita e uma transação com revisão dos registros. Clientes que saem ficam inativos; cadastros, coordenadas confirmadas e históricos não são apagados. **Versões anteriores** permite revisar uma restauração antes de ativá-la. Catálogos, campanhas, vendas, visitas e rotas continuam separados por carteira.

## Compradores e rotas

O Histórico oferece Top 5 do mês, agregado por CNPJ. O critério Pro **Potencial de compra** usa os três meses completos anteriores: volume 60%, frequência mensal 25%, recência 15%. É um índice histórico, não probabilidade de compra nem garantia de faturamento.

Exclui clientes com compra ou pedido ainda não resolvido no mês atual, incluindo pedidos arquivados após sete dias. Considera apenas pontos confirmados e os filtros atuais de cidade, região, bairro, prioridade e busca. A análise substitui a seleção pelos candidatos elegíveis. Restrinja os filtros a até 50 candidatos por consulta rodoviária.

Limites editáveis: até o primeiro cliente, entre clientes, distância total e número de paradas. Os padrões são 10 km, 5 km, 30 km e 10 visitas. Usa distâncias dirigidas pelas ruas e verifica novamente os trechos do trajeto final. Não relaxa limites silenciosamente; não inclui retorno à origem. A seleção é uma heurística determinística, sem promessa de ótimo global e sem trânsito ao vivo. Uma sequência salva pode ser reaberta como rota comum; gere nova sugestão para reavaliar compras e limites.

Natal usa o mapeamento de bairros/zonas da [Prefeitura/SEMURB, PPA 2026–2029](https://www2.natal.rn.gov.br/_anexos/guiaservicos/anexo_num_50.pdf). Outras cidades podem usar o campo Região comercial, sem inferir zonas pela direção do mapa.

## Planos e ensaio de upgrade

| Recurso | Free | Plus | Pro |
|---|---|---|---|
| Rotas salvas | 3 | 20 | Sem limite comercial |
| Carteiras | 1 | 3 | Sem limite comercial |
| Cadastro, mapa e cálculo manual de venda | Sim | Sim | Sim |
| Agenda, PDFs, relatórios completos, ranking | — | Sim | Sim |
| Potencial de compra, projeções avançadas e comparativos | — | — | Sim |

Registros existentes ficam acessíveis ao reiniciar o teste no Free; novas operações respeitam os limites. A recuperação de faturamentos já cadastrados continua disponível. Limites de carteiras/rotas e importação PDF também são validados no banco; o endpoint de compradores verifica a sessão e o plano no servidor.

O convite privado exige o e-mail confirmado da conta autorizada. Essa conta começa em Free; em **Menu da conta → Meu plano** pode simular Plus, depois Pro, ou reiniciar Free. Nenhum cartão, checkout real ou cobrança é criado. O convite expira em sete dias; o teste ativado vale trinta dias. A conta do responsável e o acesso beta geral não são alterados. Parâmetros de URL apenas abrem o diálogo; não concedem plano.

## Segurança e distribuição

As tabelas privadas de teste têm RLS e nenhuma permissão direta para clientes; funções verificam o titular e registram a progressão. A verificação de segurança manteve apenas o aviso pré-existente de [proteção contra senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), além das tabelas privadas intencionalmente sem políticas de acesso direto.

PDFs são processados localmente; arquivos reais e convites não são incluídos no repositório. O APK de testes é destinado a novas instalações. Instalações compatíveis existentes devem manter seus dados e usar a atualização interna; o instalador original permanece preservado. Navegadores simulados não substituem validação física em rota.
