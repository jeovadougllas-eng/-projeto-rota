# RotaMapa 1.6.0 — Links úteis e consulta ao Mercado Farma

A oitava tela, Links úteis, fica entre Ranking e Importar carteira. Mantém marca, paleta e cenários existentes. Os cartões seguem o mockup aprovado, com nome, descrição/domínio, abertura no navegador e edição. Adicionar link recebe nome e URL; é possível renomear, mudar o endereço e remover atalhos. A interface usa os modos claro e escuro e funciona nos planos Free, Plus e Pro.

A empresa é uma preferência da carteira, não uma inferência do e-mail ou do catálogo. Carteiras existentes mostram Identificar empresa em Links úteis. Também há Empresa desta carteira em Painel → Gerenciar carteira. EMS Marcas, Outra empresa (nome opcional) e Informar depois estão disponíveis, sem reimportar clientes. Selecionar EMS pela primeira vez inclui exatamente:

- MERCADO FARMA — https://mercadofarma.com.br/
- BÚSSOLA — https://bussolaweb.bussola.mercadofarma.com.br/login
- CONSULTA CNPJ — https://cnpj.biz/
- SINTEGRA — http://www.sintegra.gov.br/

O endereço HTTP do Sintegra é preservado conforme informado. Os atalhos padrão são copiados para as preferências privadas uma única vez; renomear, remover e selecionar novamente EMS não recria links removidos. Atalhos pessoais continuam visíveis ao mudar de empresa. Atalhos EMS ficam ocultos ao selecionar outra empresa e voltam com as edições preservadas ao retornar à EMS.

Preferências usam `usefulLinks` dentro do registro `settings` da biblioteca existente. A leitura e a RPC de gravação conservam conta, carteira e revisões do servidor. Antes de salvar, a tela sincroniza e rejeita edições de um conjunto de links que mudou; demais configurações são preservadas. Foram inspecionadas as funções existentes e as políticas no projeto ggsptbcgpdakxsdjrldd: RLS ativa, proprietário autenticado não anônimo e política restritiva da carteira selecionada. Não há nova tabela, migração, credencial privilegiada ou alteração de políticas. Nenhum cadastro real foi modificado na validação.

As URLs aceitam somente HTTP/HTTPS, sem credenciais embutidas. Nomes são texto, não HTML; ícones são locais. Não há iframe nem requisição de favicon aos sites. Sites pessoais usam seus próprios logins no navegador. Links genéricos não copiam CNPJ, pois não possuem pedido associado.

Na lista de conferência, pedidos pendentes e arquivados ganham Copiar CNPJ e abrir Mercado Farma, mantendo Verificar faturamento/recuperar e Pedido foi cancelado. O endereço usa a mesma constante do atalho EMS. O CNPJ vem do recibo original selecionado, não do cadastro atual do cliente. São copiados os 14 dígitos, com zeros iniciais e sem pontuação. A consulta não confirma o faturamento e não altera venda, prazo ou ranking.

A cópia usa a API de clipboard disponível, com alternativa de cópia selecionada pelo navegador. No web/PWA, uma janela é reservada durante o toque; ela só navega ao endereço fixo após a cópia e a conferência da carteira/pedido. Se a cópia falhar, a janela reservada é fechada e o RM mostra o CNPJ selecionável, Copiar CNPJ e Abrir Mercado Farma. Se a abertura automática for bloqueada, a janela de apoio informa que o CNPJ foi copiado e permite abrir pelo próximo toque. Novas páginas não recebem `window.opener`; os links usam `noopener noreferrer`. O CNPJ não é acrescentado à URL. No Android, AppLauncher abre o navegador, com Browser como alternativa; ambos já existem no runtime. Não é necessário novo plugin ou nova permissão. Instalação física não é presumida.

Logout e troca de carteira limpam os cartões e campos dos diálogos, cancelam a janela reservada e rejeitam callbacks de cópia ou edição antigos. Uma conferência que mudou também precisa ser reaberta. A cópia, o bloqueio da área de transferência e a abertura de sites dependem das permissões do navegador; o fluxo de apoio mantém uma alternativa manual.

Os testes usam dados sintéticos e dublês do transporte Supabase, com revisões, carteiras e falhas de escrita. Cobrem preservação da carteira importada e das preferências, quatro URLs exatas, edição, remoção persistente, empresa por carteira, plano Free, URL inválida, consulta offline da última cópia salva, conflito entre aparelhos, logout, callback atrasado, navegador e plugins nativos. Chromium exercita também a área de transferência real e uma página externa simulada, sem acessar uma conta Mercado Farma. Safari exercita os caminhos permitido/bloqueado com dublês e a seleção manual. Os testes de faturamento existentes foram atualizados apenas para expandir a seção de catálogo antes de importar os PDFs; os cálculos, arquivamento e recuperação continuam verificados.

O APK usa app.traxio.mobile, versionCode 6 / 1.6.0. O bundle mantém runtime capacitor8-20261026 e minimum nativeVersion 2. Cenários, identidade, login e instaladores anteriores permanecem preservados. A prova de assinatura determina se um instalador é compatível; instalações anteriores podem usar Conta → Sobre e atualizações → Verificar atualizações.
