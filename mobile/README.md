# Android ativo; iOS pausado

Por decisão do usuário em 20/10/2026, a entrega e os builds atuais abrangem somente o site e o Android. O código iOS previamente preparado permanece guardado; novos builds, assinatura e distribuição iOS estão desativados.

# Traxio para Android e iOS

Os projetos usam Capacitor 8 e a mesma interface, identidade visual, autenticação e sincronização Supabase do site. ID inicial: `app.traxio.mobile`.

## Preparar

Requisitos: Node 22+, JDK 21 e SDK Android 36 para Android; macOS e Xcode compatível com Capacitor 8 para iOS. Não é preciso ter chave de mapas para os links externos.

```sh
npm install --prefix mobile --ignore-scripts
node scripts/build-mobile.mjs
npm run prepare:platforms --prefix mobile
cd mobile
npx cap sync android
```

Abrir no Android Studio: `npm run android --prefix mobile`. Os comandos e fontes iOS permanecem guardados para uma retomada autorizada.

O build empacota os arquivos locais, sem carregar todo o site remotamente. Mapas, autenticação e geocodificação precisam de internet. Nenhum cliente ou senha está embutido no instalador. A carteira vem da conta autenticada; o armazenamento local do aplicativo é separado do navegador.

## Permissões e navegação

O GPS nativo solicita permissão durante o uso. A navegação não foi implementada como um serviço contínuo de localização em segundo plano. Google Maps, Waze e Apple Maps recebem as coordenadas da próxima parada, na ordem planejada. No iPhone conectado ao CarPlay, a navegação no painel pertence ao aplicativo de mapas compatível escolhido; a Traxio não possui, nesta entrega, interface ou entitlement CarPlay próprios.

Ao trocar de aplicativo, a execução em segundo plano da Traxio pode ser suspensa. Ao retornar, é possível confirmar manualmente a visita; o registro não se apresenta como chegada automática por GPS. Os outros aplicativos calculam seus próprios percursos e recálculos, que podem diferir do OSRM.

## Autenticação Google e Microsoft

O aplicativo abre o navegador de autenticação do sistema e recebe o retorno por:

```
app.traxio.mobile://auth/callback
```

**É necessário conferir/adicionar esse endereço no Supabase → Authentication → URL Configuration → Redirect URLs**, preservando as URLs do site. As permissões de administração do Supabase não estavam disponíveis na retomada; essa configuração não foi alterada nem confirmada pelo agente. Os provedores Google/Microsoft mantêm o callback Supabase já existente. O código usa PKCE e troca o código de retorno pela sessão dentro do aplicativo; a chave secreta de serviço nunca é incluída.

Os testes automatizados verificam o contrato com os plugins e os dois provedores usando dados isolados. Não foi feito login pessoal real em um aparelho. O teste Android verifica os botões de login e o runtime; não autentica uma conta de produção.

## Builds e instalação

O workflow [Traxio Android](https://github.com/jeovadougllas-eng/-projeto-rota/actions/workflows/mobile-build.yml) gera o projeto Android e o APK debug de testes. O job iOS foi removido do workflow ativo. Os artefatos são retidos por 30 dias. O APK aprovado pelos testes é salvo em `downloads/traxio-android-testes.apk` na branch de desenvolvimento e nos artefatos da execução, sem alteração da `main`. A tentativa de criar um release público foi recusada pela integração GitHub (HTTP 403); a entrega usa arquivos e artefatos permitidos, sem ampliar permissões.

- Android: APK debug instalável para testes. Publicação Google Play e atualizações assinadas exigem keystore de distribuição da proprietária/conta responsável; não foram configuradas.
- iOS: pausado; o projeto Xcode preparado anteriormente permanece guardado. Não há entrega para iPhone nesta etapa.
- CarPlay próprio da Traxio: exige desenvolvimento nativo de templates/mapa e autorização da Apple, além da conta de desenvolvedor. A passagem aos navegadores compatíveis já tem código e testes; uma conexão física ao veículo não pode ser comprovada por teste de URL.

## Identidade visual

A interface usa os originais do kit aprovado. O launcher Android usa o recorte original do ícone. O ícone iOS foi preparado a partir do ícone aprovado para obter uma imagem quadrada sem margem externa, e exportado mecanicamente em 1024×1024 durante o build; é um derivado para a plataforma, não um vetor original recuperado. Os arquivos do kit permanecem intactos.

## Testar o Android

Após a publicação da prévia, baixe o [APK de testes](https://traxio-preview.vercel.app/downloads/traxio-android-testes.apk) e confira o [SHA-256](https://traxio-preview.vercel.app/downloads/traxio-android-testes.sha256). No aparelho, autorize a instalação pelo navegador/gerenciador usado e a localização durante o uso quando solicitada. Esta é uma distribuição de teste fora da Play Store, sem contratação de publicação. Builds debug não constituem um canal de atualizações de produção com assinatura permanente.

O site para comparação é https://traxio-preview.vercel.app/ . O APK usa a mesma conta Supabase, mas tem armazenamento local próprio; por isso a carteira deve ser sincronizada pela conta. Para Google/Microsoft no APK, é necessária a configuração de retorno descrita acima.
