# Confirmação permanente do ponto e rotas com clientes aptos

Correção na branch `dev/traxelo-android-routes`. A main não foi modificada.

## Comportamento corrigido

1. **Confirmar ponto grava o cadastro imediatamente.** Não é mais necessário pressionar Salvar cliente depois de voltar do mapa. Latitude, longitude, confirmação manual e data são armazenadas no cadastro já existente. Nome, dados comerciais, campos importados e endereço original são preservados. O ponto confirmado volta a ser usado ao recarregar e nas próximas rotas.
2. **Buscas automáticas não substituem o ponto confirmado**, mesmo quando uma resposta antiga chega depois da confirmação ou quando é solicitada nova consulta forçada.
3. **A sequência e o traçado são estados distintos.** Se a sequência foi organizada mas o serviço de ruas falhou, Traçar pelas ruas fica habilitado para nova tentativa. O sistema não declara rota calculada nem libera navegação sem itinerário desenhado. A nova tentativa mantém somente os clientes já aprovados, sem exigir confirmação repetida dos excluídos.
4. **Clientes pendentes não bloqueiam os confirmados.** O botão Calcular rota com N confirmados mostra quantos pendentes ficarão de fora e abre a revisão explícita. Ele pode ser usado antes do término das outras consultas. Ao terminar uma busca pendente, o itinerário já aprovado e a navegação são preservados.
5. **Salvar no aparelho e sincronizar são etapas diferentes.** Uma confirmação dispara sincronização prioritária; salvamentos das buscas em segundo plano não adiam esse envio. Uma solicitação recebida durante outra sincronização é executada em seguida. O envio usa o RPC existente com revisão esperada. Leituras antigas da nuvem ou resultados automáticos não rebaixam um ponto manual confirmado.

Se o armazenamento local falhar, a confirmação não é anunciada como salva e o registro anterior é mantido. Se estiver sem rede ou houver conflito na conta, o ponto permanece no aparelho; o estado da sincronização aparece em Planilhas. Não foram removidas proteções de conflito nem alteradas políticas do banco.

## Causas confirmadas no código

| Erro | Causa | Correção |
|---|---|---|
| Ponto confirmado volta a desaparecer | Confirmar ponto alterava somente o rascunho e devolvia ao formulário; faltava um segundo salvamento | Salvamento atômico ao confirmar, com feedback de erro e metadados de confirmação |
| Busca posterior troca o pin manual | A opção force e respostas já em voo podiam ignorar a confirmação | Guarda antes da consulta e ao aplicar o resultado |
| Traçar pelas ruas continua desabilitado depois de sugerir | A habilitação dependia exclusivamente de lastRoute, criado somente após sucesso do serviço de ruas | Sequência preparada separada do itinerário; tentativa de ruas habilitada quando existe sequência válida |
| Rota com confirmados fica impedida por pendências | O estado de busca bloqueava todo cálculo e faltava uma ação direta para os aptos | Ação com contagem explícita; cálculo independente da fila de buscas |
| Final de uma consulta apaga o resultado da rota | A finalização da busca substituía o estado do planejamento; mudanças de clientes excluídos invalidavam a operação | Assinatura restrita aos pontos aprovados; finalização não substitui um roteiro ativo |
| Confirmação demora a chegar à conta enquanto outros clientes são buscados | Cada salvamento reiniciava o temporizador de sincronização | Mantém o prazo mais próximo e garante uma execução posterior se houver sincronização em andamento |

## Arquivos

- `index.html`: salvamento atômico do formulário na confirmação, proteção do pin no geocodificador e sincronização por revisão.
- `assets/traxio-route-ui.js`: sequência preparada, nova tentativa do traçado, ação para aptos e preservação do itinerário parcial.
- `tests/confirmed-locations.spec.js`: testes de confirmação, recarga, consulta em voo, falha de armazenamento, RPC por revisão, leitura antiga, prioridade de envio, rota parcial, falha de ruas e ordem manual.
- `scripts/android-routes.mjs`: validação no WebView instalado, incluindo seis confirmados e um pendente, confirmação persistida e reutilização na rota seguinte.
- Workflows `confirmed-locations.yml` e `confirmed-android.yml`: testes, compilação, instalação, conferência dos arquivos do APK e capturas da tela Android.

## Evidências e limites

Resultados web desta rodada (22/10/2026):
- [27 testes dos novos fluxos e 22 unitários aprovados](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39711387806).
- [184 cenários de planejamento, 160 regressões, três reproduções anteriores, três trajetos OSRM/MapLibre reais e uma consulta de endereço ao Photon aprovados](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39711387815).
- [Compilação Android aprovada; validação do APK instalado em andamento](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/39711387834).

As capturas Android usam o compositor do sistema via ADB, pois a captura do canvas acelerado pelo CDP pode omitir WebGL.

Os testes usam clientes sintéticos. A renderização de mapa e as chamadas rodoviárias da validação Android permanecem reais; o deslocamento GPS é simulado. O teste de sincronização usa um servidor simulado que implementa o contrato do RPC por revisão, sem gravar na carteira real. A permissão para consultar a carteira real foi recusada anteriormente pelo conector. O emulador não substitui uma validação em tablet físico.

Não há prazo de expiração para um ponto confirmado no cadastro; isso não equivale a garantia contra limpeza do armazenamento pelo usuário, exclusão do cadastro ou perda de dados ainda não sincronizados. O endereço pode ser corrigido e o pin reconfirmado explicitamente pelo usuário.
