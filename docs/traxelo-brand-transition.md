# Transição de marca — Traxelo.IA

## Estado atual em 23/10/2026

Os dois kits aprovados foram recebidos e seus READMEs/manifests foram lidos. O cabeçalho e o login agora usam o lettering rasterizado aprovado, com o símbolo completo recortado da composição horizontal escura. O slogan oficial **SUA ROTA COM INTELIGÊNCIA.** é texto separado; o slogan antigo da prancha não é exibido. O favicon também usa o recorte aprovado.

Os originais incorporados estão em `assets/traxelo/approved/`, com hashes em `docs/traxelo-approved-assets.json`. Os 17 arquivos do kit anterior foram preservados. Nenhum lettering foi substituído por fonte genérica e nenhum SVG aproximado foi apresentado como vetor original.

A implementação atual está na branch isolada `dev/traxelo-android-routes`; a branch inicial desta transição foi `dev/traxelo-ia-brand-transition`, baseada em `dev/traxio-mockup-fidelity`. Identificadores persistentes, callbacks OAuth, pacote Android `app.traxio.mobile` e armazenamento de clientes não foram renomeados.

As capturas e os testes atuais estão descritos em [portfolio-validation.md](portfolio-validation.md) e [portfolio-review.html](portfolio-review.html). Prévia web: https://traxio-preview.vercel.app/ . O launcher mantém seu identificador técnico; a atualização de lettering não constitui migração de dados ou de contas.

A prancha recebida contém o slogan antigo e alguns recortes apresentam margens ou corte do símbolo. Foram selecionados os pixels completos da composição aprovada e ocultada somente a marca antiga embutida no cenário de login. As imagens e a paleta restantes foram mantidas. A fidelidade é avaliada pelas capturas, sem alegar fontes ou vetores originais que o kit não contém.

`main` permanece preservada. A publicação autorizada é a prévia isolada, sem merge da branch principal.
