# Traxelo.IA — kit visual para Codex

## Identidade aprovada
- Nome: **Traxelo.IA** (não Traxio).
- Slogan oficial: **SUA ROTA COM INTELIGÊNCIA.**
- Identidade aprovada: `reference/brand_APROVADA_TRAXELO_IA.png`.
- Preserve símbolo original da estrada, marcador de localização, cores, desenho do X e do O. O lettering foi reconstruído visualmente na arte aprovada, não é uma fonte editável conhecida.

## Referências antigas (somente layout e histórico)
- `reference/interface_mockup_legacy_TRAXIO.png` é o mockup de interface original; **ainda contém o nome e slogan antigos**. Use-o para layout, proporções, componentes e atmosfera, mas **substitua a marca**.
- `reference/brand_original_legacy_TRAXIO.png` registra o logo anterior, para comparação. **Não usar em produção.**
- `assets/mockup_reference/` contém recortes das telas e ilustrações do mockup antigo, apenas como referência de implementação.

## Atenção ao slogan embutido na imagem aprovada
A nova prancha de identidade visual ainda mostra o slogan antigo 'PLANEJE MELHOR. VÁ MAIS LONGE.' nas composições. **Não é o slogan atual.** Ao usar a marca na interface, prefira o recorte do símbolo/wordmark e renderize **SUA ROTA COM INTELIGÊNCIA.** como texto separado. Não distorça nem substitua X/O por fonte genérica.

## Recursos disponíveis
- `assets/branding/` traz oito recortes em PNG da identidade aprovada, **sem transparência** e com possíveis margens, fundo e sombras. São pixels da prancha aprovada; não são SVGs ou elementos editáveis.
- `manifest.json` cataloga todos os recursos.

## Instruções de implementação
1. Trabalhe somente em branch isolada; não altere `main` ou o site publicado sem autorização.
2. Atualize marca e slogan em cabeçalho, login, navegação, favicon e metadados, quando aplicável, preservando layout e funcionalidades.
3. Não cole a prancha inteira como logo: escolha o recorte apropriado ou reconstrua um asset adequado preservando fielmente a imagem.
4. Evite exibir os fundos brancos dos recortes em interfaces escuras; se necessário, crie assets transparentes com revisão visual. Não alegue que são vetoriais.
5. Não altere login, Supabase, 157 clientes, dados, sincronização, geocodificação e rotas por motivos cosméticos.
6. Faça screenshots de login, dashboard, clientes, mapa e planilhas, inclusive em tablet; compare com o mockup antigo, **desconsiderando apenas as substituições de nome/slogan**.
7. Relate limitações e testes efetivamente executados; não declare fidelidade perfeita sem verificação.

## Não incluídos
Não temos projeto editável Figma/Canva/Illustrator/Photoshop, fontes originais TTF/OTF/WOFF2, vetores SVG originais ou ilustrações 3D em camadas.
