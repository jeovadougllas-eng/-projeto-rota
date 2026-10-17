# Traxio — revisão visual

Referência aprovada: `assets/approved-mockup.jpg`, fornecida pelo proprietário do aplicativo.

## Escopo da implementação

- Login em duas colunas: marca, benefícios, paisagem, campos com ícones, visibilidade de senha e botões Google/Microsoft.
- Cabeçalho fixo, busca, alternância de tema e menu de conta; navegação lateral com composição da referência.
- Painel: banner, três indicadores reais, carteira em duas colunas e ações rápidas.
- Clientes: tabela, busca e filtros de cidade/bairro/categoria, seleção de clientes, cadastro e edição em diálogo nativo.
- Mapas: composição lateral de seleção e mapa, ferramentas originais de localização e otimização. A indisponibilidade do serviço permanece explícita.
- Histórico e planilhas seguem a identidade aprovada e preservam os controles existentes.

## Preservação dos dados e integrações

Os dez scripts originais embutidos em `index.html` foram mantidos byte a byte. A apresentação foi extraída para `assets/traxio.css` e `assets/traxio-ui.js`.

As chaves de armazenamento, projeto Supabase, tabela `clients`, biblioteca Supabase 2.57.0, fluxo PKCE, provedores `google`/`azure`, MapLibre 5.6.0 e SheetJS 0.20.3 permanecem os mesmos. Nenhuma migração foi executada. Uma consulta somente de leitura confirmou 157 registros, todos ativos, em 17/10/2026.

Os testes usam 157 registros sintéticos, injetados exclusivamente pelo Playwright. Eles não se conectam às contas reais nem escrevem no Supabase. A autenticação real nos provedores exige verificação manual em uma origem autorizada; os testes automáticos verificam os contratos de chamada e os fluxos da interface.

## Capturas e comparação

A matriz inclui desktop 1440×1000, tablet horizontal 1024×768, tablet vertical 768×1024 e celular 390×844, em ambos os temas. Cada projeto captura login, painel, clientes, mapa, histórico e planilhas.

A primeira execução gera uma linha de base da implementação para revisão humana. Essa linha de base **não comprova equivalência com o mockup**. Depois da aprovação, as capturas devem ser incorporadas ao controle de versão e comparadas com `npm run test:visual`, sem `--update-snapshots`.

O workflow `Traxio interface review` publica capturas, traces de falha e relatório HTML como artefatos da branch. O navegador local deste ambiente não iniciou devido a restrições de IPC da sandbox; a execução foi encaminhada ao GitHub Actions.

## Limites conhecidos da fidelidade

- A referência é um JPEG composto de várias telas; não há arquivos originais das artes ou identificação da fonte. A fonte atual usa Arial/Helvetica.
- Marca, detalhe do banner e ilustração lateral usam recortes CSS do JPEG fornecido; sua resolução é limitada pela referência.
- A paisagem do login foi reconstruída a partir da referência. Ela não é o arquivo original da ilustração aprovada.
- Os screenshots automatizados isolam serviços externos e mostram o estado indisponível do mapa; é necessária uma conferência adicional com os tiles reais carregados.
- Histórico não aparece no mockup; sua composição estende os mesmos padrões visuais.

Esses pontos devem permanecer explícitos até a revisão das capturas e a entrega dos arquivos originais. Não se deve declarar fidelidade exata antes dessa revisão.
