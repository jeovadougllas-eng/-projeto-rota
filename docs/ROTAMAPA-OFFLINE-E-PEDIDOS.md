# Web/PWA 1.15.0 — pedidos e uso offline

Estado: implementação validada localmente, ainda não publicada. Migração de edição preparada e NÃO aplicada ao banco real. Produção permanece 1.14.2.

## Pedidos

Editar pedido aparece no histórico e na Feira para pedidos criados no RM, confirmados mas ainda não faturados. Permite adicionar/remover itens e alterar quantidades/observações, mantendo ID, cliente, data original, visita/rota e vínculo da feira. Guarda os valores anteriores em editHistory, até 50 revisões, e permite baixar novamente o PDF. Pedidos faturados/cancelados e originais de PDF importado permanecem protegidos.

Importar planilha pelo histórico ou pela feira aceita vários CNPJs em Excel/CSV. Agrupa itens por cliente, reconhece aliases e permite indicar manualmente as colunas/cabeçalho. Quantidade, produto e CNPJ exigem conferência. Identificação por EAN exato tem prioridade; códigos de outra origem não são presumidos códigos EMS. Não inventa embalagens, clientes, preços ou conversões de caixas. CNPJs e produtos não reconhecidos permanecem pendentes; os demais pedidos podem ser revisados individualmente. Não mistura um lote com uma visita individual. Importação anterior de um cliente/Word/PDF/foto continua disponível.

Prévia fica no namespace aditivo rotamapa.order-batch.v1:OWNER:PORTFOLIO, neste aparelho. Reabrir o importador retoma os pendentes. IDs determinísticos por arquivo/conta/carteira/CNPJ permitem reconhecer pedidos já salvos, inclusive após substituir a prévia. Pedidos registrados usam a sincronização normal; não significam faturamento ou envio ao Mercado Farma.

Exemplo privado analisado somente localmente: 5 CNPJs, 21 linhas, 68 unidades. Comparação com catálogo público de referência: 12 linhas reconhecidas exatamente e 9 exigem revisão. Cadastro real da carteira não foi consultado. Não incluir o arquivo ou seus CNPJs no repositório.

## Offline

Causa comprovada no computador: registro do service worker estava dentro do filtro de iPhone e guardava somente o aviso de reconexão. Agora registra em Web/PWA nos navegadores compatíveis. Preserva instruções de instalação de iPhone, manifesto, ID, ícones e URL de abertura /?source=iphone-pwa.

O shell público completo é instalado por allowlist. SDKs Supabase 2.57.0 e MapLibre 5.6.0 preservados nas mesmas versões, agora locais, com licenças e SHA256. Cache inclui JS/CSS/fontes/fotos/OCR/planilhas locais. Não cacheia API, auth, dados de conta ou tiles de provedores. Pins manuais e regras anteriores de expiração Google preservados. Primeiro login, novas geocodificações, mapas, cálculo remoto de rotas e operações que exigem validação no servidor continuam online.

Primeiro abrir com internet e manter aberto até concluir o preparo. O app informa andamento/conclusão/falha. Ativação na próxima abertura, após concluir pedido/rota; sem skipWaiting ou reload forçado. Build atribui cache ao commit, evitando misturar versões. Dados pessoais continuam nos stores/outboxes existentes, isolados por conta/carteira. Acesso offline reutiliza somente a sessão já guardada do mesmo proprietário, sem conferir autenticação a chamadas de servidor. Reconexão usa autenticação e revisão de conflitos existentes. Falha de storage ao salvar clientes restaura memória ao estado persistido e mostra erro.

Não prometer retenção absoluta contra limpeza/desinstalação/falta de espaço ou recusa de persistência pelo navegador. Não limpar dados nem reinstalar para atualizar. Prévia de lote é local; pedidos salvos sincronizam entre aparelhos. Novas versões aguardam fechamento das abas anteriores; cache de shell é público, não é backup de dados privados.

## Banco e validação

Migração supabase/migrations/20261112235921_editable_unbilled_orders.sql criada com CLI 3.1.0 e testada em PostgreSQL isolado. Transação altera somente o corpo da função privada existente, com âncora explícita. Sem tabelas novas, alterações de RLS, privilégios ou dados. Editar exige anexar exatamente a revisão anterior e continua por toda a validação monetária/de produtos/campanhas existente. Identidade/data permanecem imutáveis. Banco real consultado somente por metadados: função SECURITY INVOKER, fingerprint 5d358f56abc3d3ba3bd5271cfcf60b30 e âncora esperada presentes. NÃO aplicar sem autorização específica.

Passaram: 254 unitários; cadeia PostgreSQL/RLS local completa, incluindo edição válida, revisão anterior preservada e bloqueio de edição faturada/sem histórico; 10 casos novos desktop claro/celular escuro (abertura offline pela URL real da PWA, edição sem rede/reabertura/reconexão, lote retomável, mapeamento e conta alterada durante reconhecimento); 10 regressões de importação; 10 da feira; 28 de auth/importação de clientes/pins; 8 PWA com worker real (Chromium/interface iPhone simulada). Rodadas distintas, não uma bateria única. Sem Safari físico, login real, chamadas Google pagas ou escritas comerciais reais.

Rollout deve ativar validação e publicar Web/PWA coordenadamente, após aprovação. Rollback de UI para 1.14.2 preserva dados e validação aditiva, mas perde a nova abertura offline e edição; preferir correção adiante. Não restaurar banco/apagar pedidos para reverter interface. APK/OTA e iOS nativo permanecem suspensos. CI remota só poderá ser declarada aprovada após consulta efetiva.

## Complemento de fechamento — fila da biblioteca e integridade do shell

Agenda, rotas salvas e preferências também recebem fila durável local, no mesmo namespace/chave da biblioteca existente, com campo pending aditivo. Edições sucessivas do mesmo registro se consolidam conservando a revisão de origem. Reconexão valida identidade/plano e envia pela RPC já existente, com revisão CAS. Conflitos/permissões recusadas ficam pendentes e preservados; conteúdo remoto não substitui pendência local. Comparação canônica reconhece gravação aceita cujo ACK foi perdido. Mudanças de conta/carteira interrompem o envio; cache corrompido ou storage cheio não é substituído silenciosamente. Não é confirmação antecipada de quota do servidor. Operações administrativas/documentais que exigem validação específica online continuam protegidas; nenhum pedido é enviado ao Mercado Farma.

Instalação do shell verifica versão e SHA256 de cada recurso antes de aceitar o novo cache. Uma implantação que troque de versão durante o download falha com aviso e preserva a versão ativa anterior, em vez de misturar arquivos. Gerador comum ao servidor local e ao build prepara manifesto por versão; callbacks/API/tiles continuam fora do cache.

Verificação final adicional: 259 unitários passaram; 32 casos de navegador em rodada única (12 novos de offline/pedidos/lote/preferências e 20 regressões de agenda) passaram. Fixture de agenda esperava os nomes históricos Pro/Plus/Free e foi corrigida para Elite/Executivo/Essencial, sem modificar o produto para contornar o teste. Oito PWA reais passaram novamente após verificação de hashes do shell (23,9s). SQL local aprovado permanece válido: nenhum novo schema foi necessário para a fila da biblioteca. Build público anterior gerou 239 arquivos; refeito após o commit final. Publicação/DDL real continuam não executados.
