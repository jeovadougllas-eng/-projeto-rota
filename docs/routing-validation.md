# Traxelo.IA — validação de Mapa e Rotas
Branch de trabalho: `dev/traxelo-android-routes`. Base: `f9305d71c24830e3252c437420e1aa58383ce34c`. A main não foi alterada.

## Falhas confirmadas e correções
| Problema | Causa | Correção / comprovação |
|---|---|---|
| Selecionados aguardam toda a carteira importada | A fila global era aguardada integralmente, sem prioridade | Fila por cliente, prioridade para selecionados e promessas limitadas aos solicitados; uma pendência excluída atualizada em segundo plano mantém o itinerário já confirmado. |
| Sete selecionados não resultam em itinerário quando um está pendente | O cálculo aguardava a fila global e abandonava todos os pontos se sobrasse um sem coordenadas | Classificação antes de calcular; revisão individual; rota com aptos somente após confirmação explícita. Teste de seis aptos + um pendente. |
| Seleções desaparecem com filtros / sincronização | Comparações estritas entre IDs numéricos e strings; selecionar todos substituía o conjunto; render removia IDs temporariamente ausentes | IDs canônicos apenas no conjunto da seleção, sem mudar registros; seleção cumulativa que respeita busca/região; armazenamento separado por usuário; IDs não carregados são preservados e identificados. |
| Critério escolhido não afeta Organizar visitas | O botão chamava sempre distance | Os comandos usam o mesmo controlador e o critério escolhido; trocar critério invalida o trajeto anterior. |
| Operação parece concluída sem rota nas ruas | lastRoute e navegação eram criados antes da resposta de ruas | Só confirma itinerário após matriz, otimização, resposta GeoJSON e fonte/camada no mapa. Falhas não deixam navegação habilitada. |
| Trajeto antigo reaparece após limpar ou mudar origem | Pedidos antigos não eram cancelados, nem invalidados; o GPS anterior continuava ativo | Mesmo controlador também para destino avulso; AbortController, geração de cálculo e assinatura de seleção/endereço/origem/critério. Limpar interrompe GPS e mantém seleção. |
| GPS de origem antigo ou muito aproximado | Cache de até 60 segundos sem avaliar idade ou precisão | Cache reduzido; rejeita sinal com mais de 20 segundos ou incerteza superior a 100 m e informa como recuperar. |
| Origem manual ausente | Apenas primeiro cliente ou GPS disponíveis | Busca de endereço com confirmação; alternativa explícita de escolher e confirmar ponto no mapa. |
| Marcadores não correspondem à sequência | Numeração seguia a ordem dos cadastros | Numeração acompanha itinerário; origem de cliente usa O; pontos selecionados fora da rota usam ?. |
| Rota não aparece no Android apesar de OSRM responder 200 | Além do evento load antigo, isStyleLoaded pode ficar false durante carregamento de novos tiles, sem novo style.load; isso bloqueava o desenho após mover a câmera | Distingue estilo já analisado de tiles pendentes; aguarda style.load/load apenas sem um estilo utilizável; valida fonte e camada antes de anunciar sucesso. A captura android-diagnostics/failure-preview.jpg comprova o caso. |
| Tablet comprimido, mapa deslocado e controles sobrepostos | Escala do desktop; painel sticky antigo; listas e destino avulso abertos sob mapa | Grade própria para tablet, planejamento recolhível, mapa em destaque, controles com 44 px, listas secundárias expansíveis e barra de ações acessível. |
| São Paulo / Rio de Janeiro descartados como município | O validador rejeitava qualquer nome reconhecido como estado | Nomes completos de municípios são mantidos; apenas siglas UF não são inferidas como cidade; testes específicos para SP e RJ. |
| Cidade ou bairro incorreto continua impedindo a busca | As colunas originais prevaleciam mesmo após editar o endereço | Campos explícitos de cidade/bairro/UF e geocodingRegionOverride; preservação de originalRegion e importFields; nova geocodificação do cliente selecionado após salvar a correção. |
| Endereço corrigido perde texto anterior | Edição substituía address, embora campos da planilha fossem preservados | Guarda originalAddress na primeira correção, preservando importFields e dados comerciais. |

Os caminhos foram inspecionados e receberam testes reproduzíveis. A ocorrência exata da gravação não foi reconstituída com os sete registros reais: o vídeo não faz parte do ambiente, conforme instrução, e o conector Supabase negou a consulta somente de leitura. Não foram modificados dados reais para produzir evidências.

## Localizações e limites de precisão
- Número de imóvel confirmado automaticamente ou ponto revisto manualmente: apto.
- Coordenadas importadas/legadas sem comprovação: não verificadas, excluídas da rota por padrão; inclusão apenas mediante opção e confirmação explícitas; essa confirmação de uso não promove o cadastro a localização exata.
- Coordenadas de rua/cidade ou candidatas: aproximadas, pendentes de correção/confirmação.
- Valores ausentes, vazios, fora do planeta ou 0,0: indisponíveis.
- CEP valida logradouro/cidade/UF; nunca fornece silenciosamente o ponto do cliente.
- Nova tentativa explícita para pendências e uma repetição limitada para falhas transitórias do geocodificador, mantendo o intervalo do serviço.
- Não foram substituídos OSRM, Photon, ViaCEP ou a integração opcional com Geoapify. Nenhuma chave secreta foi adicionada ao frontend.
- Cobertura de números dos imóveis depende das bases consultadas. Não há garantia de localizar automaticamente todo imóvel. Não se inventam coordenadas nem se usa centro de cidade como cliente.

## Evidências já obtidas
Primeira rodada: 34/36 testes de planejamento passaram. Os dois erros reproduziram sobreposição da origem manual; foram corrigidos.
Rodada seguinte: 36/36 testes de planejamento, 20/20 testes funcionais existentes e 20/20 testes unitários passaram.
Nessa rodada, os três testes com MapLibre e OSRM reais passaram: sete clientes sintéticos geraram rota rodoviária de 4,7 km, aproximadamente oito minutos e 160 coordenadas, com sete marcadores e sete paradas.
Execução: https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39646518689

## Matriz final aprovada
Execução web: https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39652000825
- 22 testes unitários aprovados.
- 184 cenários de planejamento aprovados: desktop, tablet vertical, tablet horizontal e telefone, nos modos claro e escuro.
- 160 regressões aprovadas de autenticação (contratos), cadastro, importação/exportação, histórico, filtros, diálogos, GPS e integração nativa.
- Três reproduções antes da correção e três rotas reais OSRM/MapLibre após a correção, com capturas desktop e tablet.
- Uma consulta real ao Photon para endereço brasileiro, mantendo resultados aproximados pendentes de revisão.

## APK instalado e validado no emulador
Execução aprovada, incluindo capturas pelo compositor Android (ADB): https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39660329344
APK compilado na execução 39656428669, com fonte 1ae259c1c91608cdd70905b7c7e6186f96824b3f; reutilizado sem recompilar na validação isolada. Um verificador comparou o HTML e cinco módulos do APK com a fonte atual antes da instalação.
- Android API 35; tela 1200 × 1920 físicos (800 × 1280 CSS), com rotação para horizontal.
- Sete clientes de teste, sete marcadores numerados, sete paradas, 4,7 km, oito minutos e 160 coordenadas de ruas.
- GPS nativo simulado: um desvio sustentado solicitou e desenhou um novo trajeto real OSRM, mantendo a sequência.
- Teclado Android real aberto: altura visível de 1280 → 904 CSS; campo entre 434 e 478 CSS, sem ficar encoberto; texto mantido ao fechar.
- Seleção mantida ao filtrar cidade e girar o tablet.
- AppLauncher abriu o pacote instalado com.google.android.apps.maps com a próxima parada correta.
- Limpar interrompeu GPS sem apagar seleção; rota avulsa funcionou sem selecionar nem adicionar clientes.
- As quatro chamadas rodoviárias (matriz, roteiro, recálculo e avulsa) responderam HTTP 200. Cancelamentos de tiles registrados como ERR_ABORTED ocorreram durante mudanças de câmera, não como falhas do itinerário.

APK: 12.711.200 bytes.
SHA-256: bc433fa0a52edcdc907c51b750893d04be20bdeae3af83cf92dae90b935c18d7.
Evidências: docs/captures/android/android-routes.json e android-candidate.json.
A captura CDP do canvas acelerado não registrava o desenho WebGL. A conferência pelo compositor Android (`adb exec-out screencap -p`) confirmou ruas, linha azul e sete paradas; os PNGs principais e suas prévias JPEG são dessa captura da tela. O teste aguarda a fonte carregada e uma feição da camada route-line visível antes da captura. O Google Maps abriu sua tela inicial de primeiro uso; não foi validada uma viagem guiada nesse aplicativo.
Ocorreram falhas do ambiente/teste durante as iterações: alteração de densidade com WebView já aberto, emulador offline e expectativa incorreta de abrir Chrome quando Google Maps estava instalado. Foram isoladas das falhas do produto. A execução aprovada iniciou a tela de tablet antes do aplicativo e separou o emulador dos processos de compilação.

## Publicação e acesso
A prévia de testes é https://traxio-preview.vercel.app/; o APK é servido em /downloads/traxio-android-testes.apk.

Publicação verificada: https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39661371569
- Website, APK, relatório e capturas públicos com HTTP 200.
- Download completo do APK: 12.711.200 bytes e SHA-256 esperado; tipo Android e cabeçalho de download corretos.
- HTML e módulos servidos correspondem ao código versionado; os módulos compartilhados no APK correspondem à versão web.
- Três testes Playwright no site publicado passaram: desktop, tablet vertical e tablet horizontal escuro; cada um selecionou sete clientes sintéticos e apresentou rota real de 4,7 km, oito minutos e sete paradas, sem gravação no banco real.
- Retornos Google web/Android e rejeição de URL não autorizada aprovados no mesmo workflow.
- Código publicado na validação: 18cf1f52f496dec7f0cca07168a2f08e49c81291; commits posteriores deste relatório e dos testes não alteram os módulos do aplicativo.

Configuração externa corrigida pelo proprietário: https://traxio-preview.vercel.app/ foi adicionada aos Redirect URLs do Supabase. O reteste aprovou os retornos Google para a prévia e app.traxio.mobile://auth/callback, e rejeitou uma URL de controle não autorizada. Execução 39653886884, tentativa 2. Esses testes usam cancelamento controlado, sem login pessoal ou gravação de clientes.

## Arquivos principais
- index.html: ID da seleção, compatibilidade numérica, cancelamento da matriz, preservação do endereço e marcadores.
- assets/traxio-planner.js: classificação, partição, IDs canônicos e assinatura do planejamento.
- assets/traxio-route-ui.js: controlador único, estados, confirmação parcial, origens, cancelamento, responsividade do viewport e organização de controles.
- assets/traxio-routes.css: layout restrito ao módulo de rotas; mantém os arquivos gráficos aprovados.
- assets/traxio-geolocation.js: repetição limitada de falhas transitórias.
- tests/routes.spec.js, routes-live.spec.js, routes-before.spec.js, fixtures/routing.js e test-unit/planner.test.mjs: regressão e evidências.
- tests/geolocation.spec.js e fixtures/browser.js: adaptações explícitas dos testes para validar renderização e WebView, sem modo de teste no produto.
- mobile/capacitor.config.json, AndroidManifest.xml, runtime-entry.js e strings.xml: nome visível oficial e teclado Android com o plugin oficial Capacitor Keyboard, resizeOnFullScreen e reposicionamento do campo em foco. Package ID e retorno OAuth permanecem app.traxio.mobile.
- scripts/android-routes.mjs e workflows route-repair.yml / android-routes.yml: testes de navegador e APK.

## Reprodução
```sh
npm ci
npx playwright install --with-deps chromium
npm run check
npm run test:geolocation
npm test -- tests/routes.spec.js
npm test -- tests/auth.spec.js tests/flows.spec.js tests/geolocation.spec.js tests/native-bridge.spec.js
npm test -- tests/routes-live.spec.js --project=tablet-portrait-light --project=tablet-landscape-dark --workers=1
```
Os testes autenticados usam dados sintéticos injetados somente pelo Playwright; não há bypass de autenticação na aplicação. Os testes de ruas mantêm reais os pedidos OSRM e a renderização MapLibre. Os testes de GPS simulam deslocamento: não equivalem a um percurso físico.

## Limitações / validação pendente
- Não há acesso autorizado nesta sessão à carteira real do Supabase: a consulta agregada somente de leitura foi recusada pelo conector. Os 157 clientes reais não foram alterados. Não foi declarado que todos tenham localização exata.
- Google Maps foi aberto no emulador, mas isso não comprova uma viagem física guiada; Waze foi validado por contrato de URL/launcher, sem teste com o aplicativo Waze instalado.
- Testes em emulador não substituem o Galaxy Tab A11+ físico. Falta teste de campo com representante, endereços reais e desvios GPS reais.
- O serviço público demonstrativo OSRM não oferece SLA ou trânsito em tempo real.
- Google/Microsoft OAuth e Supabase mantêm seus identificadores. Os testes de contrato não representam login real em conta pessoal. Microsoft/Azure estava desabilitado na configuração Supabase em diagnóstico anterior; isso não foi alterado.
- Os rasters existentes da marca foram preservados. A substituição gráfica Traxio → Traxelo.IA continua dependente dos originais aprovados da nova marca, que não constam no repositório de base.
- APK de testes com assinatura debug. A compatibilidade de atualização com APKs antigos depende da chave de assinatura; nenhum procedimento que apague dados não sincronizados foi executado.
