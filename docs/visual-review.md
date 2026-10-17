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

Depois da geração inicial, o workflow compara as telas com as capturas versionadas. A regeneração exige execução manual com `refresh_snapshots=true` ou um commit explicitamente marcado com `[refresh snapshots]`, para que mudanças visuais não sejam aceitas silenciosamente. As capturas dos mapas reais ficam também em `docs/captures/`.

## Limites conhecidos da fidelidade

- A referência é um JPEG composto de várias telas; não há arquivos originais das artes ou identificação da fonte. Foi incorporada a fonte variável Roboto Condensed, sob licença OFL, para aproximar a tipografia da referência; sua identidade exata não foi confirmada.
- Marca, detalhe do banner e ilustração lateral usam recortes CSS do JPEG fornecido; sua resolução é limitada pela referência.
- A área ilustrada do login em desktop e tablet reaproveita o próprio JPEG aprovado com recorte CSS. No celular, a paisagem foi reconstruída a partir da referência.
- As 48 capturas de regressão isolam os serviços externos e mostram o estado indisponível do mapa. Um teste adicional em cada tema desktop verifica o carregamento real do MapLibre/OpenFreeMap e anexa a captura ao relatório.
- Histórico não aparece no mockup; sua composição estende os mesmos padrões visuais.

Esses pontos devem permanecer explícitos até a revisão das capturas e a entrega dos arquivos originais. Não se deve declarar fidelidade exata antes dessa revisão.

## Iterações realizadas

1. Primeira execução: falha no nome acessível das ações rápidas, que incluía a seta decorativa. Corrigida com rótulos explícitos.
2. Execução seguinte: os 9 testes principais e a matriz completa de 120 testes passaram; 48 capturas foram geradas e salvas na branch de desenvolvimento.
3. Comparação visual: corrigidos o recorte horizontal da marca no cabeçalho, a distribuição das ações rápidas e da carteira no painel, o espaço adicional acima da tabela, a decoração lateral nas telas escuras e a transição entre a arte aprovada e o fundo do login. Incorporada a fonte local Roboto Condensed.
4. Nova bateria aprovada: 122 testes passaram, incluindo MapLibre e tiles OpenFreeMap reais nos dois temas desktop; as 6 combinações de tablet/celular não repetem esse teste externo, mas mantêm os testes funcionais e as capturas. Nova inspeção ajustou a suavidade da máscara do banner.
5. Revisado o fluxo de ajuste de localização: o retorno do mapa reabre o formulário com o rascunho preservado; o comando de localizar na lista do mapa abre o editor; uma tentativa de ajuste sem coordenadas mantém a mensagem de validação visível. Adicionado teste em todas as resoluções e temas.

As capturas geradas são evidência da implementação e não equivalem à aprovação visual do proprietário.
