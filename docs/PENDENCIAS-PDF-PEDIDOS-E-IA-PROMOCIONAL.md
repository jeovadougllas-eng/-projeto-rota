# Pontos guardados — PDF de pedidos e chamadas promocionais por IA

Registro: 11/11/2026. **Decisão mais recente do titular: guardar os pontos e aguardar a retomada. Não alterar o aplicativo, não integrar serviços, não ativar cobrança e não publicar atualização por causa deste planejamento.** Esta instrução prevalece sobre autorizações anteriores de execução para estes itens. Somente documentação nesta etapa.

## 1. PDF individual de cada pedido

Pedido do titular: permitir baixar um PDF de cada venda/pedido, tanto nas vendas gerais quanto nas vendas da Feira Unifarma. A opção deve estar disponível ao terminar a confirmação do pedido. Objetivo: registrar os pedidos rapidamente no RM durante visitas/feiras e lançar depois, por exemplo à noite, no Mercado Farma. Não presumir integração automática, envio ao distribuidor ou pedido já lançado no Mercado Farma.

Nome do arquivo deve identificar facilmente o cliente. Exemplo proposto, fictício: `Pedido_Farmacia-Boa-Esperanca_2026-11-12_RM-00123.pdf`. Data e número precisam corresponder ao pedido real; formato definitivo ainda pode ser alinhado.

Conteúdo sugerido na conversa para um PDF completo: razão social, nome fantasia e CNPJ; data e identificação do pedido; origem geral/Feira Unifarma e edição quando aplicável; distribuidora; produtos/apresentações, EAN, quantidades, preços unitários com impostos, subtotais e total; condições comerciais e observações disponíveis. Campos ausentes não devem ser inventados. Diferenciar pedido confirmado de faturamento confirmado e de documento fiscal. PDF de pedido não confirma comissão/faturamento nem equivale a nota fiscal.

Foi sugerido manter o download também no detalhe da venda para baixar novamente. Não implementado. Na retomada, verificar o fluxo existente, pedidos reais versus simulação da feira e permissões antes de definir a solução final. Preservar todos os registros, faixas, impostos e precisão monetária existentes.

## 2. IA para chamadas promocionais completas

O titular esclareceu que os cards atuais já funcionam bem. A nova ideia é mais abrangente: criar peças publicitárias completas por instrução em texto, no estilo das duas referências Arrastão Azul enviadas na conversa. Não substituir/reformular os cards já aprovados.

Referências: arte vertical para Status/Stories, azul intenso/ciano/amarelo, letras grandes e efeitos de profundidade/luz, calendário, megafone, logo oficial e hierarquia de chamada comercial. As imagens mostram versões consistentes "É amanhã" e "É hoje" da mesma campanha. A data 22/10/2026 das referências é histórica, não autorização de nova vigência nem regra comercial atual.

Possíveis usos discutidos: Vem aí, É amanhã, É hoje, Últimas horas; convites de feira, lançamentos, ações com brindes e outras divulgações. Usuário descreve campanha, mensagem, data, estilo e formato; recebe prévia para revisar. Logos oficiais e textos/datas devem poder ser preservados/corrigidos; foi proposta composição de imagens geradas com elementos oficiais e textos editáveis no RM, sem garantir ainda como será implementada.

Não prometer que um modelo gratuito alcança a qualidade das referências, mantém o estilo entre versões ou reproduz logos/textos corretamente. Precisamos avaliar resultados antes de escolher a integração/API. Não inventar descontos, preços, brindes ou condições comerciais.

## 3. Prioridade financeira e opções discutidas

Titular informou ChatGPT Plus e prioridade de não assumir custo adicional. Geração de imagens nesta conversa pode usar os limites do Plus; integração do RM com a API OpenAI tem faturamento separado. O Plus não dá direito aos créditos de API da oferta específica para assinaturas Pro/Business elegíveis consultada na documentação. Não contratar outra assinatura por pressuposição.

Pesquisa documental em 11/11/2026 (revalidar na retomada; nenhuma conta externa criada/testada pelo assistente):

- **Cloudflare Workers AI / FLUX.1 Schnell**: opção recomendada para avaliação sem custo adicional; franquia de 10.000 neurons por dia compartilhada pelo uso da conta nos modelos elegíveis. Neurons são unidades de processamento, não imagens; não prometer 10.000 imagens/dia ou número fixo de imagens. FLUX.1 Schnell tem licença Apache 2.0 com uso comercial permitido, sujeito também aos termos da plataforma. Alguns outros modelos exigem pagamento; não assumir gratuidade de todo o catálogo.
- **Stability AI**: documentação anuncia 25 créditos iniciais para testar; bônus inicial, não franquia renovada diariamente. Stable Image Core custa 3 créditos por geração na tabela consultada, cerca de 8 gerações com 25 créditos. API permite uso comercial dos resultados conforme termos. Verificar oferta efetivamente disponível na conta antes de qualquer teste.
- **OpenAI API**: opção paga ou com crédito promocional efetivamente concedido; compra pré-paga mínima de US$5 na documentação consultada. Não comprar, ativar recarga ou configurar API agora.
- A página atual do Hugging Face consultada informa que contas Free precisam comprar créditos; não usar antigos resultados de busca de US$0,10/mês como promessa atual.

Fontes oficiais consultadas:

- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/
- https://huggingface.co/black-forest-labs/FLUX.1-schnell/blob/main/README.md
- https://docs.stability.ai/pricing
- https://platform.stability.ai/faq
- https://huggingface.co/docs/inference-providers/pricing
- https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing
- https://help.openai.com/en/articles/20001626-api-credits-benefit-for-eligible-chatgpt-subscriptions

## 4. Teste combinado para a retomada — fora do RM

1. Titular pode criar uma conta gratuita em https://dash.cloudflare.com/ quando retomar.
2. Procurar Workers AI e a área Playground; selecionar FLUX.1 Schnell. Confirmar a disponibilidade atual. Se aparecer exigência de pagamento, parar e conferir, sem contratar plano pago.
3. Gerar uma imagem com o mesmo briefing de teste abaixo. Nenhuma API key deve ser enviada pela conversa.
4. Titular baixa a imagem e pode trazê-la à conversa para avaliação conjunta.
5. Se o resultado agradar, testar versão "É hoje" da mesma campanha para verificar consistência; comparar duas opções por ferramenta, quando a franquia permitir. Usar o mesmo texto/configuração/referência onde houver suporte.
6. Avaliar impacto visual, escrita/acentos/data corretos, legibilidade no celular, fidelidade da marca e consistência entre versões. Uma imagem gerada aqui pode servir de referência usando os limites do Plus, sem contratar API.
7. Somente após avaliar qualidade, gratuidade real e condições de uso, discutir integração. Teste no site/Playground não prova que o modelo, a qualidade e os limites são idênticos na API; validar a API separadamente quando autorizado.

Briefing proposto (exemplo de teste, **não é campanha vigente nem instrução de implementação**):

> Crie uma arte publicitária vertical para uma campanha chamada “ARRASTÃO AZUL”, destinada a proprietários de farmácias. Use azul intenso, ciano e amarelo, calendário grande, megafone, luzes e letras impactantes. Inclua exatamente os textos: “ATENÇÃO”, “É AMANHÃ!”, “ARRASTÃO AZUL” e “12/11/2026”. Não inclua preços, descontos ou logos inventadas. Visual de campanha comercial, com boa leitura no celular.

Proporção desejada: 9:16. A data do briefing é apenas o exemplo discutido; ao retomar, atualizar conforme a campanha real escolhida. Logo oficial só deve ser enviada/aplicada quando o teste suportar imagem de referência/composição; não pedir ao modelo para inventá-la.

## Estado de entrega

- Pontos registrados para continuidade; implementação de PDF e integração IA não iniciadas.
- Nenhuma geração de imagem, conta Cloudflare/Stability, contratação, chave, cobrança, configuração de API ou teste externo executado nesta etapa.
- Aplicativo permanece na versão publicada 1.11.1. Nenhuma alteração de código, dados, configurações, banco, Web/PWA ou plataforma nativa para estes novos pontos.
- Próximo passo: aguardar o titular voltar e indicar a retomada. Não tratar este documento como autorização para iniciar trabalho no aplicativo.
