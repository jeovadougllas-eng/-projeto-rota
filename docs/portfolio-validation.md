# Revisão da lateral, marca e carteira confirmada

## Implementação e integridade

Branch isolada: `dev/traxelo-android-routes`. Código de aplicação: `84856d61a98554f13823910254f23e032d0d181b`. Commits posteriores acrescentam documentação, testes e evidências. `main` foi preservada em `84b23d405fa141854314267b528544a184e89f23`.

Prévia: https://traxio-preview.vercel.app/

APK de testes: https://traxio-preview.vercel.app/downloads/traxio-android-testes.apk

Comparação visual: https://traxio-preview.vercel.app/docs/portfolio-review.html

Precisão, serviços, custos e acesso da cliente: https://traxio-preview.vercel.app/docs/geolocation-and-client-access.md

## Falhas confirmadas e correções

| Problema | Causa confirmada no código | Correção |
| --- | --- | --- |
| Cenário da lateral desaparecia em quatro abas | Regras `body:not([data-screen="painel"])` ocultavam `.nav-art`, sua imagem e a legenda, substituindo-as pelo padrão inferior | A mesma arte aprovada aparece nas cinco abas. O menu conserva a mesma geometria ao trocar de tela |
| Largura e disposição do menu mudavam na tela de mapas | Sobrescritas específicas por tela e orientação | Shell compartilhado; orientação e largura do dispositivo definem o menu, independentemente da aba |
| “Localizados” confundia coordenada numérica com posição apta a roteamento | `valid(lat,lon)` ignorava classificação e confirmação | Contagem usa `TraxioPlanner.location(c).ready`, igual ao planejador. Aproximados, importados não verificados e indisponíveis aparecem em “A confirmar” |
| Não havia acesso direto à carteira já apta | Ausência de filtro de localização e de ações específicas | Cartão “Confirmados” abre a lista filtrada; ações explícitas criam ou sugerem rota somente com esses clientes. Busca e cidade podem refinar o grupo |
| Letreiro antigo continuava visível | Ativos antigos usados no cabeçalho/login | PNG aprovado Traxelo.IA, slogan oficial separado e favicon do kit novo. Fonte genérica não substitui o lettering |
| Marcador do símbolo ficou incompleto na primeira revisão | O recorte PNG isolado do próprio kit corta o marcador | Selecionada a versão completa do símbolo presente na composição horizontal aprovada, preservando os pixels |

Trocar filtros não altera a seleção existente. Substituir a seleção pelos clientes confirmados exibidos só acontece ao acionar explicitamente “Criar rota com estes confirmados” ou “Sugerir rota com estes confirmados”. O cálculo continua exigindo uma origem utilizável e apresenta um itinerário ou um erro explícito.

Nenhum cliente real foi excluído, recriado ou modificado para simular geolocalização. As quatro alterações pontuais em `index.html` tratam de estilos/favicon, rótulos dos indicadores e regra de contagem. OAuth, Supabase, chaves de armazenamento e `app.traxio.mobile` foram preservados.

Os 17 arquivos originais do kit anterior mantêm seus hashes. Oito arquivos do kit novo incorporados ao projeto têm hashes registrados em `docs/traxelo-approved-assets.json` e foram comparados com os anexos recebidos. Os SVGs fornecidos são vetorização aproximada segundo o próprio README; não foram apresentados como vetores originais nem utilizados para substituir o lettering aprovado.

## Arquivos e componentes

- `index.html`: carregamento do shell compartilhado, favicon e classificação dos indicadores.
- `assets/traxio-ui.js`: marca aprovada, cartões acessíveis por toque/teclado, filtro de localização e ações da carteira confirmada.
- `assets/traxelo-shell.css`: cenário e geometria do menu nas cinco telas; recortes da marca sem slogan antigo.
- `assets/reconstructed/login-art-mask.svg`: retirada apenas da marca antiga embutida no cenário, mantendo o restante da imagem.
- `assets/traxelo/approved/`: originais utilizados e documentação de origem dos kits.
- `tests/portfolio-readiness.spec.js`, `tests/portfolio-before.spec.js` e teste de marca: contadores, confirmação, filtros, seleção, origem, cálculo e capturas.
- `scripts/android-routes.mjs`, `scripts/verify-android-candidate.mjs`: evidências no APK instalado e identidade dos arquivos compilados.
- Workflows de carteira, rotas, Android, confirmação e publicação: testes e preservação de capturas na branch de desenvolvimento.

## Testes efetivos

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Validação dos scripts, identificadores de integração e kit original | Aprovado; 17 arquivos do kit anterior intactos | `npm run check` |
| Geocodificação, classificação e regras unitárias | 22 aprovados | `npm run test:geolocation` |
| Carteira confirmada, filtros, seleção, atalhos, marca e geometria das cinco abas | 56 aprovados em oito perfis | [CI carteira](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39884055218) |
| Reprodução histórica do cenário oculto em quatro abas | 3 aprovados, com 15 capturas anteriores | Mesmo workflow da carteira |
| Confirmação persistida, sincronização segura, busca concorrente e rota parcial | 27 aprovados em desktop/tablet | [CI confirmações](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39885392269) |
| Seleção, origem GPS/manual, cidades, geometria, erros, concorrência e navegação | 184 aprovados | [CI rotas](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39884055494) |
| Autenticação, importação/exportação, dados completos, diálogos, tema, teclado e ponte nativa | 160 aprovados | Mesmo workflow de rotas |
| Reprodução da versão histórica do planejamento | 3 aprovados | Mesmo workflow de rotas |
| Mapa e roteamento real por OSRM, sem respostas simuladas do provedor | 3 aprovados | Mesmo workflow de rotas |
| Consulta real ao Photon com endereço público de teste | 1 aprovado | Mesmo workflow de rotas |
| APK instalado, GPS e recálculo, teclado nativo, rotação, confirmação e novo atalho | 14 verificações aprovadas | [CI Android](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39884055223) |
| Atalho na URL publicada, confirmação persistida e trajetos completos/parciais com mapa e OSRM reais | 3 aprovados | [CI site publicado](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39884349393) |
| Identidade entre arquivos web e APK, download público e retorno OAuth | Aprovado: HTTP 200, SHA-256 idêntico, 8 originais novos íntegros, URLs de retorno aceitas e URL não autorizada recusada | [CI publicação](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39885087725) |

Perfis da carteira/regressão: desktop 1440×1000, tablet horizontal 1024×768, tablet vertical 768×1024 e celular 390×844, todos nos temas claro e escuro. Foram inspecionadas visualmente capturas do login, painel, carteira e mapa após as correções, inclusive para detectar e corrigir o símbolo truncado do kit.

O teste com serviços reais produziu um itinerário de sete paradas com **160 coordenadas na geometria viária**, **4,7 km** e **8 minutos estimados**, com matriz e rota retornando HTTP 200. O trajeto foi desenhado sobre o mapa. Clientes do cenário são sintéticos: a prova é do funcionamento do planejamento e do serviço de ruas, não da precisão dos endereços da carteira real.

## APK verificado no emulador

- Origem da compilação: `84856d61a98554f13823910254f23e032d0d181b`.
- Tamanho: 14.774.215 bytes.
- SHA-256: `7433061fab8c9346a75fdab13309198aee604e996a2e87386def97a44d504415`.
- `app.traxio.mobile` e callback OAuth preservados.
- O teclado Android reduziu o viewport sem cobrir o campo, que conservou o texto após fechar o teclado. A rotação manteve seleção e itinerário.
- GPS nativo simulado iniciou a navegação e o desvio sustentado recalculou o percurso. O AppLauncher abriu o destino em `com.google.android.apps.maps`.
- Seis confirmados e um pendente produziram um itinerário real com 199 coordenadas. A confirmação foi salva imediatamente, sobreviveu ao recarregamento e foi usada na rota seguinte.
- A carteira confirmada e a lateral das cinco abas foram verificadas dentro do WebView instalado, além dos testes de navegador.

As primeiras execuções Android foram interrompidas quando o emulador ficou offline. Os diagnósticos não indicaram falta de memória no servidor. O mesmo candidato passou ao usar renderização Mesa sob Xvfb; essa configuração foi incorporada ao workflow principal e a versão final também passou. Não se concluiu que a falha fosse da lógica de planejamento nem se ocultaram as tentativas interrompidas.

## Limitações

As capturas da suíte de carteira usam registros e serviços isolados para testar a interface de forma reproduzível. Os testes de ruas reais e do APK instalado são verificados separadamente; um mapa vazio na suíte isolada não é apresentado como evidência de itinerário em ruas.

Não houve auditoria independente dos 157 clientes: a consulta agregada de leitura ao Supabase foi recusada pelo conector por falta de permissão. Não é possível afirmar que os “20” da captura representam vinte entradas corretas sem verificar seus registros e evidências de localização. Os demais clientes não foram convertidos artificialmente em confirmados.

A verificação pública confirmou que o provedor adicional Geoapify ainda não está configurado (HTTP 503). A base atual não garante localizar o número de todos os imóveis. Google Geocoding + Google Maps é a migração recomendada para avaliar a cobertura observada pelo proprietário, mas ainda depende de projeto Google Cloud, configuração de faturamento/cotas, integração e avaliação real dos resultados. Nenhuma cobrança foi ativada. Nenhum fornecedor garante 100% de precisão em qualquer planilha. Os detalhes e as fontes de preços/licenciamento estão no documento técnico vinculado acima.

Não houve teste em tablet físico. Os testes Android usam emulador com GPS simulado, teclado real do sistema e APK instalado. O teste de OAuth verifica redirecionamento e cancelamento controlado; não faz login pessoal em contas Google/Microsoft nem cria uma conta real para a cliente. A carteira da testadora deve usar sua própria conta e dispositivo/perfil de navegador.
