# Traxelo.IA — visitas, Excel e revisão de localizações

Versão web de testes: https://traxio-preview.vercel.app/

As alterações estão no ramo `dev/traxelo-android-routes`. Não houve merge em `main`, troca da identidade visual, troca dos provedores de login ou alteração dos identificadores de clientes.

## Confirmar os pontos já salvos

1. No Painel, use **Revisar pontos salvos** ou, em Clientes, filtre **Pontos salvos para revisar**.
2. Selecione os clientes e use **Confirmar pontos no mapa (N)**.
3. O mapa abre no ponto salvo do primeiro cliente, com nome e endereço de referência. Arraste o pin ou toque na posição correta.
4. Use **Confirmar posição e salvar**. Depois, **Próximo cliente**. **Pular por enquanto** mantém o cadastro sem confirmação.
5. O aviso distingue a gravação neste aparelho da sincronização concluída na conta. Falha de armazenamento não confirma nem modifica as coordenadas em memória.

A revisão utiliza somente os clientes selecionados com ponto pendente. Não modifica o endereço importado nem as demais colunas. Clientes confirmados continuam com a ação própria de planejar rota. Mudar de aba encerra a revisão sem descartar as posições já salvas.

## Buscar e retomar

Em **Mapa e Rotas → Buscar localizações dos clientes**, escolha o grupo. **Sem ponto disponível** evita gastar novas consultas com aproximações que já podem ser revisadas. A opção **Geoapify + TomTom** continua disponível.

Cada resultado concluído deixa um checkpoint local da conta. **Retomar busca** continua pelas consultas pendentes mesmo depois de recarregar a página. Alterar um endereço invalida o resultado concluído daquele cliente; contas diferentes têm checkpoints separados. Iniciar uma nova busca inicia outro lote.

Falhas temporárias de comunicação/servidor têm no máximo duas tentativas adicionais. Sessão expirada, chave recusada, permissão ausente, configuração e cota têm mensagens distintas; cota e permissão não são repetidas automaticamente. Um cadastro inválido não bloqueia os demais. O servidor gera um código de atendimento e registra apenas códigos e tempos, sem nomes, endereços ou chaves.

Não foi possível comprovar a causa histórica exata da interrupção após 73 consultas: os logs daquela ocorrência não estavam disponíveis. A mudança trata as falhas e preserva o progresso; uma nova ocorrência pode ser identificada pelo código exibido. Não se afirmou que a carteira atingiu 80% de cobertura. As validações usam dados sintéticos; medir a cobertura real exige a busca autenticada na conta do usuário.

A precisão exigida para confirmação automática foi mantida. Pontos aproximados, posições conflitantes e registros sem evidência de imóvel continuam sujeitos à revisão manual. Não se promove um centro de rua/bairro a endereço confirmado para aumentar a porcentagem.

## Visitas e relatório para o gestor

Em **Histórico**, use **Registrar visita realizada** ou o mesmo comando na ficha do cliente. Informe cliente, data, resultado e, se conhecidos, duração e observações. Confirme que a visita ocorreu. Não há exigência de compra.

Uma confirmação manual de chegada durante a navegação registra uma visita. A chegada automática por GPS cria uma pendência: em **Chegadas por GPS para confirmar**, aprove o atendimento ou indique que não houve visita. Planejar uma rota ou marcar seu resumo como concluído não inventa visitas individuais.

O aplicativo distingue:

- **Visitas:** todos os atendimentos confirmados, incluindo retornos.
- **PDVs distintos:** cada ID de cliente uma vez no período.
- **Revisitas:** visitas além da primeira ao mesmo PDV no mês.
- **Cobertura ativa:** clientes da carteira atual visitados / carteira atual. Visitas a clientes removidos permanecem no histórico sem inflar esse percentual.

**Baixar Excel com gráficos** gera um XLSX com sete abas: Resumo mensal, Visitas, Diário, Semanal, PDVs, Dashboard e Metodologia. Inclui dois gráficos nativos editáveis, dados por visita, visitas e PDVs diários/semanais/mensais, clientes ainda não visitados e projeções. Textos de cadastros são gravados como texto, inclusive quando começam com `=`; horários e durações ausentes ficam vazios.

A projeção usa os dias concluídos até ontem no fuso configurado. Dias úteis sem visitas entram na média. Dias fora do calendário que tiveram visitas também contam como trabalho no divisor. Configure os dias da semana, feriados/folgas e, opcionalmente, uma meta. A projeção de PDVs ativos fica limitada à carteira. O painel recalcula ao abrir, retomar e mudar o dia; o arquivo enviado ao gestor é uma fotografia da emissão e deve ser gerado novamente para refletir novos dados.

O histórico anterior de rotas foi preservado. Apenas resumos identificados como execução real podem ser revisados com escolha explícita do cliente e da data; não há conversão automática por nome nem horários inventados. Anular uma visita mantém o registro para auditoria e a exclui dos indicadores.

## Nuvem e proteção dos dados

Foram acrescentados uma tabela própria de visitas e um bucket privado de exportações no Supabase, com políticas por usuário autenticado. O histórico tem fila local de envio e atualização com controle de revisão: um conflito entre dispositivos não é sobrescrito silenciosamente.

Os 157 clientes mantiveram exatamente o checksum agregado anterior: `fd75d013e535f80601c88718344c7280`. Não foram inseridas visitas de teste no banco real. Os testes de isolamento entre contas foram executados em um Postgres separado.

No Android, o Excel usa o plugin de navegador que já existe no APK: o arquivo privado é disponibilizado por um link de cinco minutos. É necessária internet para essa exportação. O teste Android simula o upload/assinatura; não utiliza a conta real. A gravação e a sincronização autenticadas em um aparelho físico ainda precisam do teste do usuário.

Os advisors do Supabase não identificaram falha de RLS nas novas estruturas. Houve aviso informativo de índice ainda sem uso, esperado numa tabela nova. Avisos anteriores de proteção contra senhas vazadas e desempenho das políticas de `cnpj_jobs` não foram alterados nesta entrega.

## Android e iPhone

O APK existente foi preservado, SHA-256 `6d9fe54fc87beac1e1da5200858ab5232468449f40733548d58ad75139fdcdc2`, pacote `app.traxio.mobile`. A atualização contém somente os arquivos web compatíveis com o runtime atual. No APK que já possui o atualizador: abra conectado, aguarde o aviso em Planilhas, encerre completamente e reabra. O download não interrompe uma navegação em andamento.

Versões antigas sem atualizador dependem da [migração com preservação de dados](android-install.html). Não desinstale o aplicativo para forçar a atualização.

É viável manter o APK Android e preparar uma PWA para iPhone, com acesso HTTPS e atalho na tela inicial sem distribuição pela App Store ou assinatura Apple Developer. A instalação PWA ainda não foi implementada nesta entrega. O GPS web em primeiro plano é possível; rastreamento com tela bloqueada tem limitações no iPhone. Navegação externa pode usar Waze/Google Maps. Ainda falta o link do projeto de orçamentos para comparar a referência específica.

## Evidências

- Histórico e relatório, três tamanhos de tela; XLSX aberto com openpyxl; RLS, privilégios por coluna e CAS testados em Postgres isolado: https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40388169370
- Revisão sequencial, armazenamento cheio, cota, falha transitória, endereço inválido e retomada após recarregar: https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40387909382
- Fluxos publicados em Chrome e WebKit, com dados sintéticos, autenticação recusada corretamente e APK intacto: https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40388953459

O primeiro roteiro Android parou por faltar passar o identificador do emulador ao teste após a exportação. Não foi considerado aprovado. O teste foi corrigido e repetido usando o mesmo ZIP; não houve substituição do APK nem ativação daquele teste incompleto. A primeira configuração WebKit também foi corrigida para não tentar iniciar o executável do Chrome como WebKit.

Capturas e [arquivo Excel de demonstração](examples/visit-report-example.xlsx) utilizam somente dados fictícios. A validação WebKit representa o motor do Safari, não um teste em iPhone físico.
