# Acessos opcionais para auditoria — RotaMapa

Implementação local e testes sintéticos não exigem credenciais de produção. O objetivo de uma conexão é conferir metadados de configuração; não alterar produção nem consultar carteiras/dados pessoais desnecessariamente.

## Conexão na interface do ChatGPT

Os nomes e a disponibilidade dos menus variam conforme conta, plataforma e produto. No navegador, procure Configurações → Apps. Se houver app oficial de Supabase/Vercel, use Conectar e autentique exclusivamente na página oficial. Não há endereço de e-mail do agente para convidar como membro da organização.

Se a conta oferecer Configurações avançadas → Modo de desenvolvedor → Criar app/conector MCP, use os servidores oficiais abaixo. Se esses controles não existirem, não invente tokens como alternativa: informe as opções que a interface realmente mostra.

### Supabase

Nome sugerido: Supabase RotaMapa — leitura.

URL MCP limitada ao projeto e modo de leitura:

`https://mcp.supabase.com/mcp?project_ref=ggsptbcgpdakxsdjrldd&read_only=true`

Autentique por OAuth, escolha a organização/projeto correto e revise o consentimento. Não retire `read_only=true` nem amplie para outros projetos para resolver falhas. Validação pretendida: estrutura, RLS e URLs de autenticação; nenhuma execução de migração, exclusão, alteração de usuários ou teste de login pessoal.

Documentação oficial: https://supabase.com/docs/guides/getting-started/mcp

### Vercel

Nome sugerido: Vercel RotaMapa — auditoria.

URL MCP oficial:

`https://mcp.vercel.com`

Autentique por OAuth, selecione a equipe correta e o projeto `traxio-preview`. Não existe nesta instrução uma promessa de que a conexão oficial seja tecnicamente somente leitura. Se o consentimento oferecer permissões amplas de escrita sem opção de restringir, não é necessário concedê-las: compartilhar os metadados relevantes manualmente continua sendo alternativa. A conexão não autoriza deploy, promoção, alteração de variáveis, domínios ou produção.

Documentação oficial: https://vercel.com/docs/mcp/vercel-mcp

## Disponibilidade nesta conversa

Depois da conexão, selecione o app na conversa se a interface permitir e informe que foi conectado. Apps do ChatGPT não necessariamente são propagados ao executor Codex Cloud. O agente deve descobrir as ferramentas realmente disponíveis antes de alegar acesso. Não há acesso Supabase/Vercel confirmado nesta sessão no momento deste registro.

## Alternativa sem conexão

Compartilhe somente capturas/exports sem segredos das telas relevantes: no Supabase, Authentication → URL Configuration e estrutura/políticas; na Vercel, projeto → Deployments → implantação de produção, Source/commit e domínios. Não compartilhe valores de variáveis, senhas, cookies, dados de clientes, chaves privadas ou tokens.

Se credenciais adicionais forem indispensáveis no futuro, use somente os campos seguros de Secrets/Environment variables do ambiente, com a menor permissão possível e justificativa específica. Não envie PAT, senha de banco, chave `service_role`, chaves privadas ou senhas de assinatura Android no chat. Acesso à configuração e autorização para modificá-la são decisões separadas.
