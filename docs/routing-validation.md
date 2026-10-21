# Traxelo.IA — validação de Mapa e Rotas
Branch de trabalho: `dev/traxelo-android-routes`. Base: `f9305d71c24830e3252c437420e1aa58383ce34c`. A main não foi alterada.

## Falhas confirmadas e correções
| Problema | Causa | Correção / comprovação |
|---|---|---|
| Sete selecionados não resultam em itinerário quando um está pendente | O cálculo aguardava a fila global e abandonava todos os pontos se sobrasse um sem coordenadas | Classificação antes de calcular; revisão individual; rota com aptos somente após confirmação explícita. Teste de seis aptos + um pendente. |
| Seleções desaparecem com filtros / sincronização | Comparações estritas entre IDs numéricos e strings; selecionar todos substituía o conjunto; render removia IDs temporariamente ausentes | IDs canônicos apenas no conjunto da seleção, sem mudar registros; seleção cumulativa que respeita busca/região; armazenamento separado por usuário; IDs não carregados são preservados e identificados. |
| Critério escolhido não afeta Organizar visitas | O botão chamava sempre distance | Os comandos usam o mesmo controlador e o critério escolhido; trocar critério invalida o trajeto anterior. |
| Operação parece concluída sem rota nas ruas | lastRoute e navegação eram criados antes da resposta de ruas | Só confirma itinerário após matriz, otimização, resposta GeoJSON e fonte/camada no mapa. Falhas não deixam navegação habilitada. |
| Trajeto antigo reaparece após limpar ou mudar origem | Pedidos antigos não eram cancelados, nem invalidados; o GPS anterior continuava ativo | AbortController, geração de cálculo e assinatura de seleção/endereço/origem/critério. Limpar interrompe GPS e mantém seleção. |
| Origem manual ausente | Apenas primeiro cliente ou GPS disponíveis | Busca de endereço com confirmação; alternativa explícita de escolher e confirmar ponto no mapa. |
| Marcadores não correspondem à sequência | Numeração seguia a ordem dos cadastros | Numeração acompanha itinerário; origem de cliente usa O; pontos selecionados fora da rota usam ?. |
| Estilo do mapa demora a carregar | Desenho aguardava load, insuficiente após mudanças de estilo | Aguarda style.load/load com timeout e cancelamento; valida fonte e camada antes de anunciar sucesso. |
| Tablet comprimido, mapa deslocado e controles sobrepostos | Escala do desktop; painel sticky antigo; listas e destino avulso abertos sob mapa | Grade própria para tablet, planejamento recolhível, mapa em destaque, controles com 44 px, listas secundárias expansíveis e barra de ações acessível. |
| Cidade ou bairro incorreto continua impedindo a busca | As colunas originais prevaleciam mesmo após editar o endereço | Campos explícitos de cidade/bairro/UF e geocodingRegionOverride; preservação de originalRegion e importFields; nova geocodificação do cliente selecionado após salvar a correção. |\n| Endereço corrigido perde texto anterior | Edição substituía address, embora campos da planilha fossem preservados | Guarda originalAddress na primeira correção, preservando importFields e dados comerciais. |

Os caminhos foram inspecionados e receberam testes reproduzíveis. A ocorrência exata da gravação não foi reconstituída com os sete registros reais: o vídeo não faz parte do ambiente, conforme instrução, e o conector Supabase negou a consulta somente de leitura. Não foram modificados dados reais para produzir evidências.

## Localizações e limites de precisão
- Número de imóvel confirmado automaticamente ou ponto revisto manualmente: apto.
- Coordenadas importadas/legadas sem comprovação: não verificadas, uso somente após confirmação explícita; essa confirmação de uso não promove o cadastro a localização exata.
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

A matriz final, a validação Android e a verificação pública são registradas abaixo após sua conclusão; compilação isolada não significa aceite.

## Arquivos principais
- index.html: ID da seleção, compatibilidade numérica, cancelamento da matriz, preservação do endereço e marcadores.
- assets/traxio-planner.js: classificação, partição, IDs canônicos e assinatura do planejamento.
- assets/traxio-route-ui.js: controlador único, estados, confirmação parcial, origens, cancelamento, responsividade do viewport e organização de controles.
- assets/traxio-routes.css: layout restrito ao módulo de rotas; mantém os arquivos gráficos aprovados.
- assets/traxio-geolocation.js: repetição limitada de falhas transitórias.
- tests/routes.spec.js, routes-live.spec.js, routes-before.spec.js, fixtures/routing.js e test-unit/planner.test.mjs: regressão e evidências.
- tests/geolocation.spec.js e fixtures/browser.js: adaptações explícitas dos testes para validar renderização e WebView, sem modo de teste no produto.
- mobile/capacitor.config.json, AndroidManifest.xml e strings.xml: somente nome visível oficial e ajuste do teclado. Package ID e retorno OAuth permanecem app.traxio.mobile.
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
- Testes em emulador não substituem o Galaxy Tab A11+ físico. Falta teste de campo com representante, endereços reais e desvios GPS reais.
- O serviço público demonstrativo OSRM não oferece SLA ou trânsito em tempo real.
- Google/Microsoft OAuth e Supabase mantêm seus identificadores. Os testes de contrato não representam login real em conta pessoal. Microsoft/Azure estava desabilitado na configuração Supabase em diagnóstico anterior; isso não foi alterado.
- Os rasters existentes da marca foram preservados. A substituição gráfica Traxio → Traxelo.IA continua dependente dos originais aprovados da nova marca, que não constam no repositório de base.
- APK de testes com assinatura debug. A compatibilidade de atualização com APKs antigos depende da chave de assinatura; nenhum procedimento que apague dados não sincronizados foi executado.
