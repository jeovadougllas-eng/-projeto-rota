# Proposta — navegação oficial Google no RM

Status: planejamento para decisão do titular. Destinos de plataforma informados: Android e iPhone. Nenhuma integração nativa iniciada; a suspensão de APK/OTA permanece vigente até novo pedido explícito.

## Objetivo

Orientação oficial Google dentro do aplicativo: instruções curva a curva, voz, posição acompanhada pela câmera e recálculo, usando Navigation SDK. O SDK fornece a experiência oficial de navegação e componentes Google; não incorpora o aplicativo Google Maps inteiro, seus locais pessoais ou todos os recursos da versão de consumo.

A Web/PWA atual usa Maps JavaScript para exibir o mapa e Places/Geocoding para encontrar locais. Navegação, veículo e recálculo atuais são próprios do RM, com OSRM. Maps JavaScript e a biblioteca Routes para Web não equivalem ao Navigation SDK nativo.

## Implementação proposta após autorização

1. Conferir distribuição, assinatura e acessos de desenvolvimento Android e iOS. O APK estava suspenso; confirmar nova autorização antes de alterar mobile ou compilar. Preparar caminho de build/teste iOS com Xcode/macOS e conta de distribuição do titular, sem solicitar segredos pelo chat.
2. Integrar uma tela nativa de navegação oficial por plataforma, preservando o restante do RM e seus IDs, carteiras, sessões, histórico e planos. A seleção de clientes continua no RM; o módulo recebe os destinos e a ordem das visitas.
3. Configurar Navigation SDK no projeto Cloud autorizado, com chaves separadas e restritas ao aplicativo por plataforma. Não copiar a chave secreta do backend para o aplicativo.
4. Separar os eventos de navegação dos registros de visita e venda. Chegada ou mudança de rota não confirma faturamento nem duplica pedidos. O retorno ao RM mantém o cliente e as visitas pendentes corretos.
5. Verificar cobrança e limites específicos do Navigation SDK antes de habilitar uso real. Não reutilizar as franquias de Places/Geocoding nem tratar orçamento de alertas como teto financeiro.
6. Validar em aparelhos Android e iPhone: posição e marcador padrão disponível no SDK, voz em português, saída da rota, nova rota, sinal GPS ruim, perda de rede, retorno de segundo plano e encerramento. Rever permissões/background e comportamento com tela bloqueada conforme as regras de cada sistema.
7. Entregar builds de teste e revisão do titular antes de distribuir/publicar em lojas. Preservar a Web/PWA e o retorno aos clientes; plano de rollback sem apagar coordenadas ou histórico.

## Critérios de aceite

- Navegação oficial Google efetivamente executada dentro das telas nativas, sem chamar o sistema OSRM de Google Navigation.
- Voz, instruções e recálculo demonstrados em Android e iPhone reais; registrar diferenças do SDK em relação ao aplicativo Google Maps de consumo.
- Nenhuma perda de cliente, pin manual ou histórico; nenhuma concessão Insider não autorizada.
- Custo e limites por serviço documentados; versões e assinatura compatíveis verificadas antes da distribuição.

Fontes oficiais: [Navigation SDK Android](https://developers.google.com/maps/documentation/navigation/android-sdk/overview), [Navigation SDK para Android/iOS](https://mapsplatform.google.com/maps-products/navigation-sdk/), [Routes para JavaScript](https://developers.google.com/maps/documentation/javascript/routes/get-a-route).
