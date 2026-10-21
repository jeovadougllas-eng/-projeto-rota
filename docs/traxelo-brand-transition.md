# Transição de marca — Traxelo.IA

Branch isolada: `dev/traxelo-ia-brand-transition`. Base: `dev/traxio-mockup-fidelity`.

## Decisão de marca
Nome de exibição: **Traxelo.IA**.
Slogan: **SUA ROTA COM INTELIGÊNCIA.**

## Alterações efetivamente realizadas
- Título HTML atualizado.
- Texto do botão de login e lema do cabeçalho atualizados.
- Teste unitário de regressão da nomenclatura adicionado.
- Textos alternativos dos recortes anteriores sinalizam explicitamente que o recurso visual ainda é legado.

## Não concluído
- Substituição do lettering e logotipos rasterizados Traxio por **arquivos efetivos** do kit Traxelo.IA.
- Substituição do ícone de aplicativo, favicon, imagem do login e recursos de launcher Android.
- Revisão visual em navegador e Android; CI desta branch não é coberto automaticamente pelo workflow atual.
- Renomeação técnica de identificadores persistentes, rotas OAuth, ID Android, chaves localStorage ou tabela Supabase. **Não renomear** sem migração planejada: isto pode quebrar sessões e dados.
- Publicação no Vercel, merge em main ou distribuição de novo APK.

## Recursos disponíveis para importação
O proprietário aprovou os pacotes `Traxelo_IA_Kit_Visual_Codex.zip` e `Traxelo_IA_Kit_Vetorial_Editavel_Codex.zip`. Os SVGs são vetorização automática, não fonte vetorial original. Devem ser comparados com a prancha aprovada; a imagem da prancha ainda pode exibir slogan antigo, portanto **não** reproduzir o slogan rasterizado anterior.

Ao importar, guardar originais intactos em `assets/traxelo/approved/` e derivados em `assets/traxelo/derived/`; evitar sobrescrever os 17 recursos imutáveis do kit antigo e seus hashes. Para trocar os recortes do header/login, revisar seletores `.brand-crop` e `.auth-original-logo` em `assets/kit-layout.css`, que atualmente dependem das dimensões e coordenadas do recorte Traxio. Preferir `<img>` independente, com object-fit:contain, após aferir dimensões reais. Não afirmar fidelidade sem capturas.

## Validação
Executar `npm ci && npm run check && npm run test:geolocation && npm test` em ambiente Node/Playwright com navegador disponível. Inspecionar visualmente login e header nos oito tamanhos/temas previstos. Confirmar autenticação real apenas em origem OAuth autorizada.

**Política:** não tocar em `main`, banco real ou publicação sem revisão e autorização.
