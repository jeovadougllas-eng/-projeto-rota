# Navegação individual e validação em rota

Ao abrir a ficha e escolher **Ver no mapa**, o pin fica destacado com as ações **Iniciar navegação**, **Ajustar pin** e **Ver cadastro**. Não é necessário selecionar vários clientes. O destino individual usa a posição atual do GPS e não inclui os outros clientes da seleção anterior.

Pontos aproximados continuam exigindo confirmação. Durante o ajuste, **Salvar posição e navegar** grava o pin no próprio cliente antes de calcular e iniciar a visita. Se a gravação falhar, a navegação não começa. Os endereços, campos comerciais e visitas existentes são preservados.

A barra **Mostrar clientes filtrados** fica imediatamente após Todos/Alta/Média/Baixa. O contador e a lista continuam refletindo a combinação de texto, prioridade e região. O cabeçalho do planejador deixou de ficar sobre as opções ao rolar.

Ao iniciar a navegação, a mesma instância do mapa ocupa a tela e mostra a próxima parada, o estado do GPS, **Recalcular agora** e **Ajustar pin da próxima parada**. **Minimizar** mantém o mapa numa janela flutuante enquanto se usa outra aba ou busca de clientes; **Ampliar** restaura a visualização. A janela considera a área segura e o teclado do celular. Navegadores sem suporte à camada Popover usam a sobreposição fixa como alternativa.

O desvio passa a ser comparado com o trecho até a próxima parada, usando a geometria das etapas retornadas pelo serviço de ruas. Estar perto de uma etapa futura não mascara mais um desvio atual. O recálculo conserva a ordem das paradas restantes e não recoloca clientes já visitados. Falhas de rede têm tentativas limitadas e uma ação manual de recuperação. Sinais imprecisos ou antigos continuam sem confirmar chegadas nem provocar recálculos indevidos.

A PWA usa GPS em primeiro plano. Ao retornar do segundo plano, ela renova a leitura de localização e atualiza o trajeto restante. Não oferece uma janela sobre outros aplicativos do iOS, nem acompanhamento contínuo com a PWA fechada. A janela flutuante funciona entre as telas do próprio Traxelo.IA.

Em simulações com origem GPS, o ponto capturado fica visível e é mantido até tocar em **Atualizar minha posição**. Os mesmos clientes são ordenados de forma estável, com a primeira visita sendo o cliente mais próximo em distância pelas ruas no critério **Menor deslocamento**; os demais deslocamentos são melhorados por uma heurística determinística. Isso não é uma garantia matemática de menor percurso global e não considera trânsito em tempo real. Uma navegação individual sempre obtém o GPS atual. Não houve migração de fornecedor de mapas nesta entrega.

Para receber a versão: recarregue a web ou feche/reabra a PWA pelo ícone. No Android com atualizador, abra com internet, aguarde o recebimento da atualização e feche completamente/reabra. O APK original e sua assinatura são preservados.
