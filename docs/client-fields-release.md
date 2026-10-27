# Separação do endereço, rede da farmácia e enquadramento no iPhone

PWA instalada: topo e navegação respeitam a área do relógio e do indicador inferior. CSS específico carregado depois do layout compartilhado.

Cadastro: Rua, número, complemento, bairro, cidade e UF separados na planilha importada, consulta CEP e edição de registros antigos. Consulta CNPJ completa lacunas dos registros importados sem sobrescrever um endereço revisado pelo usuário.

Legado: abrir Editar cadastro recupera os campos disponíveis sem reconsultar geolocalização. Salvar cliente grava a estrutura pelo sincronismo existente com proteção de revisão. Original da planilha e dados oficiais continuam preservados.

Rede é opcional e preenchida manualmente. Nada é classificado como Independente sem escolha do usuário.

Barra Mostrar clientes filtrados com contador, instrução e alvo de toque grande. Contagem zero não inclui texto de aviso.

Atualização web/PWA na próxima abertura ou recarga. Android usa o atualizador do APK original, sem substituir assinatura, origem nem os dados.

Validação de iPhone usa WebKit com áreas seguras simuladas. A confirmação visual no iPhone físico permanece necessária.

Não houve busca de novos pontos em clientes reais nem alteração em lote no banco. Campos antigos ficam separados ao abrir a edição e são persistidos ao salvar.

Verificação desta entrega (27/10/2026):

- 59 testes de modelo e proteção de dados passaram.
- 28 testes de campos, rede, filtros e área segura passaram em quatro perfis WebKit de iPhone, Android e desktop (2 casos exclusivos do iPhone foram omitidos nas outras plataformas).
- O fluxo exercitou a gravação com revisão pelo sincronismo da conta em banco simulado, recarga, consulta CEP e importação CSV. Nenhuma conta real foi usada para gravar dados de teste.
- 36 testes locais de edição, geolocalização, seleção e rotas passaram.
- O APK original foi instalado em emulador, baixou a atualização por HTTPS e passou em 11 verificações de atualização, cadastro, pins, visitas, Excel e recuperação sem perda de dados.
- Após publicação, os fluxos de cadastro e lista foram conferidos no link público com contas sintéticas e nenhum erro de JavaScript. A Vercel não registrou erros de execução na janela consultada.
- Integridade pública: 68 arquivos do pacote Android verificados; APK original preservado (SHA-256 `6d9fe54fc87beac1e1da5200858ab5232468449f40733548d58ad75139fdcdc2`).

Evidência: [testes e liberação Android](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40444137237), [cabeçalho instalado no iPhone](captures/client-fields/iphone-safari-iphone-standalone-safe-header.png), [barra dos filtros](captures/client-fields/iphone-safari-filtered-client-bar.png).

Como receber: recarregue a versão web; na PWA do iPhone, feche e reabra pelo ícone. No Android com atualizador, abra com internet, aguarde a mensagem de atualização recebida na aba Planilhas e feche completamente/reabra. Não é necessário remover o aplicativo.
