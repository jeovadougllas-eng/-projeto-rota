# Revisão a partir do kit visual aprovado

O kit recebido foi lido a partir de `README.md` e `manifest.json`. Os 17 arquivos fornecidos foram copiados sem alterações para `assets/visual-kit/`; os hashes de integridade ficam em `docs/kit-integrity.json`.

## Aplicação dos recursos

- Lettering TRAXIO: recorte original `logo_dark_background.png`, com enquadramento CSS; não foi refeito como texto HTML.
- Favicon: `app_icon_dark.png` original.
- Benefícios do login, indicadores do painel e ícones da central de planilhas: pixels dos recortes originais, com enquadramento e remoção de fundo por filtros de apresentação.
- Textos de marketing do login, painel e lateral: HTML acessível e responsivo.
- Paisagens, pin 3D, veículo e tablet: recortes aprovados preservados em camadas. Somente as áreas antes ocupadas por texto rasterizado recebem fundos reconstruídos, identificados em `assets/reconstructed/README.md`.
- Telas funcionais: mantêm formulários, carteira, importação, sincronização, mapas, planejamento e histórico existentes. Os números do mockup não substituem o estado real dos dados.

## Comparação reproduzível

O teste de referência usa os recortes e dimensões do `manifest.json`, com capturas a 2×. O workflow executa a versão anterior (`666c21a59af996b8e94b5a8faf130529d763b6c5`) e a nova contra os mesmos PNGs. Os diretórios `docs/captures/reference-before-kit/` e `docs/captures/reference/` guardam as evidências; `reference-summary.md` informa a variação da diferença média RGB. Esses valores incluem fontes, conta e cartografia e não são porcentagens de fidelidade.

## Elementos que ainda dependem de reconstrução ou novos arquivos

- Fundos completos sem texto, com ilustrações 3D em camadas: não existem no kit. As pequenas áreas abertas pelas máscaras são reconstruídas e não constituem originais recuperados.
- Família tipográfica e pesos exatos da interface: não estão identificados; a interface usa fontes de aproximação. O lettering da marca permanece original.
- Vetores editáveis das marcas e pictogramas: o kit fornece recortes rasterizados. Os controles de interface usam pictogramas funcionais reconstruídos onde não há recurso separado utilizável.
- Estilo do mapa: adaptado em MapLibre, com dados e pontos reais; não é uma reprodução estática do mapa ilustrativo.
- Histórico e variantes móveis: não possuem mockups próprios no kit; usam adaptações dos padrões aprovados.

## Proteção da versão principal e dos dados

A branch de trabalho é `dev/traxio-mockup-fidelity`. Nenhuma alteração foi autorizada para `main`. Os dez scripts originais de autenticação, dados, importação e rotas permanecem preservados. Os testes de navegador injetam dados sintéticos e não escrevem na carteira real; a contagem no Supabase é verificada somente por leitura.

Os resultados efetivamente executados nesta rodada serão registrados após a conclusão da bateria.
