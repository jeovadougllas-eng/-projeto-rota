# Separação do endereço, rede da farmácia e enquadramento no iPhone

PWA instalada: topo e navegação respeitam a área do relógio e do indicador inferior. CSS específico carregado depois do layout compartilhado.

Cadastro: Rua, número, complemento, bairro, cidade e UF separados na planilha importada, consulta CEP e edição de registros antigos. Consulta CNPJ completa lacunas dos registros importados sem sobrescrever um endereço revisado pelo usuário.

Legado: abrir Editar cadastro recupera os campos disponíveis sem reconsultar geolocalização. Salvar cliente grava a estrutura pelo sincronismo existente com proteção de revisão. Original da planilha e dados oficiais continuam preservados.

Rede é opcional e preenchida manualmente. Nada é classificado como Independente sem escolha do usuário.

Barra Mostrar clientes filtrados com contador, instrução e alvo de toque grande. Contagem zero não inclui texto de aviso.

Atualização web/PWA na próxima abertura ou recarga. Android usa o atualizador do APK original, sem substituir assinatura, origem nem os dados.

Validação de iPhone usa WebKit com áreas seguras simuladas. A confirmação visual no iPhone físico permanece necessária.

Não houve busca de novos pontos em clientes reais nem alteração em lote no banco. Campos antigos ficam separados ao abrir a edição e são persistidos ao salvar.
