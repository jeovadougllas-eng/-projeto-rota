# Geolocalização e navegação — Traxio

Branch: `dev/traxio-mockup-fidelity`. A branch `main` não foi alterada. Os testes usam dados isolados e não escrevem no banco real. A contagem inicial de 157 clientes foi verificada em 18/10; uma tentativa de reconferência em 20/10 foi negada pelo conector por falta de permissão, por isso não foi apresentada como nova confirmação do estado do banco.

## Diagnóstico confirmado

O diagnóstico remoto de 18/10/2026, execução [39083370085](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39083370085), fez consultas reais e pequenas, sem alterar clientes:

- Photon com `lang=pt`: **HTTP 400**, `Language is not supported. Supported are: default, de, en, fr`.
- A mesma pesquisa sem essa opção: HTTP 200. A implementação passa a usar explicitamente `lang=default`, inclusive em navegadores configurados em português.
- Busca estruturada de Rua Luiz XV, 770, Natal: retorna trechos da rua, **sem número do imóvel**. Essa evidência não permite atribuir um ponto exato ao cliente.
- ViaCEP reconhece o CEP 59073-230 como Rua Mira Mangue, Planalto, Natal/RN. Ele complementa o endereço; não fornece a posição da entrada.
- BrasilAPI CEP v2 retorna coordenadas aproximadas para o CEP. Elas **não são usadas como localização do imóvel**.
- OSRM responde HTTP 200 com geometria rodoviária e estimativas de distância/duração.
- Consulta SQL somente de leitura antes da mudança: 157 clientes ativos, nenhum com latitude e longitude preenchidas. Não houve preenchimento em massa do banco por agente nem migração de schema.

## Correções

- Importação preserva todas as colunas e separa rua, número, bairro, município, UF e CEP; não fixa RN para todos os usuários.
- Endereços importados entram em uma fila serial, com intervalo entre consultas, cache em memória e reaproveitamento de sugestões salvas no cadastro.
- Seleções feitas na tela Clientes também iniciam a busca ao entrar em Mapa e Rotas. A solicitação de rota espera a fila em andamento.
- Um resultado automático precisa de país, município, rua e número compatíveis, sem conflito de UF/CEP/bairro e sem dois imóveis distantes igualmente compatíveis. A indicação é de correspondência do endereço, **não uma garantia de entrada física exata**.
- Sugestões sem essa evidência aparecem como pontos aproximados, ficam separadas das coordenadas válidas e podem ser conferidas/ajustadas antes de salvar.
- “Confirmar ponto” registra a revisão mesmo quando o usuário não arrasta o marcador. Alterações de endereço invalidam evidências antigas; respostas tardias não sobrescrevem cadastros editados ou excluídos.
- Retirado o limite artificial de dez clientes: matrizes e trajetos maiores são divididos em blocos. Os testes unitários incluem os 157 clientes mais uma origem.
- “Clientes mais importantes primeiro” respeita a prioridade e desempata por distância; o modo equilibrado pondera ambos. A otimização é uma heurística sobre distâncias rodoviárias, sem garantia de ótimo global ou trânsito em tempo real.
- Recálculo usa a geometria pública mantida pelo aplicativo, sem depender do campo privado `_data` do MapLibre.
- GPS detecta desvio sustentado de pelo menos duas posições durante três segundos; limiar mínimo de 35 m ajustado à precisão, rejeitando sinal com erro maior que 100 m e posições antigas. São critérios de detecção, não precisão garantida do GPS.
- Recálculo parte da posição atual e mantém apenas as visitas restantes na ordem planejada. Evita requisições simultâneas, tenta novamente após falha com intervalo mínimo de 15 s, cancela respostas antigas ao encerrar/trocar a rota e atualiza linha, distância e tempo restante.
- O navegador precisa permanecer aberto, com localização permitida. Navegação em segundo plano com a tela bloqueada depende do navegador/sistema e não foi implementada como serviço nativo.

## Provedores pesquisados

| Serviço | Papel e adequação | Situação nesta entrega |
|---|---|---|
| [Photon](https://github.com/komoot/photon) | Geocodificação OSM, busca livre/estruturada. Servidor de demonstração sem garantia de disponibilidade e cobertura de números variável. | Corrigido e consultado realmente; requisições serializadas. |
| [Nominatim](https://operations.osmfoundation.org/policies/nominatim/) | Geocodificador OSM; servidor público limitado a 1 req/s no total da aplicação, sem autocomplete, com regras de cache e uso em lote. | Não foi adicionado como mecanismo de lote. A busca avulsa anterior permanece. |
| [ViaCEP](https://viacep.com.br/) / [BrasilAPI CEP](https://brasilapi.com.br/docs#tag/CEP-V2) | Complementam logradouro/localidade pelo CEP. Coordenada do CEP não confirma número ou estabelecimento. | Consultados realmente; ViaCEP usado somente para completar localidade. |
| [Geoapify](https://apidocs.geoapify.com/docs/geocoding/) | Busca estruturada, evidência de correspondência e confiança por imóvel. Permite [armazenamento de resultados](https://www.geoapify.com/geocoding-api/), respeitando atribuições. Também depende de cobertura dos dados. | Adaptador opcional implementado no servidor. **Não ativado: nenhuma chave configurada.** |
| [HERE](https://docs.here.com/geocoding-and-search/docs/geocode) | Distingue número, rua e localidade, com evidência de correspondência. É preciso comparar cobertura nos endereços reais e verificar plano/licença. | Documentação avaliada; sem credencial, sem chamadas reais. |
| [TomTom](https://docs.tomtom.com/geocoding-api/documentation/tomtom-maps/v1/structured-geocode) | Geocodificação estruturada com níveis de endereço e confiança. Cobertura precisa ser medida na carteira. | Documentação avaliada; sem credencial, sem chamadas reais. |
| [Google](https://developers.google.com/maps/documentation/geocoding/policies) | Endereços com tipos de precisão; uso de dados no mapa e armazenamento têm restrições. Não é substituição direta para dados persistidos com MapLibre. | Documentação avaliada; sem mudança do mapa, sem credencial ou cobrança. |
| [Mapbox](https://docs.mapbox.com/api/search/geocoding/) | Diferencia resultados temporários e permanentes; persistência exige modalidade adequada. | Documentação avaliada; sem credencial ou contratação. |

Nenhum provedor pode garantir todos os imóveis apenas pelo texto da planilha. A avaliação comercial deve comparar uma amostra conhecida, com a entrada conferida, antes de prometer cobertura. A integração opcional não foi apresentada como solução já ativa.

## Provedor adicional preparado para ativação

Configurar `GEOAPIFY_API_KEY` como variável secreta **no servidor** do projeto Vercel `traxio-preview` e redeployar esta branch. Não colocar a chave no HTML, na planilha, no Git ou no armazenamento do navegador. O endpoint `/api/geocode` valida a sessão no Supabase Auth, restringe o tamanho do endereço e aplica limite por usuário/instância. O limite em memória é uma proteção básica, não um controle global de cobrança entre várias instâncias.

O aplicativo consulta o provedor adicional quando disponível; uma instalação sem chave mantém a busca Photon. Não houve criação de conta, assinatura ou gasto com APIs comerciais.

## Verificação

O relatório final e os links das execuções concluídas são adicionados após o término dos testes. Casos implementados: parsing de planilhas, evidência e ambiguidade de endereço, proteção do endpoint, matrizes direcionadas com 157 clientes, composição de percursos grandes, importação → localização → confirmação → rota, desvio GPS, sinal impreciso/antigo, recuperação de rede, cancelamento de respostas e exclusão de paradas visitadas do recálculo.

Testes de navegação determinísticos simulam posições e respostas do roteador. A integração com MapLibre/OSRM reais tem teste separado com GPS simulado. Nenhum teste substitui validação ao dirigir num aparelho físico; não foi realizado deslocamento real por agente.

## Apple Maps e CarPlay

A navegação tem o botão **Abrir no Apple Maps / CarPlay**, que envia as coordenadas da próxima visita ao Apple Maps, com percurso de carro. Abre em outra aba/aplicativo e mantém a carteira na Traxio. A rota das próximas visitas permanece na ordem escolhida na Traxio; cada acionamento envia **uma parada**. O percurso viário, a voz, o trânsito e o recálculo no CarPlay são controlados pelo Apple Maps e podem diferir do percurso OSRM.

Conecte o iPhone ao veículo, abra o destino pelo botão e inicie o trajeto no Mapas. Como o navegador pode suspender o GPS ao trocar de app, ao retornar há **Registrar visita realizada**, com confirmação explícita. A próxima parada é atualizada somente após a visita ser registrada, sem simular chegada GPS. O histórico distingue registros manuais.

Isto é uma passagem de destino ao aplicativo compatível, não uma interface Traxio nativa no CarPlay e não um comando de pareamento. Não há API de navegador que confirme a conexão do veículo. A integração nativa exigiria projeto iOS, conta Apple Developer e autorização específica da Apple. Fontes: [Mapas no CarPlay](https://support.apple.com/guide/iphone/get-turn-by-turn-directions-iph215b053f6/ios), [CarPlay para desenvolvedores](https://developer.apple.com/carplay/) e [URLs do Apple Maps](https://developer.apple.com/documentation/mapkit/unified-map-urls).

O teste automatizado verifica coordenadas, modo de direção, abertura separada, cancelamento/confirmação de visita e atualização do próximo destino. Não houve teste com iPhone ou equipamento CarPlay físico.

## Aplicativos móveis e outros navegadores

Além do Apple Maps, Google Maps e Waze recebem a próxima coordenada confirmada; todos os links são atualizados quando uma visita é registrada. O projeto Android/iOS e seus requisitos de instalação, assinatura, login e CarPlay estão em [mobile/README.md](../mobile/README.md). Nenhuma conta comercial de geocodificação foi criada, conforme a informação do usuário de que ainda não possui uma.

## Refinamento por CEP, rua e número

O usuário definiu a confirmação no mapa como último recurso. Para CEP de oito dígitos, a consulta postal passa a ocorrer mesmo quando a planilha já contém cidade/UF. Há cache e reaproveitamento da evidência; o centroide do CEP nunca é usado como ponto do cliente. Divergências de CEP/logradouro/município/UF bloqueiam aceitação automática e aparecem no diagnóstico.

Antes de apresentar uma revisão manual, a busca tenta: provedor adicional quando configurado; Photon estruturado com CEP, rua, número, município e UF; consulta textual completa; consulta textual simplificada sem ruído. Endereço postal canônico também é tentado quando diverge, mantendo o conflito visível. O sistema só atribui coordenadas automaticamente com correspondência suficiente de número e endereço; não transforma centro de rua em imóvel exato.

A documentação atual do [Geoapify](https://apidocs.geoapify.com/docs/geocoding/) informa plano gratuito com até 3.000 consultas/dia, sem cartão e com atribuição obrigatória. A integração está preparada, mas a conta/chave ainda não foi fornecida/configurada. Não foi ativado plano pago. Esse motor adicional também precisa ser medido nos endereços reais; sua ativação não garante automaticamente cobertura de todos os números.

## Escopo atual

Somente site e Android. iOS pausado a pedido do usuário. O APK é disponibilizado pelo arquivo de desenvolvimento e pelo site, após o teste no emulador; não depende de publicação na Play Store para os testes.
