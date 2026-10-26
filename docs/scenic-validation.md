# Fundos aprovados, Painel e atualização Android

Revisão de 26/10/2026. Branch `dev/traxelo-android-routes`; a `main` não foi alterada.

## Alterações entregues

- Cinco fundos distintos aprovados: Painel, Clientes, Mapa e Rotas, Histórico e Planilhas. A imagem do Painel foi preparada sem interface embutida para receber os controles reais.
- Cartões, campos e ações sobre a imagem, com transparência, contraste e estados de foco. Os recortes de ícones e a logo aprovada não foram substituídos.
- Removidas a busca global superior e a lista/busca de clientes do Painel. A lista completa continua em Clientes.
- Indicadores clicáveis para toda a carteira, confirmados e pendentes. Os atalhos de criar/sugerir rota com confirmados permanecem.
- Pontos antigos não verificados e sugestões salvas ganham indicação própria e filtro “Pontos salvos para revisar”. Não são confundidos com clientes que não têm nenhum ponto.
- Um ponto legado sem `locationVerification`, mas com origem `manual_confirmation` e data válida `locationConfirmedAt`, volta a ser reconhecido como confirmado. Estados explicitamente aproximados ou pendentes não são promovidos. O reconhecimento não reescreve o cadastro.
- Proteções da confirmação manual, consulta forçada e sincronização usam a mesma classificação. Endereços originais e dados comerciais são preservados.

## Os vinte pontos anteriores

A contagem antiga aceitava qualquer coordenada; a nova exige evidência para liberar a rota por padrão. Os testes reproduzem uma carteira de 157 registros com vinte coordenadas não verificadas e comprovam que os vinte pontos continuam acessíveis, sem alterar seus dados nem apresentá-los como exatos. Também comprovam a recuperação de uma confirmação manual com evidência independente.

A consulta agregada de leitura à carteira real foi recusada pelo conector Supabase por falta de permissão. Assim, não se afirma que os vinte registros reais foram auditados ou que todos eram confirmados. O aplicativo apresenta a situação conforme os dados carregados na conta/dispositivo. Se não houver coordenadas nem evidências no cadastro, não há reconstrução fictícia de posições.

## Atualizações automáticas

O APK antigo não possui o mecanismo. O teste de instalação sobre o APK anteriormente distribuído confirmou `INSTALL_FAILED_UPDATE_INCOMPATIBLE`: as assinaturas de testes são diferentes. A rotina antiga tentou guardar um keystore num caminho que não existia; o log confirma que ele não foi salvo. Não é possível recuperar a chave privada a partir do APK.

**Não desinstalar o aplicativo existente sem preservar seus dados.** O site atualizado pode ser usado enquanto isso. Foi preparado um procedimento de migração assistida por computador, para APKs de teste depuráveis: preserva o APK anterior e todo o armazenamento WebView, preferências, arquivos e bancos locais; verifica hashes; pede confirmação explícita; instala e restaura; verifica cada arquivo original e mantém possibilidade de retorno. Os backups ficam somente no computador do proprietário e não devem ser enviados pelo chat. O procedimento não altera o package ID `app.traxio.mobile`, o callback OAuth ou a origem `https://localhost`. Consulte [instruções de migração](android-migration.md).

A ferramenta padrão apenas faz backup. A troca exige `--migrate` e a digitação de `MIGRAR`, depois da conferência do backup. Não foi executada nenhuma desinstalação no aparelho do proprietário. O teste usa somente o emulador com registros sintéticos. Uma chave de distribuição durável deve ser configurada em armazenamento secreto da CI antes de futuras alterações nativas; cache temporário não é um cofre de assinatura.

Depois, a versão Android verifica um manifesto HTTPS da hospedagem de testes e baixa um pacote web compatível em segundo plano. A versão é ativada na próxima abertura completa, sem recarregar a página nem interromper uma navegação em andamento. Voltar de outro aplicativo ou girar a tela não ativa o pacote pendente.

Há conferência de tamanho, SHA-256 do arquivo e de cada recurso, origem fixa, bloqueio de redirecionamentos, caminhos limitados, proteção contra extração fora da pasta, limites de arquivos/tamanho e restrição a conteúdo web. Trata-se de integridade por hashes e transporte HTTPS, não de assinatura digital independente da hospedagem. A conta e o site que hospedam os pacotes precisam permanecer protegidos.

O pacote atual e o anterior são mantidos. Uma versão corrompida é recusada; uma inicialização de teste que não confirma prontidão volta à anterior ou aos arquivos do APK. Uma versão malsucedida fica em quarentena. Falha ao baixar não apaga os dados nem substitui o pacote ativo. Mapas, geocodificação e autenticação continuam dependendo das respectivas conexões; não se promete navegação offline.

Novas permissões, plugins ou mudanças incompatíveis no runtime exigem outro APK. A compatibilidade desta versão é `capacitor8-20261026`, versão nativa 2. A verificação ocorre na abertura e, no máximo uma vez por hora, ao retornar ao aplicativo.

O fluxo de publicação mantém `candidate.json` separado do manifesto ativo. Somente o emulador de testes, configurado por ADB, usa o canal candidato. Depois dos testes, o pacote validado é promovido para `manifest.json`. Não há serviço pago adicional de atualização contratado.

## APK e validação final da migração

APK Android 1.1, código nativo 2, 16.171.451 bytes. SHA-256: `6d9fe54fc87beac1e1da5200858ab5232468449f40733548d58ad75139fdcdc2`.

A [execução final de migração e atualização](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40265253145) foi aprovada. Instalou o APK anterior, criou registros e histórico sintéticos, preservou e conferiu 44 arquivos privados, fez a transição de assinatura após confirmação de backup e verificou os clientes, os campos e o histórico no novo APK. O conteúdo privado do backup não foi publicado; somente a evidência de hashes e resultados.

Depois, o mesmo APK baixou o pacote por HTTPS, permaneceu na versão em execução enquanto ele estava pendente, aplicou a versão na próxima abertura, manteve os dados e confirmou uma segunda abertura saudável. O teste corrompeu um arquivo baixado no emulador: a versão foi recusada, o aplicativo voltou ao conteúdo incluído no APK e o pacote ruim não foi reinstalado em ciclo. Os cinco controles passaram. Não foi necessário recompilar o APK durante esses retestes.

Versão web automática validada: `9c6e912577cdab125760ba296ee29b934540cf13af6eb1b37a7868700110308f`. Pacote: 10.600.576 bytes, 55 arquivos declarados, SHA-256 `7297c3360c2204adb1ce634764c63eae9749c8f508bd3b873dbbe25454812c67`.

As 14 verificações Android de rotas, GPS, desvio, teclado, rotação e confirmação passaram com o novo código. O teste público de três perfis também [passou](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40263683049).

## Validação

- 23 casos unitários de geolocalização/classificação/roteamento e integridade da identidade aprovados no CI.
- 88 cenários de carteira e interface em oito perfis aprovados, com cinco fundos, ícones preservados, recuperação de pontos e ausência de buscas/lista duplicadas.
- 27 cenários de confirmação persistente, sincronização e rotas parciais aprovados.
- 184 cenários de planejamento e 160 regressões funcionais aprovados; três trajetos reais OSRM/MapLibre e uma consulta real Photon aprovados.
- Quatro testes JVM do instalador: origem/caminhos, bloqueio de conteúdo nativo/travessia, corrupção/incompletude e extração de pacote válido.
- Capturas em desktop, tablet vertical/horizontal e celular, com temas claro/escuro. A galeria oferece os perfis capturados explicitamente.

Os testes usam dados isolados; os testes de ruas mantêm o serviço de roteamento e a renderização reais. GPS e deslocamento Android são simulados. Não houve teste em tablet físico nem alteração da carteira real para simular sucesso. A migração Google permanece pendente da regularização do faturamento.

Código de aplicação: `d669dc0d3a2e7745e385f58d6f2f65480d1ca1a7`. Commits posteriores de documentação, rotinas e evidências não mudam a interface compilada.

Execuções: [interface e carteira](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40263245497), [confirmações](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40261845864), [planejamento e regressão](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40263683066), [Android e atualização](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40261957042).

Na execução inicial de planejamento, os testes passaram e o envio das capturas falhou por concorrência no Git. O envio ganhou tentativas limitadas com rebase. A primeira tentativa da atualização Android terminou antes de o pacote candidato estar publicado; o mesmo APK foi preservado para o reteste, sem recompilação. Os resultados finais do APK e da publicação são registrados nos arquivos JSON de evidência.


Evidências finais: [migração dos arquivos](captures/android/android-migration-files.json), [clientes e histórico](captures/android/android-upgrade.json), [atualizações automáticas e recuperação](captures/android/android-updates.json), [identidade do APK](captures/android/android-candidate.json). A [galeria](scenic-review.html) inclui quinze capturas anteriores preservadas por hash e as novas capturas de quatro perfis.
