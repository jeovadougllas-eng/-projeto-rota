> **Continuidade vigente:** o proprietário confirmou a retomada nesta conversa e pediu desconsiderar as instruções de transferência entre contas. As referências históricas abaixo não autorizam recriar o projeto, migrar serviços ou publicar produção. Referências comerciais privadas foram omitidas desta cópia pública; o original completo está no anexo privado.

# PROMPT MESTRE OFICIAL — ROTAMAPA

**Versão:** 11/11/2026  
**Projeto:** RotaMapa  
**Plataformas:** Web, PWA e APK Android  
**Idioma:** Português do Brasil  
**Objetivo:** Implementação integral das atualizações aprovadas, preservando o aplicativo existente.

---

# 0. INSTRUÇÃO PRINCIPAL

Você é o responsável técnico pela continuidade do desenvolvimento do **RotaMapa**, um aplicativo de roteirização, gestão de carteiras e produtividade comercial para representantes comerciais.

Este aplicativo já existe, está em produção e é utilizado diariamente com dados reais.

**Sua missão não é criar outro aplicativo. É atualizar o aplicativo existente, preservando todas as funcionalidades, interfaces e dados.**

O proprietário aprovou um conjunto de atualizações que devem ser implementadas, integradas e testadas, culminando na entrega das versões:

**WEB + PWA + APK ANDROID.**

Trabalhe com autonomia técnica, evitando interrupções por decisões triviais. Entretanto, não execute operações destrutivas, alterações sensíveis em produção ou publicações definitivas sem autorização expressa.

## Regras inegociáveis

1. Não recriar o RotaMapa do zero.
2. Não substituir interfaces aprovadas por layouts genéricos.
3. Não modificar a identidade visual oficial.
4. Não alterar o provedor de autenticação.
5. Não apagar, substituir, duplicar ou corromper dados existentes.
6. Não alterar identificadores de usuários ou carteiras.
7. Não modificar chaves de armazenamento local sem plano de migração e aprovação.
8. Não publicar em produção sem autorização.
9. Não considerar uma funcionalidade concluída apenas porque o código compila.
10. Não utilizar a branch `main` antiga como base.
11. Não utilizar dados reais para testes destrutivos.
12. Preservar integralmente as funcionalidades que já estão funcionando.

Quando houver divergência entre a especificação e a implementação existente, investigar e preservar o comportamento atual até que a mudança seja compreendida e validada.

---

# 1. INFRAESTRUTURA E CONTINUIDADE ENTRE DUAS CONTAS CODEX

## GitHub

Repositório:

`jeovadougllas-eng/-projeto-rota`

Atenção: o nome do repositório começa com hífen.

## Branch de produção identificada

`dev/traxelo-android-routes`

Commit-base confirmado nos registros de implantação:

`aebf58353428de586c59cc321032f3e63ce50cee`

Deployment de produção:

`dpl_374iR7zDa8QqEDkYehYFWA5yBPee`

## Branch oficial para novas atualizações

`dev/rotamapa-atualizacao-integral`

Essa branch foi criada localmente pelo Codex a partir do commit-base correto.

Antes de começar:

- Confirmar que foi enviada ao GitHub.
- Confirmar que aponta para o commit-base correto.
- Não substituir sua base pela `main`.
- Não executar merge automático da branch experimental.
- Trabalhar nela ou em branches auxiliares derivadas dela.
- Preservar a branch de produção.

## Branch experimental anterior

`dev/rotamapa-insider-promocoes-importacao`

Último commit conhecido:

`4d8c018eed5956a4eef6e87536602a893275746c`

Essa branch contém três commits experimentais relacionados a comissões e autenticação.

Auditar e aproveitar somente o que estiver correto, com testes.

Não realizar merge integral sem revisão.

## Supabase

Projeto: Traxio BR  
ID: `ggsptbcgpdakxsdjrldd`  
Região: `sa-east-1`

O nome histórico do projeto no Supabase não autoriza alterar a identidade visual do RotaMapa.

Preservar banco, autenticação, usuários, políticas RLS, sincronização e dados.

## Vercel

Projeto: `traxio-preview`

Project ID:

`prj_Bes4oJLB9Nsv4tosvzI29F5sfytu`

Team ID:

`team_nkA7YdysnXiPjmhoqbOoTBzc`

O projeto mantém nomes técnicos históricos. Não renomeá-los sem análise de impacto.

Não publicar em produção antes da aprovação.

---

# 2. DOCUMENTAÇÃO PERMANENTE PARA ALTERNÂNCIA ENTRE CONTAS

O proprietário utiliza duas contas Plus do ChatGPT/Codex para dar continuidade aos projetos.

As conversas e memórias dessas contas não são compartilhadas automaticamente.

Portanto, o repositório GitHub deve ser a fonte de verdade.

Criar ou atualizar:

**`AGENTS.md`**

Instruções permanentes do Codex:

- Segurança.
- Preservação dos dados.
- Identidade visual.
- Branch correta.
- Testes.
- Proibições.
- Critérios de publicação.

**`docs/ROTAMAPA-ESCOPO.md`**

Registrar integralmente o escopo aprovado neste documento.

**`docs/ROTAMAPA-PROGRESSO.md`**

Registrar:

- Funcionalidades concluídas.
- Funcionalidades pendentes.
- Commits.
- Arquivos alterados.
- Testes.
- Riscos.
- Bloqueios.
- Próximos passos.

Ao encerrar cada sessão, atualizar o progresso, realizar os testes pertinentes e registrar as alterações no GitHub.

Não deixar alterações importantes exclusivamente em um ambiente temporário.

---

# 3. AUTENTICAÇÃO, IDENTIDADE E PRESERVAÇÃO DOS DADOS

## Identidade

Nome oficial:

**RotaMapa**

Não exibir Traxio, Traxelo ou Traxelo.IA nas interfaces.

Preservar:

- Logo.
- Paleta.
- Tipografia.
- Layout.
- Componentes.
- Navegação.
- Responsividade.

Não redesenhar telas já aprovadas.

## Incidente de autenticação Google

O proprietário utilizava normalmente a PWA.

Ao abrir uma URL experimental da Vercel, ocorreu o erro:

`both auth code and code verifier should be non-empty`

Também apareceu uma tela de autenticação com a identidade antiga Traxio.

Posteriormente, o proprietário confirmou que continuava conseguindo acessar normalmente a PWA habitual.

Portanto, não existe evidência de perda de dados.

## Requisitos

Auditar:

- OAuth Google.
- PKCE.
- Redirect URLs.
- Sessões.
- Persistência.
- Cookies e armazenamento.
- Comportamento em domínios diferentes.
- Inicializações concorrentes.
- Fluxo Web/PWA/Android.

A implementação anterior utiliza elementos como:

- `flowType: 'pkce'`
- `detectSessionInUrl: false`
- `storageKey: 'traxio-auth-v3'`
- `exchangeCodeForSession(code)`

Não renomear chaves internas apenas por estética.

Não apagar sessões, usuários ou dados.

Não alterar a configuração de produção para resolver um problema exclusivo da prévia sem investigar a causa.

Executar testes de autenticação com segurança, preferencialmente em ambiente isolado.

---

# 4. PLANOS, SIGNATURE E INSIDER

## Signature — Edição Fundadores

Preservar o acesso do proprietário e da cofundadora Maura.

Benefícios:

Acesso Elite gratuito permanente.

Não retirar privilégios existentes.

## RM Insider — Edição Pioneiros

Criar categoria para exatamente cinco usuários convidados.

Benefícios:

Acesso Elite gratuito permanente.

Os e-mails serão fornecidos posteriormente.

Não ativar usuários sem essa informação.

### Identidade visual

Paleta:

- `#082E3A`
- `#13B8A6`
- `#55E0D1`

Mensagem:

“Quem vive a experiência ajuda a construir o futuro do RotaMapa.”

Agradecimento:

“Seu olhar, suas ideias e suas experiências ajudam a aperfeiçoar cada rota. Obrigado por fazer parte dos pioneiros do RotaMapa.”

Manter identidade visual harmonizada com o aplicativo.

## Planos comerciais

### Essencial

- 3 rotas.
- 1 carteira.
- Recursos básicos.

### Executivo

- 20 rotas.
- 3 carteiras.
- Automação de promoções.
- 3 PDFs por carteira.

### Elite

- Rotas ilimitadas sob política de uso justo.
- Carteiras ilimitadas sob política de uso justo.
- Funcionalidades avançadas.

Signature e Insider recebem os recursos Elite gratuitamente.

Auditar a semântica atual dos limites antes de aplicá-los.

As permissões precisam ser validadas no servidor, não apenas na interface.

---

# 5. GERENCIAMENTO E EXCLUSÃO DE CARTEIRAS

Adicionar opções seguras de exclusão de carteiras.

## Fazer backup e excluir

- Arquivar carteira.
- Preservar dados recuperáveis.
- Permitir restauração.
- Exibir claramente o que será preservado.

## Excluir sem backup

- Exclusão definitiva mediante confirmação forte.
- Mostrar impacto.
- Proteger outras carteiras.
- Proteger registros de outros usuários.
- Tratar carteira ativa.
- Evitar exclusão acidental.
- Respeitar sincronização offline.

Implementar mecanismos para impedir que registros excluídos reapareçam por sincronização de dispositivos antigos.

Não realizar testes destrutivos com dados reais.

---

# 6. CENTRAL DE PROMOÇÕES

Implementar um módulo integrado denominado:

**Central de Promoções**

Com três áreas principais:

## 6.1. Campanhas

Permitir importação de:

- PDF.
- Imagens.
- XLSX.
- CSV.

O sistema deverá identificar automaticamente:

- Empresa.
- Produtos.
- Códigos.
- Apresentações.
- Preços.
- Descontos.
- Faixas de quantidade.
- Vigência.
- Restrições comerciais.

A extração deverá ser automatizada, com revisão somente de informações ambíguas.

### EMS Marcas

Contemplar:

- Acelera Sell Out.
- Dia D de Ofertas.
- Campanhas futuras.

Não limitar a arquitetura à EMS.

### Motor de preços

Oferecer seleção entre:

- Preço de tabela.
- Acelera Sell Out.
- Dia D.

Não acumular descontos de campanhas distintas automaticamente.

Quando não houver condição vigente, mostrar:

“Este produto não possui condição vigente na campanha selecionada. Será utilizado o preço de tabela.”

Registrar snapshot da condição comercial utilizada na venda.

Respeitar data, horário, região, quantidade, estoque e regras específicas.

O modo offline deverá utilizar dados previamente sincronizados e informar quando estiverem desatualizados.

### Materiais comerciais

Permitir geração de cards e legendas para WhatsApp.

Utilizar fotografias originais verificadas dos produtos.

Nunca inventar embalagens, preços, fabricantes ou composições.

## 6.2. Catálogo digital

Implementar visualizador PDF com:

- Tela cheia.
- Zoom.
- Navegação.
- Swipe.
- Miniaturas.
- Busca textual quando disponível.
- Download do original.

A importação de catálogo não deverá cadastrar automaticamente produtos.

## 6.3. Caixas padrão

Permitir importar tabelas de unidades por caixa.

Formatos:

- XLSX.
- CSV.
- PDF.

Consulta rápida por produto.

Inicialmente, somente leitura.

Não impor múltiplos de pedido automaticamente.

---

# 7. IMPORTAÇÃO OTIMIZADA DE CLIENTES

Uma importação anterior de 53 clientes levou aproximadamente 40 minutos.

O objetivo é tornar o processo muito mais rápido, sem comprometer a qualidade dos dados.

Arquivo de referência:

`UNIFARMA - DOUGLAS.xlsx`

Versão correta:

- 53 clientes.
- 19 colunas.

Se o arquivo não estiver disponível, solicitar reenvio.

Não utilizar uma planilha anterior incorreta com 279 clientes.

## Requisitos

- Parsing determinístico XLSX/CSV.
- Validação.
- Normalização.
- Deduplicação.
- Importação idempotente.
- Pré-visualização.
- Indicador de progresso.
- Tratamento de erros.
- Cancelamento seguro.
- Cache.
- Processamento em lotes.

Preservar CNPJ com 14 dígitos e zeros à esquerda.

Enriquecimento por BrasilAPI quando apropriado.

Respeitar limites, custos e disponibilidade.

## Geolocalização

Preservar pins confirmados manualmente.

Não sobrescrever coordenadas confirmadas.

Utilizar CEP, cidade, endereço e dados disponíveis para localizar novos clientes.

Avaliar confiança da geocodificação.

Solicitar revisão somente dos casos incertos.

## Nome fantasia

Exibir abaixo do nome principal:

“Nome fantasia: ...”

Não alterar o tamanho da fonte principal.

Preservar layout aprovado.

Garantir isolamento entre carteiras.

---

# 8. PROJEÇÃO DE COMISSÕES

Implementar mecanismo universal para representantes comerciais.

O usuário deverá importar documentos e o sistema identificará automaticamente produtos e percentuais.

## Formatos

- Contratos PDF.
- Aditivos.
- Tabelas de comissão.
- PDF escaneado.
- XLSX.
- CSV.

## Extração

Identificar:

- Empresa.
- Código do produto.
- Nome.
- Apresentação.
- Percentual.
- Vigência.
- Exceções.

## Correspondência

Priorizar:

1. Código exato.
2. Nome.
3. Dosagem.
4. Quantidade.
5. Apresentação.

Aplicar automaticamente somente correspondências inequívocas.

Solicitar confirmação apenas das exceções.

Não confundir apresentações do mesmo produto.

## Automação

O representante não deve precisar cadastrar manualmente percentuais produto por produto.

Utilizar parsing determinístico quando possível.

Utilizar OCR ou IA para documentos complexos quando necessário.

Exibir relatório de importação.

Guardar histórico e vigência das regras.

## Cálculo

**Somente vendas faturadas entram na projeção.**

Base:

Valor faturado das mercadorias, excluindo devoluções conhecidas.

Não utilizar:

- Pedidos não faturados.
- Preço sugerido ao consumidor.
- Margem de lucro.

Não implementar controle de pagamento de comissões.

A funcionalidade é exclusivamente uma projeção.

Considerar cancelamentos, estornos e ajustes conhecidos.

Preservar taxas históricas.

Campanhas especiais de comissão não são descontos comerciais.

---

# 8.1. MODELO EMS — REFERÊNCIA PRIVADA

A referência comercial fornecida pelo proprietário será conferida com o contrato e o aditivo originais antes de configurar taxas definitivas. O arquivo original permanece no anexo privado da conversa. Códigos, percentuais e alterações contratuais específicos não são transcritos neste repositório público nem nos pacotes Web/PWA/APK.

Não publicar contratos individuais. Não disponibilizar o modelo EMS a terceiros sem validação e autorização. Nenhuma taxa é presumida pela implementação.

---

# 8.2. REGRAS CONTRATUAIS EMS

Conferir diretamente no contrato original e no aditivo.

Referências:

- Cláusula 11.1.2: valor faturado das mercadorias, excluindo devoluções.
- Cláusula 11.8: condições contratuais para aquisição do direito à comissão.
- Cláusula 11.2: pagamento após efetivo pagamento do cliente.
- Cláusula 11.2.1: possibilidade de antecipação.
- Cláusula 11.9: cancelamentos, recusas, devoluções e outras hipóteses.
- Cláusula 8: inadimplência e ajustes.
- Cláusula 11.3.1: campanhas especiais de comissão.
- Cláusula 11.10: condições especiais.
- Cláusula 16: confidencialidade.

A projeção não representa comprovação de comissão efetivamente devida.

Não armazenar dados pessoais ou bancários desnecessários dos contratos.

---

# 9. AUDITORIA DO MÓDULO DE COMISSÕES EXISTENTE

Existe uma implementação experimental:

`assets/rotamapa-commissions-model.js`

Ela não está integrada completamente.

Auditar:

- Arredondamento.
- Datas.
- Vigências.
- Faturamento.
- Devoluções.
- Cancelamentos.
- Produtos sem taxas.
- Duplicidades.
- Correspondências.
- Snapshots históricos.
- Isolamento entre usuários.

Criar testes automatizados antes de utilizar dados reais.

Não incorporar a branch experimental integralmente sem revisão.

---

# 10. PEDIDO REMOTO — WHATSAPP E OUTROS CANAIS

**Funcionalidade adicional aprovada.**

Na tela existente de registro de visita/atendimento, adicionar ao campo **Resultado**:

**Pedido remoto**

Preservar todas as opções existentes.

Não redesenhar a tela.

## Comportamento

Quando o usuário selecionar Pedido remoto:

- Registrar atendimento não presencial.
- Definir WhatsApp como canal padrão.
- Permitir selecionar Telefone, E-mail ou Outro.
- Manter observações opcionais.
- Registrar data, cliente e histórico.
- Não exigir valor de pedido.
- Não obrigar preenchimento de informações desnecessárias.

## Indicadores

Pedido remoto não deve ser contabilizado automaticamente como:

- Visita presencial.
- Rota executada.
- Quilometragem percorrida.
- Deslocamento realizado.

## Confirmação

Não utilizar a frase:

“Confirmo que esta visita realmente aconteceu.”

Substituir contextualmente por:

“Confirmo que recebi/realizei este pedido remotamente.”

## Comissões

Pedido remoto não significa venda faturada.

Não gerar projeção de comissão até existir faturamento confirmado.

## Persistência

Preservar histórico, cliente, data, canal e observações.

Não alterar registros anteriores.

Garantir funcionamento offline e sincronização.

Testar registros remotos e presenciais para o mesmo cliente.

---

# 11. PLANO DE EXECUÇÃO

## Fase 0 — Preparação

- Confirmar branch.
- Confirmar commit-base.
- Registrar documentação permanente.
- Auditar código e testes.
- Identificar dependências.
- Planejar mudanças aditivas.
- Preservar produção.

## Fase 1 — Implementação

Implementar incrementalmente:

1. Correções seguras de autenticação e identidade.
2. Planos, Signature e Insider.
3. Gerenciamento e exclusão de carteiras.
4. Importação otimizada de clientes.
5. Central de Promoções.
6. Catálogo digital.
7. Caixas padrão.
8. Importação inteligente de contratos.
9. Projeção de comissões.
10. Pedido remoto.

Não substituir funcionalidades existentes.

## Fase 2 — Testes

Executar:

- Testes unitários.
- Testes de integração.
- Testes de regressão.
- Testes de segurança.
- Testes de RLS.
- Testes multiusuário.
- Testes offline.
- Testes de sincronização.
- Testes de autenticação.
- Testes de importação.
- Testes de campanhas.
- Testes de comissões.
- Testes de pedido remoto.
- Testes de responsividade.
- Testes de atualização de PWA.
- Testes Android.

## Fase 3 — Entrega

### Web

Entregar versão funcional em ambiente de prévia validado.

### PWA

Entregar versão instalável e atualizável, preservando armazenamento e dados.

### Android

Entregar APK funcional correspondente à mesma versão.

Preservar assinatura e estratégia de atualização existentes.

Solicitar credenciais somente se indispensáveis.

### Documentação

Entregar:

- Commits.
- Changelog.
- Relatório de testes.
- Pendências.
- Instruções de atualização.
- Procedimento de rollback.

**Não publicar em produção sem autorização expressa.**

---

# 12. CRITÉRIOS DE ACEITAÇÃO

A entrega somente será considerada concluída quando:

- [ ] A identidade RotaMapa estiver correta.
- [ ] Login Google e por senha estiverem funcionando.
- [ ] A PWA existente permanecer íntegra.
- [ ] Nenhum dado existente for perdido.
- [ ] As carteiras continuarem isoladas.
- [ ] Signature e Insider estiverem implementados.
- [ ] Os cinco Insiders não forem ativados antes do envio dos e-mails.
- [ ] Os planos respeitarem os limites aprovados.
- [ ] Exclusão de carteiras possuir backup e confirmação.
- [ ] Importação de clientes estiver otimizada.
- [ ] Pins confirmados forem preservados.
- [ ] Central de Promoções estiver funcional.
- [ ] Campanhas respeitarem condições e vigências.
- [ ] Catálogo digital estiver funcional.
- [ ] Caixas padrão estiverem disponíveis.
- [ ] Documentos de comissão forem interpretados automaticamente.
- [ ] Produtos forem vinculados corretamente.
- [ ] Exceções forem revisadas quando necessário.
- [ ] Somente vendas faturadas entrarem na projeção.
- [ ] Taxas históricas forem preservadas.
- [ ] Pedido remoto estiver disponível.
- [ ] WhatsApp for o canal padrão.
- [ ] Pedido remoto não contar como visita presencial.
- [ ] Pedido remoto não gerar comissão sem faturamento.
- [ ] Web, PWA e APK estiverem integrados e testados.
- [ ] A produção permanecer preservada até autorização.

---

# 13. COMUNICAÇÃO E CONTINUIDADE

O proprietário utilizará duas contas Plus para trabalhar alternadamente no mesmo projeto.

Por isso, documentar tudo no GitHub.

Ao concluir cada etapa:

1. Executar testes.
2. Registrar commits.
3. Atualizar `docs/ROTAMAPA-PROGRESSO.md`.
4. Identificar pendências.
5. Informar o próximo passo.
6. Enviar alterações ao GitHub.

Não deixar trabalho relevante exclusivamente em ambientes temporários.

Não declarar implementação concluída sem testes.

Não prometer execução em segundo plano se o ambiente não suportar.

Evitar perguntas repetitivas sobre decisões já aprovadas.

Solicitar intervenção apenas quando indispensável.

---

# 14. ORDEM FINAL

Execute o desenvolvimento do RotaMapa com autonomia técnica e responsabilidade.

Priorize:

**1. Preservação absoluta dos dados.**

**2. Fidelidade à aplicação existente.**

**3. Implementação integral das funcionalidades aprovadas.**

**4. Testes reais e verificáveis.**

**5. Entrega Web, PWA e APK Android.**

Não interrompa o trabalho por decisões técnicas triviais.

Se encontrar riscos de perda de dados, incompatibilidade ou necessidade de alteração destrutiva, interrompa somente a operação afetada e solicite autorização.

Mantenha a produção intacta até a aprovação final.

**RESULTADO ESPERADO: ROTAMAPA COMPLETO, ATUALIZADO, TESTADO E PRONTO PARA ENTREGA NAS TRÊS PLATAFORMAS, SEM PERDA DE DADOS E SEM DESCARACTERIZAÇÃO DO APLICATIVO.**

**FIM DO PROMPT MESTRE.**

## Esclarecimento anterior preservado — PDFs do Executivo

O limite aprovado é de **3 importações de PDF por mês, por carteira**. Não é um limite de três catálogos armazenados. Uma operação pode conter os dois PDFs do mesmo pedido. Repetir o mesmo conteúdo na mesma carteira é idempotente. Preservar os documentos existentes; a regra limita novas importações no servidor.
