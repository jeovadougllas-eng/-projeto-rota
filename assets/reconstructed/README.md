# Fundos reconstruídos para textos acessíveis

Os arquivos `dashboard-background.png` e `login-background.png` são reconstruções por edição generativa dos respectivos recortes do kit. Eles não são arquivos-fonte originais recuperados.

A interface sobrepõe o recorte original a esses fundos usando `dashboard-art-mask.svg` e `login-art-mask.svg`. As máscaras abrem somente as regiões que continham textos e benefícios rasterizados. Os elementos gráficos aprovados — lettering, pin 3D, paisagem, estrada, veículo e tablet — continuam vindo dos recortes originais. Os fundos reconstruídos preenchem as áreas abertas pelas máscaras.

Os títulos, descrições e benefícios são texto HTML. A logo TRAXIO continua sendo uma imagem do kit, sem substituição por fonte genérica. No celular, a composição é adaptada porque o kit não traz um mockup móvel próprio.

Os pictogramas de benefícios, indicadores e planilhas são exibidos a partir dos pixels originais dos recortes. Filtros SVG de apresentação removem fundos claros/escuros desses pictogramas sem substituir seus desenhos. Os arquivos originais do kit não são modificados.
