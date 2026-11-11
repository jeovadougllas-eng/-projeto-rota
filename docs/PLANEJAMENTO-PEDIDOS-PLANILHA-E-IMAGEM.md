# Planejamento guardado — pedidos por planilha e imagem

11/11/2026. Titular perguntou viabilidade e pediu expressamente **não implementar esta ideia agora**. Não autoriza criar/importar pedidos, contratar IA/OCR, integrar Mercado Farma ou alterar o aplicativo por causa desta proposta. A atualização já autorizada de PDFs de pré-pedidos e ordem alfabética continua separadamente.

Confirmados no mapa atual RotaMapaProductPhotos: 44 apresentações associadas às imagens cadastradas. Não confundir com a lâmina de 29 ofertas da Feira nem com 44 arquivos originais independentes.

## Ideia do titular

- Modelo de planilha editável para encaminhar aos clientes: catálogo completo preenchido, cliente informa só CNPJ e quantidades.
- Produtos, apresentação, EAN e imagens de referência previamente associados; ordem alfabética.
- RM reconhece automaticamente o modelo e prepara o pedido para conferência.
- Preservar digitação manual e importação PDF existente; suporte Word como possibilidade adicional a avaliar, sem afirmar que já existe.
- Reconhecer também fotos de pedidos manuscritos; sinalizar letras, palavras, apresentações ou quantidades incertas para ajuste manual.

## Proposta discutida originalmente

Começar pela planilha padronizada, mais previsível para identificação e custo. CNPJ e EAN como texto, preservando zeros à esquerda. Campos de produto protegidos apenas para facilitar preenchimento; proteção da planilha não substitui validação na importação. Validar versão/estrutura, CNPJ e EAN contra a carteira/catálogo, quantidades inteiras válidas e duplicidades. Não confiar em preço/fórmula enviada pelo cliente: aplicar condições, faixas e vigência do catálogo atual no RM. Definir depois como exibir preços e fotos sem tornar o arquivo pesado.

Para manuscritos, identificar sugestão de produto/EAN e quantidade, marcar ambiguidades, mostrar a referência original e exigir conferência antes de salvar. Não completar dosagem/apresentação automaticamente com base em semelhança. OCR simples pode errar muito em escrita à mão; precisão, tecnologia e custo precisam de teste. Não prometer reconhecimento perfeito, custo zero ou disponibilidade de API ainda não verificada. Prioridade financeira do titular: sem novos custos assumidos sem alinhamento.

Integração direta Mercado Farma e padronização de SKU específico dependem de documentação/catálogo/mapeamento oficial e autorização apropriada. EAN conhecido não garante equivalência ao SKU interno de um distribuidor. Não assumir API pública nem automatizar login da plataforma.

Estado: apenas registro de viabilidade e proposta. Próximo passo depende de nova instrução do titular. Nenhuma planilha, importador Word, OCR manuscrito ou integração de pedidos criada nesta etapa.


## Atualização autorizada em 11/11/2026

Titular pediu implementar a planilha, Word e fotos manuscritas nesta etapa, além de sincronizar simulações entre aparelhos. A suspensão original acima foi substituída para estes itens. Implementação 1.13.0 em validação: planilha XLSX com 44 produtos/EAN, CNPJ e quantidades vazios, ordem alfabética; não inclui fotos embutidas ou proteção de células. Identificadores tratados como texto. Fotos originais continuam no catálogo do RM. Importador CSV/Excel, Word moderno .docx (texto/tabelas), PDF genérico e imagens por OCR local existente. Word .doc exige conversão para .docx. Todos passam por revisão editável, correspondência exata de EAN/nome completo ou escolha manual, conferência do CNPJ na carteira e segunda conferência de preços antes de salvar. Preço recebido no arquivo não é usado. Fotos mantêm prévia original e todas as linhas OCR são sinalizadas para revisão; reconhecimento manuscrito real ainda depende de teste com amostra do titular, sem promessa de acurácia.

Sincronização aproveita settings com revisão/RLS existentes, snapshot comprimido quando suportado, mesmas chaves locais, tombstones e merge por ID imutável. Máximo existente de 100 pré-pedidos, 100 linhas cada; payload da biblioteca limitado a 480 KB antes do envio e expansão a 4 MB ao ler. Limite ou falha mantém cópia local e mostra pendência; não declara sincronizado sem confirmação. Sem migração ou API paga de IA. Criação das simulações mantém acesso e corte originais; consulta/PDF depois do corte preservados.
