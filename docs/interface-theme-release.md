# Traxelo.IA — menu lateral e modos claro/escuro

O botão redundante ao lado da logo foi removido. As cinco páginas continuam acessíveis pelo menu lateral permanente, incluindo no iPhone instalado como PWA. Trocar de aba continua cancelando um ajuste de pin pendente sem alterar a localização do cliente.

O modo claro agora usa caixas claras com texto escuro; o modo escuro mantém caixas azul-escuras com texto claro. Campos, listas de seleção, filtros, cartões, formulários e diálogos acompanham o modo escolhido. Filtros selecionados e caixas marcadas continuam destacados. A preferência é mantida ao reabrir.

As cinco imagens de fundo, seus enquadramentos, transparência da cena, sobreposições e ícones do menu foram preservados. Os arquivos de arte são conferidos pelos hashes registrados em `docs/interface-theme-art.json`.

## Para enviar à testadora

- **Web e PWA para iPhone:** https://traxio-preview.vercel.app/
- **APK atual para primeira instalação no Android:** https://traxio-preview.vercel.app/downloads/traxelo-ia-testes-atualizado.apk
- **Como colocar no início do iPhone:** https://traxio-preview.vercel.app/docs/iphone-install.html

A testadora deve criar/usar a própria conta e importar a planilha da própria carteira. Acesso Pro de teste permanece gratuito nesta fase. Não é preciso compartilhar a conta ou a carteira de outro usuário.

No iPhone, abra o link no Safari e use o botão de instalação ao lado do brilho para ver as instruções de **Compartilhar → Adicionar à Tela de Início**.

Quem já usa o APK original deve mantê-lo instalado: abra com internet, aguarde a atualização ser recebida e feche completamente/reabra. O histórico e os clientes locais são preservados. O novo APK separado é destinado à primeira instalação; não substitui o instalador original assinado usado por instalações existentes.

## Verificação

O fluxo de liberação compara os dois temas nas cinco páginas, exige contraste legível dos campos/seleções, verifica a persistência do tema e a navegação lateral, preserva a arte aprovada e exercita tanto a atualização no APK original quanto uma instalação nova com a interface atual embutida. Contas, clientes e GPS das verificações são sintéticos; nenhuma carteira real é importada nos testes.
