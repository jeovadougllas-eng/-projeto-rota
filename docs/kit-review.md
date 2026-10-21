# Revisão a partir do kit visual aprovado

O kit recebido foi lido a partir de `README.md` e `manifest.json`. Os 17 arquivos fornecidos foram copiados sem alterações para `assets/visual-kit/`; os hashes de integridade ficam em `docs/kit-integrity.json`.

## Aplicação dos recursos

- Lettering TRAXIO: `logo_dark_background.png` no cabeçalho e recorte da marca em `login_hero_reference.png` no login. Ambos são pixels originais, com enquadramento CSS; o lettering não foi refeito como texto HTML.
- Favicon: `app_icon_dark.png` original.
- Benefícios do login, navegação, ações rápidas, indicadores do painel e ícones da central de planilhas: pixels dos recortes originais, com enquadramento e chave de fundo que preserva o alfa original.
- Textos de marketing do login, painel e lateral: HTML acessível e responsivo.
- Paisagens, pin 3D, veículo e tablet: recortes aprovados preservados em camadas. Somente as áreas antes ocupadas por texto rasterizado recebem fundos reconstruídos, identificados em `assets/reconstructed/README.md`.
- Telas funcionais: mantêm formulários, carteira, importação, sincronização, mapas, planejamento e histórico existentes. Os números do mockup não substituem o estado real dos dados.

## Comparação reproduzível

O teste de referência usa os recortes e dimensões do `manifest.json`, com capturas a 2×. O workflow executa a versão anterior (`666c21a59af996b8e94b5a8faf130529d763b6c5`) e a nova contra os mesmos PNGs. Os diretórios `docs/captures/reference-before-kit/` e `docs/captures/reference/` guardam as evidências; `reference-summary.md` informa a variação da diferença média RGB. Esses valores incluem fontes, conta e cartografia e não são porcentagens de fidelidade.

## Elementos que ainda dependem de reconstrução ou novos arquivos

- Fundos completos sem texto, com ilustrações 3D em camadas: não existem no kit. As pequenas áreas abertas pelas máscaras são reconstruídas e não constituem originais recuperados.
- Família tipográfica e pesos exatos da interface: não estão identificados; a interface usa fontes de aproximação. O lettering da marca permanece original.
- Vetores editáveis das marcas e pictogramas: o kit fornece recortes rasterizados. Os fundos e contornos dos recortes ainda precisam de recursos transparentes ou reconstrução para qualidade consistente entre temas. Controles de formulário usam pictogramas funcionais reconstruídos onde não há recurso separado utilizável.
- Estilo do mapa: adaptado em MapLibre, com dados e pontos reais; não é uma reprodução estática do mapa ilustrativo.
- Histórico e variantes móveis: não possuem mockups próprios no kit; usam adaptações dos padrões aprovados.

## Proteção da versão principal e dos dados

A branch de trabalho é `dev/traxio-mockup-fidelity`. Nenhuma alteração foi autorizada para `main`. Os dez scripts originais de autenticação, dados, importação e rotas permanecem preservados. Os testes de navegador injetam dados sintéticos e não escrevem na carteira real; a contagem no Supabase é verificada somente por leitura.

## Testes efetivamente realizados

Execução final: [GitHub Actions 39081400060](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39081400060), código `7f3b143a3b92fbee87a3a2323260c4ec2882f18d`.

- Verificação estática dos dez scripts originais, adaptador, dependências e IDs HTML; comparação byte a byte dos scripts originais também realizada no workspace.
- Integridade SHA-256 dos 17 arquivos do kit e dimensões de todos os recortes conferidas com o manifest.
- Aplicativo executado com servidor Node e Chromium no GitHub Actions: cinco comparações da versão anterior e cinco da nova, usando as mesmas referências PNG e proporções.
- 11 testes iniciais de fluxos aprovados.
- 160 testes da matriz aprovados, sem ignorados: desktop 1440×1000, tablet horizontal 1024×768, tablet vertical 768×1024 e celular 390×844, em claro e escuro.
- 64 retestes visuais aprovados sem atualizar a linha de base, comparando 96 capturas de telas, menus e diálogos.
- MapLibre/OpenFreeMap: canvas e tiles reais renderizados, paleta clara/escura conferida e controles Mapa/Satélite alternados nas oito combinações. As oito capturas estão em `docs/captures/live-maps/`.
- Login por senha e contratos Google/Azure, cadastro/recuperação, busca e filtros, edição, retorno do ajuste de pin, seleção, planejamento semanal/por cidade, conta/tema e backup JSON exercitados.
- Importação e exportação CSV exercitadas nas oito combinações, incluindo aspas e ponto e vírgula em campos, coordenadas e preservação dos 157 registros sintéticos iniciais após importar dois novos.
- Supabase real consultado somente por leitura: 157 clientes, todos ativos. Nenhuma migração ou alteração de registros realizada.

Os testes isolam autenticação e gravações com um SDK simulado injetado somente pelo Playwright. Não foi feito login nas contas pessoais Google/Microsoft, nem validação de percurso rodoviário em campo. As resoluções são simuladas pelo Chromium, sem certificação em aparelhos físicos ou em Safari.

## Resultado da comparação visual

A tabela completa e as imagens ficam em [reference-summary.md](captures/reference-summary.md) e no [comparador interativo](reference-review.html).

A diferença média RGB diminuiu no login (12,99 → 11,50), mapa (33,10 → 31,85) e planilhas (18,78 → 18,41). Aumentou ligeiramente no painel (20,63 → 21,19) e clientes (18,99 → 19,13). Isso permanece explícito: a revisão melhora a aplicação dos recursos originais e a acessibilidade dos textos, mas não comprova identidade visual de 100%.

As diferenças restantes incluem tipografia da interface, contornos/antialias dos ícones rasterizados, fundos sem texto reconstruídos, dados de conta e cartografia dinâmica. A marca TRAXIO continua usando o lettering original.

Prévia de testes: https://traxio-preview.vercel.app/ . A branch `main` permanece em `84b23d405fa141854314267b528544a184e89f23`.

