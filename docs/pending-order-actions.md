# Web/PWA 1.15.1 — pedidos pendentes na feira

Correção solicitada: pedidos criados no RM sem faturamento precisam aparecer nas pendências e oferecer confirmação diretamente nas vendas da feira; pedidos importados ainda não faturados precisam oferecer edição.

Pedidos RM confirmados, sem manualBilling, aparecem na lista e no sino e oferecem Confirmar faturamento. A feira usa o mesmo registro do histórico. A confirmação mantém a conferência explícita de produtos, valores e data e os controles de conta/carteira existentes.

Pedidos confirmados de um único PDF provisório, sem nenhuma baixa, permitem adicionar/remover produtos, alterar quantidades, preços e observações. O preço original é o padrão da edição. Novos produtos exigem EAN válido no catálogo ou associação verificada. O original completo fica em importedOriginal e cada revisão anterior em pdfEditHistory (até 50); ID, cliente, datas, metadados e vínculo da feira são preservados. PDF exportado informa ajuste no RM, sem envio ao Mercado Farma. Pedidos faturados, cancelados ou com múltiplos PDFs continuam protegidos.

Migração 20261113010134_pending_pdf_order_adjustments: amplia somente a validação da edição permitida. Mantém SECURITY INVOKER, RLS, isolamento, revisão, validação monetária e das linhas, confirmação de faturamento e cotas. Banco local descartável cobre edição válida, original imutável e bloqueio após faturamento. O fixture limpa apenas a cota sintética do banco local, nunca produção.

Atualização: abrir online, aguardar o aplicativo preparar os arquivos e fechar todas as janelas do RM antes de reabrir. Sem atualização forçada da aba ativa. APK/OTA permanecem suspensos.

Rollback Web: deployment anterior dpl_5e8ybu3dbgrvkbi8EK98qbKm6MwJ, commit 90de964be71999aded538826176d9667f3392b8c. A migração é compatível com o cliente anterior; não remover arquivos originais nem reverter registros ajustados. Rollback da função exige revisão específica para preservar pedidos já ajustados.
