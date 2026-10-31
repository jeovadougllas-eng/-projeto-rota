# RotaMapa — carteiras e consulta das visitas

O Painel mostra **Carteira atual → Trocar carteira**. A lista permite abrir, criar e renomear carteiras. Cada importação pede um nome e abre uma nova carteira. Os clientes existentes ficam em **Carteira inicial**, inclusive os pins confirmados e os pontos a revisar. Criar e renomear exige internet; os dados de cada carteira sincronizam na mesma conta.

Clientes/endereço completo, geolocalização, buscas pendentes, seleções de rota, visitas, vendas, produtos, campanhas, rotas salvas, agenda e preferências de relatório são separados. A troca recarrega o documento para cancelar pesquisas/GPS/edições do ambiente anterior. O plano e a cota de rotas continuam pertencendo à conta, contando as rotas de todas as carteiras.

Em Histórico, os cartões **Visitas realizadas**, **PDVs distintos**, **Revisitas** e **PDVs ativos não visitados** abrem suas listas. A lista de visitas usa Hoje ou Últimos 5 dias (incluindo hoje), dentro do mês do relatório e do fuso escolhido. Registrar venda usa a calculadora existente e mantém ID/data/rota da visita. Uma venda já confirmada abre consulta. PDVs distintos e revisitas são consulta; não visitados oferecem mapa/navegação e confirmação do pin quando necessária.

## Preservação e isolamento

Migração `rotamapa_named_portfolios`, arquivo `docs/sql/enable-portfolios.sql`, aplicada em 29/10/2026. Acrescenta carteira inicial e coluna/FK/índice nas quatro tabelas; mantém JSON, IDs, revisões e coordenadas. Antes/depois: 157 clientes, 12 eventos de visita, 44 produtos e zero registros na biblioteca. Hashes MD5 dos conteúdos + revisões, usados apenas como conferência de integridade:

- Clientes: `f17e68c1e402ab3256e68ece690e77cd`
- Visitas: `ad2468fe36d30415576e9eccfd85d8f1`
- Comércio: `09799312e7950fee59b6f0ad610234d6`

RLS combina o proprietário autenticado com a carteira do cabeçalho da requisição; consultas também usam filtro explícito. Sem cabeçalho, instalações anteriores enxergam somente a carteira inicial. FK composta impede vínculo com carteira de outra conta. A carteira de um registro é imutável; catálogo/campanha/visita de outra carteira não pode ser usado em uma venda. A escrita de rotas mantém validação, concorrência e cota global sob bloqueio por conta. A migração complementar `rotamapa_private_portfolio_plan_access` mantém a soma privilegiada da cota no esquema privado, com uma função pública invocadora e verificação do usuário.

Dados locais antigos permanecem nas mesmas chaves para a carteira inicial. Novas carteiras usam chaves separadas; caixas de saída não são apagadas na troca. O backup do aparelho identifica e exporta a carteira atual sem tokens de autenticação.

## Validação

Testes de modelo mantêm 11 visitas / 8 PDVs distintos / 3 revisitas; testes de navegador verificam filtros, venda sem nova visita, navegação individual e contraste claro/escuro. Testes de carteira usam o mesmo CNPJ com endereços/pins diferentes, importação nomeada, catálogo/visitas/rotas isolados e retorno à carteira inicial, incluindo dados locais pendentes. SQL local descartável testa a migração, RLS, FK de proprietário e rejeição de referências e RPCs entre carteiras. Os testes de navegador e Android usam dados fictícios; não criam visitas ou vendas reais.

Validação local concluída: 98 testes de unidade, 88 cenários em WebKit (Safari/Chrome iOS, tela pequena e paisagem), 18 cenários focados em Chrome Android/desktop, migração e isolamento SQL e cota Free global entre carteiras.

## Versão entregue

- Aplicação e instalador: commit `e96e6ec8a18856dc8e8d8c62db77b8f561e6a09c`.
- Versão interna: `71c13fca55ebac3e9ad02d244293f0b62fb0a7bdbde1ce2b4eb17befd2332aa9`, 92 arquivos.
- APK: 17.162.903 bytes, SHA-256 `fa72f01dfef32b4c3569764e7ea6bd40342f7bf86ed6e132027080ae3de9d68c`.
- [Validação completa](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40912851534): 144 cenários de navegador, 98 testes de unidade e SQL de isolamento/cota global aprovados.
- [Android instalado](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40914490113): 14 verificações sobre a instalação original com atualização HTTPS, oito verificações na instalação nova. Emulador Android 15/API 35; não é teste em aparelho físico.
- A aplicação do APK é idêntica à versão aprovada nos navegadores. O teste Android usa o mesmo artefato e aguarda a inicialização dos stores após cada recarga de carteira. Cenários cobrem perda de foco/toque durante sincronização e associação do proprietário no primeiro acesso.
- Aplicação web e PWA: https://traxio-preview.vercel.app/ . Nova instalação Android: https://traxio-preview.vercel.app/downloads/rotamapa-android-testes.apk . Instalações antigas mantêm seus dados e recebem a atualização interna compatível; o instalador original permanece intacto.
