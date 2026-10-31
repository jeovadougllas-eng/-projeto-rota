# Traxelo.IA — Kit vetorial de trabalho para Codex

## O que este pacote realmente contém

- `svg_editaveis/`: arquivos SVG com caminhos (`<path>`) editáveis, reconstruídos por **vetorização automática aproximada** da identidade aprovada. Não são arquivos vetoriais originais. As curvas, sombras, detalhes finos e gradientes foram simplificados em áreas de cor.
- `png_transparente/`: recortes PNG com fundo branco removido por estimativa de transparência. Podem existir halos ou resíduos; ícones de app preservam seus próprios fundos.
- `referencias/`: identidade aprovada integral e mockup legado (layout apenas).

## Regras de implementação

1. A marca é **Traxelo.IA**; slogan oficial **SUA ROTA COM INTELIGÊNCIA.** A prancha de referência ainda exibe o slogan antigo, que NÃO deve ser reutilizado.
2. Não alterar o símbolo estrada/pin nem a composição do X e do O sem validação visual.
3. Priorizar PNG recortado para uso em produção quando a vetorização apresentar distorções. Os SVG são uma base editável para refinamento em Inkscape, Illustrator ou Figma, e NÃO equivalem a uma reconstrução manual fiel.
4. Não trocar as letras estilizadas por uma fonte genérica. A fonte exata não é conhecida.
5. O mockup legado serve somente de referência de telas e composição. Não alterar banco, autenticação, dados, sincronização, rotas ou publicação em `main` sem autorização.
6. Compare lado a lado os SVG, os PNG e a referência antes de incorporar; teste contraste e responsividade.
7. SVGs são compostos de muitos paths e cores sólidas; são editáveis mas não semanticamente organizados em letras/objetos, e não mantêm gradientes vetoriais nativos.

## Status de fidelidade

- Fonte exata: desconhecida.
- Vetores originais: indisponíveis.
- SVGs: reconstruções aproximadas editáveis.
- PNGs: derivados da referência, com transparência estimada.
- Referência aprovada: preservada integralmente.
