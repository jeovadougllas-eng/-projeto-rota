# Prévia manual preservando a produção

As capturas fornecidas pelo proprietário mostram os botões de provedores em Git, sem repositório conectado visível, e Production com Auto-assign Custom Production Domains ativado para traxio-preview.vercel.app, sem campo de branch visível. Não conectar o GitHub ou alterar Production para tentar gerar uma prévia: isso poderia acionar um deployment da main antiga.

Uma alternativa é upload manual direcionado explicitamente a Preview, vinculado ao projeto existente, sem Git e sem --prod. Não foi executado deployment nesta sessão: ferramentas Vercel ausentes e endpoints bloqueados pelo proxy.

## Preparação local verificada

`node scripts/prepare-vercel-preview.mjs` cria diretório novo fora do checkout, sem apagar arquivos, e copia apenas os arquivos de runtime explicitamente permitidos. Mantém app e configurações funcionais; desativa instalação/build automático apenas no arquivo vercel.json do upload preparado. API e suas dependências locais são incluídas. Um manifesto registra commit e hashes. Não copia docs privados, contrato/referências comerciais, segredos, .git, APKs, banco, testes ou configurações de autenticação do operador. Recusa symlinks.

Pacote preparado nesta etapa: /workspace/rotamapa-preview.zip, 23.353.103 bytes, commit de código 19597e547bc1b9aea942a2b6b8b5c6b8bd8a3367. Hashes do manifesto e caminhos locais de assets do HTML conferidos. O ZIP é uma saída local; o script e estas instruções ficam versionados para reproduzi-lo.

## Publicar somente uma Preview com a conta Vercel do proprietário

Requer Node.js 22+ e terminal no computador do operador. Extraia o ZIP, abra o terminal na pasta rotamapa-preview e execute:

```sh
npx vercel@latest login
npx vercel@latest link --project traxio-preview --scope jeovadougllas-9240
npx vercel@latest deploy --target=preview --scope jeovadougllas-9240
```

Confira que o link aponta ao projeto EXISTENTE traxio-preview. Não crie outro projeto, não conecte Git, não use --prod, não faça promote/alias/domains. O login é realizado na Vercel; tokens ou senhas não devem ser enviados ao chat. A URL impressa ao fim do deploy é a Preview que pode ser compartilhada para a revisão.

Esses comandos ainda não foram executados contra a Vercel nesta sessão. Não há URL nova confirmada nem validação do build remoto.

## Limites importantes

O pacote é candidato de desenvolvimento, não entrega integral do Prompt Mestre. Os endpoints Supabase permanecem os existentes, sem alteração no código ou nas configurações de produção. Não utilizar login real nem testar operações de gravação em contas reais nesta prévia até haver configuração de testes e validação autorizadas. OAuth pode exigir configuração de redirect própria para a prévia; APIs existentes também têm restrições de origem que precisam ser avaliadas. Não ampliar permissões/redirects automaticamente.

Não inclui instaladores nem bundles de atualização Android. PWA usa os arquivos comuns, mas instalação/atualização e isolamento devem ser validados antes de distribuição. Publicar uma Preview não substitui testes nem autoriza promover produção.
