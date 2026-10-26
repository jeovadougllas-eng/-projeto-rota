# Mapa: busca de clientes, menu móvel e confirmação direta do pin

Versão web: https://traxio-preview.vercel.app/
Branch: `dev/traxelo-android-routes`. Nenhuma alteração em `main`.

## Alterações entregues

- Navegação fixa movida para fora do contêiner de rolagem. A barra compacta permanece acessível no celular e o botão Menu abre os nomes completos das cinco abas; Escape, toque fora e escolha de uma aba fecham o menu. O menu não aparece antes da autenticação.
- Em Mapa e Rotas, **Buscar localizações dos clientes** permite consultar não confirmados, selecionados ou resultados dos filtros atuais. A busca preserva clientes já confirmados e a seleção usada na rota.
- É possível escolher **Geoapify + TomTom** ou a busca atual OpenStreetMap. As duas chaves ficam no servidor. As consultas paralelas por serviço respeitam a fila sequencial entre clientes e as cotas do endpoint existente. Recusa de credencial/cota ou falha de comunicação interrompe a busca com mensagem explícita.
- Imóveis aceitos pelas regras conservadoras são salvos localmente e enviados pelo mecanismo de sincronização existente. Geoapify só é aceito automaticamente quando informa resultado de imóvel com alta confiança e endereço compatível; discordância entre serviços impede aceitação automática. O registro de endereço do TomTom, sozinho, permanece para revisão, pois não informa confiança física equivalente.
- Clientes confirmados aparecem no mapa mesmo sem seleção para uma rota, respeitando os filtros. Os números das paradas selecionadas continuam separados dos pontos da carteira.
- Cada aproximação tem **Confirmar pin no mapa**. Essa ação abre diretamente o mapa com pin laranja; arrastar ou tocar reposiciona, **Confirmar posição e salvar** confirma, e **Cancelar ajuste** descarta a alteração.
- A confirmação muda somente coordenadas e evidências de localização do cliente existente, preservando endereço original, campos importados, telefone, prioridade e demais dados comerciais.
- O aviso distingue **salvo neste aparelho**, **envio pendente** e **sincronizado com a conta**. A confirmação de nuvem depende do resultado do fluxo de revisão/CAS existente. Conflitos e falhas não são anunciados como sucesso.
- O CORS do endpoint autenticado aceita as origens locais conhecidas do APK; requisições sem autenticação continuam recusadas.

## Causas confirmadas no código e limites da reprodução

1. A navegação estava dentro de `main`, que é fixo e rolável, e não havia controle de expansão no celular. A imagem enviada mostra a ausência no Safari; o problema físico específico desse aparelho não foi reproduzido diretamente. A arquitetura foi corrigida e a visibilidade/clicabilidade após rolagem foi verificada em Chromium e WebKit.
2. Pontos aproximados abriam o cadastro modal e exigiam encontrar outra ação para ajustar o mapa. A confirmação reusava o salvamento integral do formulário, reconstruindo o endereço mesmo quando a intenção era apenas confirmar coordenadas. O fluxo direto preserva o cadastro original.
3. A fila comum ignorava clientes que já possuíam coordenadas, mesmo não verificadas; o cache de aproximações também podia bloquear uma tentativa forçada. A busca explícita agora pode repetir esses casos, preservando confirmações manuais.
4. A busca automática iniciada pela seleção podia disputar com a busca explícita com outro provedor. Resultados substituídos agora são cancelados por AbortController e não sobrescrevem a confirmação posterior.
5. O mapa desenhava somente os clientes selecionados para uma rota. Assim, uma busca com seleção vazia podia terminar sem mostrar clientes já geolocalizados. Agora a carteira confirmada também é desenhada.

## Testes já executados

- 42 casos do novo fluxo em desktop, tablet vertical e horizontal, celular Chromium, celular WebKit e desktop WebKit: **passaram**. Dados sintéticos; consultas de geocodificação e banco simuladas. Capturas incluem o menu e a barra de confirmação.
  https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40371014349
- 27 casos existentes de confirmação persistente, sincronização por revisão, proteção contra nuvem atrasada, rota parcial e retomada da roteirização: **passaram**.
  https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40370862698
- 88 casos de identidade, estrutura das cinco abas e carteira confirmada, mais 3 capturas da versão anterior: **passaram**.
  https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40370862747
- 36 casos Node, incluindo validação de origem/CORS Android, exigência de autenticação e proteção contra coordenadas inválidas: executados; aprovação adicional de CI registrada no workflow do comparador.
- Os testes não acessam nem alteram os 157 clientes reais. Os doubles de banco exercitam o RPC de revisão existente, mas não comprovam as permissões de uma conta real específica.

## Android e atualização

O APK distribuído foi preservado: package `app.traxio.mobile`, runtime `capacitor8-20261026`, SHA-256 `6d9fe54fc87beac1e1da5200858ab5232468449f40733548d58ad75139fdcdc2`.

As alterações são de HTML/JS/CSS, distribuíveis pelo atualizador web dessa versão do APK. Não é necessário gerar outro APK para essas alterações. APKs anteriores que não possuam o atualizador não recebem esse recurso; não desinstale uma versão antiga sem a migração/backup descritos em `/docs/android-install.html`.

Durante a preparação dos testes Android, três falhas do harness foram corrigidas: ausência do diretório das capturas e tentativa de emular celular mudando a densidade de uma atividade já aberta e uma expectativa incorreta de restaurar as coordenadas anteriores após uma edição manual deliberada. O teste passou a exigir a preservação do novo ponto confirmado durante a recuperação. O teste final usa rotação real do tablet; expansão em celular é coberta pelos testes Chromium/WebKit. Essas falhas não foram tratadas como aprovação do pacote.

## Como validar com sua carteira

1. Entre na sua conta e abra Mapa e Rotas.
2. Expanda Buscar localizações dos clientes, escolha o grupo e o serviço e toque em Buscar e salvar localizações.
3. Acompanhe os contadores e os pontos confirmados no mapa. Nenhuma aproximação é contada como confirmação manual.
4. Em um resultado aproximado, toque em Confirmar pin no mapa, ajuste a entrada da loja e toque em Confirmar posição e salvar.
5. Confira o aviso de sincronização. Em caso de envio pendente, reconecte ou use Tentar sincronizar; conflitos permanecem protegidos.
6. Reabra o app ou entre na mesma conta em outro aparelho para conferir o ponto salvo e então planeje a rota.

Limites: não há validação em tablet físico nem medição de cobertura/precisão dos 157 endereços nesta entrega. As chaves foram configuradas, mas a validade/cobertura efetiva dos provedores para a carteira depende de uma execução autenticada real. Nenhum resultado de teste sintético representa precisão física de 100% ou comprovação da meta de 80%.

## Verificação final publicada e no Android

- **21 testes passaram no link web real**, em desktop, tablet vertical e celular. São dados sintéticos e respostas de geocodificação/banco simuladas, servidas pela página publicada. O servidor real também respondeu corretamente ao preflight Android e recusou uma consulta sem autenticação.
  https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40372835361
- **28 testes de regressão do fluxo passaram** na rodada Chromium final, além da rodada anterior de 42 que incluiu WebKit.
  https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40372835557
- **8 verificações Android passaram** no APK original instalado em emulador API 35: download HTTPS, aplicação no próximo início sem reinstalar, preservação de dados, inicialização saudável, marcadores sem seleção, confirmação direta com evento de arrasto MapLibre e RPC simulado, rotação real do tablet e recuperação/quarentena de pacote corrompido. A posição intencionalmente alterada no teste foi preservada após a recuperação.
  https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40373265344

Atualização web Android aprovada: `8e8f93d69949e7e1633176b2491be43be8ee90c6c80ddb95a5fb1e6c15a57cae`, 57 arquivos, 10.613.414 bytes, SHA-256 do ZIP `0007c0529871b56c02738364fa35907ad7756026b0a8d45f568c1d490d1dbc92`.

Capturas reais do emulador, com dados sintéticos:
- `/docs/captures/location-android/android-location-tablet.png`
- `/docs/captures/location-android/android-location-landscape-menu.png`
- `/docs/captures/location-android/android-updated-dashboard.png`
- `/docs/captures/location-android/android-updates.json` contém os resultados estruturados.

Para receber no APK que já possui o atualizador: abra conectado à internet, aguarde o aviso de atualização pronta em Planilhas, feche o aplicativo completamente e reabra. O download não reinicia uma navegação ativa. No navegador, basta recarregar o site. O APK anterior sem atualizador continua exigindo a migração segura já documentada; não o desinstale sem backup.

## Regressão completa e integridade final

- **184 testes de transações de rota passaram** na versão final do código do aplicativo (mesmos `index.html` e assets da versão publicada). A primeira regressão seguinte parou porque um teste ainda procurava o comando antigo “Conferir pin sugerido” e exigia passar pelo cadastro. O teste foi atualizado para o fluxo solicitado: abrir diretamente o mapa, confirmar uma vez e verificar que endereço e colunas importadas permanecem intactos. Não foi removida a verificação de persistência.
- **160 testes funcionais passaram**, cobrindo Google/Microsoft por doubles de OAuth, formulários, importação/exportação/backup, geocodificação de endereço numerado, confirmação de aproximação, GPS/recalculo e ponte nativa. **3 testes com roteirização real em ruas passaram**, além de **1 consulta pública de endereço de teste** no provedor atual (não Geoapify/TomTom e não a carteira real).
  https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40374382915
- **Integridade pública aprovada**: HTTP 200 do site, APK original de 16.171.451 bytes com SHA preservado, ZIP de atualização com SHA correto, todos os **57 arquivos internos do ZIP** conferidos e **2 capturas Android** disponíveis. Os recursos exclusivos do runtime nativo são verificados dentro do ZIP; não se espera que existam como arquivos da página web. O verificador inicial que procurava o runtime no diretório web foi corrigido.
  https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40374586604

As consultas Geoapify/TomTom em clientes reais continuam dependendo da sessão do usuário. Nenhum teste sintético, de integridade ou do endereço público foi apresentado como cobertura dos 157 clientes.
