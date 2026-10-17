# Traxio

Aplicativo de planejamento de rotas comerciais. HTML, CSS e JavaScript, com autenticação e sincronização Supabase, mapas MapLibre e planilhas SheetJS.

## Desenvolvimento

```sh
npm ci
npm run dev
```

Abra `http://127.0.0.1:4173`. O servidor local não modifica a configuração do projeto Supabase. O login OAuth em localhost exige que essa origem já esteja autorizada no Supabase/provedor.

## Testes

```sh
npx playwright install chromium
npm run check
npm test -- --update-snapshots  # primeira geração, para revisão
npm run test:visual           # comparação após aprovar as capturas
npm run test:report
```

As oito configurações cobrem desktop, tablets nas duas orientações e celular, em claro e escuro. Os testes isolam os serviços externos e usam somente dados sintéticos. O workflow da branch de desenvolvimento disponibiliza relatório e capturas como artefatos.

Veja [o escopo, a preservação dos dados e os limites da revisão visual](docs/visual-review.md). A branch principal só deve receber as alterações após autorização do proprietário.

