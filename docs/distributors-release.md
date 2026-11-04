# RotaMapa 1.2.1 — distribuidoras dos pedidos PDF

Na conferência de cada PDF, o campo de texto livre foi substituído por uma seleção com Acripel e Meirelles. O campo continua opcional e a seleção é independente para cada um dos dois documentos da venda.

A leitura preenche a distribuidora quando encontra uma identificação textual explícita ou uma marca textual inequívoca no cabeçalho. Maiúsculas e minúsculas são tratadas da mesma forma. Nomes de clientes e de produtos não são usados para presumir a distribuidora; resultados ausentes ou ambíguos ficam para escolha manual. A seleção automática pode ser corrigida, e qualquer mudança pede nova conferência antes de salvar.

Os três PDFs anteriormente fornecidos não trazem esses nomes no texto extraído. Nesses modelos a escolha permanece manual; não inferimos a empresa a partir do CNPJ do cliente, de preços ou do número do pedido. Não foi acrescentado OCR nem envio dos documentos a serviços externos.

A identificação de produtos, a confirmação manual de apresentações e os cálculos não foram alterados. Os nomes escolhidos são preservados no histórico e nas exportações usando o campo de distribuidora já existente. Registros antigos não são reescritos e não há migração de banco de dados.
