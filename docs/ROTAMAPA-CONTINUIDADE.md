# Continuidade do RotaMapa

## Decisão vigente

A evolução será conduzida exclusivamente na conta Codex usada nesta conversa. A orientação anterior de alternar duas contas foi substituída pelo proprietário. Não é necessário recriar o aplicativo nem transferir seus serviços. Se a cota terminar, a continuidade aguarda disponibilidade nesta conta; não será movida automaticamente para outra.

## Fonte de verdade

- Repositório: jeovadougllas-eng/-projeto-rota.
- Branch exclusiva de desenvolvimento: dev/rotamapa-atualizacao-integral.
- Base de produção autorizada: aebf58353428de586c59cc321032f3e63ce50cee.
- Último checkpoint antes desta decisão: 5d4051ae5202ee16618dea3bb80d8d7a3e657216. Consulte o HEAD remoto para obter o commit mais recente; este documento não substitui o histórico Git.
- Produção de referência: dev/traxelo-android-routes; experimental preservada: dev/rotamapa-insider-promocoes-importacao. Não realizar merge automático.
- Supabase existente: ggsptbcgpdakxsdjrldd (Traxio BR).
- Vercel existente: traxio-preview. O domínio com nome preview atende a produção identificada; não deduzir segurança pelo nome.

## Antes de cada etapa

1. Ler AGENTS.md, ROTAMAPA-ESCOPO.md, ROTAMAPA-PROGRESSO.md e este documento.
2. Confirmar branch, HEAD e alterações locais. Verificar o remoto sem sobrescrever trabalho existente.
3. Identificar o próximo item pendente e preservar as funcionalidades existentes.
4. Utilizar testes isolados e dados sintéticos. Não autenticar contas reais para testar sincronização.

Ao concluir cada etapa, executar validações pertinentes, atualizar o progresso, criar commit e enviar esta branch ao GitHub. Não deixar trabalho relevante apenas na sessão. Sessões novas nesta mesma conta devem retomar pelo código e pelos documentos, sem depender da memória do chat.

## Estado funcional

Já foram preparadas etapas de autenticação/identidade, Insider sem ativação, Pedido remoto, importação de clientes, gestão de carteiras e cota mensal de PDFs. Há extrator local/OCR e núcleo de comissões testados. Consulte o progresso para distinguir implementação, testes e ativação: as migrações preparadas não foram aplicadas ao Supabase.

Ainda faltam concluir a Central de Promoções, catálogo digital, caixas padrão, UI/persistência/sincronização de regras e snapshots de comissão e a validação final das três plataformas. Faltam amostras/documentos originais, a planilha correta de 53 clientes/19 colunas e os cinco e-mails Insider. Não inventar dados nem ativar benefícios antes da informação e autorização previstas.

O APK local compilado é unsigned, apenas de validação. Não distribuir como atualização compatível. A entrega Android requer confirmar a assinatura original e validar atualização sem perda de dados. Referências de testes e artefato estão em ROTAMAPA-VALIDACAO.md e rotamapa-local-android-proof.json.

## Acessos e produção

Autorizações GitHub, Supabase e Vercel pertencem às respectivas integrações e não são migradas por editar documentos. As ferramentas Supabase/Vercel ainda não estavam disponíveis nesta sessão no último diagnóstico. Consulte ROTAMAPA-ACESSOS.md. Uma nova tarefa pode ser necessária para incorporar ferramentas instaladas, mas deve permanecer nesta mesma conta e usar a branch correta.

Nenhuma publicação de produção, migração destrutiva, mudança sensível de autenticação ou alteração de dados reais está autorizada por esta decisão de continuidade. Assinaturas e segredos devem ficar em configuração segura, nunca no Git ou no chat. Não revogar conexões anteriores automaticamente: qualquer revisão de acessos deve ser feita com conhecimento do proprietário para não interromper o serviço.
