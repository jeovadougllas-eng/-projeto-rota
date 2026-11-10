# Google Maps — Web/PWA

Implementação usa duas variáveis de produção no Vercel, sem valores em código ou documentação:

- `GOOGLE_MAPS_BROWSER_API_KEY`: SDK Maps JavaScript, restrita no Google Cloud ao site `https://traxio-preview.vercel.app/*` e somente Maps JavaScript API. Embora cadastrada como Secret no Vercel, esta chave precisa chegar ao navegador para carregar o mapa; a restrição de referenciador é indispensável.
- `GOOGLE_MAPS_SERVER_API_KEY`: somente Places API (New) e Geocoding API; usada exclusivamente pela função `/api/google-location`. Não usar restrição de sites nesta chave de servidor. Restringir por IP apenas se houver saída fixa contratada/configurada.

O projeto Google `rotamapa-maps` e seu faturamento são independentes da conta GitHub/OAuth do aplicativo. Nenhum cliente, sessão, carteira ou histórico foi migrado de provedor.

## Comportamento

A importação e a busca automática consultam primeiro nome fantasia/razão social com endereço, município e UF. Se necessário, consultam o endereço no Geocoding. Uma correspondência compatível e sem ambiguidade é salva automaticamente; diferentes unidades ou endereços imprecisos ficam para revisão. Nenhum serviço garante precisão em todos os estabelecimentos. Pins confirmados manualmente não são substituídos.

No mapa, **Localizar clientes no Google** inicia o fluxo existente de busca em lote, com progresso, pausa e retomada. O seletor de serviço também permite Google. Os serviços gratuitos permanecem disponíveis pelo seletor e em ambientes sem as variáveis.

Quando há resultados Google, o mapa usa Google Maps, incluindo atribuição nativa e opção satélite; não apresenta esses resultados sobre OpenStreetMap/MapLibre. GPS, ajuste manual e desenho das rotas usam uma camada de compatibilidade. A roteirização pelas ruas existente continua com OSRM; este trabalho não habilita a API Routes nem navegação viária Google embutida.

## Uso e cache

Durante a validação, o servidor exige conta Signature, Insider já autorizado ou operador existente. Não concede novas permissões e não ativa convidados.

Cada carregamento autorizado do SDK e cada chamada externa de Places/Geocoding exige reserva transacional no Supabase: 400 reservas por usuário/dia, 2.000 por projeto/dia e 3.000 por projeto/mês, calendário America/Fortaleza. São limites de chamadas deste backend, não limites monetários nem garantias sobre todo o faturamento Google: a chave pública do SDK e usos externos ao aplicativo não passam pelo contador. Alertas de orçamento R$100 configurados no Cloud não bloqueiam cobranças. Não foram estimados preços ou franquias como se fossem garantidos.

Somente coordenadas, identificador do lugar e metadados de qualidade são retornados. Nomes e endereços obtidos do Google não substituem os dados importados nem são guardados. Coordenadas automáticas expiram em 27 dias. A limpeza diária no banco deixa margem sob 30 dias; a aplicação limpa o cache local na abertura, a cada minuto e ao voltar à tela. Não substitui pins manuais por coordenadas nulas. Backups CSV/JSON e snapshots de visitas excluem coordenadas automáticas Google; clientes e histórico comercial permanecem. Rotas salvas conservam IDs e metadados de expiração; para recalcular após expiração, é preciso localizar novamente os clientes. Renomear/favoritar uma rota com cache expirado exige resolver as coordenadas atuais.

## Preparação e publicação

1. Validar `supabase/migrations/20261110204232_google_location_limits.sql` no banco local isolado.
2. Aplicar a migração revisada e `docs/sql/enable-google-cache-cron.sql` ao Supabase autorizado, sem dados sintéticos. Conferir o job `rotamapa-google-cache-expiry` ativo e suas execuções.
3. Publicar o commit revisado no projeto Vercel existente, target production, após checks Web/PWA. As duas variáveis já estão restritas a Production; prévias sem variáveis usam a alternativa gratuita.
4. Verificar `/api/google-location` (GET informa apenas configuração; POST sem sessão deve dar401), recursos públicos e PWA. Não efetuar login real como teste automatizado.
5. Titular valida uma busca real pelo próprio navegador, verificando pins e consumo no Google Cloud. Não declarar precisão para os157 clientes antes dessa validação.

Rollback de aplicativo: deployment Web/PWA1.9.2 `dpl_DtGGg8HSGZntQ795k4YRhFJ4raiU`. Não remover o job de expiração enquanto existir cache Google; a migração é aditiva e não altera memberships. Android e OTA permanecem suspensos.

Referências: [políticas Places](https://developers.google.com/maps/documentation/places/web-service/policies), [termos específicos](https://cloud.google.com/maps-platform/terms/maps-service-terms), [restrições de chaves](https://developers.google.com/maps/api-security-best-practices), [Supabase Cron](https://supabase.com/docs/guides/cron).
