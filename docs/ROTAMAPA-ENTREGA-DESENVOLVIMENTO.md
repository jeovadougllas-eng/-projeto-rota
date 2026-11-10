# Entrega de desenvolvimento — 10/11/2026

Esta é uma candidata em desenvolvimento, não uma declaração de cumprimento integral do Prompt Mestre. Branch exclusiva: dev/rotamapa-atualizacao-integral. Produção preservada em aebf58353428de586c59cc321032f3e63ce50cee.

## Web e PWA

O acesso Vercel passou a funcionar nesta execução por VERCEL_TOKEN vinculado a api.vercel.com. A API confirmou o projeto prj_Bes4oJLB9Nsv4tosvzI29F5sfytu e a equipe team_nkA7YdysnXiPjmhoqbOoTBzc. Nenhuma variável, integração Git, configuração ou alias de produção foi alterado.

Primeira Preview efetivamente criada e READY nesta execução:

- URL: https://traxio-preview-qg8easr3c-jeovadougllas-9240.vercel.app/
- Deployment: dpl_8cQHdsGUkpngrRa6fA1c37TCQ8h3.
- Fonte: e7cb0a31f9193a81fe703e460bbf22f402ade26f; etapa anterior à integração da biblioteca descrita abaixo.
- Target retornado: null, ambiente Preview. Nesta versão da REST API, omitir target cria Preview; target literal preview foi rejeitado antes de qualquer deployment. Nunca usar production.

O último link correspondente à integração seguinte será registrado no progresso após a API confirmar READY. Web e PWA utilizam a mesma URL. A Preview tem origem própria: não transfere automaticamente sessões ou dados locais da PWA instalada. Não executar login/sincronização reais para testar esta candidata sem plano de validação aprovado.

O proxy desta execução permite api.vercel.com, mas bloqueou o GET do hostname público da Preview com CONNECT 403. READY foi confirmado na API; navegação remota, OAuth real e instalação da PWA não estão certificados. Os testes de navegador usam servidor local e dados sintéticos. O domínio adicional necessário para testar remotamente é somente o hostname exato da candidata, sem alterar destinos do segredo Vercel nem autorizar a internet inteira.

## Biblioteca e funcionalidades

- Armazenamento IndexedDB por usuário e carteira, originais de catálogo locais, outbox explícita, importação idempotente, histórico imutável e conflitos preservados.
- Importação de caixas, campanhas e comissões pela extração/OCR local existente. Linhas inequívocas são identificadas; campos desconhecidos e exceções não são descartados silenciosamente.
- Caixas: busca por código/nome/apresentação e unidades por caixa, sem impor múltiplos de pedido.
- Campanhas: consulta de preço por apresentação, data, quantidade, região, estoque informado e horário quando explicitamente disponíveis. Restrições não interpretadas bloqueiam aplicação automática. Não empilhar campanhas.
- A calculadora existente aceita Dia D diário e Acelera de mês completo. Apenas importações equivalentes, sem restrições adicionais, podem ser convertidas para esse fluxo. Condições universais não representáveis continuam para consulta/revisão; não simular suporte integral a elas nas vendas.
- Comissões: vínculo por código exato/descrição completa ou revisão; somente faturamento comprovado no modelo existente; devoluções e estornos conhecidos; snapshots das taxas usadas. Contratos com exceções condicionais não representadas ficam pendentes de revisão.
- Catálogo: original PDF, zoom, páginas, miniaturas, busca, download/compartilhamento local. Guardar e sincronizar são ações explícitas; não cadastram produtos.
- Materiais: card PNG e legenda para WhatsApp com foto original fornecida e explicitamente conferida pelo usuário, preços do catálogo/condição vigente, sem upload automático da foto.

## Supabase: preparado, não aplicado

Migrações novas em supabase/migrations/20261109000100_* até 20261110000100_* permanecem rascunhos testados em Postgres local sem rede. Não existe confirmação de ferramentas administrativas Supabase nesta tarefa. A autorização para desenvolver não substitui a autorização específica previamente exigida pelo proprietário para alterar o banco real.

A última migração adiciona biblioteca imutável, RPC com validação da conta/carteira/plano, RLS, bucket privado rotamapa-catalogs, cota compartilhada de PDF e verificação servidor de venda faturada/regra de origem para snapshots. Não envia contratos originais: somente condições aprovadas. Metadados e PDF de catálogo são sincronizados separadamente; upload perdido pode ser verificado e retomado pelo mesmo proprietário.

Sem rollout aprovado, a sincronização dos módulos novos pode informar serviço indisponível e preservar a fila local. PDFs novos ficam pendentes de confirmação da cota no servidor. Recursos atuais continuam usando seus próprios fluxos.

Arquivamento preserva documentos e originais. A exclusão definitiva de carteira que contenha originais no Storage é bloqueada, até existir limpeza autorizada pelo serviço Storage; não apagar storage.objects diretamente nem deixar arquivos órfãos alegando exclusão completa. A biblioteca textual é removida somente da carteira confirmada; caches locais sincronizados são limpos após o aceite do servidor, preservando eventuais pendências novas.

Antes de rollout: auditoria somente leitura do schema/RLS/Storage real, backup verificado, revisão das diferenças em relação às funções instaladas, validação em ambiente isolado e autorização específica. Não executar simplesmente todos os SQL históricos.

## Android

O shell Capacitor continua app.traxio.mobile e usa as mesmas fontes Web. A compilação local de validação release não cria chave e não produz instalador assinável por suposição. scripts/prepare-development-apk.py verifica todos os assets compartilhados dentro do APK e só retém um APK assinado se o certificado coincidir com downloads/rotamapa-android-1.7.0-testes.apk.

O workflow RotaMapa development validation (no production) executa testes sintéticos, compila e guarda artefatos da branch autorizada. Permissão contents:read; não cria commits, releases, deploys, aliases, migrações ou atualizações OTA. Tenta restaurar a chave histórica de testes pelo cache já existente. Caches de outra branch podem ser inacessíveis; isso não autoriza criar uma chave substituta.

Se não existir chave compatível no cache, o responsável pela assinatura pode configurá-la em GitHub → repositório jeovadougllas-eng/-projeto-rota → Settings → Secrets and variables → Actions → New repository secret. Nomes usados pelo workflow: ROTAMAPA_ANDROID_KEYSTORE_BASE64, ROTAMAPA_ANDROID_KEY_ALIAS, ROTAMAPA_ANDROID_STORE_PASSWORD e ROTAMAPA_ANDROID_KEY_PASSWORD. Utilizar exclusivamente o keystore original e suas credenciais, por esse canal seguro; nunca enviar valores na conversa, em docs ou commits. Se não possuir a chave original, solicitar ao responsável pelo APK anterior; não gerar uma substituta e chamá-la de atualização compatível.

Artefatos ficam em GitHub → Actions → RotaMapa development validation (no production) → execução do commit → Artifacts → rotamapa-development-<commit>. android-proof.json distingue signed:false de um candidato assinado cujo certificado foi verificado. Um arquivo unsigned.apk não é um APK instalável de atualização. Mesmo candidato assinado precisa de teste de instalação/atualização em dispositivo isolado antes de distribuição.

## Atualização e retorno

Preview não promove produção. Para abandonar a candidata, manter o domínio e deployment de produção atuais; nenhuma reversão de dados é necessária porque esta tarefa não os alterou. Não publicar os arquivos locais updateweb ou manifest OTA.

Após aprovação futura, preparar publicação e atualização por plataforma com snapshots/backup e testes de compatibilidade. Alterações de schema exigem plano próprio; não executar rollback destrutivo para simular retorno. E-mails Insider, contratos/aditivos originais e planilha de 53 clientes ainda são entradas pendentes.
