# Traxio — revisão visual

Referências aprovadas, preservadas sem alterações: `assets/approved-mockup.jpg` (interface) e `assets/approved-identity.jpg` (marca).

A comparação interativa está em `docs/reference-review.html`. Execute `npm run dev` e abra `http://127.0.0.1:4173/docs/reference-review.html`.

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

A matriz inclui desktop 1440×1000, tablet horizontal 1024×768, tablet vertical 768×1024 e celular 390×844, em ambos os temas. Cada projeto captura login, painel, clientes, mapa, histórico e planilhas, além do menu de conta, configurações, ficha, editor de cliente, cadastro de conta e recuperação de senha: 96 capturas na matriz.

A primeira execução gera uma linha de base da implementação para revisão humana. Essa linha de base **não comprova equivalência com o mockup**. Depois da aprovação, as capturas devem ser incorporadas ao controle de versão e comparadas com `npm run test:visual`, sem `--update-snapshots`.

O workflow `Traxio interface review` publica capturas, traces de falha e relatório HTML como artefatos da branch. O navegador local deste ambiente não iniciou devido a restrições de IPC da sandbox; a execução foi encaminhada ao GitHub Actions.

Depois da geração inicial, o workflow compara as telas com as capturas versionadas. A regeneração exige execução manual com `refresh_snapshots=true` ou um commit explicitamente marcado com `[refresh snapshots]`, para que mudanças visuais não sejam aceitas silenciosamente. As capturas dos mapas reais ficam também em `docs/captures/`.

## Limites conhecidos da fidelidade

- As referências são JPEGs; não há arquivos vetoriais, fontes editáveis ou identificação da família tipográfica. Foi incorporada a fonte variável Roboto Condensed, sob licença OFL, para aproximar a tipografia da referência; sua identidade exata não foi confirmada.
- A marca do cabeçalho e do login móvel usa o arquivo aprovado de identidade. O banner completo e as ilustrações usam recortes CSS do mockup original, preservando as artes e suas proporções. A resolução é limitada pelos JPEGs fornecidos.
- A área ilustrada do login em desktop e tablet reaproveita o próprio JPEG aprovado com recorte CSS. No celular, a mesma arte aprovada é usada com recorte responsivo; a imagem anteriormente reconstruída foi removida.
- As 48 capturas das telas principais fazem parte da matriz de 96 imagens e isolam os serviços externos; o mapa apresenta o estado indisponível nesse conjunto. Um teste adicional em cada tema desktop verifica o carregamento real do MapLibre/OpenFreeMap e anexa a captura ao relatório.
- Histórico não aparece no mockup; sua composição estende os mesmos padrões visuais.

Esses pontos devem permanecer explícitos até a revisão das capturas e a entrega dos arquivos originais. Não se deve declarar fidelidade exata antes dessa revisão.

## Iterações realizadas

1. Primeira execução: falha no nome acessível das ações rápidas, que incluía a seta decorativa. Corrigida com rótulos explícitos.
2. Execução seguinte: os 9 testes principais e a matriz completa de 120 testes passaram; 48 capturas foram geradas e salvas na branch de desenvolvimento.
3. Comparação visual: corrigidos o recorte horizontal da marca no cabeçalho, a distribuição das ações rápidas e da carteira no painel, o espaço adicional acima da tabela, a decoração lateral nas telas escuras e a transição entre a arte aprovada e o fundo do login. Incorporada a fonte local Roboto Condensed.
4. Nova bateria aprovada: 122 testes passaram, incluindo MapLibre e tiles OpenFreeMap reais nos dois temas desktop; as 6 combinações de tablet/celular não repetem esse teste externo, mas mantêm os testes funcionais e as capturas. Nova inspeção ajustou a suavidade da máscara do banner.
5. Revisado o fluxo de ajuste de localização: o retorno do mapa reabre o formulário com o rascunho preservado; o comando de localizar na lista do mapa abre o editor; uma tentativa de ajuste sem coordenadas mantém a mensagem de validação visível. Adicionado teste em todas as resoluções e temas.

As capturas geradas são evidência da implementação e não equivalem à aprovação visual do proprietário.


## Comparação direta com o arquivo aprovado

Além das capturas de regressão, `tests/reference.spec.js` compara a implementação com cinco áreas imutáveis do mockup: login (563×526), painel (717×526), clientes (469×325), mapa (423×325) e planilhas (381×325). As duas imagens são apresentadas com escala de 2×, lado a lado, em `docs/captures/reference/`. O JSON de cada tela informa a diferença média RGB e a proporção de pixels com diferenças acima de 24 níveis; nenhuma dessas medidas é convertida em uma alegação de fidelidade de 100%.

As verificações geométricas confirmam as dimensões do cabeçalho e da barra lateral; o login também verifica posição e largura do formulário segundo as coordenadas aprovadas. O mapa nessa comparação carrega cartografia real. As diferenças de dados da conta, localização dos clientes e cartografia permanecem explícitas.

A segunda revisão incorporou a marca do arquivo de identidade, alinhou o formulário de login às coordenadas aprovadas, corrigiu o banner duplicado, as alturas de navegação, o tamanho da tabela e a disposição dos dois cartões de planilhas. Os botões Mapa/Satélite alternam a camada real e preservam fontes, rotas e marcadores. Os rótulos do mapa escuro tiveram seus contornos corrigidos.

O JPEG de identidade contém logotipos e lettering rasterizado, mas não identifica uma família tipográfica nem fornece fontes editáveis. A composição usa o lettering original nas marcas, Arial na interface e Roboto Condensed no formulário; a equivalência exata da fonte da interface não pode ser certificada a partir desse material. O histórico e as variantes móveis não aparecem na referência e estendem seus padrões.


## Resultado final da execução

Execução validada: [GitHub Actions 39078485014](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39078485014), código `be42fdcaea16d8f0b7f5047c64c6596107481564`.

- Verificação estática: dez scripts originais preservados e integrações mantidas.
- Comparação direta com as cinco áreas do mockup: 5 verificações geométricas aprovadas, com capturas e métricas salvas. Isso não representa igualdade de pixels.
- Verificação inicial dos fluxos principais: 10 testes aprovados.
- Matriz de navegador: 146 testes aprovados e 6 ignorados intencionalmente; somente a verificação externa de cartografia não é repetida nas seis combinações de tablet/celular.
- Reteste das telas e diálogos, sem atualizar referências: 64 testes aprovados, comparando as 96 capturas geradas.
- Consulta somente de leitura ao Supabase: 157 clientes, todos ativos. Nenhuma migração ou alteração de registros realizada.
- Branch principal preservada em `84b23d405fa141854314267b528544a184e89f23`.

As diferenças restantes de tipografia, ícones, dados de conta e cartografia estão visíveis nas comparações. O resultado não é declarado 100% idêntico ao JPEG aprovado.
