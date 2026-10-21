# Traxio — kit de referência visual e implementação

## Fontes de verdade
- `reference/839.png`: identidade visual aprovada.
- `reference/1411.png`: mockup de interface aprovado.

## Arquivos preparados
A pasta `assets/` contém **recortes diretos dos PNGs originais**, sem redesenho nem substituição de fonte. Eles servem como referência de comparação e, quando o recorte permitir, como recurso visual provisório.

## Atenção à fidelidade
- O lettering TRAXIO é personalizado: **não recriar usando texto HTML em fonte genérica**.
- Recortes de logos podem incluir fundo, sombra e margens. Não são PNGs transparentes nem SVGs vetoriais.
- Os banners são partes de uma composição rasterizada; texto dentro da imagem não é acessível ou responsivo. Para a interface final, construir o conteúdo textual em HTML/CSS e criar/reconstruir as artes de fundo separadamente.
- A imagem não informa nomes exatos de fontes, pesos, coordenadas vetoriais nem códigos HEX originais. Medições derivadas são aproximações, não arquivos-fonte recuperados.
- Não modificar login, autenticação, dados ou roteamento apenas para coincidir visualmente com números e textos ilustrativos do mockup.

## Plano de implementação e validação
1. Inventariar HTML/CSS/JS atuais e criar branch isolada.
2. Usar a logo aprovada como imagem, sem recriar tipografia.
3. Reconstruir estrutura responsiva das telas de login, painel, clientes, mapa/rotas e planilhas.
4. Reproduzir gradientes, espaçamentos, hierarquia e contraste dos dois temas.
5. Gerar screenshots na mesma proporção das referências (preferencialmente com Playwright), comparar lado a lado e ajustar iterativamente.
6. Validar autenticação Google/Microsoft, 157 clientes reais, importação e navegação; não publicar sem aprovação.

## Arquivos ausentes
Não existem neste kit: projeto Figma/Canva/AI/PSD, arquivos TTF/OTF/WOFF2 originais, logos SVG originais, ilustrações 3D em camadas. Sua obtenção requer reconstrução ou novos arquivos-fonte; não é possível extraí-los integralmente de uma imagem plana.
