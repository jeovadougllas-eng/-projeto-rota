# Localização dos clientes e primeiro acesso da testadora

Revisão técnica em 23/10/2026. Esta nota distingue mudanças implementadas de serviços que ainda dependem de configuração e de medições com endereços reais.

## Por que o Google encontra um endereço que a busca atual não encontra?

O login Google existente usa OAuth e não habilita a API de endereços do Google Maps Platform.

O mapa exibido atualmente usa MapLibre/OpenFreeMap; a conversão de endereço em coordenadas usa Photon/OpenStreetMap e ViaCEP para dados postais. A existência de uma rua no mapa não significa que seus números de imóveis estejam mapeados. O Google mantém uma base diferente de endereços e estabelecimentos. Encontrar uma farmácia pelo nome no aplicativo Google Maps também não demonstra, por si só, que a API Geocoding encontrará o mesmo estabelecimento usando somente o texto do endereço: isso precisa ser medido pela API escolhida.

A sugestão de sequência usa uma matriz de distâncias viárias e os critérios comerciais do planejador; ela depende de localizações utilizáveis, mas não é o serviço que descobre os endereços.

O código já preserva as colunas da planilha, identifica número/CEP/cidade/UF, tenta consultas estruturadas e textuais e rejeita resultados que representam apenas uma rua ou município. Esse controle evita apresentar um centro de cidade como se fosse a entrada de um cliente. A integração adicional Geoapify já existe no backend, condicionada a `GEOAPIFY_API_KEY`, sem chave secreta no navegador. Não foi ativada nenhuma cobrança nem substituído o fornecedor nesta revisão. A verificação da prévia publicada confirmou HTTP 503 para o provedor adicional: Geoapify ainda não está configurado nessa hospedagem.

O número “20” da captura não comprova vinte entradas verificadas: a implementação anterior contava qualquer par de coordenadas válido. O contador agora usa a mesma regra do planejamento: ponto confirmado manualmente ou correspondência automática no número do imóvel. Coordenadas importadas sem verificação, aproximações e ausência de coordenadas ficam em “A confirmar”. O novo atalho abre a lista correspondente. Contadores não criam coordenadas nem convertem os 137 pendentes em localizações exatas.

Não foi possível auditar os dados reais no banco por este conector: a consulta agregada somente de leitura foi recusada por falta de permissão. Os testes usam dados isolados, sem modificar cadastros reais. Não há uma medição independente afirmando que todos os 157 endereços são encontrados por qualquer fornecedor.

## Precisão de 100%

Não existe garantia honesta de 100% para qualquer planilha, mesmo com serviço pago. CEP não identifica necessariamente um imóvel; número inexistente, S/N, quadra/lote, mudança de nome de rua, estabelecimento fechado ou entrada em outra rua exigem tratamento de exceção. A posição do prédio também pode diferir da entrada acessível por automóvel.

A classificação do Google diferencia `ROOFTOP`, `RANGE_INTERPOLATED`, `GEOMETRIC_CENTER` e `APPROXIMATE`; uma resposta com correspondência parcial não deve ser aprovada silenciosamente. Nem `ROOFTOP` garante a entrada correta de todos os estabelecimentos. Referência: [respostas da API Geocoding](https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding).

Para exigir precisão verificável em todos os registros, é necessário comparar com uma fonte conhecida da localização do cliente e resolver as exceções, por exemplo com ponto fornecido pelo estabelecimento ou medição no local. A confirmação manual pode ser uma exceção, mas não pode ser eliminada por promessa comercial.

## Serviço recomendado e custos

**Para avaliar a cobertura que você já observa no Google Maps, recomendo Google Geocoding API e Google Maps JavaScript API para a exibição do mapa.** Quando houver correspondência por estabelecimento, avaliar Places separadamente, com a necessidade e o custo de cada consulta explícitos. A migração deve preservar a interface aprovada e os dados comerciais.

Na tabela oficial consultada, Geocoding tem franquia de **10.000 eventos/mês**; o primeiro escalão pago custa **US$ 5 por 1.000** eventos acima da franquia. Dynamic Maps tem franquia de **10.000 eventos/mês**, com primeiro escalão pago de **US$ 7 por 1.000**. São SKUs distintos: a franquia de geocodificação não cobre automaticamente mapas, Places e rotas. A API exige um projeto com faturamento habilitado, mesmo quando o uso permanece na franquia. Reconsultas, tentativas e todos os usuários entram no consumo; consultar uma vez 157 endereços é diferente de recalculá-los repetidamente. Referências: [preços Google](https://developers.google.com/maps/billing-and-pricing/pricing) e [faturamento e cotas](https://developers.google.com/maps/documentation/geocoding/usage-and-billing).

**Não basta salvar permanentemente as coordenadas da API Google no Supabase e desenhá-las no mapa OSM atual.** A política de Geocoding exige Google Maps quando os resultados são exibidos em um mapa e limita armazenamento/cache; `place_id` tem exceção para armazenamento permanente. A integração precisa distinguir dados fornecidos pelo usuário de conteúdo licenciado e cumprir os termos aplicáveis. Referência: [política Geocoding](https://developers.google.com/maps/documentation/geocoding/policies).

Se o requisito imediato for não cadastrar faturamento, há o plano gratuito Geoapify com **3.000 créditos/dia**, sem cartão, permitido para uso comercial com atribuição. O primeiro plano pago anunciado custa US$ 59/mês. Como essa opção também utiliza dados abertos, não há evidência de que pagar pelo plano vá resolver os endereços ausentes. Não recomendo contratar um plano apenas para aumentar a cota antes de medir a cobertura. Referência: [preços Geoapify](https://www.geoapify.com/pricing/).

## Etapas necessárias para a migração Google

1. Disponibilizar acesso a um projeto Google Cloud do proprietário; habilitar faturamento e as APIs escolhidas, com cotas adequadas e monitoramento. Alertas de orçamento não equivalem a bloqueio automático de gastos. Nenhuma chave deve ser enviada em mensagem.
2. Medir primeiro os endereços hoje pendentes com consultas estruturadas, sem alterar os registros originais. Conferir município/UF/CEP/número, correspondências parciais e nível de precisão. Reportar separadamente cobertura e acerto verificado.
3. Implementar o fornecedor no backend, com chave de geocodificação restrita ao uso servidor. A chave de exibição do Maps JavaScript é pública por projeto e deve ser restringida por site/API; ela não deve ser reutilizada como credencial secreta do servidor.
4. Adaptar o mapa, marcadores, enquadramento e trajetos à plataforma escolhida, atendendo também às regras de uso conjunto de conteúdo de rotas e mapas. Testar web e Android, autorizações GPS, teclado, recálculo e abertura da navegação externa.
5. Preservar pontos confirmados pelo usuário, guardar evidências de precisão e tratar exceções explicitamente. Seguir os limites de armazenamento do fornecedor em vez de prometer persistência irrestrita de conteúdo licenciado.

Esta migração **ainda não está implementada nem ativada**. As correções de lateral, marca e planejamento com clientes confirmados funcionam com a plataforma atual e não dependem da contratação.

## Conta própria da cliente

A cliente terá carteira própria, conforme solicitado. Ela não precisa de acesso ao GitHub, Supabase administrativo nem à sua conta. A leitura das configurações públicas do Supabase confirmou cadastro de novos usuários habilitado e login Google ativo. O provedor Microsoft/Azure está desativado no projeto; essa configuração existente não foi alterada.

1. Enviar a URL da versão web de testes ou o APK de testes verificado. Para iniciar o teste, prefira o site no dispositivo pessoal dela.
2. Para o primeiro teste, recomendo **Entrar com Google**, usando a conta pessoal dela. O cadastro por e-mail também está disponível em **Criar conta**, com confirmação quando solicitada; a entrega desse e-mail depende da configuração SMTP e não foi validada com o endereço real da cliente. O botão Microsoft é preservado, mas sua disponibilidade depende da configuração Azure no Supabase; não foi ativado um provedor novo nesta revisão.
3. Entrar e confirmar que a carteira está vazia. Importar uma planilha própria, aguardar as localizações e verificar a sincronização em **Planilhas → Verificar agora**.
4. Selecionar os clientes confirmados pelo atalho, definir a origem, escolher o critério, calcular e conferir as paradas antes de iniciar a navegação.

Usar **dispositivo ou perfil de navegador próprio**. O armazenamento local legado da carteira é associado ao navegador e possui bloqueio de sincronização ao trocar de proprietário; não é uma carteira compartilhada entre contas. Não testar a conta dela no seu perfil que contém os 157 registros. Não compartilhar sua senha nem importar automaticamente sua carteira para ela. Compartilhamento de equipe exigiria outro modelo de permissões, que não foi solicitado.

O APK é uma versão de testes; a instalação externa à Play Store pode exigir liberar a instalação pelo navegador usado para baixá-lo. Não há validação em tablet físico nesta revisão: o ambiente disponível permite testes de navegador e emulador Android. Os serviços públicos de demonstração de busca e rotas não oferecem garantia de disponibilidade para uma operação comercial crítica.
