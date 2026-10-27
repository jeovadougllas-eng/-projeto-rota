# Traxelo.IA para iPhone

Abra https://traxio-preview.vercel.app/ no Safari ou Chrome do iPhone.

1. Toque no ícone **Instalar** ao lado do botão de brilho. Ele também está disponível na tela de login.
2. O aplicativo mostra os passos do navegador. Toque em **Compartilhar → Adicionar à Tela de Início**.
3. Se aparecer **Abrir como App**, ative essa opção. Confirme **Adicionar**.
4. Abra o novo ícone **Traxelo.IA**. Use a mesma conta para acessar os dados sincronizados.

No iPhone, a confirmação da instalação é feita pelo usuário no menu do navegador. O site não consegue inserir um ícone na Tela de Início por conta própria. Se estiver num navegador interno ou a opção não aparecer, use **Copiar link do aplicativo** e abra-o no Safari.

Antes de mudar do navegador para o app instalado, confira a sincronização em Planilhas. O iOS pode separar os dados locais e a sessão de cada contexto. Dados ainda não enviados à nuvem continuam no navegador original; a instalação não os copia automaticamente. A PWA mantém os mesmos serviços, carteiras e identificadores do aplicativo atual.

O botão aparece somente no navegador do iPhone. Ao abrir pelo ícone instalado, ele desaparece. Android e computador mantêm a interface existente. O APK e o pacote de atualização Android já aprovado são preservados; builds nativos futuros removem os metadados e scripts da PWA.

## Atualizações e conexão

O aplicativo instalado busca os arquivos atuais pela internet ao abrir. A PWA não guarda o HTML do aplicativo, chamadas de autenticação, APIs, clientes, visitas ou mapas em seu cache. Apenas uma página genérica de reconexão é guardada para mostrar uma orientação se o aplicativo for reaberto sem internet. Nenhum registro ou fila local existente é apagado por essa página.

Não há recarga automática no meio de uma rota ou do registro de uma visita. As atualizações do service worker aguardam o encerramento das páginas antigas; o carregamento normal do aplicativo continua pela rede. Não é necessário remover e instalar o ícone novamente para receber as próximas versões web.

O uso do GPS em primeiro plano permanece sujeito à permissão de localização do iPhone. O rastreamento contínuo com tela bloqueada tem limitações no iOS; as opções existentes de navegação externa continuam disponíveis.

## Implementação e fontes

- Manifesto: `/iphone.webmanifest`, nome `Traxelo.IA`, modo standalone, URL inicial `/?source=iphone-pwa`, escopo `/` e ícones PNG de 192 e 512 pixels.
- Ícone Apple: `/assets/iphone/apple-touch-icon.png`, 180 × 180 pixels, derivado da marca aprovada, sem alterar os arquivos originais do kit.
- Service worker: `/iphone-sw.js`, registrado apenas no iPhone web em contexto seguro. Não força ativação, não recarrega páginas e não intercepta requisições de API ou recursos externos.
- O botão aguarda a criação do cabeçalho e acompanha a alternância entre login e sessão autenticada. Há um único botão de brilho, preservando sua ação e preferência existente.
- O link copiado contém somente a origem e `/`: códigos OAuth, parâmetros e fragmentos não são compartilhados.
- [Instruções oficiais da Apple](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios).
- [Instruções oficiais do Chrome para iPhone](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DiOS&hl=pt-BR).

Os testes automáticos usam contas e clientes fictícios e o motor WebKit com perfis de iPhone. Eles não simulam a interface nativa de confirmação da Tela de Início nem substituem um teste num iPhone físico. Nenhum cliente ou visita foi alterado no Supabase para preparar a PWA.

## Validação desta entrega

- Instalação, posição do botão, login/logout, instruções, cópia de link sem códigos de autenticação, modo standalone, registro real do service worker, cache sem dados de clientes e retorno após falha real de transporte: rodada final aprovada no WebKit em quatro tamanhos/perfis de iPhone, mais verificações de exclusão em Android e desktop.
- O HTML produzido para o runtime nativo excluiu a PWA; o SHA do APK e a versão ativa do pacote Android permaneceram iguais.
- Evidências: https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40438198255

A primeira validação identificou e corrigiu a inicialização anterior ao cabeçalho e uma regra antiga que ocultava os controles antes do login. O modo offline simulado pelo WebKit retornou erro interno; a verificação de recuperação passou ao provocar uma interrupção real no servidor de testes e restaurar a conexão. O teste público valida o registro e o cache do worker; a interrupção de transporte fica no servidor isolado, sem afetar o aplicativo publicado.

### Verificação no endereço público

Os recursos publicados foram conferidos por hash, incluindo os tipos de conteúdo do manifesto, os ícones e a política de atualização do service worker. O APK e o pacote ativo Android foram confirmados sem alteração. Passaram 30 verificações públicas de instalação/isolamento e 20 verificações dos relatórios de visitas nos quatro perfis de iPhone, incluindo persistência após recarregar e download do Excel.

Evidências públicas: https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40440422440

A regressão anterior do mesmo código do aplicativo também passou nas transações de rotas, fluxos existentes e serviços reais de ruas: https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40438198066

O teste de relatório mantém a autenticação sintética isolada mesmo quando o service worker assume a navegação; o SDK real não substitui a simulação. Não foram utilizados dados ou credenciais reais de usuários para essas verificações.
